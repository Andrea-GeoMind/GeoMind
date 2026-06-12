import { describe, it, expect } from 'vitest'
import type {
  FirecrawlPage,
  TechnicalIssue,
  TechnicalIssueCategoryEnum,
  RuleInput,
} from '@/lib/analysis/technical/types'

describe('Technical analysis types', () => {
  it('FirecrawlPage accepts a minimal page with just url', () => {
    const page: FirecrawlPage = { url: 'https://example.com/' }
    expect(page.url).toBe('https://example.com/')
  })

  it('FirecrawlPage accepts full metadata', () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/blog/post',
      markdown: '# Title\n\nContent',
      statusCode: 200,
      metadata: {
        title: 'Title',
        h1: ['Title'],
        h2: ['Section'],
        schemaOrgs: [{ '@type': 'Article' }],
        loadTime: 1200,
      },
    }
    expect(page.metadata?.schemaOrgs).toHaveLength(1)
  })

  it('FirecrawlPage metadata accepts extra Firecrawl keys via index signature', () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/',
      metadata: {
        ogTitle: 'Title',
        viewport: 'width=device-width, initial-scale=1',
        robots: 'index, follow',
        'twitter:card': 'summary',
      },
    }
    expect(typeof page.metadata?.['ogTitle']).toBe('string')
  })

  it('TechnicalIssue has required V2 fields (severity/effort/impact)', () => {
    const issue: TechnicalIssue = {
      ruleKey: 'https_missing',
      category: 'accessibility',
      title: 'Site non sécurisé',
      description: 'HTTP instead of HTTPS.',
      sampleUrls: ['http://example.com'],
      severity: 'major',
      effort: 3,
      impact: 3,
    }
    expect(issue.severity).toBe('major')
    expect(issue.effort).toBe(3)
    expect(issue.impact).toBe(3)
  })

  it('TechnicalIssue accepts severity opportunity', () => {
    const issue: TechnicalIssue = {
      ruleKey: 'url_too_long',
      category: 'structure',
      title: 'URL très longue',
      description: 'Opportunité.',
      sampleUrls: [],
      severity: 'opportunity',
      effort: 3,
      impact: 1,
    }
    expect(issue.severity).toBe('opportunity')
  })

  it('TechnicalIssueCategoryEnum accepts valid values', () => {
    const categories: TechnicalIssueCategoryEnum[] = [
      'accessibility',
      'structure',
      'schema_org',
      'performance',
    ]
    expect(categories).toHaveLength(4)
  })

  it('RuleInput has pages and siteUrl', () => {
    const input: RuleInput = {
      pages: [{ url: 'https://example.com/' }],
      siteUrl: 'https://example.com',
    }
    expect(input.siteUrl).toBe('https://example.com')
  })
})
