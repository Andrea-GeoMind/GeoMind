import { appendFileSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { IAEngine } from '@/lib/ai/connectors/base'
import { ChatGPTConnector } from '@/lib/ai/connectors/chatgpt'
import { ClaudeConnector } from '@/lib/ai/connectors/claude'
import { GeminiConnector } from '@/lib/ai/connectors/gemini'
import { CITATION_SUFFIX } from '@/lib/ai/prompts/citation'
import { AuditBudget, TYPICAL_CALL_COST_USD } from '@/lib/prospect-audit/budget'
import { analyseAnswer, rankCitedInstead } from '@/lib/prospect-audit/citations'
import {
  aiIssues,
  computeProspectScores,
  hasOwnSite,
  placeIssues,
  ruleIssues,
  siteUnreachableIssue,
  sortIssues,
} from '@/lib/prospect-audit/issues'
import { readProspectSite } from '@/lib/prospect-audit/crawl'
import { PROSPECT_PAGE_LIMIT } from '@/lib/prospect-audit/run'
import { evaluateTechnicalRules } from '@/lib/analysis/technical'
import { evaluateContentRules } from '@/lib/analysis/content'
import { loadAuditDocument, saveAuditDocument } from '@/lib/prospect-audit/storage'
import { synthesizeAudit } from '@/lib/prospect-audit/synthesis'
import { hashAuditToken } from '@/lib/prospect-audit/token'
import { AuditDocumentSchema, type ProspectEngine } from '@/lib/prospect-audit/types'

/**
 * Complète un audit publié dont des cases sont restées sans réponse (coupure
 * réseau, 429) : repose seulement ces questions, puis refait notes, problèmes
 * « IA » et rédaction. Même lien. Coût : ~0,01 $ par case + ~0,01 $.
 *
 * Usage :
 *   npx tsx --conditions=react-server --env-file=.env.local scripts/prospection/audit-complete.ts --rank 6
 *   ... --relire-site   relit aussi le site (~6 crédits Firecrawl) et refait Technique et Contenu
 */

const OUT_DIR = join(homedir(), 'Downloads', 'Audits-C05b')

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}

async function main(): Promise<void> {
  const rank = Number(arg('--rank'))
  const rows = readFileSync(join(OUT_DIR, 'liens.csv'), 'utf8').trim().split('\n').slice(1).map((l) => l.split(';'))
  const url = rows.filter((c) => Number(c[0]) === rank).pop()?.[2]
  if (!url) throw new Error(`Aucun lien pour le rang ${rank}`)
  const hash = hashAuditToken(url.split('/audit/')[1] ?? '')
  const doc = await loadAuditDocument(hash)
  if (!doc) throw new Error('Audit introuvable')

  const failed = doc.answers.filter((a) => a.status === 'failed')
  const reread = process.argv.includes('--relire-site') && hasOwnSite(doc.prospect)
  console.log(`${doc.prospect.name} : ${failed.length} case(s) sans réponse${reread ? ', site relu' : ''}`)
  if (failed.length === 0 && !reread) return

  const engines: Record<ProspectEngine, IAEngine> = {
    chatgpt: new ChatGPTConnector(),
    gemini: new GeminiConnector(),
    claude: new ClaudeConnector(),
  }
  const p = doc.prospect
  const target = {
    name: p.name,
    domain: hasOwnSite(p) && p.website ? new URL(p.website).hostname.replace(/^www\./, '') : null,
    listingUrl: p.listing ? p.website : null,
  }
  const budget = new AuditBudget()
  const answers = [...doc.answers]
  for (const cell of failed) {
    const label = `Q${cell.question + 1} ${cell.engine}`
    budget.assertRoom(label, TYPICAL_CALL_COST_USD[cell.engine])
    const response = await engines[cell.engine].query(doc.questions[cell.question]!.text + CITATION_SUFFIX)
    budget.record(label, response.cost_usd)
    const analysis = analyseAnswer(response.answer, response.sources, target)
    answers[answers.indexOf(cell)] = { ...cell, status: 'ok', ...analysis }
    console.log(`  ${label} : ${analysis.cited ? 'CITÉ' : 'absent'} · ${response.cost_usd.toFixed(4)} $`)
  }

  // Site relu (règles corrigées depuis l'audit) : Technique et Contenu refaits
  let technical = doc.scores.technical
  let content = doc.scores.content
  let site = doc.site
  let siteIssues = doc.issues.filter((i) => i.category === 'technique' || i.category === 'contenu' || i.key === 'site.inaccessible')
  if (reread && p.website) {
    const crawl = await readProspectSite(p.website, PROSPECT_PAGE_LIMIT)
    console.log(`  ${crawl.pages.length} page(s) relue(s), ${crawl.credits} crédits Firecrawl`)
    if (crawl.pages.length === 0) {
      technical = null
      content = null
      siteIssues = [siteUnreachableIssue(p.website)]
      site = { analysed: false, url: p.website, pagesAnalysed: 0 }
    } else {
      const tech = await evaluateTechnicalRules(crawl.pages, p.website, PROSPECT_PAGE_LIMIT)
      const cont = await evaluateContentRules(crawl.pages, p.website, PROSPECT_PAGE_LIMIT, [p.activity])
      technical = tech.score
      content = cont.score
      siteIssues = [
        ...ruleIssues('technique', tech.issues, tech.pagesAnalysed),
        ...ruleIssues('contenu', cont.issues, cont.pagesAnalysed),
      ]
      site = { analysed: true, url: p.website, pagesAnalysed: Math.max(tech.pagesAnalysed, cont.pagesAnalysed) }
    }
  }

  const scores = computeProspectScores(answers, technical, content, p)
  if (!scores) throw new Error('Notes impossibles')
  const issues = sortIssues([...placeIssues(p), ...siteIssues, ...aiIssues(answers)])
  budget.assertRoom('rédaction', 0.01, { usesReserve: true })
  const synthesis = await synthesizeAudit({
    businessName: p.name,
    activity: p.activity,
    arrondissement: p.arrondissement,
    hasOwnSite: hasOwnSite(p),
    issues,
  })
  budget.record('rédaction', synthesis.costUsd ?? 0.01, { releasesReserve: true })

  const next = AuditDocumentSchema.parse({
    ...doc,
    answers,
    scores,
    site,
    issues,
    citedInstead: rankCitedInstead(answers.filter((a) => a.status === 'ok')),
    solutions: synthesis.solutions,
    plan: synthesis.plan,
  })
  await saveAuditDocument(hash, next, { overwrite: true })
  appendFileSync(
    join(OUT_DIR, 'journal.jsonl'),
    JSON.stringify({
      at: new Date().toISOString(),
      rank,
      name: p.name,
      status: 'publié',
      costUsd: budget.spentUsd,
      firecrawlCredits: 0,
      detail: `${failed.length} case(s) complétée(s)${reread ? ', site relu' : ''}`,
    }) + '\n'
  )
  console.log(`  ✔ complété : ${budget.spentUsd.toFixed(4)} $`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
