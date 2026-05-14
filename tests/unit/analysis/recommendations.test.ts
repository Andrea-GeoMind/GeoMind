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
