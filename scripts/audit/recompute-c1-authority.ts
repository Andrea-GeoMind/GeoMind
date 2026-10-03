/**
 * Recalcule le score Autorité des analyses produites avant le correctif C1.
 *
 * Jusqu'au 2026-09-23, `clientCitationsFound` additionnait les SOURCES citées
 * au lieu de compter les RÉPONSES qui citent le client, quand le dénominateur
 * comptait bien des réponses. Une réponse citant deux pages du domaine pesait
 * double, et le score dépassait le taux de citation réel.
 *
 * Le correctif ne recalculait que les analyses à venir. Mais un score obtenu
 * avec la mauvaise formule n'a jamais été vrai : il relève de la même logique
 * que les constats noindex et sitemap retirés, pas d'un état passé du site à
 * préserver. On le recalcule donc avec la fonction du moteur, à partir des
 * réponses stockées — sans relance, donc sans crédit.
 *
 *   pnpm tsx scripts/audit/recompute-c1-authority.ts            # avant/après
 *   pnpm tsx scripts/audit/recompute-c1-authority.ts --apply    # applique
 */

import postgres from 'postgres'
import { computeAuthorityScore, computeGlobalScore } from '@/lib/analysis/scoring'

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const APPLY = process.argv.includes('--apply')

interface Ligne {
  id: string
  name: string
  au: number | null
  te: number | null
  co: number | null
  gl: number | null
  reponses: number
  citant: number
}

async function main(): Promise<void> {
  const rows = (await sql`
    select a.id, s.name, a.authority_score au, a.technical_score te,
           a.content_score co, a.global_score gl,
      (select count(*)::int from authority_results r where r.analysis_id = a.id) reponses,
      (select count(distinct r.id)::int from authority_sources x
         join authority_results r on r.id = x.authority_result_id
         where r.analysis_id = a.id and x.is_client_domain) citant
    from analyses a join sites s on s.id = a.site_id
    where a.authority_score is not null
    order by a.created_at`) as unknown as Ligne[]

  let n = 0
  for (const r of rows) {
    const auNouveau = computeAuthorityScore(r.reponses, r.citant)
    if (auNouveau === r.au) continue
    const glNouveau =
      r.te === null || r.co === null ? r.gl : computeGlobalScore(auNouveau, r.te, r.co)
    n++
    console.log(
      `${r.name.padEnd(26)} ${String(r.citant).padStart(2)}/${String(r.reponses).padEnd(3)} ` +
        `Autorité ${r.au} → ${auNouveau}   Global ${r.gl} → ${glNouveau}   (${r.id.slice(0, 8)})`
    )
    if (APPLY) {
      await sql`update analyses set authority_score = ${auNouveau}, global_score = ${glNouveau},
                updated_at = now() where id = ${r.id}`
    }
  }
  console.log(`\n${n} analyse(s) à recalculer.`)
  console.log(APPLY ? 'Appliqué.' : '(simulation — relancer avec --apply)')
  await sql.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
