import type { Prospect } from './types'

/**
 * Score de négligence — 0 à 100, le plus élevé désignant le meilleur prospect.
 *
 * Pourquoi ne pas trier sur technique+contenu : la première série a donné une
 * médiane de 80 et seulement 2 sites sous 70 sur 24. Ces deux piliers mesurent
 * de l'hygiène, et un site récent la respecte tout seul — ils ne séparent pas
 * les entreprises. Ce score combine des signaux qui, eux, distinguent un site
 * suivi d'un site laissé de côté.
 *
 * Chaque signal est déterministe et déjà collecté : aucun appel LLM, aucun
 * coût supplémentaire.
 */

export interface NeglectSignal {
  key: string
  label: string
  points: number
}

/** Poids choisis par force de conviction commerciale, pas par gravité technique. */
const WEIGHTS = {
  /** Invisible volontairement sans le savoir : l'argument le plus frappant. */
  noindex: 30,
  /** Pas de nom de domaine à soi : diagnostic immédiat et visible du dirigeant. */
  noOwnDomain: 25,
  /** Rien ne présente l'entreprise aux machines. */
  noStructuredData: 20,
  /** Beaucoup d'avis mais un site négligé : l'entreprise marche malgré son site. */
  tractionSansSite: 15,
  /** Socle technique absent. */
  noSitemap: 5,
  noFaq: 5,
} as const

/** Au-delà, l'entreprise a une vraie notoriété locale — et donc à perdre. */
const STRONG_TRACTION = 80

/**
 * Détaille les signaux retenus pour un prospect.
 * `issueKeys` : clés de règles remontées par les moteurs technique et contenu.
 */
export function neglectSignals(
  p: Prospect,
  issueKeys: string[] = []
): NeglectSignal[] {
  const has = (fragment: string) => issueKeys.some((k) => k.includes(fragment))
  const out: NeglectSignal[] = []

  if (has('noindex')) {
    out.push({ key: 'noindex', label: 'Page clé invisible des moteurs', points: WEIGHTS.noindex })
  }
  if (p.platform) {
    out.push({
      key: 'no-own-domain',
      label: `Pas de domaine propre (${p.platform})`,
      points: WEIGHTS.noOwnDomain,
    })
  }
  if (has('schema-org') || has('schema_org')) {
    out.push({
      key: 'no-structured-data',
      label: 'Aucune donnée structurée',
      points: WEIGHTS.noStructuredData,
    })
  }
  // Traction commerciale réelle mais site en retrait : c'est là que l'écart
  // entre ce que vaut l'entreprise et ce que montre son site est le plus grand.
  const weakSite = (p.contentScore ?? 100) < 70 || (p.technicalScore ?? 100) < 70
  if ((p.reviewCount ?? 0) >= STRONG_TRACTION && weakSite) {
    out.push({
      key: 'traction-sans-site',
      label: `${p.reviewCount} avis mais un site en retrait`,
      points: WEIGHTS.tractionSansSite,
    })
  }
  if (has('sitemap')) {
    out.push({ key: 'no-sitemap', label: 'Pas de plan du site', points: WEIGHTS.noSitemap })
  }
  if (has('faq')) {
    out.push({ key: 'no-faq', label: 'Aucune question fréquente', points: WEIGHTS.noFaq })
  }

  return out
}

export function neglectScore(p: Prospect, issueKeys: string[] = []): number {
  const total = neglectSignals(p, issueKeys).reduce((sum, s) => sum + s.points, 0)
  return Math.min(100, total)
}
