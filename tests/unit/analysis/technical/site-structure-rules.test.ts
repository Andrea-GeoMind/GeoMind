import { describe, it, expect } from 'vitest'
import { checkBrokenInternalLinks } from '@/lib/analysis/technical/rules/broken-internal-links'
import { checkPaginationMissing } from '@/lib/analysis/technical/rules/pagination-missing'
import type { FirecrawlPage } from '@/lib/analysis/technical/types'

const SITE_URL = 'https://example.com'

// ─── checkBrokenInternalLinks ─────────────────────────────────────────────────

describe('checkBrokenInternalLinks', () => {
  it('returns an issue listing the 4xx pages', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', statusCode: 200 },
      { url: 'https://example.com/ancienne-page', statusCode: 404 },
      { url: 'https://example.com/privee', statusCode: 403 },
    ]
    const result = await checkBrokenInternalLinks({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('broken_internal_links')
    expect(result!.category).toBe('structure')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(2)
    expect(result!.sampleUrls).toContain('https://example.com/ancienne-page')
    expect(result!.sampleUrls).toContain('https://example.com/privee')
  })

  it('returns null when no page is in 4xx', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', statusCode: 200 },
      { url: 'https://example.com/about', statusCode: 200 },
    ]
    const result = await checkBrokenInternalLinks({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('ignores 5xx errors (handled by http-errors-ratio)', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', statusCode: 200 },
      { url: 'https://example.com/erreur-serveur', statusCode: 500 },
    ]
    const result = await checkBrokenInternalLinks({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('ignores pages without a statusCode', async () => {
    const pages: FirecrawlPage[] = [{ url: 'https://example.com/' }]
    const result = await checkBrokenInternalLinks({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('limits sampleUrls to 5', async () => {
    const pages: FirecrawlPage[] = Array.from({ length: 8 }, (_, i) => ({
      url: `https://example.com/cassee-${i}`,
      statusCode: 404,
    }))
    const result = await checkBrokenInternalLinks({ pages, siteUrl: SITE_URL })
    expect(result!.sampleUrls.length).toBeLessThanOrEqual(5)
  })
})

// ─── checkPaginationMissing ───────────────────────────────────────────────────

const BLOG_LISTING: FirecrawlPage[] = [
  { url: 'https://example.com/' },
  { url: 'https://example.com/blog/article-1' },
  { url: 'https://example.com/blog/article-2' },
  { url: 'https://example.com/blog/article-3' },
  { url: 'https://example.com/blog/article-4' },
  { url: 'https://example.com/blog/article-5' },
]

describe('checkPaginationMissing', () => {
  it('returns an opportunity when a listing section has no pagination URL', async () => {
    const result = await checkPaginationMissing({ pages: BLOG_LISTING, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('pagination_missing')
    expect(result!.category).toBe('structure')
    expect(result!.severity).toBe('opportunity')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(1)
    expect(result!.sampleUrls.length).toBeLessThanOrEqual(5)
    expect(result!.sampleUrls[0]).toContain('/blog/')
  })

  it('returns null when a /page/N pagination URL exists', async () => {
    const pages = [...BLOG_LISTING, { url: 'https://example.com/blog/page/2' }]
    const result = await checkPaginationMissing({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null when a ?page= pagination URL exists', async () => {
    const pages = [...BLOG_LISTING, { url: 'https://example.com/blog?page=2' }]
    const result = await checkPaginationMissing({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null when no section reaches 5 pages', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/' },
      { url: 'https://example.com/about' },
      { url: 'https://example.com/blog/article-1' },
      { url: 'https://example.com/blog/article-2' },
    ]
    const result = await checkPaginationMissing({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null for an empty crawl', async () => {
    const result = await checkPaginationMissing({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })
})
