import { describe, it, expect } from 'vitest'
import {
  stripEmbeddedDocuments,
  mainHead,
  extractDocumentMeta,
} from '@/lib/crawl/document-scope'
import { extractHeadings } from '@/lib/crawl/headings'
import { extractJsonLd } from '@/lib/crawl/json-ld'

/**
 * Régression du 24/09/2026, généralisée le 03/10.
 *
 * Firecrawl exécute le JavaScript et aplatit les documents embarqués dans le
 * HTML parent (`data-original-tag="iframe"`). Toute balise censée être unique
 * au document — title, description, canonical, lang, Open Graph, H1, JSON-LD —
 * peut donc être celle d'un widget tiers.
 */

/** Reproduit la structure relevée sur lembellie-lyon.com (widget AddToAny). */
const PAGE = `<!DOCTYPE html><html lang="fr"><head>
    <title>L'Embellie — Institut de beauté à Lyon</title>
    <meta name="description" content="Centre de beauté à Lyon depuis 2000.">
    <link rel="canonical" href="https://www.lembellie-lyon.com/">
    <meta property="og:title" content="L'Embellie">
  </head><body>
    <h1>Institut de beauté à Lyon</h1>
    <script type="application/ld+json">{"@type":"LocalBusiness","name":"L'Embellie"}</script>
    <div id="a2a_sm_ifr" title="AddToAny Utility Frame" data-original-tag="iframe">
      <!DOCTYPE html><html lang="en"><head>
        <title>A2A</title>
        <meta name="description" content="AddToAny sharing frame">
        <meta name="robots" content="noindex">
        <link rel="canonical" href="https://static.addtoany.com/menu/sm.html">
        <meta property="og:title" content="AddToAny">
      </head><body>
        <h1>Share</h1>
        <script type="application/ld+json">{"@type":"WebSite","name":"AddToAny"}</script>
      </body></html>
    </div>
    <h2>Nos soins</h2>
  </body></html>`

describe('retrait des documents embarqués', () => {
  const clean = stripEmbeddedDocuments(PAGE)

  it('retire le sous-arbre complet du widget', () => {
    expect(clean).not.toContain('AddToAny')
    expect(clean).not.toContain('A2A')
    expect(clean).not.toContain('addtoany.com')
  })

  it('garde intact le contenu de la page', () => {
    expect(clean).toContain("L'Embellie — Institut de beauté à Lyon")
    expect(clean).toContain('Institut de beauté à Lyon')
    expect(clean).toContain('Nos soins')
  })

  it('retire aussi une iframe restée sous sa vraie balise', () => {
    const html = '<body><p>vrai</p><iframe src="x"><h1>pub</h1></iframe></body>'
    const out = stripEmbeddedDocuments(html)
    expect(out).toContain('vrai')
    expect(out).not.toContain('pub')
  })

  it('gère les div imbriqués sans déborder', () => {
    // Un indexOf('</div>') naïf s'arrêterait au premier div interne et
    // laisserait la moitié du sous-document dans la page.
    const html =
      '<body><div data-original-tag="iframe"><div><div>pub</div></div></div><p>vrai</p></body>'
    const out = stripEmbeddedDocuments(html)
    expect(out).not.toContain('pub')
    expect(out).toContain('vrai')
  })
})

describe('balises uniques du document principal', () => {
  const meta = extractDocumentMeta(PAGE)!

  it('lit le title, la description et le canonical de la page', () => {
    expect(meta.title).toBe("L'Embellie — Institut de beauté à Lyon")
    expect(meta.description).toBe('Centre de beauté à Lyon depuis 2000.')
    expect(meta.canonical).toBe('https://www.lembellie-lyon.com/')
  })

  it('lit le lang du html principal, pas celui du widget', () => {
    expect(meta.language).toBe('fr')
  })

  it('lit l’Open Graph de la page, pas celui du widget', () => {
    expect(meta.ogTitle).toBe("L'Embellie")
  })

  it('n’invente rien quand la balise est absente', () => {
    const sans = extractDocumentMeta('<html><head><title>T</title></head><body></body></html>')!
    expect(sans.title).toBe('T')
    expect(sans.description).toBeNull()
    expect(sans.canonical).toBeNull()
  })

  it('renvoie null quand il n’y a pas de HTML', () => {
    expect(extractDocumentMeta(null)).toBeNull()
    expect(extractDocumentMeta('')).toBeNull()
  })
})

describe('le head isolé s’arrête au document principal', () => {
  it('ne contient rien du widget', () => {
    const head = mainHead(PAGE)
    expect(head).toContain("L'Embellie — Institut de beauté")
    expect(head).not.toContain('A2A')
    expect(head).not.toContain('noindex')
  })
})

describe('titres et JSON-LD ignorent les sous-documents', () => {
  it('ne retient que le H1 de la page', () => {
    const h = extractHeadings(PAGE)!
    expect(h.h1).toEqual(['Institut de beauté à Lyon'])
    expect(h.h1).not.toContain('Share')
    expect(h.h2).toEqual(['Nos soins'])
  })

  it('ne compte pas le H1 du widget dans la hiérarchie', () => {
    // Deux H1 dans le HTML brut, un seul dans le document : la règle
    // « H1 dupliqué » se déclenchait à tort.
    expect(extractHeadings(PAGE)!.levels.filter((n) => n === 1)).toHaveLength(1)
  })

  it('ne retient que le JSON-LD de la page', () => {
    const entities = extractJsonLd(PAGE)
    expect(entities).toEqual([{ '@type': 'LocalBusiness', name: "L'Embellie" }])
  })
})
