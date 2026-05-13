// lib/analysis/authority-table.ts

import type { IAEngineName } from '@/lib/ai/connectors/base'

export const IA_ENGINES: IAEngineName[] = ['chatgpt', 'claude', 'gemini', 'perplexity']

export const ENGINE_LABELS: Record<IAEngineName, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
}

export type AuthoritySource = {
  id: string
  url: string
  title: string | null
  domain: string
  isClientDomain: boolean
}

export type AuthorityResultRow = {
  id: string
  engine: IAEngineName
  answer: string
  promptIsNeutral: boolean
  partialResponse: boolean
  sources: AuthoritySource[]
  prompt: { id: string; text: string; isNeutral: boolean }
}

export type EngineStats = {
  engine: IAEngineName
  label: string
  total: number
  cited: number
  percentage: number
}

export type CellData = {
  resultId: string
  engine: IAEngineName
  answer: string
  sources: AuthoritySource[]
  cited: boolean
  partial: boolean
}

export type CrossTableRow = {
  promptId: string
  promptText: string
  cells: Partial<Record<IAEngineName, CellData>>
}

export function buildEngineStats(results: AuthorityResultRow[]): EngineStats[] {
  return IA_ENGINES.map((engine) => {
    const engineResults = results.filter((r) => r.engine === engine && r.promptIsNeutral)
    const total = engineResults.length
    const cited = engineResults.filter((r) =>
      r.sources.some((s) => s.isClientDomain)
    ).length
    return {
      engine,
      label: ENGINE_LABELS[engine],
      total,
      cited,
      percentage: total === 0 ? 0 : Math.round((cited / total) * 100),
    }
  })
}

export function buildCrossTable(results: AuthorityResultRow[]): CrossTableRow[] {
  const promptMap = new Map<string, CrossTableRow>()

  for (const result of results) {
    const promptId = result.prompt.id
    if (!promptMap.has(promptId)) {
      promptMap.set(promptId, {
        promptId,
        promptText: result.prompt.text,
        cells: {},
      })
    }
    const row = promptMap.get(promptId)!
    row.cells[result.engine] = {
      resultId: result.id,
      engine: result.engine,
      answer: result.answer,
      sources: result.sources,
      cited: result.sources.some((s) => s.isClientDomain),
      partial: result.partialResponse,
    }
  }

  return Array.from(promptMap.values())
}
