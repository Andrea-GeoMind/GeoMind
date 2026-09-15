import { describe, it, expect } from 'vitest'
import { extractJsonLd } from '@/lib/crawl/json-ld'

const wrap = (json: string) => `<html><head><script type="application/ld+json">${json}</script></head><body>x</body></html>`

describe('extractJsonLd', () => {
  it('extrait un objet unique', () => {
    const out = extractJsonLd(wrap('{"@context":"https://schema.org","@type":"Organization","name":"ACME"}'))
    expect(out).toHaveLength(1)
    expect(out[0]['@type']).toBe('Organization')
  })

  it('aplatit un @graph (forme produite par Next.js)', () => {
    const out = extractJsonLd(
      wrap('{"@context":"https://schema.org","@graph":[{"@type":"Organization"},{"@type":"WebSite"},{"@type":"FAQPage"}]}')
    )
    expect(out.map((e) => e['@type'])).toEqual(['Organization', 'WebSite', 'FAQPage'])
  })

  it('aplatit un tableau de racine', () => {
    const out = extractJsonLd(wrap('[{"@type":"Article"},{"@type":"BreadcrumbList"}]'))
    expect(out.map((e) => e['@type'])).toEqual(['Article', 'BreadcrumbList'])
  })

  it('agrège plusieurs blocs script', () => {
    const html = wrap('{"@type":"Organization"}') + wrap('{"@type":"Product"}')
    expect(extractJsonLd(html).map((e) => e['@type'])).toEqual(['Organization', 'Product'])
  })

  it('ignore un bloc invalide sans perdre les autres', () => {
    const html = wrap('{ ceci nest pas du json') + wrap('{"@type":"Organization"}')
    expect(extractJsonLd(html).map((e) => e['@type'])).toEqual(['Organization'])
  })

  it('gère les variantes de balise (simple quote, attributs supplémentaires, casse)', () => {
    const html =
      `<script id="a" TYPE='application/ld+json' data-x="1">{"@type":"LocalBusiness"}</script>`
    expect(extractJsonLd(html).map((e) => e['@type'])).toEqual(['LocalBusiness'])
  })

  it('gère les enveloppes CDATA et commentaires HTML (WordPress)', () => {
    expect(extractJsonLd(wrap('<!--{"@type":"Organization"}-->')).map((e) => e['@type'])).toEqual(['Organization'])
    expect(extractJsonLd(wrap('//<![CDATA[{"@type":"WebSite"}//]]>')).map((e) => e['@type'])).toEqual(['WebSite'])
  })

  it('conserve les propriétés utiles aux règles (author Person)', () => {
    const out = extractJsonLd(wrap('{"@type":"BlogPosting","author":{"@type":"Person","name":"A. Schwertz"}}'))
    expect(out[0]['author']).toEqual({ '@type': 'Person', name: 'A. Schwertz' })
  })

  it('ignore les entrées sans @type', () => {
    expect(extractJsonLd(wrap('{"name":"sans type"}'))).toEqual([])
  })

  it('ne casse pas sur du HTML vide, nul ou sans JSON-LD', () => {
    expect(extractJsonLd(null)).toEqual([])
    expect(extractJsonLd(undefined)).toEqual([])
    expect(extractJsonLd('')).toEqual([])
    expect(extractJsonLd('<html><body>rien</body></html>')).toEqual([])
  })

  it('ignore un script ld+json vide', () => {
    expect(extractJsonLd(wrap('   '))).toEqual([])
  })
})

// ─── buildPageMetadata ────────────────────────────────────────────────────────
// Régression du bug qui faisait remonter 7 faux « points faibles » schema_org sur
// TOUS les rapports clients : `metadata.schemaOrgs` n'était jamais rempli.
// Piège associé : le format `html` de Firecrawl est nettoyé et retire les
// `<script>` — seul `rawHtml` contient le JSON-LD.

describe('buildPageMetadata', () => {
  it('remplit schemaOrgs depuis le HTML brut', async () => {
    const { buildPageMetadata } = await import('@/lib/crawl/pages')
    const meta = buildPageMetadata({
      markdown: '# Titre',
      rawHtml: wrap('{"@type":"Organization","name":"Cabinet"}'),
      metadata: { title: 'Accueil', statusCode: 200 },
    })
    expect(meta.title).toBe('Accueil')
    expect(meta.schemaOrgs).toEqual([{ '@type': 'Organization', name: 'Cabinet' }])
  })

  it('renvoie un tableau vide (et non undefined) quand la page n a pas de JSON-LD', async () => {
    const { buildPageMetadata } = await import('@/lib/crawl/pages')
    expect(buildPageMetadata({ markdown: 'x', metadata: {} }).schemaOrgs).toEqual([])
  })

  it('tolère un document sans metadata', async () => {
    const { buildPageMetadata } = await import('@/lib/crawl/pages')
    expect(buildPageMetadata({}).schemaOrgs).toEqual([])
  })
})
