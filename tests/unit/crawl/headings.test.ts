import { describe, it, expect } from 'vitest'
import { extractHeadings } from '@/lib/crawl/headings'
import { isArticleUrl, isSectionIndexUrl } from '@/lib/analysis/technical/rules/_url-helpers'

describe('extractHeadings', () => {
  it('extrait H1 et H2 du HTML', () => {
    const out = extractHeadings('<h1>Tous les articles</h1><h2>Strip technique</h2><h2>Greffe</h2>')
    expect(out).toEqual({ h1: ['Tous les articles'], h2: ['Strip technique', 'Greffe'] })
  })

  it('retire les balises internes et décode les entités', () => {
    const out = extractHeadings("<h1 class=\"t\"><span>L&rsquo;alternative</span> &amp; la greffe</h1>")
    expect(out?.h1).toEqual(['L’alternative & la greffe'])
  })

  it('trouve un H1 que le markdown de Firecrawl perdrait (bannière)', () => {
    const html = '<header class="banner"><h1>Mentions légales</h1></header><main><p>…</p></main>'
    expect(extractHeadings(html)?.h1).toEqual(['Mentions légales'])
  })

  it('renvoie des tableaux vides sur une page réellement sans titre', () => {
    expect(extractHeadings('<div>rien</div>')).toEqual({ h1: [], h2: [] })
  })

  it('ignore les titres vides', () => {
    expect(extractHeadings('<h1>  </h1><h1>Vrai</h1>')?.h1).toEqual(['Vrai'])
  })

  it('renvoie null sans HTML — les règles retombent sur le markdown', () => {
    expect(extractHeadings(null)).toBeNull()
    expect(extractHeadings('')).toBeNull()
  })
})

describe('isArticleUrl / isSectionIndexUrl', () => {
  it('reconnaît un article', () => {
    expect(isArticleUrl('https://x.fr/blog/mon-article')).toBe(true)
    expect(isArticleUrl('https://x.fr/actualites/2026/titre')).toBe(true)
  })

  it("ne prend pas l'index de section pour un article", () => {
    expect(isArticleUrl('https://x.fr/blog/')).toBe(false)
    expect(isArticleUrl('https://x.fr/blog')).toBe(false)
    expect(isSectionIndexUrl('https://x.fr/blog/')).toBe(true)
  })

  it('ignore une page hors section éditoriale', () => {
    expect(isArticleUrl('https://x.fr/contact/')).toBe(false)
    expect(isSectionIndexUrl('https://x.fr/contact/')).toBe(false)
  })

  it('tolère une URL invalide', () => {
    expect(isArticleUrl('pas-une-url')).toBe(false)
  })
})
