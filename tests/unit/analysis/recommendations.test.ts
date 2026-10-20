import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db/queries/technical-issues', () => ({
  getTechnicalIssuesByAnalysisId: vi.fn(),
}))
vi.mock('@/lib/db/queries/content-issues', () => ({
  getContentIssuesByAnalysisId: vi.fn(),
}))
vi.mock('@/lib/db/queries/recommendations', () => ({
  insertRecommendations: vi.fn(),
}))
vi.mock('@/lib/ai/structured', () => ({
  callStructured: vi.fn(),
}))
vi.mock('@/lib/monitoring', () => ({
  captureJobFailure: vi.fn(),
}))
vi.mock('@/lib/ai/cost', () => ({
  logEstimatedBatchCost: vi.fn(),
}))

import { buildInsertPayloads } from '@/lib/analysis/recommendations'

describe('buildInsertPayloads', () => {
  it('retourne un payload par issue technique', () => {
    const payloads = buildInsertPayloads('analysis-1', [
      { id: 'tech-1', type: 'technical', content: '## How\nFix it.' },
    ])
    expect(payloads).toHaveLength(1)
    expect(payloads[0]).toMatchObject({
      analysisId: 'analysis-1',
      issueType: 'technical',
      issueId: 'tech-1',
      variant: 'simplified',
      content: '## How\nFix it.',
    })
  })

  it('retourne un payload par issue contenu', () => {
    const payloads = buildInsertPayloads('analysis-1', [
      { id: 'cont-1', type: 'content', content: '## How\nFix content.' },
    ])
    expect(payloads[0]).toMatchObject({
      issueType: 'content',
      issueId: 'cont-1',
    })
  })

  it('retourne [] si aucune issue', () => {
    expect(buildInsertPayloads('analysis-1', [])).toHaveLength(0)
  })
})

describe('generateRecommendations — tolérance aux refus (PLAN 48)', () => {
  it('garde les fiches obtenues quand un appel est refusé', async () => {
    const { getTechnicalIssuesByAnalysisId } = await import('@/lib/db/queries/technical-issues')
    const { getContentIssuesByAnalysisId } = await import('@/lib/db/queries/content-issues')
    const { insertRecommendations } = await import('@/lib/db/queries/recommendations')
    const { callStructured } = await import('@/lib/ai/structured')
    const { generateRecommendations } = await import('@/lib/analysis/recommendations')

    const issue = (id: string) => ({ id, title: 't', description: 'd', ruleKey: 'r' })
    vi.mocked(getTechnicalIssuesByAnalysisId).mockResolvedValue([issue('t1'), issue('t2')] as never)
    vi.mocked(getContentIssuesByAnalysisId).mockResolvedValue([issue('c1')] as never)
    vi.mocked(callStructured)
      .mockResolvedValueOnce({ data: { content: 'fiche numéro un, assez longue' } } as never)
      .mockRejectedValueOnce(new Error('OpenRouter error 402: in_flight_budget_exhausted'))
      .mockResolvedValueOnce({ data: { content: 'fiche numéro trois, assez longue' } } as never)

    const outcome = await generateRecommendations('site-1', 'analysis-1')

    expect(outcome.generated).toBe(2)
    expect(outcome.failedIssueIds).toEqual(['t2'])
    const inserted = vi.mocked(insertRecommendations).mock.calls[0]![0]
    expect(inserted.map((r) => r.issueId)).toEqual(['t1', 'c1'])
    // Chaque appel est borné
    for (const call of vi.mocked(callStructured).mock.calls) {
      expect(call[0].maxTokens).toBeGreaterThan(0)
    }
  })
})
