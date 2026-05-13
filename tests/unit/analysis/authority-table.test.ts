// tests/unit/analysis/authority-table.test.ts

import { describe, it, expect } from 'vitest'
import {
  buildEngineStats,
  buildCrossTable,
  type AuthorityResultRow,
} from '@/lib/analysis/authority-table'

function makeResult(
  overrides: Partial<AuthorityResultRow> & Pick<AuthorityResultRow, 'engine'>
): AuthorityResultRow {
  return {
    id: overrides.id ?? 'r1',
    engine: overrides.engine,
    answer: overrides.answer ?? 'some answer',
    promptIsNeutral: overrides.promptIsNeutral ?? true,
    partialResponse: overrides.partialResponse ?? false,
    sources: overrides.sources ?? [],
    prompt: overrides.prompt ?? { id: 'p1', text: 'What is X?', isNeutral: true },
  }
}

describe('buildEngineStats', () => {
  it('returns 0% when no results', () => {
    const stats = buildEngineStats([])
    expect(stats).toHaveLength(4)
    expect(stats.every((s) => s.total === 0 && s.cited === 0 && s.percentage === 0)).toBe(true)
  })

  it('counts cited correctly when client domain found', () => {
    const results: AuthorityResultRow[] = [
      makeResult({ engine: 'chatgpt', sources: [{ id: 's1', url: 'https://client.fr', title: null, domain: 'client.fr', isClientDomain: true }] }),
      makeResult({ id: 'r2', engine: 'chatgpt', sources: [{ id: 's2', url: 'https://other.com', title: null, domain: 'other.com', isClientDomain: false }] }),
    ]
    const stats = buildEngineStats(results)
    const chatgpt = stats.find((s) => s.engine === 'chatgpt')!
    expect(chatgpt.total).toBe(2)
    expect(chatgpt.cited).toBe(1)
    expect(chatgpt.percentage).toBe(50)
  })

  it('ignores non-neutral prompts', () => {
    const results: AuthorityResultRow[] = [
      makeResult({ engine: 'claude', promptIsNeutral: false, sources: [{ id: 's1', url: 'https://client.fr', title: null, domain: 'client.fr', isClientDomain: true }] }),
    ]
    const stats = buildEngineStats(results)
    const claude = stats.find((s) => s.engine === 'claude')!
    expect(claude.total).toBe(0)
    expect(claude.cited).toBe(0)
  })
})

describe('buildCrossTable', () => {
  it('returns empty array when no results', () => {
    expect(buildCrossTable([])).toEqual([])
  })

  it('groups results by promptId into rows', () => {
    const results: AuthorityResultRow[] = [
      makeResult({ engine: 'chatgpt', prompt: { id: 'p1', text: 'What is X?', isNeutral: true } }),
      makeResult({ id: 'r2', engine: 'gemini', prompt: { id: 'p1', text: 'What is X?', isNeutral: true } }),
      makeResult({ id: 'r3', engine: 'chatgpt', prompt: { id: 'p2', text: 'Another?', isNeutral: true } }),
    ]
    const table = buildCrossTable(results)
    expect(table).toHaveLength(2)
    const row1 = table.find((r) => r.promptId === 'p1')!
    expect(row1.cells['chatgpt']).toBeDefined()
    expect(row1.cells['gemini']).toBeDefined()
    expect(row1.cells['perplexity']).toBeUndefined()
  })

  it('sets cited=true when any source isClientDomain', () => {
    const results: AuthorityResultRow[] = [
      makeResult({
        engine: 'chatgpt',
        sources: [{ id: 's1', url: 'https://client.fr', title: null, domain: 'client.fr', isClientDomain: true }],
      }),
    ]
    const table = buildCrossTable(results)
    expect(table[0].cells['chatgpt']?.cited).toBe(true)
  })
})
