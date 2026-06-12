import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/queries/sites', () => ({
  getSiteById: vi.fn(),
}))
vi.mock('@/lib/db/queries/firecrawl-pages', () => ({
  getFirecrawlPagesBySiteId: vi.fn(),
}))
vi.mock('@/lib/db/queries/technical-issues', () => ({
  insertTechnicalIssues: vi.fn(),
}))
vi.mock('@/lib/quotas', () => ({
  getPageAnalysisLimit: vi.fn().mockResolvedValue(10),
}))

// Stub all network rules to avoid real HTTP calls
vi.mock('@/lib/analysis/technical/rules/robots-txt-block-all', () => ({
  checkRobotsTxtBlockAll: vi.fn().mockResolvedValue(null),
}))
vi.mock('@/lib/analysis/technical/rules/robots-txt-block-ai-bots', () => ({
  checkRobotsTxtBlockAiBots: vi.fn().mockResolvedValue(null),
}))
vi.mock('@/lib/analysis/technical/rules/sitemap-missing', () => ({
  checkSitemapMissing: vi.fn().mockResolvedValue(null),
}))
vi.mock('@/lib/analysis/technical/rules/sitemap-malformed', () => ({
  checkSitemapMalformed: vi.fn().mockResolvedValue(null),
}))
vi.mock('@/lib/analysis/technical/rules/llms-txt-missing', () => ({
  checkLlmsTxtMissing: vi.fn().mockResolvedValue(null),
}))
// Stub the schema rules that would fire on the minimal fixture pages
vi.mock('@/lib/analysis/technical/rules/schema-org-organization', () => ({
  checkSchemaOrgOrganization: vi.fn().mockResolvedValue(null),
}))
// Stub https-missing so individual tests can opt-in to an issue
vi.mock('@/lib/analysis/technical/rules/https-missing', () => ({
  checkHttpsMissing: vi.fn().mockResolvedValue(null),
}))

import { getSiteById } from '@/lib/db/queries/sites'
import { getFirecrawlPagesBySiteId } from '@/lib/db/queries/firecrawl-pages'
import { insertTechnicalIssues } from '@/lib/db/queries/technical-issues'
import { checkHttpsMissing } from '@/lib/analysis/technical/rules/https-missing'
import { runTechnicalAnalysis } from '@/lib/analysis/technical'

const SITE_ID = 'site-uuid-1234'
const ANALYSIS_ID = 'analysis-uuid-5678'

const MOCK_SITE = {
  id: SITE_ID,
  url: 'https://example.com',
  name: 'Example',
  userId: 'user-1',
  language: 'fr',
  country: 'FR',
  isVerified: false,
      coachIntroSeen: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const MOCK_PAGES = [
  { id: 'p1', siteId: SITE_ID, url: 'https://example.com/', markdown: '# Home', statusCode: 200, metadata: null, crawledAt: new Date() },
  { id: 'p2', siteId: SITE_ID, url: 'https://example.com/about', markdown: '# About\n\n## Our Story\n\nContent', statusCode: 200, metadata: null, crawledAt: new Date() },
]

describe('runTechnicalAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSiteById).mockResolvedValue(MOCK_SITE)
    vi.mocked(getFirecrawlPagesBySiteId).mockResolvedValue(MOCK_PAGES)
    vi.mocked(insertTechnicalIssues).mockResolvedValue([])
    vi.mocked(checkHttpsMissing).mockResolvedValue(null)
  })

  it('returns score=100 and issueCount=0 when no rules detect issues', async () => {
    const result = await runTechnicalAnalysis({ siteId: SITE_ID, analysisId: ANALYSIS_ID })
    expect(result.score).toBe(100)
    expect(result.issueCount).toBe(0)
  })

  it('inserts only opportunities (≥3, garantie §18.6) when no issues are detected', async () => {
    await runTechnicalAnalysis({ siteId: SITE_ID, analysisId: ANALYSIS_ID })
    expect(insertTechnicalIssues).toHaveBeenCalledOnce()
    const inserted = vi.mocked(insertTechnicalIssues).mock.calls[0][0]
    expect(inserted.length).toBeGreaterThanOrEqual(3)
    expect(inserted.every((i) => i.severity === 'opportunity')).toBe(true)
    expect(inserted.every((i) => i.penalty === 0)).toBe(true)
  })

  it('inserts issues when rules detect problems', async () => {
    // Make the https-missing mock return an issue for this test
    vi.mocked(checkHttpsMissing).mockResolvedValue({
      ruleKey: 'https_missing',
      category: 'accessibility',
      title: 'Site non sécurisé (HTTP)',
      description: 'Test description',
      sampleUrls: ['http://example.com'],
      severity: 'major',
      effort: 3,
      impact: 3,
    })
    const result = await runTechnicalAnalysis({ siteId: SITE_ID, analysisId: ANALYSIS_ID })
    expect(result.issueCount).toBeGreaterThan(0)
    expect(insertTechnicalIssues).toHaveBeenCalledOnce()
    const insertedIssues = vi.mocked(insertTechnicalIssues).mock.calls[0][0]
    const httpsIssue = insertedIssues.find((i) => i.ruleKey === 'https_missing')
    expect(httpsIssue).toBeDefined()
    // La pénalité est dérivée de la sévérité (major = 12)
    expect(httpsIssue!.penalty).toBe(12)
    expect(httpsIssue!.severity).toBe('major')
  })

  it('returns score < 100 when issues are detected', async () => {
    vi.mocked(checkHttpsMissing).mockResolvedValue({
      ruleKey: 'https_missing',
      category: 'accessibility',
      title: 'Site non sécurisé (HTTP)',
      description: 'Test description',
      sampleUrls: ['http://example.com'],
      severity: 'major',
      effort: 3,
      impact: 3,
    })
    const result = await runTechnicalAnalysis({ siteId: SITE_ID, analysisId: ANALYSIS_ID })
    expect(result.score).toBeLessThan(100)
  })

  it('throws when site is not found', async () => {
    vi.mocked(getSiteById).mockResolvedValue(null as never)
    await expect(
      runTechnicalAnalysis({ siteId: 'unknown', analysisId: ANALYSIS_ID })
    ).rejects.toThrow()
  })
})
