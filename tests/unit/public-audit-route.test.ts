import { describe, it, expect, vi, beforeEach } from 'vitest'

// L'audit lui-même n'est pas rejoué : on teste la logique de la route
// (cache, rate limit, jeton) et non les fetches réseau.
vi.mock('@/lib/analysis/express-audit', async () => {
  const real = await vi.importActual<typeof import('@/lib/analysis/express-audit')>(
    '@/lib/analysis/express-audit'
  )
  return { ...real, runExpressAudit: vi.fn() }
})

vi.mock('@/lib/db/client', () => ({
  db: { select: vi.fn(), insert: vi.fn() },
}))

import { db } from '@/lib/db/client'
import { runExpressAudit } from '@/lib/analysis/express-audit'
import { POST } from '@/app/api/public-audit/route'

const mockDb = vi.mocked(db)
const mockRun = vi.mocked(runExpressAudit)

/** File d'attente des résultats de `db.select()` : cache d'abord, compteurs ensuite. */
function queueSelects(...results: unknown[][]) {
  let i = 0
  mockDb.select.mockImplementation(
    () =>
      ({
        from: () => ({
          where: (..._a: unknown[]) => {
            const current = results[i++] ?? []
            const chain = {
              orderBy: () => ({ limit: () => Promise.resolve(current) }),
              then: (res: (v: unknown) => unknown) => Promise.resolve(current).then(res),
            }
            return chain
          },
        }),
      }) as never
  )
}

/** Capture les lignes insérées et renvoie un claim_token unique à chaque appel. */
function captureInserts(): { rows: Record<string, unknown>[] } {
  const rows: Record<string, unknown>[] = []
  let n = 0
  mockDb.insert.mockImplementation(
    () =>
      ({
        values: (v: Record<string, unknown>) => {
          rows.push(v)
          return {
            returning: () => Promise.resolve([{ claimToken: `token-${++n}` }]),
          }
        },
      }) as never
  )
  return { rows }
}

function request(url: string) {
  return new Request('https://geomind.fr/api/public-audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
    body: JSON.stringify({ url }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/public-audit — jeton de rattachement', () => {
  it('donne un jeton distinct au visiteur servi par le cache', async () => {
    // Cache présent pour le domaine, compteurs à zéro
    queueSelects([{ score: 91, checks: [], createdAt: new Date() }], [{ computed: 0, rows: 0 }])
    const { rows } = captureInserts()

    const res = await POST(request('exemple.fr'))
    const json = await res.json()

    expect(json.cached).toBe(true)
    expect(json.score).toBe(91)
    // Le jeton vient d'une ligne fraîchement insérée, pas de la ligne cachée
    expect(json.claimToken).toBe('token-1')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ domain: 'exemple.fr', fromCache: true })
    // Aucun audit recalculé : le cache a bien évité le travail réseau
    expect(mockRun).not.toHaveBeenCalled()
  })

  it('insère une ligne non-cache et renvoie son jeton quand il faut calculer', async () => {
    queueSelects([], [{ computed: 0, rows: 0 }])
    const { rows } = captureInserts()
    mockRun.mockResolvedValue({
      domain: 'exemple.fr',
      score: 64,
      checks: [],
      responseTimeMs: 120,
    })

    const res = await POST(request('exemple.fr'))
    const json = await res.json()

    expect(json.cached).toBe(false)
    expect(json.claimToken).toBe('token-1')
    expect(rows[0]).toMatchObject({ fromCache: false })
  })
})

describe('POST /api/public-audit — rate limit', () => {
  it('refuse au-delà du plafond d’audits réellement calculés', async () => {
    queueSelects([], [{ computed: 5, rows: 5 }])
    captureInserts()

    const res = await POST(request('exemple.fr'))
    expect(res.status).toBe(429)
    expect(mockRun).not.toHaveBeenCalled()
  })

  it('sert encore le cache tant que le plafond de lignes n’est pas atteint', async () => {
    // 5 audits calculés (plafond atteint) mais le cache reste servi
    queueSelects([{ score: 88, checks: [], createdAt: new Date() }], [{ computed: 5, rows: 5 }])
    captureInserts()

    const res = await POST(request('exemple.fr'))
    expect(res.status).toBe(200)
    expect((await res.json()).cached).toBe(true)
  })

  it('refuse tout au-delà du plafond de lignes, cache compris', async () => {
    queueSelects([{ score: 88, checks: [], createdAt: new Date() }], [{ computed: 0, rows: 30 }])
    captureInserts()

    const res = await POST(request('exemple.fr'))
    expect(res.status).toBe(429)
  })
})
