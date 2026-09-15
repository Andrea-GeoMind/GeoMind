import { describe, it, expect, vi, afterEach } from 'vitest'
import { measureResponseTimes } from '@/lib/crawl/response-time'
import type { FirecrawlPageInsert } from '@/lib/crawl/pages'

const page = (url: string, metadata: Record<string, unknown> | null = null): FirecrawlPageInsert => ({
  siteId: 's1',
  url,
  markdown: null,
  metadata,
  statusCode: 200,
})

afterEach(() => vi.unstubAllGlobals())

describe('measureResponseTimes', () => {
  it('renseigne loadTime sur chaque page', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('ok')))
    const pages = [page('https://a.fr/'), page('https://a.fr/contact')]
    await measureResponseTimes(pages)
    for (const p of pages) expect(typeof p.metadata?.loadTime).toBe('number')
  })

  it('préserve les métadonnées existantes', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('ok')))
    const pages = [page('https://a.fr/', { title: 'Accueil', schemaOrgs: [] })]
    await measureResponseTimes(pages)
    expect(pages[0].metadata?.title).toBe('Accueil')
    expect(pages[0].metadata?.schemaOrgs).toEqual([])
  })

  it("laisse la page sans loadTime quand la requête échoue, sans lever", async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNREFUSED') }))
    const pages = [page('https://injoignable.invalid/')]
    await expect(measureResponseTimes(pages)).resolves.toBeUndefined()
    expect(pages[0].metadata?.loadTime).toBeUndefined()
  })

  it('mesure chaque page exactement une fois', async () => {
    const spy = vi.fn(async () => new Response('ok'))
    vi.stubGlobal('fetch', spy)
    const pages = Array.from({ length: 12 }, (_, i) => page(`https://a.fr/p${i}`))
    await measureResponseTimes(pages)
    expect(spy).toHaveBeenCalledTimes(12)
    expect(pages.every((p) => typeof p.metadata?.loadTime === 'number')).toBe(true)
  })

  it('ne fait rien sur un lot vide', async () => {
    const spy = vi.fn()
    vi.stubGlobal('fetch', spy)
    await measureResponseTimes([])
    expect(spy).not.toHaveBeenCalled()
  })
})
