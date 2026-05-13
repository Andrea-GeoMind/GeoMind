import { describe, it, expect } from 'vitest'
import { checkH1MissingOrDuplicate } from '@/lib/analysis/technical/rules/h1-missing-or-duplicate'
import { checkHierarchyMissing } from '@/lib/analysis/technical/rules/hierarchy-missing'
import { checkDepthTooDeep } from '@/lib/analysis/technical/rules/depth-too-deep'
import type { FirecrawlPage } from '@/lib/analysis/technical/types'

const SITE_URL = 'https://example.com'

// ─── checkH1MissingOrDuplicate ────────────────────────────────────────────────

describe('checkH1MissingOrDuplicate', () => {
  it('returns null when all pages have exactly 1 H1', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: '# Home\n\nContent' },
      { url: 'https://example.com/about', markdown: '# About\n\nContent' },
      { url: 'https://example.com/contact', markdown: '# Contact\n\nContent' },
      { url: 'https://example.com/blog', markdown: '# Blog\n\nContent' },
      { url: 'https://example.com/service', markdown: '# Services\n\nContent' },
    ]
    const result = await checkH1MissingOrDuplicate({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null for empty pages array', async () => {
    const result = await checkH1MissingOrDuplicate({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('detects when >20% of pages have no H1', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: '# Home' },
      { url: 'https://example.com/a', markdown: 'No heading here' },
      { url: 'https://example.com/b', markdown: 'No heading here' },
      { url: 'https://example.com/c', markdown: '# Good' },
      { url: 'https://example.com/d', markdown: '# Good' },
    ]
    // 2/5 = 40% > 20%
    const result = await checkH1MissingOrDuplicate({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('h1_missing_or_duplicate')
    expect(result!.category).toBe('structure')
    expect(result!.penalty).toBe(5)
  })

  it('does NOT flag when exactly 20% (boundary — ratio must be strictly >20%)', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: '# Title\n# Duplicate' },
      { url: 'https://example.com/a', markdown: '# Good' },
      { url: 'https://example.com/b', markdown: '# Good' },
      { url: 'https://example.com/c', markdown: '# Good' },
      { url: 'https://example.com/d', markdown: '# Good' },
    ]
    // 1/5 = 20% — not > 20%, so null
    const result = await checkH1MissingOrDuplicate({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('uses metadata.h1 when available instead of markdown parsing', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: '# Home', metadata: { h1: ['Home'] } },
      { url: 'https://example.com/a', markdown: '', metadata: { h1: [] } },
      { url: 'https://example.com/b', markdown: '', metadata: { h1: [] } },
      { url: 'https://example.com/c', markdown: '', metadata: { h1: [] } },
      { url: 'https://example.com/d', markdown: '', metadata: { h1: [] } },
    ]
    // 4/5 = 80% > 20% → issue
    const result = await checkH1MissingOrDuplicate({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.sampleUrls.length).toBeLessThanOrEqual(5)
  })

  it('limits sampleUrls to 5', async () => {
    const pages: FirecrawlPage[] = Array.from({ length: 10 }, (_, i) => ({
      url: `https://example.com/page-${i}`,
      markdown: 'no heading',
    }))
    const result = await checkH1MissingOrDuplicate({ pages, siteUrl: SITE_URL })
    expect(result!.sampleUrls.length).toBeLessThanOrEqual(5)
  })
})

// ─── checkHierarchyMissing ────────────────────────────────────────────────────

describe('checkHierarchyMissing', () => {
  it('returns null when all content pages have H2', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: '# Home\n\nNo H2 needed on home' },
      { url: 'https://example.com/blog/post-1', markdown: '# Title\n\n## Section\n\nContent' },
      { url: 'https://example.com/blog/post-2', markdown: '# Title\n\n## Section\n\nContent' },
    ]
    const result = await checkHierarchyMissing({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null when there are no content pages (only home)', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: '# Home' },
    ]
    const result = await checkHierarchyMissing({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null for empty pages', async () => {
    const result = await checkHierarchyMissing({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('detects when >50% of content pages lack H2', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: '# Home' },
      { url: 'https://example.com/page-1', markdown: '# Title\n\nNo H2 here' },
      { url: 'https://example.com/page-2', markdown: '# Title\n\nNo H2 here' },
      { url: 'https://example.com/page-3', markdown: '# Title\n\nNo H2 here' },
      { url: 'https://example.com/page-4', markdown: '# Title\n\n## Section here' },
    ]
    // content pages = 4. 3 without H2 = 75% > 50%
    const result = await checkHierarchyMissing({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('hierarchy_missing')
    expect(result!.category).toBe('structure')
    expect(result!.penalty).toBe(5)
  })

  it('does not flag the home page (/) as a content page', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: '# Home\n\nNo H2' },
      { url: 'https://example.com/about', markdown: '# About\n\n## Our Story\n\nContent' },
    ]
    const result = await checkHierarchyMissing({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })
})

// ─── checkDepthTooDeep ────────────────────────────────────────────────────────

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
    expect(result!.penalty).toBe(5)
  })

  it('does not flag depth exactly 3', async () => {
    const pages: FirecrawlPage[] = Array.from({ length: 10 }, (_, i) => ({
      url: `https://example.com/a/b/c-${i}`,
    }))
    const result = await checkDepthTooDeep({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })
})
