/**
 * Audit prospect (ticket C-05b) — orchestration.
 *
 * 5 questions × 3 moteurs, posées UNE PAR UNE (jamais en parallèle) pour que
 * le garde-fou de dépense contrôle chaque appel ; puis, si le commerce a un
 * site à lui, les règles Technique et Contenu de l'analyse sur les pages déjà
 * lues ; puis la liste des problèmes, déterministe ; enfin un seul appel LLM
 * pour rédiger solutions et plan.
 *
 * Aucune lecture ni écriture en base, aucun crawl ici : les pages et les
 * moteurs sont fournis par l'appelant (script admin), ce qui garde ce module
 * testable sans réseau.
 */

import type { IAEngine, IAResponse } from '@/lib/ai/connectors/base'
import { CITATION_SUFFIX } from '@/lib/ai/prompts/citation'
import { buildProspectQuestions } from '@/lib/ai/prompts/prospect-audit'
import { isPromptNeutral } from '@/lib/analysis/neutrality'
import { evaluateTechnicalRules } from '@/lib/analysis/technical'
import { evaluateContentRules } from '@/lib/analysis/content'
import type { FirecrawlPage } from '@/lib/analysis/technical/types'
import { AuditBudget, TYPICAL_CALL_COST_USD, SYNTHESIS_RESERVE_USD } from '@/lib/prospect-audit/budget'
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
import type { SynthesisResult } from '@/lib/prospect-audit/synthesis'
import {
  AUDIT_DOCUMENT_VERSION,
  AuditDocumentSchema,
  PROSPECT_ENGINES,
  type AnswerCell,
  type AuditDocument,
  type ProspectEngine,
  type ProspectInput,
  type ProspectIssue,
} from '@/lib/prospect-audit/types'

/** Pages lues sur le site du prospect (accueil, contact, prestations…). */
export const PROSPECT_PAGE_LIMIT = 5
/** Au-delà, l'audit n'a plus assez de réponses pour être montré. */
export const MAX_FAILED_CALLS = 3
export const AUDIT_TTL_DAYS = 60
const CALL_TIMEOUT_MS = 90_000
const RETRY_DELAY_MS = 3_000

export class AuditAbortedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuditAbortedError'
  }
}

export interface RawAnswer {
  question: number
  engine: ProspectEngine
  prompt: string
  answer: string | null
  sources: { url: string; domain: string }[]
  costUsd: number
  error: string | null
}

export interface RunProspectAuditDeps {
  engines: Record<ProspectEngine, IAEngine>
  /**
   * Pages lues sur le site propre du prospect ; `null` s'il n'en a pas (ou si
   * la fiche renvoie vers une plateforme). `[]` = site illisible.
   */
  pages: FirecrawlPage[] | null
  synthesize: (params: {
    businessName: string
    activity: ProspectInput['activity']
    arrondissement: string
    hasOwnSite: boolean
    issues: ProspectIssue[]
  }) => Promise<SynthesisResult>
  budget?: AuditBudget
  now?: Date
  retryDelayMs?: number
  log?: (line: string) => void
}

export interface RunProspectAuditResult {
  document: AuditDocument
  raw: RawAnswer[]
  budget: AuditBudget
}

