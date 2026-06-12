import { describe, it, expect } from 'vitest'
import { checkNoBreadcrumbSchema } from '@/lib/analysis/technical/rules/no-breadcrumb-schema'
import { checkNoAuthorSchema } from '@/lib/analysis/technical/rules/no-author-schema'
import { checkNoHowToSchema } from '@/lib/analysis/technical/rules/no-how-to-schema'
import type { RuleInput } from '@/lib/analysis/technical/types'

const INPUT: RuleInput = { pages: [], siteUrl: 'https://example.com' }

// ─── checkNoBreadcrumbSchema ──────────────────────────────────────────────────

describe('checkNoBreadcrumbSchema', () => {
  it('returns an issue for a depth-2 page without BreadcrumbList', async () => {
    const page = { url: 'https://example.com/services/plomberie', metadata: { schemaOrgs: [] } }
    const result = await checkNoBreadcrumbSchema(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('no_breadcrumb_schema')
    expect(result!.category).toBe('schema_org')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(1)
    expect(result!.sampleUrls).toEqual(['https://example.com/services/plomberie'])
  })

  it('returns null for a depth-1 page', async () => {
    const page = { url: 'https://example.com/services', metadata: { schemaOrgs: [] } }
    const result = await checkNoBreadcrumbSchema(page, INPUT)
    expect(result).toBeNull()
  })

  it('returns null when BreadcrumbList is declared', async () => {
    const page = {
      url: 'https://example.com/services/plomberie',
      metadata: { schemaOrgs: [{ '@type': 'BreadcrumbList' }] },
    }
    const result = await checkNoBreadcrumbSchema(page, INPUT)
    expect(result).toBeNull()
  })
})

// ─── checkNoAuthorSchema ──────────────────────────────────────────────────────

describe('checkNoAuthorSchema', () => {
  it('returns an issue for an Article schema without a Person author', async () => {
    const page = {
      url: 'https://example.com/guide-seo',
      metadata: { schemaOrgs: [{ '@type': 'Article', headline: 'Guide' }] },
    }
    const result = await checkNoAuthorSchema(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('no_author_schema')
    expect(result!.category).toBe('schema_org')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(2)
  })

  it('returns an issue for a /blog URL without any schema', async () => {
    const page = { url: 'https://example.com/blog/mon-article', markdown: '# Mon article' }
    const result = await checkNoAuthorSchema(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('no_author_schema')
  })

  it('returns null when the article declares a Person author', async () => {
    const page = {
      url: 'https://example.com/blog/mon-article',
      metadata: {
        schemaOrgs: [
          { '@type': 'BlogPosting', author: { '@type': 'Person', name: 'Jeanne Dupont' } },
        ],
      },
    }
    const result = await checkNoAuthorSchema(page, INPUT)
    expect(result).toBeNull()
  })

  it('accepts an array of authors containing a Person', async () => {
    const page = {
      url: 'https://example.com/blog/mon-article',
      metadata: {
        schemaOrgs: [
          {
            '@type': 'Article',
            author: [{ '@type': 'Organization' }, { '@type': 'Person', name: 'Jeanne' }],
          },
        ],
      },
    }
    const result = await checkNoAuthorSchema(page, INPUT)
    expect(result).toBeNull()
  })

  it('returns null for a non-article page', async () => {
    const page = { url: 'https://example.com/contact', metadata: { schemaOrgs: [] } }
    const result = await checkNoAuthorSchema(page, INPUT)
    expect(result).toBeNull()
  })
})

// ─── checkNoHowToSchema ───────────────────────────────────────────────────────

describe('checkNoHowToSchema', () => {
  it('returns an opportunity when H1 starts with « Comment » and no HowTo schema', async () => {
    const page = {
      url: 'https://example.com/guides/changer-un-joint',
      markdown: '# Comment changer un joint de robinet\n\nÉtape 1…',
      metadata: { schemaOrgs: [] },
    }
    const result = await checkNoHowToSchema(page, INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('no_how_to_schema')
    expect(result!.category).toBe('schema_org')
    expect(result!.severity).toBe('opportunity')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(2)
  })

  it('detects « how to » in the metadata title', async () => {
    const page = {
      url: 'https://example.com/guides/fix-a-leak',
      metadata: { title: 'How to fix a leak' },
    }
    const result = await checkNoHowToSchema(page, INPUT)
    expect(result).not.toBeNull()
  })

  it('returns null when a HowTo schema is declared', async () => {
    const page = {
      url: 'https://example.com/guides/changer-un-joint',
      markdown: '# Comment changer un joint',
      metadata: { schemaOrgs: [{ '@type': 'HowTo' }] },
    }
    const result = await checkNoHowToSchema(page, INPUT)
    expect(result).toBeNull()
  })

  it('returns null when the page is not a how-to guide', async () => {
    const page = { url: 'https://example.com/about', markdown: '# Qui sommes-nous' }
    const result = await checkNoHowToSchema(page, INPUT)
    expect(result).toBeNull()
  })

  it('does not flag titles merely containing « comment » mid-sentence', async () => {
    const page = {
      url: 'https://example.com/blog/avis',
      markdown: '# Laissez un commentaire à propos de nos services',
    }
    // « commentaire » commence par « comment » mais le pattern exige un mot complet… ici
    // « commentaire » matche \bcomment ? Non : la règle utilise comment\b, donc pas de match.
    const result = await checkNoHowToSchema(page, INPUT)
    expect(result).toBeNull()
  })
})
