import { describe, it, expect } from 'vitest'
import { checkThinContent } from '@/lib/analysis/content/rules/thin-content'
import { checkNoStructuredLists } from '@/lib/analysis/content/rules/no-structured-lists'
import type { FirecrawlPage } from '@/lib/analysis/content/types'

const SITE_URL = 'https://example.com'

const longText = 'mot '.repeat(350).trim()
const shortText = 'mot '.repeat(50).trim()

// ─── checkThinContent ─────────────────────────────────────────────────────────

describe('checkThinContent', () => {
  it('returns null when all pages have enough words', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: longText },
      { url: 'https://example.com/about', markdown: longText },
      { url: 'https://example.com/services', markdown: longText },
    ]
    expect(await checkThinContent({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null for empty pages array', async () => {
    expect(await checkThinContent({ pages: [], siteUrl: SITE_URL })).toBeNull()
  })

  it('detects when >30% of pages are thin', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: shortText },
      { url: 'https://example.com/a', markdown: shortText },
      { url: 'https://example.com/b', markdown: longText },
      { url: 'https://example.com/c', markdown: longText },
      { url: 'https://example.com/d', markdown: longText },
    ]
    // 2/5 = 40% > 30%
    const result = await checkThinContent({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('thin_content')
    expect(result!.category).toBe('readability')
    expect(result!.penalty).toBe(10)
  })

  it('does not flag when exactly 30% thin (boundary)', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: shortText },
      { url: 'https://example.com/b', markdown: shortText },
      { url: 'https://example.com/c', markdown: shortText },
      { url: 'https://example.com/d', markdown: longText },
      { url: 'https://example.com/e', markdown: longText },
      { url: 'https://example.com/f', markdown: longText },
      { url: 'https://example.com/g', markdown: longText },
      { url: 'https://example.com/h', markdown: longText },
      { url: 'https://example.com/i', markdown: longText },
      { url: 'https://example.com/j', markdown: longText },
    ]
    // 3/10 = 30% — not > 30%, should be null
    const result = await checkThinContent({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
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
    expect(result!.penalty).toBe(6)
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
