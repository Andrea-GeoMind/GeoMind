import { describe, it, expect } from 'vitest'
import { checkHttpsMissing } from '@/lib/analysis/technical/rules/https-missing'
import { checkHttpErrorsRatio } from '@/lib/analysis/technical/rules/http-errors-ratio'
import { checkPageSizeHeavy } from '@/lib/analysis/technical/rules/page-size-heavy'
import { checkImagesWithoutAlt } from '@/lib/analysis/technical/rules/images-without-alt'
import type { RuleInput } from '@/lib/analysis/technical/types'

const PAGES_OK = [
  { url: 'https://example.com/', markdown: '# Home', statusCode: 200 },
  { url: 'https://example.com/about', markdown: '# About', statusCode: 200 },
  { url: 'https://example.com/contact', markdown: '# Contact', statusCode: 200 },
]

const INPUT: RuleInput = { pages: PAGES_OK, siteUrl: 'https://example.com' }

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
    expect(result!.severity).toBe('major')
    expect(result!.effort).toBe(3)
    expect(result!.impact).toBe(3)
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
  it('detects when error ratio is above 5%', async () => {
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
    expect(result!.severity).toBe('major')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(3)
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

// ─── checkPageSizeHeavy (scope page V2) ───────────────────────────────────────

describe('checkPageSizeHeavy', () => {
  it('returns null for a lightweight page', async () => {
    const result = await checkPageSizeHeavy(
      { url: 'https://example.com/', markdown: '# Short page' },
      INPUT
    )
    expect(result).toBeNull()
  })

  it('returns null when markdown is missing', async () => {
    const result = await checkPageSizeHeavy({ url: 'https://example.com/' }, INPUT)
    expect(result).toBeNull()
  })

  it('detects a page whose markdown proxies >2MB HTML', async () => {
    const heavyMarkdown = 'a'.repeat(510_000)
    const page = { url: 'https://example.com/heavy', markdown: heavyMarkdown }
    const result = await checkPageSizeHeavy(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('page_size_heavy')
    expect(result!.category).toBe('performance')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(1)
    expect(result!.sampleUrls).toEqual(['https://example.com/heavy'])
    expect(result!.pageUrl).toBeUndefined()
  })
})

// ─── checkImagesWithoutAlt (scope page) ───────────────────────────────────────

describe('checkImagesWithoutAlt', () => {
  it('returns an issue when >20% of images lack alt text (≥3 images)', async () => {
    const markdown = [
      '![Logo](https://example.com/logo.png)',
      '![](https://example.com/photo-1.png)',
      '![](https://example.com/photo-2.png)',
      '![Une équipe au travail](https://example.com/team.png)',
    ].join('\n\n')
    const result = await checkImagesWithoutAlt({ url: 'https://example.com/about', markdown }, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('images_without_alt')
    expect(result!.category).toBe('accessibility')
    expect(result!.severity).toBe('minor')
    expect(result!.sampleUrls).toEqual(['https://example.com/about'])
  })

  it('returns null when all images have alt text', async () => {
    const markdown = [
      '![Logo](https://example.com/logo.png)',
      '![Photo](https://example.com/photo.png)',
      '![Équipe](https://example.com/team.png)',
    ].join('\n\n')
    const result = await checkImagesWithoutAlt({ url: 'https://example.com/about', markdown }, INPUT)
    expect(result).toBeNull()
  })

  it('returns null when the page has fewer than 3 images', async () => {
    const markdown = '![](https://example.com/a.png)\n\n![](https://example.com/b.png)'
    const result = await checkImagesWithoutAlt({ url: 'https://example.com/about', markdown }, INPUT)
    expect(result).toBeNull()
  })

  it('returns null when the missing-alt ratio is ≤20%', async () => {
    const markdown = [
      '![](https://example.com/no-alt.png)',
      '![Alt 1](https://example.com/1.png)',
      '![Alt 2](https://example.com/2.png)',
      '![Alt 3](https://example.com/3.png)',
      '![Alt 4](https://example.com/4.png)',
    ].join('\n\n')
    // 1/5 = 20% — pas strictement supérieur à 20%
    const result = await checkImagesWithoutAlt({ url: 'https://example.com/about', markdown }, INPUT)
    expect(result).toBeNull()
  })
})
