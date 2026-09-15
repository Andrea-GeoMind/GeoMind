import { describe, it, expect } from 'vitest'
import { getSchemaTypes, typesOf, resolveEntities } from '@/lib/analysis/technical/rules/_schema-helpers'
import { checkNoAuthorSchema } from '@/lib/analysis/technical/rules/no-author-schema'
import { checkSchemaOrgFaq } from '@/lib/analysis/technical/rules/schema-org-faq'
import type { FirecrawlPage } from '@/lib/analysis/technical/types'

const page = (schemaOrgs: Array<Record<string, unknown>>, url = 'https://x.fr/blog/a'): FirecrawlPage => ({
  url,
  markdown: '# A',
  statusCode: 200,
  metadata: { schemaOrgs },
})

// Patrons réels relevés sur des sites clients (WordPress/Yoast) qui faisaient
// conclure à tort à une absence de balisage.

describe('typesOf / getSchemaTypes', () => {
  it('lit un @type chaîne', () => {
    expect(typesOf({ '@type': 'FAQPage' })).toEqual(['FAQPage'])
  })

  it('lit un @type tableau — ["WebPage","FAQPage"]', () => {
    expect(typesOf({ '@type': ['WebPage', 'FAQPage'] })).toEqual(['WebPage', 'FAQPage'])
  })

  it('aplatit les types tableau au niveau de la page', () => {
    expect(getSchemaTypes(page([{ '@type': ['WebPage', 'FAQPage'] }, { '@type': 'Organization' }]))).toEqual([
      'WebPage',
      'FAQPage',
      'Organization',
    ])
  })

  it('ignore les entrées non-objets et les @type non-chaînes', () => {
    expect(getSchemaTypes(page(['texte' as unknown as Record<string, unknown>, { '@type': 42 }]))).toEqual([])
  })
})

describe('resolveEntities', () => {
  const p = page([
    { '@type': 'Person', '@id': 'https://x.fr/#author', name: 'Laurent VENET' },
    { '@type': 'BlogPosting', author: { '@id': 'https://x.fr/#author' } },
  ])

  it('résout une référence @id vers l entité du graphe', () => {
    const resolved = resolveEntities({ '@id': 'https://x.fr/#author' }, p)
    expect(resolved.some((e) => typesOf(e).includes('Person'))).toBe(true)
  })

  it('renvoie l objet tel quel quand la référence ne pointe nulle part', () => {
    expect(resolveEntities({ '@id': 'https://x.fr/#inconnu' }, p)).toHaveLength(1)
  })
})

describe('checkNoAuthorSchema', () => {
  it('ne signale rien quand author est imbriqué', async () => {
    const p = page([{ '@type': 'BlogPosting', author: { '@type': 'Person', name: 'A' } }])
    expect(await checkNoAuthorSchema(p, { pages: [p], siteUrl: 'https://x.fr' })).toBeNull()
  })

  it('ne signale rien quand author est une référence @id (patron Yoast)', async () => {
    const p = page([
      { '@type': 'Person', '@id': 'https://x.fr/a/#author', name: 'Laurent VENET' },
      { '@type': 'BlogPosting', author: { '@id': 'https://x.fr/a/#author', name: 'Laurent VENET' } },
    ])
    expect(await checkNoAuthorSchema(p, { pages: [p], siteUrl: 'https://x.fr' })).toBeNull()
  })

  it('signale un article réellement sans auteur', async () => {
    const p = page([{ '@type': 'BlogPosting', headline: 'A' }])
    const issue = await checkNoAuthorSchema(p, { pages: [p], siteUrl: 'https://x.fr' })
    expect(issue?.ruleKey).toBe('no_author_schema')
  })

  it("ne confond pas un auteur Organization avec une Person", async () => {
    const p = page([
      { '@type': 'Organization', '@id': 'https://x.fr/#org', name: 'ACME' },
      { '@type': 'BlogPosting', author: { '@id': 'https://x.fr/#org' } },
    ])
    expect((await checkNoAuthorSchema(p, { pages: [p], siteUrl: 'https://x.fr' }))?.ruleKey).toBe('no_author_schema')
  })
})

describe('checkSchemaOrgFaq', () => {
  it('reconnaît une FAQPage déclarée via un @type tableau', async () => {
    const p = page([{ '@type': ['WebPage', 'FAQPage'] }], 'https://x.fr/faq')
    expect(await checkSchemaOrgFaq({ pages: [p], siteUrl: 'https://x.fr' })).toBeNull()
  })
})
