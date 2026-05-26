import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(),
  },
}))

vi.mock('@/lib/db/queries/subscriptions', () => ({
  getSubscriptionByUserId: vi.fn(),
}))

vi.mock('@/lib/db/queries/analyses', () => ({
  countAnalysesThisMonth: vi.fn(),
  countAllAnalyses: vi.fn(),
}))

vi.mock('@/lib/db/queries/coach', () => ({
  countCoachMessagesThisMonth: vi.fn(),
}))

import { getSubscriptionByUserId } from '@/lib/db/queries/subscriptions'
import { countCoachMessagesThisMonth } from '@/lib/db/queries/coach'
import { canSendCoachMessage, getRemainingCoachMessages } from '@/lib/quotas'

const mockSub = vi.mocked(getSubscriptionByUserId)
const mockCount = vi.mocked(countCoachMessagesThisMonth)

beforeEach(() => vi.clearAllMocks())

describe('canSendCoachMessage', () => {
  it('refuse plan free (limite 0)', async () => {
    mockSub.mockResolvedValue({ plan: 'free' } as never)
    expect(await canSendCoachMessage('user-1')).toBe(false)
  })

  it('autorise plan pro sous la limite (20 messages)', async () => {
    mockSub.mockResolvedValue({ plan: 'pro' } as never)
    mockCount.mockResolvedValue(19)
    expect(await canSendCoachMessage('user-1')).toBe(true)
  })

  it('refuse plan pro à la limite exacte (20)', async () => {
    mockSub.mockResolvedValue({ plan: 'pro' } as never)
    mockCount.mockResolvedValue(20)
    expect(await canSendCoachMessage('user-1')).toBe(false)
  })

  it('autorise plan business sans limite', async () => {
    mockSub.mockResolvedValue({ plan: 'business' } as never)
    mockCount.mockResolvedValue(999)
    expect(await canSendCoachMessage('user-1')).toBe(true)
  })

  it('autorise plan admin sans limite', async () => {
    mockSub.mockResolvedValue({ plan: 'admin' } as never)
    expect(await canSendCoachMessage('user-1')).toBe(true)
  })

  it('refuse si pas de subscription (considéré free)', async () => {
    mockSub.mockResolvedValue(null)
    expect(await canSendCoachMessage('user-1')).toBe(false)
  })
})

describe('getRemainingCoachMessages', () => {
  it('retourne 0/0/0 pour plan free', async () => {
    mockSub.mockResolvedValue({ plan: 'free' } as never)
    const result = await getRemainingCoachMessages('user-1')
    expect(result).toEqual({ used: 0, limit: 0, remaining: 0 })
  })

  it('calcule correctement remaining pour plan pro', async () => {
    mockSub.mockResolvedValue({ plan: 'pro' } as never)
    mockCount.mockResolvedValue(8)
    const result = await getRemainingCoachMessages('user-1')
    expect(result).toEqual({ used: 8, limit: 20, remaining: 12 })
  })

  it('retourne Infinity pour plan business', async () => {
    mockSub.mockResolvedValue({ plan: 'business' } as never)
    const result = await getRemainingCoachMessages('user-1')
    expect(result.remaining).toBe(Infinity)
  })
})
