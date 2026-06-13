/**
 * lib/analysis/competitors.ts
 *
 * Analyse concurrentielle (PLAN item 27) — exploite ce que l'analyse d'autorité
 * capture déjà : TOUTES les sources citées par les IA, pas seulement le domaine
 * client. On en tire le « share of voice » (part de citations) du client vs ses
 * concurrents déclarés vs les autres domaines fréquemment cités, et le « pourquoi
 * lui » (quels moteurs / quels prompts / quelles pages citent chaque acteur).
 *
 * Fonctions PURES et déterministes — aucun appel LLM, aucun accès DB. Alimentées
 * par les AuthorityResultRow déjà chargées + la liste des concurrents déclarés.
 */

import type { AuthorityResultRow } from '@/lib/analysis/authority-table'
import type { IAEngineName } from '@/lib/ai/connectors/base'

/** Normalise un domaine : minuscule, sans protocole, sans www, sans chemin. */
export function normalizeDomain(input: string): string {
  let s = input.trim().toLowerCase()
  s = s.replace(/^https?:\/\//, '')
  s = s.replace(/^www\./, '')
  s = s.split('/')[0] ?? s
  s = s.split('?')[0] ?? s
  return s.replace(/\.$/, '')
}

export interface CompetitorStanding {
  domain: string
  /** Nom lisible si connu (concurrent déclaré), sinon le domaine */
  label: string
  /** Type : le client, un concurrent déclaré, ou un domaine découvert */
  kind: 'client' | 'declared' | 'discovered'
  /** Nombre de réponses IA où ce domaine est cité au moins une fois */
  citedResponses: number
  /** Part de voix : citedResponses / nombre total de réponses (%) */
  shareOfVoice: number
  /** Moteurs qui le citent */
  engines: IAEngineName[]
  /** Exemples d'URLs citées (max 3) — le « pourquoi lui » concret */
  sampleUrls: string[]
}

export interface CompetitorAnalysis {
  totalResponses: number
  standings: CompetitorStanding[]
  /** Rang du client (1 = le plus cité), null s'il n'est jamais cité */
  clientRank: number | null
  clientStanding: CompetitorStanding | null
}

interface DeclaredCompetitor {
  url: string
  name: string | null
}

/**
 * Calcule le classement de part de voix.
 * @param results        réponses d'autorité (mode forcé, prompts neutres)
 * @param clientUrl      URL du site client
 * @param declared       concurrents déclarés à la découverte
 * @param maxDiscovered  nombre max de domaines « découverts » à remonter
 */
export function analyzeCompetitors(
  results: AuthorityResultRow[],
  clientUrl: string,
  declared: DeclaredCompetitor[],
  maxDiscovered = 8
): CompetitorAnalysis {
  const clientDomain = normalizeDomain(clientUrl)
  const declaredByDomain = new Map<string, string>() // domaine → nom
  for (const c of declared) {
    const d = normalizeDomain(c.url)
    if (d) declaredByDomain.set(d, c.name?.trim() || d)
  }

  // Agrégation par domaine sur les réponses neutres uniquement (comparable au score)
  const neutral = results.filter((r) => r.promptIsNeutral)
  const totalResponses = neutral.length

  interface Agg {
    citedResponses: number
    engines: Set<IAEngineName>
    urls: Set<string>
  }
  const byDomain = new Map<string, Agg>()

  for (const r of neutral) {
    // Domaines distincts cités dans CETTE réponse (une citation par réponse max)
    const domainsInResponse = new Map<string, string>() // domaine → 1re URL
    for (const src of r.sources) {
      const d = normalizeDomain(src.domain || src.url)
      if (!d) continue
      if (!domainsInResponse.has(d)) domainsInResponse.set(d, src.url)
    }
    for (const [d, url] of domainsInResponse) {
      const agg = byDomain.get(d) ?? { citedResponses: 0, engines: new Set(), urls: new Set() }
      agg.citedResponses += 1
      agg.engines.add(r.engine)
      if (agg.urls.size < 3) agg.urls.add(url)
      byDomain.set(d, agg)
    }
  }

  function toStanding(domain: string, agg: Agg): CompetitorStanding {
    const kind: CompetitorStanding['kind'] =
      domain === clientDomain ? 'client' : declaredByDomain.has(domain) ? 'declared' : 'discovered'
    return {
      domain,
      label: declaredByDomain.get(domain) ?? domain,
      kind,
      citedResponses: agg.citedResponses,
      shareOfVoice: totalResponses > 0 ? Math.round((agg.citedResponses / totalResponses) * 100) : 0,
      engines: [...agg.engines],
      sampleUrls: [...agg.urls],
    }
  }

  // On garde : le client (même non cité), tous les concurrents déclarés (même non
  // cités), et les meilleurs domaines découverts.
  const standingsMap = new Map<string, CompetitorStanding>()

  const emptyAgg = (): Agg => ({ citedResponses: 0, engines: new Set(), urls: new Set() })

  standingsMap.set(clientDomain, toStanding(clientDomain, byDomain.get(clientDomain) ?? emptyAgg()))
  for (const d of declaredByDomain.keys()) {
    standingsMap.set(d, toStanding(d, byDomain.get(d) ?? emptyAgg()))
  }

  // Domaines découverts (ni client ni déclarés), triés par citations, top N
  const discovered = [...byDomain.entries()]
    .filter(([d]) => d !== clientDomain && !declaredByDomain.has(d))
    .map(([d, agg]) => toStanding(d, agg))
    .sort((a, b) => b.citedResponses - a.citedResponses)
    .slice(0, maxDiscovered)
  for (const s of discovered) standingsMap.set(s.domain, s)

  const standings = [...standingsMap.values()].sort(
    (a, b) => b.citedResponses - a.citedResponses || a.label.localeCompare(b.label)
  )

  const clientStanding = standings.find((s) => s.kind === 'client') ?? null
  // Rang du client parmi les acteurs cités (>0 citations)
  const ranked = standings.filter((s) => s.citedResponses > 0)
  const clientRankIdx = ranked.findIndex((s) => s.kind === 'client')
  const clientRank = clientRankIdx >= 0 ? clientRankIdx + 1 : null

  return { totalResponses, standings, clientRank, clientStanding }
}
