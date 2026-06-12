import { describe, it, expect } from 'vitest'
import { checkCanonicalMissing } from '@/lib/analysis/technical/rules/canonical-missing'
import { checkOpenGraphMissing } from '@/lib/analysis/technical/rules/open-graph-missing'
import { checkTwitterCardMissing } from '@/lib/analysis/technical/rules/twitter-card-missing'
import { checkHtmlLangMissing } from '@/lib/analysis/technical/rules/html-lang-missing'
import { checkMobileViewportMissing } from '@/lib/analysis/technical/rules/mobile-viewport-missing'
import { checkNoindexOnKeyPages } from '@/lib/analysis/technical/rules/noindex-on-key-pages'
import type { RuleInput } from '@/lib/analysis/technical/types'

const INPUT: RuleInput = { pages: [], siteUrl: 'https://example.com' }

// ─── checkCanonicalMissing ────────────────────────────────────────────────────

describe('checkCanonicalMissing', () => {
  it('returns an issue when metadata has no canonical nor ogUrl', async () => {
    const page = { url: 'https://example.com/about', metadata: { title: 'About' } }
    const result = await checkCanonicalMissing(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('canonical_missing')
    expect(result!.category).toBe('accessibility')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(2)
    expect(result!.sampleUrls).toEqual(['https://example.com/about'])
    expect(result!.pageUrl).toBeUndefined()
  })

  it('returns null when a canonical key is present', async () => {
    const page = {
      url: 'https://example.com/about',
      metadata: { canonical: 'https://example.com/about' },
    }
    const result = await checkCanonicalMissing(page, INPUT)
    expect(result).toBeNull()
  })

  it('returns null when ogUrl is present', async () => {
    const page = { url: 'https://example.com/about', metadata: { ogUrl: 'https://example.com/about' } }
    const result = await checkCanonicalMissing(page, INPUT)
    expect(result).toBeNull()
  })

  it('returns null when metadata is missing entirely (insufficient data)', async () => {
    const result = await checkCanonicalMissing({ url: 'https://example.com/about' }, INPUT)
    expect(result).toBeNull()
  })
})

// ─── checkOpenGraphMissing ────────────────────────────────────────────────────

describe('checkOpenGraphMissing', () => {
  it('returns an issue when ≥2 OG tags are missing', async () => {
    const page = { url: 'https://example.com/', metadata: { ogTitle: 'Example' } }
    const result = await checkOpenGraphMissing(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('open_graph_missing')
    expect(result!.category).toBe('structure')
    expect(result!.severity).toBe('minor')
    expect(result!.sampleUrls).toEqual(['https://example.com/'])
  })

  it('returns null when only 1 OG tag is missing', async () => {
    const page = {
      url: 'https://example.com/',
      metadata: { ogTitle: 'Example', ogDescription: 'Description' },
    }
    const result = await checkOpenGraphMissing(page, INPUT)
    expect(result).toBeNull()
  })

  it('returns null when all OG tags are present (colon-style keys)', async () => {
    const page = {
      url: 'https://example.com/',
      metadata: {
        'og:title': 'Example',
        'og:description': 'Description',
        'og:image': 'https://example.com/img.png',
      },
    }
    const result = await checkOpenGraphMissing(page, INPUT)
    expect(result).toBeNull()
  })

  it('returns null when metadata is missing entirely', async () => {
    const result = await checkOpenGraphMissing({ url: 'https://example.com/' }, INPUT)
    expect(result).toBeNull()
  })
})

// ─── checkTwitterCardMissing ──────────────────────────────────────────────────

describe('checkTwitterCardMissing', () => {
  it('returns an opportunity when twitter:card is absent', async () => {
    const page = { url: 'https://example.com/', metadata: { title: 'Example' } }
    const result = await checkTwitterCardMissing(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('twitter_card_missing')
    expect(result!.category).toBe('structure')
    expect(result!.severity).toBe('opportunity')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(1)
  })

  it('returns null when twitter:card is present', async () => {
    const page = { url: 'https://example.com/', metadata: { 'twitter:card': 'summary' } }
    const result = await checkTwitterCardMissing(page, INPUT)
    expect(result).toBeNull()
  })

  it('returns null when metadata is missing entirely', async () => {
    const result = await checkTwitterCardMissing({ url: 'https://example.com/' }, INPUT)
    expect(result).toBeNull()
  })
})

// ─── checkHtmlLangMissing ─────────────────────────────────────────────────────

describe('checkHtmlLangMissing', () => {
  it('returns an issue when language is absent', async () => {
    const page = { url: 'https://example.com/', metadata: { title: 'Example' } }
    const result = await checkHtmlLangMissing(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('html_lang_missing')
    expect(result!.category).toBe('accessibility')
    expect(result!.severity).toBe('moderate')
  })

  it('returns an issue when language is an empty string', async () => {
    const page = { url: 'https://example.com/', metadata: { language: '  ' } }
    const result = await checkHtmlLangMissing(page, INPUT)
    expect(result).not.toBeNull()
  })

  it('returns null when language is declared', async () => {
    const page = { url: 'https://example.com/', metadata: { language: 'fr' } }
    const result = await checkHtmlLangMissing(page, INPUT)
    expect(result).toBeNull()
  })

  it('returns null when metadata is missing entirely', async () => {
    const result = await checkHtmlLangMissing({ url: 'https://example.com/' }, INPUT)
    expect(result).toBeNull()
  })
})

// ─── checkMobileViewportMissing ───────────────────────────────────────────────

describe('checkMobileViewportMissing', () => {
  it('returns an issue when viewport is absent', async () => {
    const page = { url: 'https://example.com/', metadata: { title: 'Example' } }
    const result = await checkMobileViewportMissing(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('mobile_viewport_missing')
    expect(result!.category).toBe('accessibility')
    expect(result!.severity).toBe('moderate')
  })

  it('returns null when viewport is present', async () => {
    const page = {
      url: 'https://example.com/',
      metadata: { viewport: 'width=device-width, initial-scale=1' },
    }
    const result = await checkMobileViewportMissing(page, INPUT)
    expect(result).toBeNull()
  })

  it('returns null when metadata is missing entirely', async () => {
    const result = await checkMobileViewportMissing({ url: 'https://example.com/' }, INPUT)
    expect(result).toBeNull()
  })
})

// ─── checkNoindexOnKeyPages ───────────────────────────────────────────────────

describe('checkNoindexOnKeyPages', () => {
  it('returns an issue when a depth-1 page has noindex', async () => {
    const page = { url: 'https://example.com/services', metadata: { robots: 'noindex, nofollow' } }
    const result = await checkNoindexOnKeyPages(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('noindex_on_key_pages')
    expect(result!.category).toBe('accessibility')
    expect(result!.severity).toBe('major')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(3)
  })

  it('returns an issue when the home page has noindex', async () => {
    const page = { url: 'https://example.com/', metadata: { robots: 'NOINDEX' } }
    const result = await checkNoindexOnKeyPages(page, INPUT)
    expect(result).not.toBeNull()
  })

  it('returns null when noindex is on a deep page (depth > 1)', async () => {
    const page = { url: 'https://example.com/blog/old-post', metadata: { robots: 'noindex' } }
    const result = await checkNoindexOnKeyPages(page, INPUT)
    expect(result).toBeNull()
  })

  it('returns null when robots allows indexing', async () => {
    const page = { url: 'https://example.com/services', metadata: { robots: 'index, follow' } }
    const result = await checkNoindexOnKeyPages(page, INPUT)
    expect(result).toBeNull()
  })

  it('returns null when robots metadata is absent', async () => {
    const result = await checkNoindexOnKeyPages({ url: 'https://example.com/services' }, INPUT)
    expect(result).toBeNull()
  })
})
