import { describe, it, expect } from 'vitest'
import { checkNoFaqContent } from '@/lib/analysis/content/rules/no-faq-content'
import { checkNoDefinitionPatterns } from '@/lib/analysis/content/rules/no-definition-patterns'
import { checkLowPageCount } from '@/lib/analysis/content/rules/low-page-count'
import { checkNoDatesInContent } from '@/lib/analysis/content/rules/no-dates-in-content'
import type { FirecrawlPage } from '@/lib/analysis/content/types'

const SITE_URL = 'https://example.com'

// ─── checkNoFaqContent ────────────────────────────────────────────────────────

describe('checkNoFaqContent', () => {
  it('returns null when a page has ≥3 question headings', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/faq',
        markdown: '## Qu\'est-ce que GeoMind ?\n\nRéponse.\n\n## Comment fonctionne le service ?\n\nRéponse.\n\n## Quel est le prix ?\n\nRéponse.',
      },
    ]
    expect(await checkNoFaqContent({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null for empty pages array', async () => {
    expect(await checkNoFaqContent({ pages: [], siteUrl: SITE_URL })).toBeNull()
  })

  it('detects when no page has FAQ structure', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: '# Home\n\nWelcome.' },
      { url: 'https://example.com/about', markdown: '# About\n\n## Our team\n\nContent.' },
    ]
    const result = await checkNoFaqContent({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('no_faq_content')
    expect(result!.category).toBe('structure')
    expect(result!.penalty).toBe(7)
  })

  it('does not flag when question headings are spread across pages', async () => {
    // A single page with ≥3 question headings is enough
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: '## Why use this?' },
      { url: 'https://example.com/b', markdown: '## When is it useful?' },
      { url: 'https://example.com/c', markdown: '## How does it work?\n\n## What is the cost?\n\n## Can I cancel?' },
    ]
    // /c has 3 question headings → no issue
    expect(await checkNoFaqContent({ pages, siteUrl: SITE_URL })).toBeNull()
  })
})

// ─── checkNoDefinitionPatterns ────────────────────────────────────────────────

describe('checkNoDefinitionPatterns', () => {
  it('returns null when a page contains definitional sentences', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/glossary',
        markdown: 'Le GEO est une pratique qui consiste à optimiser la visibilité.',
      },
    ]
    expect(await checkNoDefinitionPatterns({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null for empty pages array', async () => {
    expect(await checkNoDefinitionPatterns({ pages: [], siteUrl: SITE_URL })).toBeNull()
  })

  it('detects absence of definitional content', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: 'Welcome! Buy now. Contact us.' },
      { url: 'https://example.com/about', markdown: 'Our team rocks. Call today.' },
    ]
    const result = await checkNoDefinitionPatterns({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('no_definition_patterns')
    expect(result!.category).toBe('structure')
    expect(result!.penalty).toBe(5)
  })

  it('recognises "désigne" pattern', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: 'Ce terme désigne un concept important.' },
    ]
    expect(await checkNoDefinitionPatterns({ pages, siteUrl: SITE_URL })).toBeNull()
  })
})

// ─── checkLowPageCount ────────────────────────────────────────────────────────

describe('checkLowPageCount', () => {
  it('returns null when site has ≥5 pages', async () => {
    const pages: FirecrawlPage[] = Array.from({ length: 5 }, (_, i) => ({
      url: `https://example.com/page-${i}`,
    }))
    expect(await checkLowPageCount({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('detects when fewer than 5 pages are crawled', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/' },
      { url: 'https://example.com/about' },
    ]
    const result = await checkLowPageCount({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('low_page_count')
    expect(result!.category).toBe('coverage')
    expect(result!.penalty).toBe(10)
  })

  it('returns null for exactly 5 pages', async () => {
    const pages: FirecrawlPage[] = Array.from({ length: 5 }, (_, i) => ({
      url: `https://example.com/page-${i}`,
    }))
    expect(await checkLowPageCount({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('includes siteUrl in sampleUrls when flagged', async () => {
    const pages: FirecrawlPage[] = [{ url: 'https://example.com/' }]
    const result = await checkLowPageCount({ pages, siteUrl: SITE_URL })
    expect(result!.sampleUrls).toContain(SITE_URL)
  })
})

// ─── checkNoDatesInContent ────────────────────────────────────────────────────

describe('checkNoDatesInContent', () => {
  it('returns null when a page contains a year', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: 'Publié en 2024.' },
    ]
    expect(await checkNoDatesInContent({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null for empty pages array', async () => {
    expect(await checkNoDatesInContent({ pages: [], siteUrl: SITE_URL })).toBeNull()
  })

  it('detects absence of dates', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: 'Bienvenue sur notre site.' },
      { url: 'https://example.com/about', markdown: 'Notre équipe est disponible.' },
    ]
    const result = await checkNoDatesInContent({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('no_dates_in_content')
    expect(result!.category).toBe('coverage')
    expect(result!.penalty).toBe(5)
  })

  it('recognises French month names', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/blog', markdown: 'Publié en janvier 2024.' },
    ]
    expect(await checkNoDatesInContent({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('recognises dd/mm/yyyy date format', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: 'Mis à jour le 15/03/2024.' },
    ]
    expect(await checkNoDatesInContent({ pages, siteUrl: SITE_URL })).toBeNull()
  })
})
