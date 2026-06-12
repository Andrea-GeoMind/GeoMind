import { describe, it, expect } from 'vitest'
import { checkShortAverageWordCount } from '@/lib/analysis/content/rules/short-average-word-count'
import { checkNoStatisticsOrFigures } from '@/lib/analysis/content/rules/no-statistics-or-figures'
import { checkNoExternalCitations } from '@/lib/analysis/content/rules/no-external-citations'
import { checkContentNotFreshAt } from '@/lib/analysis/content/rules/content-not-fresh'
import { checkNoNamedEntities } from '@/lib/analysis/content/rules/no-named-entities'
import { checkDuplicateContentCrossPages } from '@/lib/analysis/content/rules/duplicate-content-cross-pages'
import { checkNoComparativeContent } from '@/lib/analysis/content/rules/no-comparative-content'
import { checkAboutPageMissing } from '@/lib/analysis/content/rules/about-page-missing'
import { checkContactInfoMissing } from '@/lib/analysis/content/rules/contact-info-missing'
import type { FirecrawlPage } from '@/lib/analysis/content/types'

const SITE_URL = 'https://example.com'

// ─── checkShortAverageWordCount ───────────────────────────────────────────────

describe('checkShortAverageWordCount', () => {
  it('detects when the average word count is below 300', async () => {
    const shortText = 'mot '.repeat(100).trim()
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: shortText },
      { url: 'https://example.com/b', markdown: shortText },
      { url: 'https://example.com/c', markdown: shortText },
    ]
    const result = await checkShortAverageWordCount({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('short_average_word_count')
    expect(result!.category).toBe('readability')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(3)
    expect(result!.impact).toBe(3)
  })

  it('returns null when the average is 300+ words', async () => {
    const longText = 'mot '.repeat(400).trim()
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: longText },
      { url: 'https://example.com/b', markdown: longText },
      { url: 'https://example.com/c', markdown: longText },
    ]
    expect(await checkShortAverageWordCount({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null with fewer than 3 pages with markdown', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: 'court' },
      { url: 'https://example.com/b', markdown: 'court' },
    ]
    expect(await checkShortAverageWordCount({ pages, siteUrl: SITE_URL })).toBeNull()
  })
})

// ─── checkNoStatisticsOrFigures ───────────────────────────────────────────────

describe('checkNoStatisticsOrFigures', () => {
  it('detects near-absence of figures across the site', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: 'Nous proposons des services de qualité.' },
      { url: 'https://example.com/b', markdown: 'Notre équipe vous accompagne au quotidien.' },
    ]
    const result = await checkNoStatisticsOrFigures({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('no_statistics_or_figures')
    expect(result!.category).toBe('coverage')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(2)
  })

  it('returns null when the content contains figures and sources', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/a',
        markdown: 'Selon une étude récente, 42 % des TPE utilisent un logiciel de facturation.',
      },
    ]
    expect(await checkNoStatisticsOrFigures({ pages, siteUrl: SITE_URL })).toBeNull()
  })
})

// ─── checkNoExternalCitations ─────────────────────────────────────────────────

describe('checkNoExternalCitations', () => {
  it('detects fewer than 2 outbound links site-wide', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/a',
        markdown: 'Voir notre page [contact](https://example.com/contact) pour en savoir plus.',
      },
      {
        url: 'https://example.com/b',
        markdown: 'Une seule source : [Wikipédia](https://fr.wikipedia.org/wiki/GEO).',
      },
    ]
    // 1 seul lien externe < 2
    const result = await checkNoExternalCitations({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('no_external_citations')
    expect(result!.category).toBe('coverage')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(2)
  })

  it('returns null with 2+ external links', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/a',
        markdown:
          'Sources : [Wikipédia](https://fr.wikipedia.org/wiki/GEO) et [Le Monde](https://www.lemonde.fr/article).',
      },
    ]
    expect(await checkNoExternalCitations({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('ignores www. prefix when comparing to the site domain', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/a',
        markdown:
          'Liens internes : [a](https://www.example.com/x) et [b](https://www.example.com/y).',
      },
    ]
    expect(
      await checkNoExternalCitations({ pages, siteUrl: 'https://www.example.com' })
    ).not.toBeNull()
  })
})

// ─── checkContentNotFresh ─────────────────────────────────────────────────────

describe('checkContentNotFresh', () => {
  const NOW = new Date(2026, 5, 12) // 12 juin 2026 (déterministe)

  it('detects when no date in the last 12 months is found', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: 'Publié en janvier 2024.' },
      { url: 'https://example.com/b', markdown: 'Mis à jour le 15/03/2023.' },
    ]
    const result = await checkContentNotFreshAt({ pages, siteUrl: SITE_URL }, NOW)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('content_not_fresh')
    expect(result!.category).toBe('coverage')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(2)
  })

  it('returns null when a recent date exists', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: 'Mis à jour en mars 2026.' },
    ]
    expect(await checkContentNotFreshAt({ pages, siteUrl: SITE_URL }, NOW)).toBeNull()
  })

  it('recognises dd/mm/yyyy recent dates', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: 'Article du 02/01/2026 sur le GEO.' },
    ]
    expect(await checkContentNotFreshAt({ pages, siteUrl: SITE_URL }, NOW)).toBeNull()
  })

  it('returns null when no page has markdown', async () => {
    const pages: FirecrawlPage[] = [{ url: 'https://example.com/a' }]
    expect(await checkContentNotFreshAt({ pages, siteUrl: SITE_URL }, NOW)).toBeNull()
  })
})

