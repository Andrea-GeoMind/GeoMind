import { describe, it, expect } from 'vitest'
import { checkSchemaOrgOrganization } from '@/lib/analysis/technical/rules/schema-org-organization'
import { checkSchemaOrgFaq } from '@/lib/analysis/technical/rules/schema-org-faq'
import { checkSchemaOrgArticle } from '@/lib/analysis/technical/rules/schema-org-article'
import { checkSchemaOrgProduct } from '@/lib/analysis/technical/rules/schema-org-product'
import type { FirecrawlPage } from '@/lib/analysis/technical/types'

const SITE_URL = 'https://example.com'

// ─── checkSchemaOrgOrganization ───────────────────────────────────────────────

describe('checkSchemaOrgOrganization', () => {
  it('returns null when home page has Organization schema', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/',
        metadata: { schemaOrgs: [{ '@type': 'Organization', name: 'Example' }] },
      },
    ]
    const result = await checkSchemaOrgOrganization({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null when home page has LocalBusiness schema', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/',
        metadata: { schemaOrgs: [{ '@type': 'LocalBusiness', name: 'Example' }] },
      },
    ]
    const result = await checkSchemaOrgOrganization({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null when no home page is in the crawled pages', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/about', metadata: { schemaOrgs: [] } },
    ]
    const result = await checkSchemaOrgOrganization({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns an issue when home page has no Organization schema', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/',
        metadata: { schemaOrgs: [{ '@type': 'Article' }] },
      },
    ]
    const result = await checkSchemaOrgOrganization({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('schema_org_organization')
    expect(result!.category).toBe('schema_org')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(2)
  })

  it('returns an issue when home page has no schemaOrgs at all', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: '# Home' },
    ]
    const result = await checkSchemaOrgOrganization({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
  })
})

// ─── checkSchemaOrgFaq (détection durcie V2) ──────────────────────────────────

describe('checkSchemaOrgFaq', () => {
  it('returns null when no FAQ pages are detected', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: '# Home\n\nWelcome to our site.' },
      { url: 'https://example.com/about', markdown: '# About\n\nWe are a company.' },
    ]
    const result = await checkSchemaOrgFaq({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null when FAQ pages have FAQPage schema', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/faq',
        markdown: '# FAQ\n\n## Question 1?\n\nAnswer 1\n\n## Question 2?\n\nAnswer 2\n\n## Question 3?\n\nAnswer 3',
        metadata: { schemaOrgs: [{ '@type': 'FAQPage' }] },
      },
    ]
    const result = await checkSchemaOrgFaq({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns an issue when FAQ page lacks FAQPage schema', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/faq',
        markdown: '# FAQ\n\n## Question 1?\n\nAnswer 1\n\n## Question 2?\n\nAnswer 2\n\n## Question 3?\n\nAnswer 3',
        metadata: { schemaOrgs: [] },
      },
    ]
    const result = await checkSchemaOrgFaq({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('schema_org_faq')
    expect(result!.category).toBe('schema_org')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(3)
  })

  it('détection durcie : flags FAQ content written as bold questions (no interrogative headings)', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/aide',
        markdown:
          '# Aide\n\n**Combien coûte la livraison ?**\n\n5€ partout en France.\n\n**Quels sont les délais ?**\n\n48h ouvrées.\n\n**Puis-je retourner un produit ?**\n\nOui, sous 30 jours.',
        metadata: { schemaOrgs: [] },
      },
    ]
    const result = await checkSchemaOrgFaq({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('schema_org_faq')
    expect(result!.severity).toBe('moderate')
  })

  it('détection durcie : flags a /faq URL even without parsed Q/A markdown', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/faq', markdown: '# Vos questions', metadata: { schemaOrgs: [] } },
    ]
    const result = await checkSchemaOrgFaq({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
  })

  it('détection durcie : flags explicit Q/R line patterns', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/support',
        markdown:
          '# Support\n\nQ : Comment créer un compte ?\nR : Cliquez sur Inscription.\n\nQ : Comment changer mon mot de passe ?\nR : Depuis les paramètres.\n\nQ : Comment supprimer mon compte ?\nR : Contactez-nous.',
        metadata: { schemaOrgs: [] },
      },
    ]
    const result = await checkSchemaOrgFaq({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
  })
})

// ─── checkSchemaOrgArticle ────────────────────────────────────────────────────

describe('checkSchemaOrgArticle', () => {
  it('returns null when no article pages are detected', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: '# Home' },
      { url: 'https://example.com/about', markdown: '# About' },
    ]
    const result = await checkSchemaOrgArticle({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null when article pages have Article schema', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/blog/my-post',
        markdown: '# My Post\n\nContent here.',
        metadata: { schemaOrgs: [{ '@type': 'Article' }] },
      },
    ]
    const result = await checkSchemaOrgArticle({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null when article pages have BlogPosting schema', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/blog/my-post',
        markdown: '# My Post',
        metadata: { schemaOrgs: [{ '@type': 'BlogPosting' }] },
      },
    ]
    const result = await checkSchemaOrgArticle({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns an issue when a /blog/ page lacks Article schema', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/blog/my-post',
        markdown: '# My Post',
        metadata: { schemaOrgs: [] },
      },
    ]
    const result = await checkSchemaOrgArticle({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('schema_org_article')
    expect(result!.category).toBe('schema_org')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(2)
  })
})

// ─── checkSchemaOrgProduct ────────────────────────────────────────────────────

describe('checkSchemaOrgProduct', () => {
  it('returns null when no product pages are detected', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/', markdown: '# Home' },
    ]
    const result = await checkSchemaOrgProduct({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null when product pages have Product schema', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/produit/chaussure-running',
        markdown: '# Chaussure Running',
        metadata: { schemaOrgs: [{ '@type': 'Product' }] },
      },
    ]
    const result = await checkSchemaOrgProduct({ pages, siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns an issue when a /produit/ page lacks Product schema', async () => {
    const pages: FirecrawlPage[] = [
      {
        url: 'https://example.com/produit/chaussure',
        markdown: '# Chaussure',
        metadata: { schemaOrgs: [] },
      },
    ]
    const result = await checkSchemaOrgProduct({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('schema_org_product')
    expect(result!.category).toBe('schema_org')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(2)
  })

  it('detects /product/ and /shop/ URL patterns', async () => {
    const pages: FirecrawlPage[] = [
      { url: 'https://example.com/product/shoes', metadata: { schemaOrgs: [] } },
    ]
    const result = await checkSchemaOrgProduct({ pages, siteUrl: SITE_URL })
    expect(result).not.toBeNull()
  })
})
