import { describe, it, expect, vi, afterEach } from 'vitest'
import { checkSitemapMissing } from '@/lib/analysis/technical/rules/sitemap-missing'
import { checkSitemapMalformed } from '@/lib/analysis/technical/rules/sitemap-malformed'
import { checkLlmsTxtMissing } from '@/lib/analysis/technical/rules/llms-txt-missing'
import { checkResponseTimeSlow } from '@/lib/analysis/technical/rules/response-time-slow'
import type { FirecrawlPage } from '@/lib/analysis/technical/types'

const SITE_URL = 'https://example.com'
const VALID_SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
</urlset>`

// ─── checkSitemapMissing ──────────────────────────────────────────────────────

describe('checkSitemapMissing', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns null when sitemap.xml exists with XML content-type', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: (h: string) => h === 'content-type' ? 'application/xml' : null },
    }))
    const result = await checkSitemapMissing({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns an issue when sitemap returns 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: { get: () => null },
    }))
    const result = await checkSitemapMissing({ pages: [], siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('sitemap_missing')
    expect(result!.category).toBe('accessibility')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(2)
  })

  it('returns null on network error (graceful degradation)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))
    const result = await checkSitemapMissing({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })
})

// ─── checkSitemapMalformed ────────────────────────────────────────────────────

describe('checkSitemapMalformed', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns null when sitemap is not found (handled by sitemap-missing)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    const result = await checkSitemapMalformed({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null when sitemap is valid XML with urlset', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => VALID_SITEMAP,
    }))
    const result = await checkSitemapMalformed({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns an issue when sitemap content is not valid XML', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html>Not a sitemap</html>',
    }))
    const result = await checkSitemapMalformed({ pages: [], siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('sitemap_malformed')
    expect(result!.category).toBe('accessibility')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(2)
  })

  it('returns null on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))
    const result = await checkSitemapMalformed({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })
})

// ─── checkLlmsTxtMissing ──────────────────────────────────────────────────────

describe('checkLlmsTxtMissing', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns null when llms.txt exists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const result = await checkLlmsTxtMissing({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns an issue when llms.txt returns 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    const result = await checkLlmsTxtMissing({ pages: [], siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('llms_txt_missing')
    expect(result!.category).toBe('accessibility')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(2)
  })

  it('returns null on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))
    const result = await checkLlmsTxtMissing({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })
})

// ─── checkResponseTimeSlow (seuil V2 : 2000 ms) ───────────────────────────────

describe('checkResponseTimeSlow', () => {
  it('returns null when no pages have loadTime metadata', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: '# Home' },
    ]
    const result = await checkResponseTimeSlow({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null when average loadTime is ≤2000ms', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', metadata: { loadTime: 1000 } },
      { url: 'https://example.com/about', metadata: { loadTime: 2000 } },
    ]
    const result = await checkResponseTimeSlow({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns an issue when average loadTime is >2000ms (seuil durci)', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', metadata: { loadTime: 2200 } },
      { url: 'https://example.com/about', metadata: { loadTime: 2600 } },
    ]
    const result = await checkResponseTimeSlow({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('response_time_slow')
    expect(result!.category).toBe('performance')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(3)
    expect(result!.impact).toBe(2)
  })

  it('only averages pages that have loadTime', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', metadata: { loadTime: 5000 } },
      { url: 'https://example.com/about' },
    ]
    const result = await checkResponseTimeSlow({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
  })
})
