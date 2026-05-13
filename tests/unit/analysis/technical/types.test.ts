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

  it('TechnicalIssue has required fields', () => {
    const issue: TechnicalIssue = {
      ruleKey: 'https_missing',
      category: 'accessibility',
      title: 'Site non sécurisé',
      description: 'HTTP instead of HTTPS.',
      sampleUrls: ['http://example.com'],
      penalty: 15,
    }
    expect(issue.penalty).toBe(15)
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
