import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '@/lib/crawl/retry'
import { firecrawlDocumentSchema } from '@/lib/crawl/schemas'
import { dedupeFirecrawlPages } from '@/lib/crawl/pages'

// ─── dedupeFirecrawlPages ─────────────────────────────────────────────────────
// Régression : un site builder (eatbu/DISH) sert `/`, le domaine nu et `?lang=xx`
// qui se canonicalisent vers la même metadata.url → doublons (siteId, url) dans le
// batch → Postgres rejette l'ON CONFLICT → 0 page écrite → découverte bloquée à 90 %.

describe('dedupeFirecrawlPages', () => {
  const page = (url: string, markdown: string) => ({
    siteId: 's1',
    url,
    markdown,
    metadata: null,
    statusCode: 200,
  })

  it('supprime les doublons (siteId, url) en gardant la dernière occurrence', () => {
    const pages = [
      page('https://x.fr/?lang=fr', 'A'),
      page('https://x.fr/?lang=en', 'B'),
      page('https://x.fr/?lang=en', 'C'), // doublon de la ligne précédente
    ]
    const result = dedupeFirecrawlPages(pages)
    expect(result).toHaveLength(2)
    expect(result.find((p) => p.url === 'https://x.fr/?lang=en')?.markdown).toBe('C')
  })

  it('ne dédoublonne pas entre sites différents pour la même url', () => {
    const pages = [
      { ...page('https://x.fr/', 'A'), siteId: 's1' },
      { ...page('https://x.fr/', 'B'), siteId: 's2' },
    ]
    expect(dedupeFirecrawlPages(pages)).toHaveLength(2)
  })

  it('laisse une liste sans doublon intacte', () => {
    const pages = [page('https://x.fr/a', 'A'), page('https://x.fr/b', 'B')]
    expect(dedupeFirecrawlPages(pages)).toHaveLength(2)
  })

  it('gère une liste vide', () => {
    expect(dedupeFirecrawlPages([])).toEqual([])
  })
})

// ─── withRetry ────────────────────────────────────────────────────────────────

describe('withRetry', () => {
  it('retourne le résultat au premier essai si succès', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn, 3)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('réessaie 3 fois puis lance l erreur', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('timeout'))
    await expect(withRetry(fn, 3)).rejects.toThrow('timeout')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('réussit au 2e essai', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue('recovered')
    const result = await withRetry(fn, 3)
    expect(result).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("n'attend pas pour le dernier essai raté", async () => {
    const fn = vi.fn().mockRejectedValue(new Error('err'))
    const start = Date.now()
    await withRetry(fn, 1).catch(() => null)
    expect(Date.now() - start).toBeLessThan(200)
  })

  it('ne réessaie pas sur erreur 401', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('401 Unauthorized'))
    await expect(withRetry(fn, 3)).rejects.toThrow('401')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('ne réessaie pas sur erreur 403', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('403 Forbidden'))
    await expect(withRetry(fn, 3)).rejects.toThrow('403')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

// ─── firecrawlDocumentSchema ──────────────────────────────────────────────────

describe('firecrawlDocumentSchema', () => {
  it('accepte un document complet', () => {
    const doc = {
      markdown: '# Titre\nContenu',
      metadata: {
        title: 'Titre',
        description: 'Description',
        url: 'https://exemple.fr/page',
        statusCode: 200,
      },
    }
    expect(firecrawlDocumentSchema.safeParse(doc).success).toBe(true)
  })

  it('accepte un document sans markdown ni metadata', () => {
    expect(firecrawlDocumentSchema.safeParse({}).success).toBe(true)
  })

  it('accepte des champs metadata inconnus (passthrough)', () => {
    const doc = {
      markdown: 'contenu',
      metadata: {
        title: 'Page',
        ogImage: 'https://exemple.fr/img.png',
        customField: 'valeur',
      },
    }
    const result = firecrawlDocumentSchema.safeParse(doc)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.metadata?.['customField']).toBe('valeur')
    }
  })

  it('normalise statusCode en number', () => {
    const doc = { metadata: { statusCode: 404 } }
    const result = firecrawlDocumentSchema.safeParse(doc)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.metadata?.statusCode).toBe(404)
    }
  })
})
