import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/queries/subscriptions', () => ({
  getSubscriptionByUserId: vi.fn(),
}))

vi.mock('@/lib/db/queries/analyses', () => ({
  countAnalysesThisMonth: vi.fn(),
  countAllAnalyses: vi.fn(),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(),
  },
}))

import { getSubscriptionByUserId } from '@/lib/db/queries/subscriptions'
import { countAnalysesThisMonth, countAllAnalyses } from '@/lib/db/queries/analyses'
import { db } from '@/lib/db/client'
import {
  canAddSite,
  canRunFullAnalysis,
  canRunTabAnalysis,
  getRemainingAnalysesThisMonth,
  getSitesUsage,
  getUsageStats,
} from '@/lib/quotas'

const mockSub = vi.mocked(getSubscriptionByUserId)
const mockAnalysesThisMonth = vi.mocked(countAnalysesThisMonth)
const mockAllAnalyses = vi.mocked(countAllAnalyses)
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

// ─── canRunFullAnalysis ───────────────────────────────────────────────────────

describe('canRunFullAnalysis', () => {
  it('autorise si sous la limite à vie (free : 1)', async () => {
    mockSub.mockResolvedValue({ plan: 'free' } as never)
    mockAllAnalyses.mockResolvedValue(0)
    expect(await canRunFullAnalysis('user-1')).toBe(true)
  })

  it('refuse si à la limite à vie (free : 1)', async () => {
    mockSub.mockResolvedValue({ plan: 'free' } as never)
    mockAllAnalyses.mockResolvedValue(1)
    expect(await canRunFullAnalysis('user-1')).toBe(false)
  })

  it('autorise plan business sous la limite (30)', async () => {
    mockSub.mockResolvedValue({ plan: 'business' } as never)
    mockAnalysesThisMonth.mockResolvedValue(29)
    expect(await canRunFullAnalysis('user-1')).toBe(true)
  })

  it('refuse plan business à la limite (30)', async () => {
    mockSub.mockResolvedValue({ plan: 'business' } as never)
    mockAnalysesThisMonth.mockResolvedValue(30)
    expect(await canRunFullAnalysis('user-1')).toBe(false)
  })
})

// ─── canRunTabAnalysis ────────────────────────────────────────────────────────

describe('canRunTabAnalysis', () => {
  it('même comportement que canRunFullAnalysis — autorise si sous la limite', async () => {
    mockSub.mockResolvedValue({ plan: 'pro' } as never)
    mockAnalysesThisMonth.mockResolvedValue(3)
    expect(await canRunTabAnalysis('user-1')).toBe(true)
  })

  it('même comportement que canRunFullAnalysis — refuse à la limite', async () => {
    mockSub.mockResolvedValue({ plan: 'pro' } as never)
    mockAnalysesThisMonth.mockResolvedValue(4)
    expect(await canRunTabAnalysis('user-1')).toBe(false)
  })
})

// ─── getRemainingAnalysesThisMonth ────────────────────────────────────────────

describe('getRemainingAnalysesThisMonth', () => {
  it('retourne used/limit/remaining corrects pour free avec 0 analyse', async () => {
    mockSub.mockResolvedValue({ plan: 'free' } as never)
    mockAllAnalyses.mockResolvedValue(0)
    const result = await getRemainingAnalysesThisMonth('user-1')
    expect(result).toEqual({ used: 0, limit: 1, remaining: 1 })
  })

  it('remaining vaut 0 quand la limite est atteinte (free)', async () => {
    mockSub.mockResolvedValue({ plan: 'free' } as never)
    mockAllAnalyses.mockResolvedValue(1)
    const result = await getRemainingAnalysesThisMonth('user-1')
    expect(result).toEqual({ used: 1, limit: 1, remaining: 0 })
  })

  it('remaining ne peut pas être négatif', async () => {
    mockSub.mockResolvedValue({ plan: 'free' } as never)
    mockAllAnalyses.mockResolvedValue(10)
    const { remaining } = await getRemainingAnalysesThisMonth('user-1')
    expect(remaining).toBe(0)
  })

  it('calcule correctement pour plan pro (4 analyses)', async () => {
    mockSub.mockResolvedValue({ plan: 'pro' } as never)
    mockAnalysesThisMonth.mockResolvedValue(2)
    const result = await getRemainingAnalysesThisMonth('user-1')
    expect(result).toEqual({ used: 2, limit: 4, remaining: 2 })
  })
})

// ─── getSitesUsage ────────────────────────────────────────────────────────────

describe('getSitesUsage', () => {
  it('retourne used/limit/remaining corrects', async () => {
    mockSub.mockResolvedValue({ plan: 'pro' } as never)
    mockSiteCount(2)
    const result = await getSitesUsage('user-1')
    expect(result).toEqual({ used: 2, limit: 3, remaining: 1 })
  })

  it('remaining vaut 0 à la limite', async () => {
    mockSub.mockResolvedValue({ plan: 'free' } as never)
    mockSiteCount(1)
    const result = await getSitesUsage('user-1')
    expect(result).toEqual({ used: 1, limit: 1, remaining: 0 })
  })
})

// ─── getUsageStats ────────────────────────────────────────────────────────────

describe('getUsageStats', () => {
  it('retourne plan + sites + analyses agrégés', async () => {
    mockSub.mockResolvedValue({ plan: 'pro' } as never)
    mockAnalysesThisMonth.mockResolvedValue(2)
    mockSiteCount(1)
    const stats = await getUsageStats('user-1')
    expect(stats.plan).toBe('pro')
    expect(stats.sites).toEqual({ used: 1, limit: 3, remaining: 2 })
    expect(stats.analyses).toEqual({ used: 2, limit: 4, remaining: 2 })
  })

  it('utilise free par défaut si pas de subscription', async () => {
    mockSub.mockResolvedValue(null)
    mockAllAnalyses.mockResolvedValue(0)
    mockSiteCount(0)
    const stats = await getUsageStats('user-1')
    expect(stats.plan).toBe('free')
    expect(stats.sites.limit).toBe(1)
    expect(stats.analyses.limit).toBe(1)
  })
})
