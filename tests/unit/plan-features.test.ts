import { describe, it, expect } from 'vitest'
import { PLAN_FEATURES, PLAN_PRICES, computeFrozenSiteIds } from '@/lib/plans'

// ─── PLAN_FEATURES (§17.2) ────────────────────────────────────────────────────

describe('PLAN_FEATURES', () => {
  it('free : pas de page analysis, pas de mémoire coach, 3 publishers', () => {
    const f = PLAN_FEATURES.free
    expect(f.pageAnalysisLimit).toBe(0)
    expect(f.coachMemory).toBe(false)
    expect(f.fullRecommendations).toBe(false)
    expect(f.publishersFull).toBe(false)
    expect(f.pdfExport).toBe('none')
  })

  it('solo : 5 pages, mémoire coach, publishers complets, pas de reco complète', () => {
    const f = PLAN_FEATURES.solo
    expect(f.pageAnalysisLimit).toBe(5)
    expect(f.coachMemory).toBe(true)
    expect(f.fullRecommendations).toBe(false)
    expect(f.publishersFull).toBe(true)
  })

  it('pro : 10 pages, reco complètes, export PDF standard', () => {
    const f = PLAN_FEATURES.pro
    expect(f.pageAnalysisLimit).toBe(10)
    expect(f.fullRecommendations).toBe(true)
    expect(f.pdfExport).toBe('standard')
  })

  it('business : white-label + historique illimité', () => {
    const f = PLAN_FEATURES.business
    expect(f.pdfExport).toBe('white_label')
    expect(f.historyDays).toBe(Infinity)
  })

  it('admin : tout débloqué', () => {
    const f = PLAN_FEATURES.admin
    expect(f.fullRecommendations).toBe(true)
    expect(f.coachMemory).toBe(true)
    expect(f.publishersFull).toBe(true)
  })

  it('les fonctionnalités sont monotones croissantes free → solo → pro', () => {
    expect(PLAN_FEATURES.solo.pageAnalysisLimit).toBeGreaterThan(
      PLAN_FEATURES.free.pageAnalysisLimit
    )
    expect(PLAN_FEATURES.pro.pageAnalysisLimit).toBeGreaterThanOrEqual(
      PLAN_FEATURES.solo.pageAnalysisLimit
    )
    expect(PLAN_FEATURES.solo.historyDays).toBeGreaterThan(PLAN_FEATURES.free.historyDays)
  })
})

// ─── PLAN_PRICES (§17.2) ──────────────────────────────────────────────────────

describe('PLAN_PRICES', () => {
  it('grille mensuelle : Solo 19 / Pro 59 / Business 149', () => {
    expect(PLAN_PRICES.solo.monthly).toBe(19)
    expect(PLAN_PRICES.pro.monthly).toBe(59)
    expect(PLAN_PRICES.business.monthly).toBe(149)
  })

  it("l'annuel est ~20 % moins cher que le mensuel", () => {
    for (const plan of ['solo', 'pro', 'business'] as const) {
      const { monthly, annual } = PLAN_PRICES[plan]
      const discount = 1 - annual / monthly
      expect(discount).toBeGreaterThanOrEqual(0.18)
      expect(discount).toBeLessThanOrEqual(0.22)
    }
  })
})

// ─── computeFrozenSiteIds (§17.5) ─────────────────────────────────────────────
// Sites triés du plus récent au plus ancien — les plus récents restent actifs.

describe('computeFrozenSiteIds', () => {
  it('aucun site gelé quand sous la limite', () => {
    expect(computeFrozenSiteIds(['a', 'b'], 5)).toEqual([])
  })

  it('gèle les sites les plus anciens au-delà de la limite', () => {
    expect(computeFrozenSiteIds(['recent', 'milieu', 'ancien'], 2)).toEqual(['ancien'])
  })

  it('gèle tous les excédentaires après un gros downgrade (pro 5 → solo 2)', () => {
    expect(computeFrozenSiteIds(['s1', 's2', 's3', 's4', 's5'], 2)).toEqual(['s3', 's4', 's5'])
  })

  it('limite infinie (admin) : rien de gelé', () => {
    expect(computeFrozenSiteIds(['a', 'b', 'c'], Infinity)).toEqual([])
  })

  it('limite exacte : rien de gelé', () => {
    expect(computeFrozenSiteIds(['a', 'b'], 2)).toEqual([])
  })
})
