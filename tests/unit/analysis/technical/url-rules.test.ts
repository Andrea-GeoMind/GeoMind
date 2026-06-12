import { describe, it, expect } from 'vitest'
import { checkUrlNotReadable } from '@/lib/analysis/technical/rules/url-not-readable'
import { checkUrlTooLong } from '@/lib/analysis/technical/rules/url-too-long'
import type { RuleInput } from '@/lib/analysis/technical/types'

const INPUT: RuleInput = { pages: [], siteUrl: 'https://example.com' }

// ─── checkUrlNotReadable ──────────────────────────────────────────────────────

describe('checkUrlNotReadable', () => {
  it('returns an issue when the path contains a long numeric id', async () => {
    const page = { url: 'https://example.com/produit/123456' }
    const result = await checkUrlNotReadable(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('url_not_readable')
    expect(result!.category).toBe('structure')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(3)
    expect(result!.impact).toBe(1)
    expect(result!.sampleUrls).toEqual(['https://example.com/produit/123456'])
  })

  it('returns an issue when the URL has 2+ query parameters', async () => {
    const page = { url: 'https://example.com/produits?cat=12&tri=prix' }
    const result = await checkUrlNotReadable(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('url_not_readable')
  })

  it('returns null for a clean descriptive URL', async () => {
    const page = { url: 'https://example.com/services/plomberie-paris' }
    const result = await checkUrlNotReadable(page, INPUT)
    expect(result).toBeNull()
  })

  it('returns null with a single query parameter and short ids', async () => {
    const page = { url: 'https://example.com/blog/article-123?ref=nl' }
    const result = await checkUrlNotReadable(page, INPUT)
    expect(result).toBeNull()
  })
})

// ─── checkUrlTooLong ──────────────────────────────────────────────────────────

describe('checkUrlTooLong', () => {
  it('returns an opportunity when the URL exceeds 100 characters', async () => {
    const longUrl = `https://example.com/${'segment-tres-long/'.repeat(6)}page`
    expect(longUrl.length).toBeGreaterThan(100)
    const result = await checkUrlTooLong({ url: longUrl }, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('url_too_long')
    expect(result!.category).toBe('structure')
    expect(result!.severity).toBe('opportunity')
    expect(result!.effort).toBe(3)
    expect(result!.impact).toBe(1)
  })

  it('returns null for a URL of 100 characters or fewer', async () => {
    const result = await checkUrlTooLong({ url: 'https://example.com/services' }, INPUT)
    expect(result).toBeNull()
  })
})
