import { describe, it, expect } from 'vitest'
import { checkThinContent } from '@/lib/analysis/content/rules/thin-content'
import { checkNoStructuredLists } from '@/lib/analysis/content/rules/no-structured-lists'
import type { FirecrawlPage } from '@/lib/analysis/content/types'

const SITE_URL = 'https://example.com'

const longText = 'mot '.repeat(350).trim()
const shortText = 'mot '.repeat(50).trim()

// ─── checkThinContent ─────────────────────────────────────────────────────────

describe('checkThinContent', () => {
  it('returns null when the median page length is above the floor', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: longText },
      { url: 'https://example.com/about', markdown: longText },
      { url: 'https://example.com/services', markdown: shortText },
    ]
    // Median of [50, 350, 350] = 350 ≥ 150 → null
    expect(await checkThinContent({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null for empty pages array', async () => {
    expect(await checkThinContent({ pages: [], siteUrl: SITE_URL })).toBeNull()
  })

  it('detects when the median page length is below 150 words', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: shortText },
      { url: 'https://example.com/a', markdown: shortText },
      { url: 'https://example.com/b', markdown: shortText },
      { url: 'https://example.com/c', markdown: longText },
      { url: 'https://example.com/d', markdown: longText },
    ]
    // Median of [50, 50, 50, 350, 350] = 50 < 150
    const result = await checkThinContent({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('thin_content')
    expect(result!.category).toBe('readability')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(3)
    expect(result!.impact).toBe(3)
  })

  it('does not flag when the median is exactly at the floor (boundary)', async () => {
    const exactly150 = 'mot '.repeat(150).trim()
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: shortText },
      { url: 'https://example.com/b', markdown: exactly150 },
      { url: 'https://example.com/c', markdown: longText },
    ]
    // Median of [50, 150, 350] = 150, not < 150 → null
    expect(await checkThinContent({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('limits sampleUrls to 5', async () => {
    const pages: FirecrawlPage[] = Array.from({ length: 10 }, (_, i) => ({
      url: `https://example.com/page-${i}`,
      markdown: shortText,
    }))
    const result = await checkThinContent({ pages, siteUrl: SITE_URL })
    expect(result!.sampleUrls.length).toBeLessThanOrEqual(5)
  })
})

// ─── checkNoStructuredLists ───────────────────────────────────────────────────

describe('checkNoStructuredLists', () => {
  it('returns null when most pages have lists', async () => {
    const withList = '## Section\n\n- item 1\n- item 2\n- item 3'
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: withList },
      { url: 'https://example.com/a', markdown: withList },
      { url: 'https://example.com/b', markdown: 'Just text, no list here.' },
    ]
    // 1/3 = 33% without lists — < 50%, null
    expect(await checkNoStructuredLists({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null for empty pages array', async () => {
    expect(await checkNoStructuredLists({ pages: [], siteUrl: SITE_URL })).toBeNull()
  })

  it('detects when >50% of pages lack lists', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: 'No list here.' },
      { url: 'https://example.com/b', markdown: 'No list here.' },
      { url: 'https://example.com/c', markdown: 'No list here.' },
      { url: 'https://example.com/d', markdown: '- item 1\n- item 2' },
    ]
    // 3/4 = 75% > 50%
    const result = await checkNoStructuredLists({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('no_structured_lists')
    expect(result!.category).toBe('readability')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(2)
  })

  it('recognises ordered lists (1. item)', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: '1. First step\n2. Second step' },
    ]
    expect(await checkNoStructuredLists({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('limits sampleUrls to 5', async () => {
    const pages: FirecrawlPage[] = Array.from({ length: 10 }, (_, i) => ({
      url: `https://example.com/page-${i}`,
      markdown: 'No list here at all.',
    }))
    const result = await checkNoStructuredLists({ pages, siteUrl: SITE_URL })
    expect(result!.sampleUrls.length).toBeLessThanOrEqual(5)
  })
})
