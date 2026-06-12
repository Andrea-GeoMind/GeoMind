import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/queries/subscriptions', () => ({
  getSubscriptionByUserId: vi.fn(),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(),
  },
}))

// Mock de la partie serveur des crédits — les helpers purs restent réels
vi.mock('@/lib/credits', async () => {
  const shared = await import('@/lib/credits-shared')
  return {
    ...shared,
    getUserCredits: vi.fn(),
    hasEnoughCredits: vi.fn(),
  }
})

import { getSubscriptionByUserId } from '@/lib/db/queries/subscriptions'
import { db } from '@/lib/db/client'
import { getUserCredits, hasEnoughCredits, CREDIT_COSTS } from '@/lib/credits'
import {
  canAddSite,
  canRunFullAnalysis,
  canRunTabAnalysis,
  canSendCoachMessage,
  getSitesUsage,
  getUsageStats,
} from '@/lib/quotas'

const mockSub = vi.mocked(getSubscriptionByUserId)
const mockGetUserCredits = vi.mocked(getUserCredits)
const mockHasEnough = vi.mocked(hasEnoughCredits)
const mockDb = vi.mocked(db)

function mockSiteCount(n: number) {
  const fromMock = vi.fn().mockReturnValue(
    Promise.resolve([{ value: n }])
  )
  const whereMock = vi.fn().mockReturnValue(fromMock())
  const selectMock = vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: whereMock }) })
  mockDb.select = selectMock
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── canAddSite ───────────────────────────────────────────────────────────────

describe('canAddSite', () => {
  it('autorise si sous la limite (free : 1 site)', async () => {
    mockSub.mockResolvedValue({ plan: 'free' } as never)
    mockSiteCount(0)
    expect(await canAddSite('user-1')).toBe(true)
  })

  it('refuse si à la limite (free : 1 site)', async () => {
    mockSub.mockResolvedValue({ plan: 'free' } as never)
    mockSiteCount(1)
    expect(await canAddSite('user-1')).toBe(false)
  })

  it('autorise plan pro sous la limite (3 sites)', async () => {
    mockSub.mockResolvedValue({ plan: 'pro' } as never)
    mockSiteCount(2)
    expect(await canAddSite('user-1')).toBe(true)
  })

  it('refuse plan pro à la limite (3 sites)', async () => {
    mockSub.mockResolvedValue({ plan: 'pro' } as never)
    mockSiteCount(3)
    expect(await canAddSite('user-1')).toBe(false)
  })

  it('traite un user sans abonnement comme free', async () => {
    mockSub.mockResolvedValue(null)
    mockSiteCount(0)
    expect(await canAddSite('user-1')).toBe(true)
  })
})

// ─── canRunFullAnalysis / canRunTabAnalysis / canSendCoachMessage ─────────────
// Depuis TKT-CREDITS, ces checks délèguent au solde de crédits.

describe('canRunFullAnalysis', () => {
  it('délègue à hasEnoughCredits avec le coût analyse complète', async () => {
    mockHasEnough.mockResolvedValue(true)
    expect(await canRunFullAnalysis('user-1')).toBe(true)
    expect(mockHasEnough).toHaveBeenCalledWith('user-1', CREDIT_COSTS.fullAnalysis)
  })

  it('refuse si le solde est insuffisant', async () => {
    mockHasEnough.mockResolvedValue(false)
    expect(await canRunFullAnalysis('user-1')).toBe(false)
  })
})

describe('canRunTabAnalysis', () => {
  it('délègue à hasEnoughCredits avec le coût autorité seule', async () => {
    mockHasEnough.mockResolvedValue(true)
    expect(await canRunTabAnalysis('user-1')).toBe(true)
    expect(mockHasEnough).toHaveBeenCalledWith('user-1', CREDIT_COSTS.authorityOnly)
  })
})

describe('canSendCoachMessage', () => {
  it('délègue à hasEnoughCredits avec le coût message coach', async () => {
    mockHasEnough.mockResolvedValue(true)
    expect(await canSendCoachMessage('user-1')).toBe(true)
    expect(mockHasEnough).toHaveBeenCalledWith('user-1', CREDIT_COSTS.coachMessage)
  })

  it('refuse si le solde est insuffisant (free à 0 crédit)', async () => {
    mockHasEnough.mockResolvedValue(false)
    expect(await canSendCoachMessage('user-1')).toBe(false)
  })
})

// ─── getSitesUsage ────────────────────────────────────────────────────────────

describe('getSitesUsage', () => {
  it('retourne used/limit/remaining pour un plan free', async () => {
    mockSub.mockResolvedValue({ plan: 'free' } as never)
    mockSiteCount(1)
    expect(await getSitesUsage('user-1')).toEqual({ used: 1, limit: 1, remaining: 0 })
  })

  it('retourne remaining correct pour un plan business', async () => {
    mockSub.mockResolvedValue({ plan: 'business' } as never)
    mockSiteCount(4)
    expect(await getSitesUsage('user-1')).toEqual({ used: 4, limit: 10, remaining: 6 })
  })
})

// ─── getUsageStats ────────────────────────────────────────────────────────────

describe('getUsageStats', () => {
  it('agrège plan, sites, crédits et allocation mensuelle', async () => {
    mockSub.mockResolvedValue({ plan: 'pro' } as never)
    mockSiteCount(2)
    mockGetUserCredits.mockResolvedValue({ monthly: 15_000, purchased: 500, total: 15_500 })

    const stats = await getUsageStats('user-1')

    expect(stats.plan).toBe('pro')
    expect(stats.sites).toEqual({ used: 2, limit: 3, remaining: 1 })
    expect(stats.credits).toEqual({ monthly: 15_000, purchased: 500, total: 15_500 })
    expect(stats.creditsPerMonth).toBe(20_000)
  })

  it('expose une allocation infinie pour le plan admin', async () => {
    mockSub.mockResolvedValue({ plan: 'admin' } as never)
    mockSiteCount(0)
    mockGetUserCredits.mockResolvedValue({
      monthly: Infinity,
      purchased: Infinity,
      total: Infinity,
    })

    const stats = await getUsageStats('user-1')
    expect(stats.creditsPerMonth).toBe(Infinity)
    expect(stats.credits.total).toBe(Infinity)
  })
})
