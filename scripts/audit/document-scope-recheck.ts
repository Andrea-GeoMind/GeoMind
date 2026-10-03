/**
 * Revérifie les constats qui dépendent d'une balise unique au document.
 *
 * Pourquoi : jusqu'au 03/10/2026, les extracteurs lisaient tout le HTML rendu
 * par Firecrawl — lequel aplatit les documents embarqués dans la page parente
 * (`data-original-tag="iframe"`). Le `<title>`, le `<h1>`, le canonical, le
 * `lang`, les balises Open Graph ou le JSON-LD d'un widget tiers pouvaient donc
 * être pris pour ceux du client. C'est ce qui a fait signaler
 * `lembellie-lyon.com` en « page clé en noindex » alors que le site est
 * parfaitement indexable.
 *
 * Les analyses déjà en base portent des constats produits par l'ancienne
 * lecture. Ce script les rejoue.
 *
 * Deux limites, à connaître avant de lire le rapport :
 *
 * 1. Le `rawHtml` n'est pas conservé (`firecrawl_pages` ne garde que le
 *    markdown et les métadonnées extraites). On ne rejoue donc pas « le HTML
 *    d'origine » : on refetche la page telle qu'elle est aujourd'hui.
 * 2. Notre requête n'exécute pas le JavaScript. Une balise injectée côté client
 *    nous échappe — mais c'est précisément le cas où Firecrawl, lui, la voit :
 *    quand les deux divergent, on ne conclut pas, on signale.
 *
 * Aucune dépense : requêtes HTTP simples, aucun crédit Firecrawl.
 *
 *   pnpm tsx scripts/audit/document-scope-recheck.ts            # simulation
 *   pnpm tsx scripts/audit/document-scope-recheck.ts --apply    # corrige
 */

import postgres from 'postgres'
import { extractDocumentMeta } from '@/lib/crawl/document-scope'
import { extractHeadings } from '@/lib/crawl/headings'
import { computeIssuesScore, computeGlobalScore } from '@/lib/analysis/scoring'

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const APPLY = process.argv.includes('--apply')

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

/** Verdict d'une revérification. */
type Verdict = 'confirmé' | 'infirmé' | 'indéterminé'

/**
 * Règles dont le constat dépend d'une balise unique au document, avec le moyen
 * de le revérifier. `null` en retour = on ne sait pas trancher.
 */
const RECHECKS: Record<string, (html: string) => Verdict> = {
  h1_missing_or_duplicate: (html) => {
    const h = extractHeadings(html)
    if (!h) return 'indéterminé'
    // Le constat porte sur « différent de 1 ».
    return h.h1.length === 1 ? 'infirmé' : 'confirmé'
  },
  canonical_missing: (html) => verdict(extractDocumentMeta(html)?.canonical),
  html_lang_missing: (html) => verdict(extractDocumentMeta(html)?.language),
  mobile_viewport_missing: (html) => verdict(extractDocumentMeta(html)?.viewport),
  twitter_card_missing: (html) => verdict(extractDocumentMeta(html)?.twitterCard),
  open_graph_missing: (html) => {
    const m = extractDocumentMeta(html)
    if (!m) return 'indéterminé'
    // La règle liste les balises manquantes : le constat tombe si les trois
    // principales sont présentes.
    return m.ogTitle && m.ogDescription && m.ogImage ? 'infirmé' : 'confirmé'
  },
}

/** Une balise trouvée infirme un constat « manquant » ; absente, elle le confirme. */
function verdict(value: string | null | undefined): Verdict {
  if (value === undefined) return 'indéterminé'
  return value ? 'infirmé' : 'confirmé'
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': BROWSER_UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) return null
    return (await res.text()).slice(0, 2_000_000)
  } catch {
    return null
  }
}

interface Ligne {
  id: string
  analysisId: string
  ruleKey: string
  pageUrl: string | null
  siteName: string
  siteUrl: string
}

async function main(): Promise<void> {
  const cles = Object.keys(RECHECKS)
  const rows = (await sql`
    select ti.id, ti.analysis_id as "analysisId", ti.rule_key as "ruleKey",
           ti.page_url as "pageUrl", s.name as "siteName", s.url as "siteUrl"
    from technical_issues ti
    join analyses a on a.id = ti.analysis_id
    join sites s on s.id = a.site_id
    where ti.rule_key = any(${cles})
    order by s.name, ti.rule_key`) as unknown as Ligne[]

  console.log(`${rows.length} constat(s) à revérifier sur ${cles.length} règles.\n`)

  const aRetirer: Ligne[] = []
  const htmlParUrl = new Map<string, string | null>()

  for (const r of rows) {
    const url = r.pageUrl ?? r.siteUrl
    if (!htmlParUrl.has(url)) htmlParUrl.set(url, await fetchPage(url))
    const html = htmlParUrl.get(url)!

    if (html === null) {
      console.log(`  ?  ${r.siteName} · ${r.ruleKey} — page injoignable, on ne touche à rien`)
      continue
    }
    const v = RECHECKS[r.ruleKey]!(html)
    const marque = v === 'infirmé' ? '✗' : v === 'confirmé' ? '✓' : '?'
    console.log(`  ${marque}  ${r.siteName} · ${r.ruleKey} · ${new URL(url).pathname} — ${v}`)
    if (v === 'infirmé') aRetirer.push(r)
  }

  console.log(`\n${aRetirer.length} constat(s) non confirmé(s).`)
  if (aRetirer.length === 0 || !APPLY) {
    if (aRetirer.length > 0) console.log('(simulation — relancer avec --apply pour corriger)')
    await sql.end()
    return
  }

  // Retrait puis recalcul des notes avec les fonctions du moteur, pour que les
  // scores restent ceux qu'une relance produirait.
  const analyses = [...new Set(aRetirer.map((r) => r.analysisId))]
  for (const analysisId of analyses) {
    const ids = aRetirer.filter((r) => r.analysisId === analysisId).map((r) => r.id)
    await sql.begin(async (tx) => {
      await tx`delete from technical_issues where id = any(${ids})`
      const restantes = await tx`
        select rule_key, category, penalty, page_url from technical_issues
        where analysis_id = ${analysisId}`
      const [{ c: pages }] = (await tx`
        select count(*)::int c from firecrawl_pages fp
        join analyses a on a.site_id = fp.site_id where a.id = ${analysisId}`) as unknown as [
        { c: number },
      ]
      const technical = computeIssuesScore(
        restantes.map((i) => ({
          ruleKey: i.rule_key as string,
          category: i.category as string,
          penalty: Number(i.penalty),
          pageUrl: i.page_url as string | null,
        })),
        pages
      )
      const [a] = (await tx`
        select authority_score as au, content_score as co from analyses where id = ${analysisId}`) as unknown as [
        { au: number | null; co: number | null },
      ]
      const global = a.co === null ? null : computeGlobalScore(a.au, technical, a.co)
      await tx`update analyses set technical_score = ${technical},
               global_score = ${global}, updated_at = now() where id = ${analysisId}`
      console.log(`  analyse ${analysisId.slice(0, 8)} : Technique → ${technical}, Global → ${global}`)
    })
  }
  await sql.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
