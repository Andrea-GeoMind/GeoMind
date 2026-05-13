import { describe, it, expect } from 'vitest'
import { checkMetaDescriptionMissing } from '@/lib/analysis/content/rules/meta-description-missing'
import { checkMetaDescriptionTooShort } from '@/lib/analysis/content/rules/meta-description-too-short'
import { checkDuplicateMetaDescriptions } from '@/lib/analysis/content/rules/duplicate-meta-descriptions'
import { checkTitleMissingOrShort } from '@/lib/analysis/content/rules/title-missing-or-short'
import type { FirecrawlPage } from '@/lib/analysis/content/types'

const SITE_URL = 'https://example.com'

// ─── checkMetaDescriptionMissing ──────────────────────────────────────────────

describe('checkMetaDescriptionMissing', () => {
  it('returns null when all pages have descriptions', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', metadata: { description: 'Home page description here.' } },
      { url: 'https://example.com/about', metadata: { description: 'About us page description.' } },
    ]
    expect(await checkMetaDescriptionMissing({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null for empty pages array', async () => {
    expect(await checkMetaDescriptionMissing({ pages: [], siteUrl: SITE_URL })).toBeNull()
  })

  it('detects when >20% of pages are missing descriptions', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', metadata: {} },
      { url: 'https://example.com/b', metadata: {} },
      { url: 'https://example.com/c', metadata: { description: 'Good desc.' } },
      { url: 'https://example.com/d', metadata: { description: 'Good desc.' } },
      { url: 'https://example.com/e', metadata: { description: 'Good desc.' } },
    ]
    // 2/5 = 40% > 20%
    const result = await checkMetaDescriptionMissing({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('meta_description_missing')
    expect(result!.category).toBe('metadata')
    expect(result!.penalty).toBe(8)
  })

  it('treats empty string description as missing', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', metadata: { description: '   ' } },
      { url: 'https://example.com/b', metadata: { description: '' } },
      { url: 'https://example.com/c', metadata: { description: 'Good desc.' } },
    ]
    // 2/3 = 67% > 20%
    const result = await checkMetaDescriptionMissing({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
  })

  it('limits sampleUrls to 5', async () => {
    const pages: FirecrawlPage[] = Array.from({ length: 10 }, (_, i) => ({
      url: `https://example.com/page-${i}`,
      metadata: {},
    }))
    const result = await checkMetaDescriptionMissing({ pages, siteUrl: SITE_URL })
    expect(result!.sampleUrls.length).toBeLessThanOrEqual(5)
  })
})

// ─── checkMetaDescriptionTooShort ─────────────────────────────────────────────

describe('checkMetaDescriptionTooShort', () => {
  it('returns null when descriptions are long enough', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/',
        metadata: { description: 'This is a long enough description that provides context.' },
      },
    ]
    expect(await checkMetaDescriptionTooShort({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null when no pages have descriptions', async () => {
    const pages: FirecrawlPage[] = [{ url: 'https://example.com/', metadata: {} }]
    expect(await checkMetaDescriptionTooShort({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('detects when >30% of pages with descriptions are too short', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', metadata: { description: 'Short.' } },
      { url: 'https://example.com/b', metadata: { description: 'Also too short.' } },
      { url: 'https://example.com/c', metadata: { description: 'This one is long enough to pass the minimum character threshold check.' } },
    ]
    // 2/3 = 67% > 30%
    const result = await checkMetaDescriptionTooShort({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('meta_description_too_short')
    expect(result!.category).toBe('metadata')
    expect(result!.penalty).toBe(5)
  })
})

// ─── checkDuplicateMetaDescriptions ───────────────────────────────────────────

describe('checkDuplicateMetaDescriptions', () => {
  it('returns null when all descriptions are unique', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', metadata: { description: 'Home page.' } },
      { url: 'https://example.com/about', metadata: { description: 'About page.' } },
      { url: 'https://example.com/contact', metadata: { description: 'Contact page.' } },
    ]
    expect(await checkDuplicateMetaDescriptions({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null with a single page', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', metadata: { description: 'Home.' } },
    ]
    expect(await checkDuplicateMetaDescriptions({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('detects duplicate descriptions', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', metadata: { description: 'Same description.' } },
      { url: 'https://example.com/b', metadata: { description: 'Same description.' } },
      { url: 'https://example.com/c', metadata: { description: 'Unique.' } },
    ]
    const result = await checkDuplicateMetaDescriptions({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('duplicate_meta_descriptions')
    expect(result!.category).toBe('metadata')
    expect(result!.penalty).toBe(5)
  })

  it('ignores pages without descriptions', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', metadata: {} },
      { url: 'https://example.com/b', metadata: {} },
    ]
    expect(await checkDuplicateMetaDescriptions({ pages, siteUrl: SITE_URL })).toBeNull()
  })
})

// ─── checkTitleMissingOrShort ─────────────────────────────────────────────────

describe('checkTitleMissingOrShort', () => {
  it('returns null when all pages have good titles', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', metadata: { title: 'Welcome to Our Website' } },
      { url: 'https://example.com/about', metadata: { title: 'About Us — Our Story' } },
    ]
    expect(await checkTitleMissingOrShort({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null for empty pages array', async () => {
    expect(await checkTitleMissingOrShort({ pages: [], siteUrl: SITE_URL })).toBeNull()
  })

  it('detects when >20% of pages have missing or short titles', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', metadata: {} },
      { url: 'https://example.com/b', metadata: { title: 'Short' } },
      { url: 'https://example.com/c', metadata: { title: 'This is a Good Title for the Page' } },
      { url: 'https://example.com/d', metadata: { title: 'Another Fine Title to Read' } },
      { url: 'https://example.com/e', metadata: { title: 'Great Title Right Here' } },
    ]
    // 2/5 = 40% > 20%
    const result = await checkTitleMissingOrShort({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('title_missing_or_short')
    expect(result!.category).toBe('metadata')
    expect(result!.penalty).toBe(8)
  })

  it('limits sampleUrls to 5', async () => {
    const pages: FirecrawlPage[] = Array.from({ length: 10 }, (_, i) => ({
      url: `https://example.com/page-${i}`,
      metadata: {},
    }))
    const result = await checkTitleMissingOrShort({ pages, siteUrl: SITE_URL })
    expect(result!.sampleUrls.length).toBeLessThanOrEqual(5)
  })
})