// ─── checkNoNamedEntities ─────────────────────────────────────────────────────

describe('checkNoNamedEntities', () => {
  it('detects low density of proper nouns', async () => {
    const sentence = 'le service aide les petites entreprises locales chaque jour sans exception. '
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: sentence.repeat(25) },
    ]
    const result = await checkNoNamedEntities({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('no_named_entities')
    expect(result!.category).toBe('coverage')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(2)
  })

  it('returns null when the content names brands, places and people', async () => {
    const sentence =
      'notre agence travaille avec GeoMind à Paris pour la marque Renault chaque semaine. '
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: sentence.repeat(25) },
    ]
    expect(await checkNoNamedEntities({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null when there is too little text to judge', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: 'quelques mots seulement ici.' },
    ]
    expect(await checkNoNamedEntities({ pages, siteUrl: SITE_URL })).toBeNull()
  })
})

// ─── checkDuplicateContentCrossPages ──────────────────────────────────────────

describe('checkDuplicateContentCrossPages', () => {
  const baseText = Array.from({ length: 120 }, (_, i) => `mot${i}`).join(' ')

  it('detects two near-identical pages', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: baseText },
      { url: 'https://example.com/b', markdown: baseText },
      { url: 'https://example.com/c', markdown: 'Un contenu complètement différent ici, sans rapport.' },
    ]
    const result = await checkDuplicateContentCrossPages({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('duplicate_content_cross_pages')
    expect(result!.category).toBe('structure')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(3)
    expect(result!.impact).toBe(2)
    expect(result!.sampleUrls).toContain('https://example.com/a')
    expect(result!.sampleUrls).toContain('https://example.com/b')
  })

  it('returns null when pages are distinct', async () => {
    const otherText = Array.from({ length: 120 }, (_, i) => `terme${i}`).join(' ')
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/a', markdown: baseText },
      { url: 'https://example.com/b', markdown: otherText },
    ]
    expect(await checkDuplicateContentCrossPages({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null with a single page', async () => {
    const pages: FirecrawlPage[] = [{ url: 'https://example.com/a', markdown: baseText }]
    expect(await checkDuplicateContentCrossPages({ pages, siteUrl: SITE_URL })).toBeNull()
  })
})

// ─── checkNoComparativeContent ────────────────────────────────────────────────

describe('checkNoComparativeContent', () => {
  it('detects the absence of comparative content', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/services', markdown: '# Nos services\n\nDescription.' },
      { url: 'https://example.com/tarifs', metadata: { title: 'Nos tarifs' } },
    ]
    const result = await checkNoComparativeContent({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('no_comparative_content')
    expect(result!.category).toBe('coverage')
    expect(result!.severity).toBe('opportunity')
    expect(result!.effort).toBe(3)
    expect(result!.impact).toBe(3)
  })

  it('returns null when a comparative heading exists', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/guide',
        markdown: '## Top 5 des meilleurs logiciels de facturation',
      },
    ]
    expect(await checkNoComparativeContent({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null when a comparative URL exists', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/comparatif-crm', markdown: 'Contenu.' },
    ]
    expect(await checkNoComparativeContent({ pages, siteUrl: SITE_URL })).toBeNull()
  })
})

// ─── checkAboutPageMissing ────────────────────────────────────────────────────

describe('checkAboutPageMissing', () => {
  it('detects a missing about page', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/services', metadata: { title: 'Nos services' } },
      { url: 'https://example.com/tarifs', metadata: { title: 'Nos tarifs' } },
    ]
    const result = await checkAboutPageMissing({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('about_page_missing')
    expect(result!.category).toBe('coverage')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(2)
  })

  it('returns null when an a-propos URL exists', async () => {
    const pages: FirecrawlPage[] = [{ url: 'https://example.com/a-propos' }]
    expect(await checkAboutPageMissing({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null when a title matches "Qui sommes-nous" (accents/espaces)', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/equipe', metadata: { title: 'Qui sommes-nous ? — Notre équipe' } },
    ]
    expect(await checkAboutPageMissing({ pages, siteUrl: SITE_URL })).toBeNull()
  })
})

// ─── checkContactInfoMissing ──────────────────────────────────────────────────

describe('checkContactInfoMissing', () => {
  it('detects when no contact page nor email exists', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/services', markdown: 'Nos services de qualité.' },
    ]
    const result = await checkContactInfoMissing({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('contact_info_missing')
    expect(result!.category).toBe('coverage')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(2)
  })

  it('returns null when a contact page exists', async () => {
    const pages: FirecrawlPage[] = [{ url: 'https://example.com/contact' }]
    expect(await checkContactInfoMissing({ pages, siteUrl: SITE_URL })).toBeNull()
  })

  it('returns null when an email is visible in the content', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/services', markdown: 'Écrivez-nous : bonjour@example.com' },
    ]
    expect(await checkContactInfoMissing({ pages, siteUrl: SITE_URL })).toBeNull()
  })
})
