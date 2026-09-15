import { describe, it, expect } from 'vitest'
import { isCrawlTruncated, crawlWasTruncated, CRAWL_TRUNCATED_KEY } from '@/lib/analysis/crawl-coverage'
import { checkAboutPageMissing } from '@/lib/analysis/content/rules/about-page-missing'
import { checkContactInfoMissing } from '@/lib/analysis/content/rules/contact-info-missing'
import { checkLowPageCount } from '@/lib/analysis/content/rules/low-page-count'
import { checkThinContent } from '@/lib/analysis/content/rules/thin-content'
import type { FirecrawlPage } from '@/lib/analysis/content/types'

describe('isCrawlTruncated', () => {
  it('est vrai quand le crawl atteint son plafond', () => {
    expect(isCrawlTruncated({ pagesFound: 20, maxPages: 20 })).toBe(true)
  })

  it('est faux quand le crawl a tout exploré', () => {
    expect(isCrawlTruncated({ pagesFound: 7, maxPages: 20 })).toBe(false)
  })

  it("est vrai quand la découverte a échoué — la taille du site est inconnue", () => {
    expect(isCrawlTruncated({ pagesFound: 1, maxPages: 20, discoveryFailed: true })).toBe(true)
  })
})

describe('crawlWasTruncated', () => {
  it('lit le marqueur posé sur les pages', () => {
    expect(crawlWasTruncated([{ metadata: { [CRAWL_TRUNCATED_KEY]: true } }])).toBe(true)
    expect(crawlWasTruncated([{ metadata: { [CRAWL_TRUNCATED_KEY]: false } }])).toBe(false)
  })

  it('reste faux sur des pages sans marqueur (crawl antérieur au correctif)', () => {
    expect(crawlWasTruncated([{ metadata: null }, {}])).toBe(false)
  })
})

// Le cas réel : drlaurentvenet.fr publie /a-propos/ et /contact/, mais le crawl
// plafonné ne les avait pas atteintes — le rapport les déclarait absentes.
const page = (url: string): FirecrawlPage => ({
  url,
  markdown: '# Titre\n\nUn contenu de page quelconque, assez long pour compter.',
  statusCode: 200,
  metadata: { title: 'Page' },
})

const pages = [page('https://x.fr/'), page('https://x.fr/services/')]

describe('règles d existence sur un crawl plafonné', () => {
  const truncated = { pages, siteUrl: 'https://x.fr', crawlTruncated: true }
  const complete = { pages, siteUrl: 'https://x.fr', crawlTruncated: false }

  it('ne conclut pas à une page À propos manquante', async () => {
    expect(await checkAboutPageMissing(truncated)).toBeNull()
    expect((await checkAboutPageMissing(complete))?.ruleKey).toBe('about_page_missing')
  })

  it('ne conclut pas à des coordonnées introuvables', async () => {
    expect(await checkContactInfoMissing(truncated)).toBeNull()
    expect((await checkContactInfoMissing(complete))?.ruleKey).toBe('contact_info_missing')
  })

  it('ne reproche pas une couverture thématique insuffisante', async () => {
    expect(await checkLowPageCount(truncated)).toBeNull()
    expect((await checkLowPageCount(complete))?.ruleKey).toBe('low_page_count')
  })

  it('laisse parler les règles proportionnelles — un échantillon reste représentatif', async () => {
    expect((await checkThinContent(truncated))?.ruleKey).toBe('thin_content')
  })

  it('conclut normalement quand le marqueur est absent (crawl antérieur)', async () => {
    const legacy = { pages, siteUrl: 'https://x.fr' }
    expect((await checkAboutPageMissing(legacy))?.ruleKey).toBe('about_page_missing')
  })
})
