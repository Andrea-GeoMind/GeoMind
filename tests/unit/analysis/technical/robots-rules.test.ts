import { describe, it, expect, vi, afterEach } from 'vitest'
import { checkRobotsTxtBlockAll } from '@/lib/analysis/technical/rules/robots-txt-block-all'
import { checkRobotsTxtBlockAiBots } from '@/lib/analysis/technical/rules/robots-txt-block-ai-bots'
import { parseRobots, blocksAllBots, blockedAiBots } from '@/lib/analysis/technical/rules/_robots-parser'

const SITE_URL = 'https://example.com'

// ─── parseRobots ──────────────────────────────────────────────────────────────

describe('parseRobots', () => {
  it('parses a simple allow-all robots.txt', () => {
    const records = parseRobots('User-agent: *\nDisallow:')
    expect(records).toHaveLength(1)
    expect(records[0].userAgents).toContain('*')
    expect(records[0].disallows).toContain('')
  })

  it('parses multiple blocks separated by blank lines', () => {
    const text = 'User-agent: Googlebot\nDisallow: /private\n\nUser-agent: *\nDisallow: /'
    const records = parseRobots(text)
    expect(records).toHaveLength(2)
  })

  it('ignores comment lines (#)', () => {
    const text = '# Allow all\nUser-agent: *\nDisallow:'
    const records = parseRobots(text)
    expect(records[0].userAgents).toContain('*')
  })
})

describe('blocksAllBots', () => {
  it('returns true for Disallow: / on User-agent: *', () => {
    expect(blocksAllBots('User-agent: *\nDisallow: /')).toBe(true)
  })

  it('returns false for Disallow: /private on User-agent: *', () => {
    expect(blocksAllBots('User-agent: *\nDisallow: /private')).toBe(false)
  })

  it('returns false when * agent has empty Disallow (allow all)', () => {
    expect(blocksAllBots('User-agent: *\nDisallow:')).toBe(false)
  })

  it('returns false when only specific bots are blocked', () => {
    expect(blocksAllBots('User-agent: GPTBot\nDisallow: /')).toBe(false)
  })
})

describe('blockedAiBots', () => {
  it('returns GPTBot when it is blocked', () => {
    const blocked = blockedAiBots('User-agent: GPTBot\nDisallow: /')
    expect(blocked).toContain('GPTBot')
  })

  it('returns ClaudeBot when it is blocked', () => {
    const blocked = blockedAiBots('User-agent: ClaudeBot\nDisallow: /')
    expect(blocked).toContain('ClaudeBot')
  })

  it('returns empty array when no AI bots are blocked', () => {
    const blocked = blockedAiBots('User-agent: *\nDisallow:')
    expect(blocked).toHaveLength(0)
  })

  it('returns all blocked AI bots', () => {
    const text = 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /'
    const blocked = blockedAiBots(text)
    expect(blocked).toContain('GPTBot')
    expect(blocked).toContain('ClaudeBot')
  })
})

// ─── checkRobotsTxtBlockAll ───────────────────────────────────────────────────

describe('checkRobotsTxtBlockAll', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns null when robots.txt does not block all bots', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'User-agent: *\nDisallow:',
    }))
    const result = await checkRobotsTxtBlockAll({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns an issue when robots.txt has Disallow: / for *', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'User-agent: *\nDisallow: /',
    }))
    const result = await checkRobotsTxtBlockAll({ pages: [], siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('robots_txt_block_all')
    expect(result!.category).toBe('accessibility')
    expect(result!.severity).toBe('major')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(3)
  })

  it('returns null when robots.txt returns 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const result = await checkRobotsTxtBlockAll({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns null on network error (graceful degradation)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await checkRobotsTxtBlockAll({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })
})

// ─── checkRobotsTxtBlockAiBots ────────────────────────────────────────────────

describe('checkRobotsTxtBlockAiBots', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns null when no AI bots are blocked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'User-agent: *\nDisallow:',
    }))
    const result = await checkRobotsTxtBlockAiBots({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })

  it('returns an issue listing the blocked AI bots', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /',
    }))
    const result = await checkRobotsTxtBlockAiBots({ pages: [], siteUrl: SITE_URL })
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('robots_txt_block_ai_bots')
    expect(result!.severity).toBe('major')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(3)
    expect(result!.description).toContain('GPTBot')
    expect(result!.description).toContain('ClaudeBot')
  })

  it('returns null on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await checkRobotsTxtBlockAiBots({ pages: [], siteUrl: SITE_URL })
    expect(result).toBeNull()
  })
})
