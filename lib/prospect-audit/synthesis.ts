/**
 * Rédaction des solutions et du plan d'action d'un audit prospect : UN appel
 * LLM, petit modèle, sortie plafonnée, validée par Zod (règle CLAUDE.md §8).
 *
 * Le schéma est construit à partir des problèmes détectés : une solution par
 * catégorie présente, ni plus ni moins. Une réponse qui en invente une autre,
 * ou en oublie une, est rejetée et redemandée avec la correction.
 */

import { z } from 'zod'
import { callStructured } from '@/lib/ai/structured'
import {
  PROSPECT_SYNTHESIS_SYSTEM_PROMPT,
  buildProspectSynthesisMessage,
} from '@/lib/ai/prompts/prospect-audit'
import {
  PlanDaySchema,
  SolutionSchema,
  type IssueCategory,
  type ProspectActivity,
  type ProspectIssue,
} from '@/lib/prospect-audit/types'

export const SYNTHESIS_MODEL = 'anthropic/claude-haiku-4-5'
/** 7 catégories × ~90 tokens + 5 jours × ~80 tokens ≈ 1 100 tokens. */
export const SYNTHESIS_MAX_TOKENS = 1_600

/** « 4,9 s », « 92 » → « 4.9 », « 92 ». Les jours du plan (1 à 5) sont toujours permis. */
export function numbersIn(text: string): string[] {
  return (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(',', '.').replace(/^0+(?=\d)/, ''))
}

/**
 * Le texte rédigé ne contient aucun chiffre absent de la liste des problèmes :
 * c'est la preuve vérifiable, à défaut d'une autre, que rien n'est inventé
 * (le 20/10/2026, sans ce contrôle : « vos concurrents en ont 80 à 95 »,
 * « visez 50 avis dans les 3 mois » — ni l'un ni l'autre dans les faits).
 */
export function inventedNumbers(texts: string[], source: string): string[] {
  const allowed = new Set([...numbersIn(source), '1', '2', '3', '4', '5'])
  return [...new Set(texts.flatMap(numbersIn).filter((n) => !allowed.has(n)))]
}

export function buildSynthesisSchema(categories: IssueCategory[], source?: string) {
  const expected = [...new Set(categories)]
  return z
    .object({
      solutions: z.array(SolutionSchema),
      plan: z.array(PlanDaySchema).length(5),
    })
    .superRefine((value, ctx) => {
      const got = value.solutions.map((s) => s.category)
      const missing = expected.filter((c) => !got.includes(c))
      const extra = got.filter((c) => !expected.includes(c))
      const duplicated = got.filter((c, i) => got.indexOf(c) !== i)
      if (missing.length || extra.length || duplicated.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['solutions'],
          message: `une solution par catégorie attendue (${expected.join(', ')}) ; manquantes : ${missing.join(', ') || 'aucune'} ; en trop : ${[...extra, ...duplicated].join(', ') || 'aucune'}`,
        })
      }
      if (source !== undefined) {
        const texts = [
          ...value.solutions.map((x) => x.text),
          ...value.plan.flatMap((d) => [d.title, ...d.tasks]),
        ]
        const invented = inventedNumbers(texts, source)
        if (invented.length > 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['solutions'],
            message: `chiffres absents de la liste des problèmes : ${invented.join(', ')}. N'écris que des chiffres présents dans la liste, aucun objectif chiffré, aucune estimation.`,
          })
        }
      }
      const days = value.plan.map((d) => d.day)
      if (days.some((d, i) => d !== i + 1)) {
        ctx.addIssue({ code: 'custom', path: ['plan'], message: 'les jours doivent être 1, 2, 3, 4, 5 dans cet ordre' })
      }
    })
}

export type Synthesis = z.infer<ReturnType<typeof buildSynthesisSchema>>

export interface SynthesisResult {
  solutions: Synthesis['solutions']
  plan: Synthesis['plan']
  costUsd: number | null
}

export async function synthesizeAudit(params: {
  businessName: string
  activity: ProspectActivity
  arrondissement: string
  hasOwnSite: boolean
  issues: ProspectIssue[]
}): Promise<SynthesisResult> {
  const userContent = buildProspectSynthesisMessage(params)
  const schema = buildSynthesisSchema(
    params.issues.map((i) => i.category),
    userContent
  )
  const { data, costUsd } = await callStructured({
    systemPrompt: PROSPECT_SYNTHESIS_SYSTEM_PROMPT,
    userContent,
    schema,
    model: SYNTHESIS_MODEL,
    maxTokens: SYNTHESIS_MAX_TOKENS,
  })
  // Remis dans l'ordre des catégories de la page
  const order = [...new Set(params.issues.map((i) => i.category))]
  const solutions = [...data.solutions].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))
  return { solutions, plan: data.plan, costUsd }
}
