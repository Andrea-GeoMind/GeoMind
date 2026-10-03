/**
 * Retire les constats portant sur des fichiers qui ne sont pas des pages.
 *
 * Le crawl avalait les sitemaps et les passait au moteur de règles comme des
 * pages ordinaires. Un `sitemap_index.xml` se voyait reprocher un H1 manquant,
 * une langue non déclarée, un viewport absent, des balises Open Graph et une
 * Twitter Card. Relevé le 2026-10-03 : 79 des 251 constats techniques en base,
 * dont 42 sur un seul rapport client.
 *
 * Le crawl les écarte désormais à l'entrée (`lib/crawl/html-pages.ts`), mais
 * les analyses déjà produites les portent encore. Ce script les retire et
 * recalcule les notes avec les fonctions du moteur, pour que les scores soient
 * ceux qu'une relance donnerait — sans relance, donc sans crédit.
 *
 *   pnpm tsx scripts/audit/purge-non-html-issues.ts            # avant/après
 *   pnpm tsx scripts/audit/purge-non-html-issues.ts --apply    # applique
 */

import postgres from 'postgres'
import { isHtmlCandidateUrl } from '@/lib/crawl/html-pages'
import { computeIssuesScore, computeGlobalScore } from '@/lib/analysis/scoring'

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const APPLY = process.argv.includes('--apply')

interface Issue {
  id: string
  analysisId: string
  pageUrl: string | null
  ruleKey: string
  category: string
  penalty: string | number
}

interface Analyse {
  id: string
  siteName: string
  siteId: string
  authority: number | null
  technical: number | null
  content: number | null
  global: number | null
}

/** Les issues de page dont l'URL n'est pas une page analysable. */
function aRetirer(issues: Issue[]): Issue[] {
  return issues.filter((i) => i.pageUrl !== null && !isHtmlCandidateUrl(i.pageUrl))
}

async function main(): Promise<void> {
  const analyses = (await sql`
    select a.id, s.name as "siteName", s.id as "siteId",
           a.authority_score as authority, a.technical_score as technical,
           a.content_score as content, a.global_score as global
    from analyses a join sites s on s.id = a.site_id
    where a.technical_score is not null or a.content_score is not null
    order by s.name`) as unknown as Analyse[]

  let totalRetires = 0
  const lignes: string[] = []

  for (const a of analyses) {
    const tech = (await sql`
      select id, analysis_id as "analysisId", page_url as "pageUrl",
             rule_key as "ruleKey", category, penalty
      from technical_issues where analysis_id = ${a.id}`) as unknown as Issue[]
    const cont = (await sql`
      select id, analysis_id as "analysisId", page_url as "pageUrl",
             rule_key as "ruleKey", category, penalty
      from content_issues where analysis_id = ${a.id}`) as unknown as Issue[]

    const techHors = aRetirer(tech)
    const contHors = aRetirer(cont)
    if (techHors.length === 0 && contHors.length === 0) continue

    const [{ c: pages }] = (await sql`
      select count(*)::int c from firecrawl_pages where site_id = ${a.siteId}`) as unknown as [
      { c: number },
    ]
    const scorable = (list: Issue[]) =>
      list.map((i) => ({
        ruleKey: i.ruleKey,
        category: i.category,
        penalty: Number(i.penalty),
        pageUrl: i.pageUrl,
      }))

    const techApres = computeIssuesScore(
      scorable(tech.filter((i) => !techHors.includes(i))),
      pages
    )
    const contApres = computeIssuesScore(
      scorable(cont.filter((i) => !contHors.includes(i))),
      pages
    )
    const globalApres =
      a.content === null ? null : computeGlobalScore(a.authority, techApres, contApres)

    totalRetires += techHors.length + contHors.length
    lignes.push(
      `${a.siteName.padEnd(26)} ` +
        `constats ${String(techHors.length + contHors.length).padStart(2)} retirés  |  ` +
        `Tech ${String(a.technical ?? '—').padStart(3)} → ${String(techApres).padStart(3)}  ` +
        `Contenu ${String(a.content ?? '—').padStart(3)} → ${String(contApres).padStart(3)}  ` +
        `Global ${String(a.global ?? '—').padStart(4)} → ${String(globalApres ?? '—').padStart(4)}`
    )

    if (APPLY) {
      const ids = [...techHors.map((i) => i.id), ...contHors.map((i) => i.id)]
      await sql.begin(async (tx) => {
        if (techHors.length) {
          await tx`delete from technical_issues where id = any(${techHors.map((i) => i.id)})`
        }
        if (contHors.length) {
          await tx`delete from content_issues where id = any(${contHors.map((i) => i.id)})`
        }
        await tx`update analyses set technical_score = ${techApres},
                 content_score = ${contApres}, global_score = ${globalApres},
                 updated_at = now() where id = ${a.id}`
      })
      void ids
    }
  }

  console.log(lignes.join('\n') || 'Aucun constat à retirer.')
  console.log(`\n${totalRetires} constat(s) sur des fichiers non-HTML.`)
  console.log(APPLY ? 'Appliqué.' : '(simulation — relancer avec --apply)')
  await sql.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
