import { describe, it, expect } from 'vitest'
import { checkH1MissingOrDuplicate } from '@/lib/analysis/technical/rules/h1-missing-or-duplicate'
import { checkHierarchyMissing } from '@/lib/analysis/technical/rules/hierarchy-missing'
import { checkDepthTooDeep } from '@/lib/analysis/technical/rules/depth-too-deep'
import type { FirecrawlPage, RuleInput } from '@/lib/analysis/technical/types'

const SITE_URL = 'https://example.com'
const INPUT: RuleInput = { pages: [], siteUrl: SITE_URL }

// ─── checkH1MissingOrDuplicate (scope page V2) ────────────────────────────────

describe('checkH1MissingOrDuplicate', () => {
  it('returns null when the page has exactly 1 H1', async () => {
    const page: FirecrawlPage = { url: 'https://example.com/about', markdown: '# About\n\nContent' }
    const result = await checkH1MissingOrDuplicate(page, INPUT)
    expect(result).toBeNull()
  })

  it('detects a page with no H1', async () => {
    const page: FirecrawlPage = { url: 'https://example.com/a', markdown: 'No heading here' }
    const result = await checkH1MissingOrDuplicate(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('h1_missing_or_duplicate')
    expect(result!.category).toBe('structure')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(2)
    expect(result!.sampleUrls).toEqual(['https://example.com/a'])
    expect(result!.pageUrl).toBeUndefined()
  })

  it('detects a page with duplicated H1s', async () => {
    const page: FirecrawlPage = { url: 'https://example.com/a', markdown: '# Title\n# Duplicate' }
    const result = await checkH1MissingOrDuplicate(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('h1_missing_or_duplicate')
  })

  it('uses metadata.h1 when available instead of markdown parsing', async () => {
    const page: FirecrawlPage = { url: 'https://example.com/a', markdown: '', metadata: { h1: [] } }
    const result = await checkH1MissingOrDuplicate(page, INPUT)
    expect(result).not.toBeNull()
  })

  it('accepts metadata.h1 as a single string (exactly 1 H1)', async () => {
    const page: FirecrawlPage = { url: 'https://example.com/a', markdown: '', metadata: { h1: 'Title' } }
    const result = await checkH1MissingOrDuplicate(page, INPUT)
    expect(result).toBeNull()
  })
})

// ─── checkHierarchyMissing (scope page V2) ────────────────────────────────────

describe('checkHierarchyMissing', () => {
  it('returns null when the content page has an H2', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/blog/post-1',
      markdown: '# Title\n\n## Section\n\nContent',
    }
    const result = await checkHierarchyMissing(page, INPUT)
    expect(result).toBeNull()
  })

  it('does not flag the home page', async () => {
    const page: FirecrawlPage = { url: 'https://example.com/', markdown: '# Home\n\nNo H2' }
    const result = await checkHierarchyMissing(page, INPUT)
    expect(result).toBeNull()
  })

  it('detects a content page without any H2', async () => {
    const page: FirecrawlPage = { url: 'https://example.com/page-1', markdown: '# Title\n\nNo H2 here' }
    const result = await checkHierarchyMissing(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('hierarchy_missing')
    expect(result!.category).toBe('structure')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(2)
    expect(result!.sampleUrls).toEqual(['https://example.com/page-1'])
  })

  it('detects a level skip (H3 before any H2)', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/page-2',
      markdown: '# Title\n\n### Sous-sous-section directe\n\nContent\n\n## Section tardive',
    }
    const result = await checkHierarchyMissing(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('hierarchy_missing')
    expect(result!.description).toContain('H3')
  })

  it('returns null when markdown is empty (insufficient data)', async () => {
    const page: FirecrawlPage = { url: 'https://example.com/page-3', markdown: '' }
    const result = await checkHierarchyMissing(page, INPUT)
    expect(result).toBeNull()
  })

  it('accepts H2 declared via metadata.h2', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/page-4',
      markdown: 'Texte sans titres markdown',
      metadata: { h2: ['Section'] },
    }
    const result = await checkHierarchyMissing(page, INPUT)
    expect(result).toBeNull()
  })
})

// ─── checkDepthTooDeep (scope site) ───────────────────────────────────────────

describe('checkDepthTooDeep', () => {
  it('returns null when all pages are at depth ≤3', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/' },
      { url: 'https://example.com/about' },
      { url: 'https://example.com/blog/post' },
      { url: 'https://example.com/a/b/c' },
    ]
    const result = await checkDepthTooDeep({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null for empty pages', async () => {
    const result = await checkDepthTooDeep({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('detects when >30% of pages are at depth >3', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/' },
      { url: 'https://example.com/a/b/c/d' },
      { url: 'https://example.com/a/b/c/d/e' },
      { url: 'https://example.com/about' },
      { url: 'https://example.com/blog/post' },
    ]
    // 2/5 = 40% > 30%
    const result = await checkDepthTooDeep({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('depth_too_deep')
    expect(result!.category).toBe('structure')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(3)
    expect(result!.impact).toBe(1)
  })

  it('does not flag depth exactly 3', async () => {
    const pages: FirecrawlPage[] = Array.from({ length: 10 }, (_, i) => ({
      url: `https://example.com/a/b/c-${i}`,
    }))
    const result = await checkDepthTooDeep({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })
})
