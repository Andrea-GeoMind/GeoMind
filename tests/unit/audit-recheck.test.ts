import { describe, it, expect } from 'vitest'
import { extractDocumentMeta } from '@/lib/crawl/document-scope'
import { extractHeadings } from '@/lib/crawl/headings'

/**
 * Les verdicts dont dépend `scripts/audit/document-scope-recheck.ts`.
 *
 * Le script lui-même ouvre une connexion Postgres au chargement, donc on teste
 * ici la logique qu'il applique : sur une page saine, un constat « manquant »
 * doit être infirmé ; sur une page qui porte vraiment le défaut, confirmé.
 */
const PAGE_SAINE = `<!DOCTYPE html><html lang="fr"><head>
    <title>Institut</title>
    <link rel="canonical" href="https://x.fr/">
    <meta name="viewport" content="width=device-width">
    <meta name="twitter:card" content="summary">
    <meta property="og:title" content="T"><meta property="og:description" content="D">
    <meta property="og:image" content="https://x.fr/i.png">
  </head><body><h1>Unique</h1>
    <div data-original-tag="iframe"><html lang="en"><head><title>Widget</title>
      <link rel="canonical" href="https://tiers.com/"></head><body><h1>Pub</h1></body></html></div>
  </body></html>`

const PAGE_DEFAUT = `<!DOCTYPE html><html><head><title>Sans rien</title></head>
  <body><h1>A</h1><h1>B</h1></body></html>`

describe('verdicts de la revérification', () => {
  it('infirme les constats « manquant » sur une page saine', () => {
    const m = extractDocumentMeta(PAGE_SAINE)!
    expect(m.canonical).toBe('https://x.fr/')
    expect(m.language).toBe('fr')
    expect(m.viewport).toBe('width=device-width')
    expect(m.twitterCard).toBe('summary')
    expect(m.ogTitle && m.ogDescription && m.ogImage).toBeTruthy()
    expect(extractHeadings(PAGE_SAINE)!.h1).toEqual(['Unique'])
  })

  it('ne se laisse pas tromper par le widget de la page saine', () => {
    const m = extractDocumentMeta(PAGE_SAINE)!
    expect(m.canonical).not.toContain('tiers.com')
    expect(m.language).not.toBe('en')
    expect(extractHeadings(PAGE_SAINE)!.h1).not.toContain('Pub')
  })

  it('confirme les constats sur une page qui porte vraiment le défaut', () => {
    const m = extractDocumentMeta(PAGE_DEFAUT)!
    expect(m.canonical).toBeNull()
    expect(m.language).toBeNull()
    expect(m.viewport).toBeNull()
    expect(m.twitterCard).toBeNull()
    // Deux H1 : le constat « H1 dupliqué » tient.
    expect(extractHeadings(PAGE_DEFAUT)!.h1).toHaveLength(2)
  })
})
