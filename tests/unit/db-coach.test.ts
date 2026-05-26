import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/client', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
  },
}))

vi.mock('@/lib/db/schema', () => ({
  coachMessages: {
    siteId: 'siteId',
    analysisId: 'analysisId',
    userId: 'userId',
    role: 'role',
    createdAt: 'createdAt',
  },
}))

import { db } from '@/lib/db/client'
import {
  insertCoachMessage,
  getCoachMessages,
  countCoachMessagesThisMonth,
} from '@/lib/db/queries/coach'

const mockDb = vi.mocked(db)

beforeEach(() => vi.clearAllMocks())

describe('insertCoachMessage', () => {
  it('inserts and returns the row', async () => {
    const row = { id: 'msg-1', role: 'user', content: 'hello' }
    const returningMock = vi.fn().mockResolvedValue([row])
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock })
    mockDb.insert = vi.fn().mockReturnValue({ values: valuesMock })

    const result = await insertCoachMessage({
      siteId: 'site-1',
      analysisId: 'analysis-1',
      userId: 'user-1',
      role: 'user',
      content: 'hello',
    })
    expect(result).toEqual(row)
    expect(mockDb.insert).toHaveBeenCalledOnce()
  })
})

describe('getCoachMessages', () => {
  it('returns messages ordered by createdAt', async () => {
    const messages = [
      { id: 'msg-1', role: 'user', content: 'hello' },
      { id: 'msg-2', role: 'assistant', content: 'world' },
    ]
    const limitMock = vi.fn().mockResolvedValue(messages)
    const orderByMock = vi.fn().mockReturnValue({ limit: limitMock })
    const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock })
    const fromMock = vi.fn().mockReturnValue({ where: whereMock })
    mockDb.select = vi.fn().mockReturnValue({ from: fromMock })

    const result = await getCoachMessages('site-1', 'analysis-1')
    expect(result).toEqual(messages)
    expect(mockDb.select).toHaveBeenCalledOnce()
  })
})

describe('countCoachMessagesThisMonth', () => {
  it('returns the count of user messages this month', async () => {
    const whereMock = vi.fn().mockResolvedValue([{ value: 5 }])
    const fromMock = vi.fn().mockReturnValue({ where: whereMock })
    mockDb.select = vi.fn().mockReturnValue({ from: fromMock })

    const result = await countCoachMessagesThisMonth('user-1')
    expect(result).toBe(5)
  })

  it('returns 0 when no messages found', async () => {
    const whereMock = vi.fn().mockResolvedValue([])
    const fromMock = vi.fn().mockReturnValue({ where: whereMock })
    mockDb.select = vi.fn().mockReturnValue({ from: fromMock })

    const result = await countCoachMessagesThisMonth('user-1')
    expect(result).toBe(0)
  })
})
