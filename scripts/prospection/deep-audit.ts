import { createSite, deleteSite, getSiteById } from '@/lib/db/queries/sites'
import { getAnalysisById } from '@/lib/db/queries/analyses'
import { launchFullAnalysis } from '@/lib/analysis/launch'
import { db } from '@/lib/db/client'
import {
  citationChecks,
  authorityResults,
  authoritySources,
  competitors,
} from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

/**
 * Audit approfondi d'un prospect — avec le pilier Autorité.
 *
 * Contrairement au reste de la chaîne de prospection, celui-ci CONSOMME des
 * crédits OpenRouter (~0,44 $ : 10 questions × 4 moteurs) et crée un site et
 * une analyse en base, le pipeline Inngest l'exigeant. À réserver aux quelques
 * prospects qu'on veut vraiment convaincre, et à nettoyer après lecture.
 *
 * Usage :
 *   pnpm tsx scripts/prospection/deep-audit.ts --url https://x.fr --user <uuid>
 *   pnpm tsx scripts/prospection/deep-audit.ts --cleanup <siteId>
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}

async function report(siteId: string, analysisId: string): Promise<void> {
  const analysis = await getAnalysisById(analysisId)
  const site = await getSiteById(siteId)

  console.log(`\n═══ ${site?.name} ═══`)
  console.log(`  statut            : ${analysis?.status}`)
  console.log(`  note globale      : ${analysis?.globalScore ?? 'non mesurée'}`)
  console.log(`  note AUTORITÉ     : ${analysis?.authorityScore ?? 'non mesurée'}`)
  console.log(`  note technique    : ${analysis?.technicalScore ?? '—'}`)
  console.log(`  note contenu      : ${analysis?.contentScore ?? '—'}`)

  // Citations : une ligne par (question × moteur).
  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      cited: sql<number>`count(*) filter (where ${citationChecks.cited} = true)::int`,
    })
    .from(citationChecks)
    .where(eq(citationChecks.siteId, siteId))

  console.log(`\n  CITATIONS : ${counts?.cited ?? 0} sur ${counts?.total ?? 0} réponses`)

  // Qui est cité à sa place : domaines apparaissant dans les sources des
  // réponses. On compte une fois par réponse, pas par occurrence, pour ne pas
  // sur-représenter un site cité plusieurs fois dans la même réponse.
  const ranked = await db
    .select({
      domain: authoritySources.domain,
      responses: sql<number>`count(distinct ${authoritySources.authorityResultId})::int`,
    })
    .from(authoritySources)
    .innerJoin(authorityResults, eq(authorityResults.id, authoritySources.authorityResultId))
    .where(eq(authorityResults.analysisId, analysisId))
    .groupBy(authoritySources.domain)
    .orderBy(sql`count(distinct ${authoritySources.authorityResultId}) desc`)
    .limit(15)

  const own = site ? new URL(site.url).hostname.replace(/^www\./, '') : ''
  console.log(`\n  CITÉS À SA PLACE (domaine — nb de réponses sur 40) :`)
  for (const r of ranked) {
    if (r.domain === own) continue
    console.log(`    ${String(r.responses).padStart(3)}  ${r.domain}`)
  }

  const detected = await db.select().from(competitors).where(eq(competitors.siteId, siteId))
  if (detected.length > 0) {
    console.log(`\n  CONCURRENTS identifiés à la découverte :`)
    for (const c of detected) console.log(`    ${c.name ?? '—'} — ${c.url}`)
  }
}

async function main(): Promise<void> {
  const cleanupId = arg('--cleanup')
  if (cleanupId) {
    await deleteSite(cleanupId)
    console.log(`site ${cleanupId} supprimé`)
    return
  }

  const url = arg('--url')
  const userId = arg('--user')
  const existing = arg('--site')

  if (existing) {
    const site = await getSiteById(existing)
    if (!site) throw new Error('site introuvable')
    const analysisId = arg('--analysis')
    if (!analysisId) throw new Error('--analysis requis avec --site')
    await report(existing, analysisId)
    return
  }

  if (!url || !userId) throw new Error('--url et --user requis')

  const host = new URL(url).hostname.replace(/^www\./, '')
  const site = await createSite({ userId, name: host, url })
  console.log(`site créé : ${site.id} (${host})`)

  const launched = await launchFullAnalysis(userId, site.id)
  if ('error' in launched) {
    console.error(`lancement impossible : ${launched.error}`)
    console.log(`\nPensez à supprimer le site : --cleanup ${site.id}`)
    return
  }
  console.log(`analyse lancée : ${launched.analysisId}`)
  console.log(`\nsuivi : --site ${site.id} --analysis ${launched.analysisId}`)

  // Suivi jusqu'à aboutissement (ou échec).
  for (let i = 0; i < 60; i++) {
    await sleep(20_000)
    const a = await getAnalysisById(launched.analysisId)
    process.stdout.write(`\r  ${(i + 1) * 20}s — statut ${a?.status}      `)
    if (a && a.status !== 'running' && a.status !== 'pending') {
      console.log()
      if (a.status === 'error') console.error(`\néchec : ${a.errorMessage}`)
      await report(site.id, launched.analysisId)
      console.log(`\nNettoyage : pnpm tsx scripts/prospection/deep-audit.ts --cleanup ${site.id}`)
      return
    }
  }
  console.log('\ndélai dépassé — relancez avec --site / --analysis pour lire le résultat')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
