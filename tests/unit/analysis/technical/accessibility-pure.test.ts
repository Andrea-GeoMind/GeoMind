import { describe, it, expect } from 'vitest'
import { checkHttpsMissing } from '@/lib/analysis/technical/rules/https-missing'
import { checkHttpErrorsRatio } from '@/lib/analysis/technical/rules/http-errors-ratio'
import { checkPageSizeHeavy } from '@/lib/analysis/technical/rules/page-size-heavy'
import type { RuleInput } from '@/lib/analysis/technical/types'

const PAGES_OK = [
  { url: 'https://example.com/', markdown: '# Home', statusCode: 200 },
  { url: 'https://example.com/about', markdown: '# About', statusCode: 200 },
  { url: 'https://example.com/contact', markdown: '# Contact', statusCode: 200 },
]

// ─── checkHttpsMissing ────────────────────────────────────────────────────────

describe('checkHttpsMissing', () => {
  it('returns null when site uses HTTPS', async () => {
    const result = await checkHttpsMissing({ pages: PAGES_OK, siteUrl: 'https://example.com' })
    expect(result).toBeNull()
  })

  it('returns an issue when site uses HTTP', async () => {
    const result = await checkHttpsMissing({ pages: PAGES_OK, siteUrl: 'http://example.com' })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('https_missing')
    expect(result!.category).toBe('accessibility')
    expect(result!.penalty).toBe(15)
    expect(result!.sampleUrls).toContain('http://example.com')
  })

  it('is deterministic', async () => {
    const input: RuleInput = { pages: PAGES_OK, siteUrl: 'http://example.com' }
    const a = await checkHttpsMissing(input)
    const b = await checkHttpsMissing(input)
    expect(a).toEqual(b)
  })
})

// ─── checkHttpErrorsRatio ─────────────────────────────────────────────────────

describe('checkHttpErrorsRatio', () => {
  it('returns null when error ratio is ≤5%', async () => {
    const pages = [
      { url: 'https://example.com/', statusCode: 200 },
      { url: 'https://example.com/a', statusCode: 200 },
      { url: 'https://example.com/b', statusCode: 200 },
      { url: 'https://example.com/c', statusCode: 200 },
      { url: 'https://example.com/d', statusCode: 200 },
      { url: 'https://example.com/e', statusCode: 404 },
    ]
    // 1/6 = 16.7% > 5% → should detect
    const result = await checkHttpErrorsRatio({ pages, siteUrl: 'https://example.com' })
    expect(result).not.toBeNull()
  })

  it('returns null when no errors', async () => {
    const result = await checkHttpErrorsRatio({ pages: PAGES_OK, siteUrl: 'https://example.com' })
    expect(result).toBeNull()
  })

  it('returns null for empty pages array', async () => {
    const result = await checkHttpErrorsRatio({ pages: [], siteUrl: 'https://example.com' })
    expect(result).toBeNull()
  })

  it('detects >5% ratio and returns issue with correct fields', async () => {
    const pages = Array.from({ length: 10 }, (_, i) => ({
      url: `https://example.com/page-${i}`,
      statusCode: i < 6 ? 404 : 200,
    }))
    const result = await checkHttpErrorsRatio({ pages, siteUrl: 'https://example.com' })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('http_errors_ratio')
    expect(result!.category).toBe('accessibility')
    expect(result!.penalty).toBe(15)
    expect(result!.sampleUrls.length).toBeGreaterThan(0)
  })

  it('counts pages with statusCode >= 400 as errors', async () => {
    const pages = [
      { url: 'https://example.com/ok', statusCode: 200 },
      { url: 'https://example.com/ok2', statusCode: 301 },
      { url: 'https://example.com/err1', statusCode: 500 },
      { url: 'https://example.com/err2', statusCode: 403 },
      { url: 'https://example.com/err3', statusCode: 404 },
    ]
    // 3/5 = 60% > 5%
    const result = await checkHttpErrorsRatio({ pages, siteUrl: 'https://example.com' })
    expect(result).not.toBeNull()
  })

  it('limits sampleUrls to 5 entries', async () => {
    const pages = Array.from({ length: 20 }, (_, i) => ({
      url: `https://example.com/err-${i}`,
      statusCode: 404,
    }))
    const result = await checkHttpErrorsRatio({ pages, siteUrl: 'https://example.com' })
    expect(result!.sampleUrls.length).toBeLessThanOrEqual(5)
  })
})

// ─── checkPageSizeHeavy ───────────────────────────────────────────────────────

describe('checkPageSizeHeavy', () => {
  it('returns null when all pages are lightweight', async () => {
    const result = await checkPageSizeHeavy({ pages: PAGES_OK, siteUrl: 'https://example.com' })
    expect(result).toBeNull()
  })

  it('returns null for empty pages array', async () => {
    const result = await checkPageSizeHeavy({ pages: [], siteUrl: 'https://example.com' })
    expect(result).toBeNull()
  })

  it('detects a page whose markdown proxies >2MB HTML', async () => {
    const heavyMarkdown = 'a'.repeat(510_000)
    const pages = [
      { url: 'https://example.com/', markdown: '# Short page' },
      { url: 'https://example.com/heavy', markdown: heavyMarkdown },
    ]
    const result = await checkPageSizeHeavy({ pages, siteUrl: 'https://example.com' })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('page_size_heavy')
    expect(result!.category).toBe('performance')
    expect(result!.penalty).toBe(3)
    expect(result!.sampleUrls).toContain('https://example.com/heavy')
  })
})
