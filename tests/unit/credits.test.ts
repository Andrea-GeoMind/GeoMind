import { describe, it, expect } from 'vitest'
import {
  CREDIT_COSTS,
  WELCOME_BONUS_CREDITS,
  needsMonthlyReset,
  splitConsumption,
  formatCreditsAsUsage,
  formatCreditsAmount,
} from '@/lib/credits-shared'
import { CREDIT_PACKS, PLAN_LIMITS } from '@/lib/plans'

// ─── Constantes (§17) ─────────────────────────────────────────────────────────

describe('CREDIT_COSTS', () => {
  it('analyse complète = 400 crédits', () => {
    expect(CREDIT_COSTS.fullAnalysis).toBe(400)
  })

  it('message coach Haiku = 10 crédits', () => {
    expect(CREDIT_COSTS.coachMessage).toBe(10)
  })

  it('bonus de bienvenue = 1000 crédits — couvre au moins l’analyse offerte du plan Gratuit', () => {
    expect(WELCOME_BONUS_CREDITS).toBe(1_000)
    expect(WELCOME_BONUS_CREDITS).toBeGreaterThanOrEqual(CREDIT_COSTS.fullAnalysis)
  })
})

describe('PLAN_LIMITS — crédits mensuels', () => {
  it('free = 0 (1 analyse offerte via le bonus de bienvenue, pas de renouvellement)', () => {
    expect(PLAN_LIMITS.free.creditsPerMonth).toBe(0)
  })

  it('les allocations croissent avec le plan', () => {
    expect(PLAN_LIMITS.solo.creditsPerMonth).toBeGreaterThan(PLAN_LIMITS.free.creditsPerMonth)
    expect(PLAN_LIMITS.pro.creditsPerMonth).toBeGreaterThan(PLAN_LIMITS.solo.creditsPerMonth)
    expect(PLAN_LIMITS.business.creditsPerMonth).toBeGreaterThan(PLAN_LIMITS.pro.creditsPerMonth)
  })

  it('admin = illimité', () => {
    expect(PLAN_LIMITS.admin.creditsPerMonth).toBe(Infinity)
  })
})

describe('CREDIT_PACKS', () => {
  it('expose les 3 packs Starter/Growth/Power aux prix §17.3', () => {
    expect(CREDIT_PACKS.starter).toMatchObject({ credits: 500, priceEur: 5 })
    expect(CREDIT_PACKS.growth).toMatchObject({ credits: 2_000, priceEur: 15 })
    expect(CREDIT_PACKS.power).toMatchObject({ credits: 8_000, priceEur: 49 })
  })

  it('le prix au crédit décroît avec la taille du pack (incitation au gros pack)', () => {
    const perCredit = (p: { credits: number; priceEur: number }) => p.priceEur / p.credits
    expect(perCredit(CREDIT_PACKS.growth)).toBeLessThan(perCredit(CREDIT_PACKS.starter))
    expect(perCredit(CREDIT_PACKS.power)).toBeLessThan(perCredit(CREDIT_PACKS.growth))
  })
})

// ─── needsMonthlyReset ────────────────────────────────────────────────────────

describe('needsMonthlyReset', () => {
  it('free : jamais de reset (pas d’allocation mensuelle, bonus de bienvenue uniquement)', () => {
    const last = new Date('2025-12-15T10:00:00Z')
    const now = new Date('2026-06-28T10:00:00Z')
    expect(needsMonthlyReset(last, 'free', now)).toBe(false)
  })

  it('pro : pas de reset lazy avant 32 jours (le webhook Stripe gère)', () => {
    const last = new Date('2026-06-01T00:00:00Z')
    const now = new Date('2026-06-30T00:00:00Z')
    expect(needsMonthlyReset(last, 'pro', now)).toBe(false)
  })

  it('pro : filet de sécurité à 32 jours si le webhook a été manqué', () => {
    const last = new Date('2026-05-01T00:00:00Z')
    const now = new Date('2026-06-05T00:00:00Z')
    expect(needsMonthlyReset(last, 'pro', now)).toBe(true)
  })
})

// ─── splitConsumption ─────────────────────────────────────────────────────────

describe('splitConsumption', () => {
  it('consomme les crédits mensuels en premier', () => {
    expect(splitConsumption(500, 1_000, 400)).toEqual({ fromMonthly: 400, fromPurchased: 0 })
  })

  it('bascule sur les crédits achetés quand les mensuels sont insuffisants', () => {
    expect(splitConsumption(100, 1_000, 400)).toEqual({ fromMonthly: 100, fromPurchased: 300 })
  })

  it('retourne null si le solde total est insuffisant — jamais de négatif', () => {
    expect(splitConsumption(100, 200, 400)).toBeNull()
  })

  it('consomme exactement le solde total restant', () => {
    expect(splitConsumption(100, 300, 400)).toEqual({ fromMonthly: 100, fromPurchased: 300 })
  })

  it('montant nul = aucune consommation', () => {
    expect(splitConsumption(0, 0, 0)).toEqual({ fromMonthly: 0, fromPurchased: 0 })
  })
})

// ─── formatCreditsAsUsage ─────────────────────────────────────────────────────

describe('formatCreditsAsUsage', () => {
  it('Infinity → illimité', () => {
    expect(formatCreditsAsUsage(Infinity)).toBe('illimité')
  })

  it('sous le coût d’un message coach → solde épuisé', () => {
    expect(formatCreditsAsUsage(5)).toBe('solde épuisé')
  })

  it('sous le coût d’une analyse → questions uniquement', () => {
    expect(formatCreditsAsUsage(100)).toBe('≈ 10 questions à GEO')
  })

  it('singulier pour une seule analyse possible', () => {
    expect(formatCreditsAsUsage(500)).toBe('≈ 1 analyse complète ou 50 questions à GEO')
  })

  it('pluriel au-delà', () => {
    expect(formatCreditsAsUsage(5_000)).toBe('≈ 12 analyses complètes ou 500 questions à GEO')
  })
})

describe('formatCreditsAmount', () => {
  it('Infinity → ∞', () => {
    expect(formatCreditsAmount(Infinity)).toBe('∞')
  })

  it('format français avec séparateur de milliers', () => {
    // Intl fr-FR utilise une espace insécable (étroite) comme séparateur
    expect(formatCreditsAmount(5_000)).toBe(new Intl.NumberFormat('fr-FR').format(5_000))
    expect(formatCreditsAmount(42)).toBe('42')
  })
})
