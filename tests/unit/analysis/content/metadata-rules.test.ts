import { describe, it, expect } from 'vitest'
import { checkMetaDescriptionMissing } from '@/lib/analysis/content/rules/meta-description-missing'
import { checkMetaDescriptionTooShort } from '@/lib/analysis/content/rules/meta-description-too-short'
import { checkDuplicateMetaDescriptions } from '@/lib/analysis/content/rules/duplicate-meta-descriptions'
import { checkTitleMissingOrShort } from '@/lib/analysis/content/rules/title-missing-or-short'
import type { FirecrawlPage, RuleInput } from '@/lib/analysis/content/types'

const SITE_URL = 'https://example.com'
const EMPTY_INPUT: RuleInput = { pages: [], siteUrl: SITE_URL }

const LONG_DESC =
  'Cette description fait largement plus de quatre-vingts caractères pour passer le seuil minimal exigé.'

// ─── checkMetaDescriptionMissing (scope PAGE) ─────────────────────────────────

describe('checkMetaDescriptionMissing', () => {
  it('returns null when the page has a description', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/',
      metadata: { description: 'Home page description here.' },
    }
    expect(await checkMetaDescriptionMissing(page, EMPTY_INPUT)).toBeNull()
  })

  it('detects a page without description', async () => {
    const page: FirecrawlPage = { url: 'https://example.com/a', metadata: {} }
    const result = await checkMetaDescriptionMissing(page, EMPTY_INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('meta_description_missing')
    expect(result!.category).toBe('metadata')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(2)
    expect(result!.sampleUrls).toEqual([page.url])
  })

  it('treats whitespace-only description as missing', async () => {
    const page: FirecrawlPage = { url: 'https://example.com/a', metadata: { description: '   ' } }
    expect(await checkMetaDescriptionMissing(page, EMPTY_INPUT)).not.toBeNull()
  })

  it('does not set pageUrl itself (runner responsibility)', async () => {
    const page: FirecrawlPage = { url: 'https://example.com/a', metadata: {} }
    const result = await checkMetaDescriptionMissing(page, EMPTY_INPUT)
    expect(result!.pageUrl).toBeUndefined()
  })
})

// ─── checkMetaDescriptionTooShort (scope PAGE) ────────────────────────────────

describe('checkMetaDescriptionTooShort', () => {
  it('returns null when the description is 80+ characters', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/',
      metadata: { description: LONG_DESC },
    }
    expect(await checkMetaDescriptionTooShort(page, EMPTY_INPUT)).toBeNull()
  })

  it('returns null when the description is missing (other rule covers it)', async () => {
    const page: FirecrawlPage = { url: 'https://example.com/', metadata: {} }
    expect(await checkMetaDescriptionTooShort(page, EMPTY_INPUT)).toBeNull()
  })

  it('detects a description shorter than 80 characters', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/a',
      metadata: { description: 'Trop court.' },
    }
    const result = await checkMetaDescriptionTooShort(page, EMPTY_INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('meta_description_too_short')
    expect(result!.category).toBe('metadata')
    expect(result!.severity).toBe('opportunity')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(1)
    expect(result!.sampleUrls).toEqual([page.url])
  })
})

// ─── checkDuplicateMetaDescriptions (scope SITE) ──────────────────────────────

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
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(1)
  })

  it('ignores pages without descriptions', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', metadata: {} },
      { url: 'https://example.com/b', metadata: {} },
    ]
    expect(await checkDuplicateMetaDescriptions({ pages, siteUrl: SITE_URL })).toBeNull()
  })
})

// ─── checkTitleMissingOrShort (scope PAGE) ────────────────────────────────────

describe('checkTitleMissingOrShort', () => {
  it('returns null when the page has a good title', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/',
      metadata: { title: 'Welcome to Our Website' },
    }
    expect(await checkTitleMissingOrShort(page, EMPTY_INPUT)).toBeNull()
  })

  it('detects a missing title', async () => {
    const page: FirecrawlPage = { url: 'https://example.com/a', metadata: {} }
    const result = await checkTitleMissingOrShort(page, EMPTY_INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('title_missing_or_short')
    expect(result!.category).toBe('metadata')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(2)
    expect(result!.sampleUrls).toEqual([page.url])
  })

  it('detects a title shorter than 20 characters', async () => {
    const page: FirecrawlPage = { url: 'https://example.com/b', metadata: { title: 'Short' } }
    const result = await checkTitleMissingOrShort(page, EMPTY_INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('title_missing_or_short')
  })

  it('ignores non-200 pages', async () => {
    const page: FirecrawlPage = { url: 'https://example.com/404', statusCode: 404, metadata: {} }
    expect(await checkTitleMissingOrShort(page, EMPTY_INPUT)).toBeNull()
  })
})
