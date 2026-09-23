import { describe, it, expect, vi, afterEach } from 'vitest'
import { probePages } from '@/lib/crawl/page-probe'
import type { FirecrawlPageInsert } from '@/lib/crawl/pages'

const page = (url: string, metadata: Record<string, unknown> | null = null): FirecrawlPageInsert => ({
  siteId: 's1',
  url,
  markdown: null,
  metadata,
  statusCode: 200,
})

afterEach(() => vi.unstubAllGlobals())

describe('probePages', () => {
  it('renseigne loadTime sur chaque page', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('ok')))
    const pages = [page('https://a.fr/'), page('https://a.fr/contact')]
    await probePages(pages)
    for (const p of pages) expect(typeof p.metadata?.loadTime).toBe('number')
  })

  it('préserve les métadonnées existantes', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('ok')))
    const pages = [page('https://a.fr/', { title: 'Accueil', schemaOrgs: [] })]
    await probePages(pages)
    expect(pages[0].metadata?.title).toBe('Accueil')
    expect(pages[0].metadata?.schemaOrgs).toEqual([])
  })

  it("laisse la page sans loadTime quand la requête échoue, sans lever", async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNREFUSED') }))
    const pages = [page('https://injoignable.invalid/')]
    await expect(probePages(pages)).resolves.toBeUndefined()
    expect(pages[0].metadata?.loadTime).toBeUndefined()
  })

  it('mesure chaque page exactement une fois', async () => {
    const spy = vi.fn(async () => new Response('ok'))
    vi.stubGlobal('fetch', spy)
    const pages = Array.from({ length: 12 }, (_, i) => page(`https://a.fr/p${i}`))
    await probePages(pages)
    expect(spy).toHaveBeenCalledTimes(12)
    expect(pages.every((p) => typeof p.metadata?.loadTime === 'number')).toBe(true)
  })

  it("relève l'en-tête X-Robots-Tag sur la même requête", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('ok', { headers: { 'x-robots-tag': 'noindex, follow' } }))
    )
    const pages = [page('https://a.fr/')]
    await probePages(pages)
    expect(pages[0].metadata?.xRobotsTag).toBe('noindex, follow')
  })

  it("distingue l'en-tête absent de la page non sondée", async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('ok')))
    const sondee = [page('https://a.fr/')]
    await probePages(sondee)
    // En-tête absent : la sonde a répondu, il n'y a pas de directive.
    expect(sondee[0].metadata?.xRobotsTag).toBeNull()

    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNREFUSED') }))
    const muette = [page('https://b.fr/')]
    await probePages(muette)
    // Rien relevé : on ne sait pas, et la règle noindex doit se taire.
    expect(muette[0].metadata?.xRobotsTag).toBeUndefined()
  })

  it('ne fait rien sur un lot vide', async () => {
    const spy = vi.fn()
    vi.stubGlobal('fetch', spy)
    await probePages([])
    expect(spy).not.toHaveBeenCalled()
  })
})
