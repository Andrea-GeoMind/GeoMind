import { describe, it, expect } from 'vitest'
import {
  detectAiSource,
  isValidActionKind,
  summarizePixelEvents,
  type PixelEventLite,
} from '@/lib/analysis/pixel'

describe('detectAiSource', () => {
  it('reconnaît les moteurs IA depuis le referrer', () => {
    expect(detectAiSource('https://chatgpt.com/c/abc')).toBe('chatgpt')
    expect(detectAiSource('https://www.perplexity.ai/search')).toBe('perplexity')
    expect(detectAiSource('https://gemini.google.com/app')).toBe('gemini')
    expect(detectAiSource('https://copilot.microsoft.com/')).toBe('copilot')
    expect(detectAiSource('https://claude.ai/chat')).toBe('claude')
    expect(detectAiSource('https://chat.openai.com/')).toBe('chatgpt')
  })

  it('ne classe PAS le trafic non-IA comme IA', () => {
    expect(detectAiSource('https://www.google.com/search?q=x')).toBeNull()
    expect(detectAiSource('https://facebook.com')).toBeNull()
    expect(detectAiSource('')).toBeNull()
    expect(detectAiSource(null)).toBeNull()
    expect(detectAiSource('pas une url')).toBeNull()
  })
})

describe('isValidActionKind', () => {
  it('valide les types d’action connus', () => {
    expect(isValidActionKind('tel')).toBe(true)
    expect(isValidActionKind('form')).toBe(true)
    expect(isValidActionKind('booking')).toBe(true)
    expect(isValidActionKind('xxx')).toBe(false)
    expect(isValidActionKind(null)).toBe(false)
  })
})

describe('summarizePixelEvents', () => {
  const ev = (
    type: 'pageview' | 'action',
    aiSource: string,
    visitorHash: string,
    actionKind: string | null = null
  ): PixelEventLite => ({ type, aiSource, visitorHash, actionKind, createdAt: new Date() })

  it('compte les visiteurs uniques, pages vues et actions', () => {
    const s = summarizePixelEvents([
      ev('pageview', 'chatgpt', 'v1'),
      ev('pageview', 'chatgpt', 'v1'), // même visiteur → 1 unique, 2 pages
      ev('pageview', 'perplexity', 'v2'),
      ev('action', 'chatgpt', 'v1', 'tel'),
      ev('action', 'perplexity', 'v2', 'form'),
    ])
    expect(s.aiVisitors).toBe(2)
    expect(s.aiPageviews).toBe(3)
    expect(s.aiActions).toBe(2)
  })

  it('répartit par source, triée par visiteurs', () => {
    const s = summarizePixelEvents([
      ev('pageview', 'chatgpt', 'a'),
      ev('pageview', 'chatgpt', 'b'),
      ev('pageview', 'perplexity', 'c'),
    ])
    expect(s.bySource[0].source).toBe('chatgpt')
    expect(s.bySource[0].visitors).toBe(2)
    expect(s.bySource[1].source).toBe('perplexity')
  })

  it('répartit les actions par type', () => {
    const s = summarizePixelEvents([
      ev('action', 'chatgpt', 'a', 'tel'),
      ev('action', 'chatgpt', 'b', 'tel'),
      ev('action', 'chatgpt', 'c', 'form'),
    ])
    expect(s.byAction[0]).toEqual({ kind: 'tel', count: 2 })
    expect(s.byAction[1]).toEqual({ kind: 'form', count: 1 })
  })

  it('classe une source inconnue en other', () => {
    const s = summarizePixelEvents([ev('pageview', 'inconnue', 'a')])
    expect(s.bySource[0].source).toBe('other')
  })
})