function isRetryable(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /\b(408|409|425|429|500|502|503|504)\b|rate.?limit|timeout|ECONNRESET|ETIMEDOUT|fetch failed|overloaded/i.test(
    message
  )
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} : timeout après ${ms / 1000} s`)), ms)
    }),
  ]).finally(() => clearTimeout(timer))
}

function domainOf(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

export async function runProspectAudit(
  prospect: ProspectInput,
  deps: RunProspectAuditDeps
): Promise<RunProspectAuditResult> {
  const budget = deps.budget ?? new AuditBudget()
  const now = deps.now ?? new Date()
  const log = deps.log ?? (() => {})
  const retryDelayMs = deps.retryDelayMs ?? RETRY_DELAY_MS
  const ownSite = hasOwnSite(prospect)

  // ── 1. Questions (neutres par construction, vérifiées quand même — §6) ──────
  const questions = buildProspectQuestions(prospect.activity, prospect.arrondissement)
  for (const q of questions) {
    if (!isPromptNeutral(q.text, prospect.website ?? 'https://invalide.local', prospect.name)) {
      throw new AuditAbortedError(`Question non neutre (contient le nom ou le domaine) : ${q.text}`)
    }
  }

  // ── 2. Réponses des moteurs, une par une ───────────────────────────────────
  const target = {
    name: prospect.name,
    domain: ownSite ? domainOf(prospect.website) : null,
    listingUrl: prospect.listing ? prospect.website : null,
  }
  const answers: AnswerCell[] = []
  const raw: RawAnswer[] = []
  let failed = 0

  for (const [qi, question] of questions.entries()) {
    for (const engineName of PROSPECT_ENGINES) {
      const label = `Q${qi + 1} ${engineName}`
      const engine = deps.engines[engineName]
      const prompt = question.text + CITATION_SUFFIX
      let response: IAResponse | null = null
      let lastError: unknown = null

      for (let attempt = 1; attempt <= 2 && !response; attempt++) {
        budget.assertRoom(label, TYPICAL_CALL_COST_USD[engineName])
        try {
          response = await withTimeout(engine.query(prompt), CALL_TIMEOUT_MS, label)
          budget.record(label, response.cost_usd)
        } catch (err) {
          if (err instanceof Error && err.name === 'BudgetExceededError') throw err
          lastError = err
          // Un appel coupé par notre timeout a pu être facturé : on compte le
          // coût habituel plutôt que zéro, par prudence.
          if (err instanceof Error && /timeout après/.test(err.message)) {
            budget.record(`${label} (timeout)`, TYPICAL_CALL_COST_USD[engineName])
          }
          if (attempt === 1 && isRetryable(err)) await new Promise((r) => setTimeout(r, retryDelayMs))
          else break
        }
      }

      if (!response) {
        failed += 1
        const message = lastError instanceof Error ? lastError.message : String(lastError)
        log(`  ${label} : échec — ${message.slice(0, 160)}`)
        answers.push({ question: qi, engine: engineName, status: 'failed', cited: false, position: null, competitors: [] })
        raw.push({ question: qi, engine: engineName, prompt, answer: null, sources: [], costUsd: 0, error: message.slice(0, 500) })
        if (failed > MAX_FAILED_CALLS) {
          throw new AuditAbortedError(`${failed} appels sans réponse : audit arrêté, rien n'est publié.`)
        }
        continue
      }

      const analysis = analyseAnswer(response.answer, response.sources, target)
      answers.push({
        question: qi,
        engine: engineName,
        status: 'ok',
        cited: analysis.cited,
        position: analysis.position,
        competitors: analysis.competitors,
      })
      raw.push({
        question: qi,
        engine: engineName,
        prompt,
        answer: response.answer,
        sources: response.sources.map((s) => ({ url: s.url, domain: s.domain })),
        costUsd: response.cost_usd,
        error: null,
      })
      log(
        `  ${label} : ${analysis.cited ? `CITÉ${analysis.position ? ` (rang ${analysis.position})` : ''}` : 'absent'} · ` +
          `${response.cost_usd.toFixed(4)} $ · cumul ${budget.spentUsd.toFixed(4)} $`
      )
    }
  }

  // ── 3. Site : règles Technique et Contenu existantes ───────────────────────
  let technical: number | null = null
  let content: number | null = null
  let pagesAnalysed = 0
  const siteIssues: ProspectIssue[] = []
  if (ownSite && prospect.website) {
    const pages = deps.pages ?? []
    if (pages.length === 0) {
      siteIssues.push(siteUnreachableIssue(prospect.website))
    } else {
      const tech = await evaluateTechnicalRules(pages, prospect.website, PROSPECT_PAGE_LIMIT)
      const cont = await evaluateContentRules(pages, prospect.website, PROSPECT_PAGE_LIMIT, [prospect.activity])
      technical = tech.score
      content = cont.score
      pagesAnalysed = Math.max(tech.pagesAnalysed, cont.pagesAnalysed)
      siteIssues.push(
        ...ruleIssues('technique', tech.issues, tech.pagesAnalysed),
        ...ruleIssues('contenu', cont.issues, cont.pagesAnalysed)
      )
    }
  }

  // ── 4. Notes et problèmes ──────────────────────────────────────────────────
  const scores = computeProspectScores(answers, technical, content, prospect)
  if (!scores) throw new AuditAbortedError('Aucune réponse des IA : audit arrêté, rien n’est publié.')

  const issues = sortIssues([...placeIssues(prospect), ...siteIssues, ...aiIssues(answers)])

  // ── 5. Solutions et plan : un seul appel LLM ───────────────────────────────
  budget.assertRoom('rédaction', SYNTHESIS_RESERVE_USD, { usesReserve: true })
  const synthesis = await deps.synthesize({
    businessName: prospect.name,
    activity: prospect.activity,
    arrondissement: prospect.arrondissement,
    hasOwnSite: ownSite,
    issues,
  })
  budget.record('rédaction', synthesis.costUsd ?? SYNTHESIS_RESERVE_USD, { releasesReserve: true })
  log(`  rédaction : ${(synthesis.costUsd ?? 0).toFixed(4)} $ · total ${budget.spentUsd.toFixed(4)} $`)

  const document = AuditDocumentSchema.parse({
    version: AUDIT_DOCUMENT_VERSION,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + AUDIT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    prospect,
    questions,
    answers,
    scores,
    site: { analysed: ownSite && pagesAnalysed > 0, url: ownSite ? prospect.website : null, pagesAnalysed },
    issues,
    citedInstead: rankCitedInstead(answers.filter((a) => a.status === 'ok')),
    solutions: synthesis.solutions,
    plan: synthesis.plan,
  })

  return { document, raw, budget }
}
