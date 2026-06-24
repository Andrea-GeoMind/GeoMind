import { describe, it, expect, vi, afterEach } from 'vitest'
import { z } from 'zod'

vi.mock('@/lib/env', () => ({
  env: { OPENROUTER_API_KEY: 'sk-or-test' },
}))

import { callStructured } from '@/lib/ai/structured'

const Schema = z.object({ ok: z.boolean() })

/** Réponse OpenRouter 200 avec un contenu LLM brut donné. */
function llmResponse(content: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content } }],
      usage: { prompt_tokens: 1, completion_tokens: 1 },
    }),
    text: async () => content,
  }
}

function errResponse(status: number, body = 'error') {
  return { ok: false, status, json: async () => ({}), text: async () => body }
}

const VALID = llmResponse(JSON.stringify({ ok: true }))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('callStructured — robustesse réseau', () => {
  it('réessaie après un timeout (AbortError) puis réussit', async () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' })
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(abort)
      .mockResolvedValueOnce(VALID)
    vi.stubGlobal('fetch', fetchMock)

    const res = await callStructured({ systemPrompt: 's', userContent: 'u', schema: Schema })
    expect(res.data.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('réessaie après une erreur réseau puis réussit', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce(VALID)
    vi.stubGlobal('fetch', fetchMock)

    const res = await callStructured({ systemPrompt: 's', userContent: 'u', schema: Schema })
    expect(res.data.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('réessaie sur 429 (rate limit) puis réussit', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errResponse(429))
      .mockResolvedValueOnce(VALID)
    vi.stubGlobal('fetch', fetchMock)

    const res = await callStructured({ systemPrompt: 's', userContent: 'u', schema: Schema })
    expect(res.data.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('réessaie sur 503 (serveur indispo) puis réussit', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errResponse(503))
      .mockResolvedValueOnce(VALID)
    vi.stubGlobal('fetch', fetchMock)

    const res = await callStructured({ systemPrompt: 's', userContent: 'u', schema: Schema })
    expect(res.data.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('ne réessaie pas sur une erreur 4xx définitive (401)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(errResponse(401, 'unauthorized'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      callStructured({ systemPrompt: 's', userContent: 'u', schema: Schema })
    ).rejects.toThrow('401')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('réessaie avec correction sur JSON invalide puis réussit', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(llmResponse('ceci nest pas du json valide ###'))
      .mockResolvedValueOnce(VALID)
    vi.stubGlobal('fetch', fetchMock)

    const res = await callStructured({ systemPrompt: 's', userContent: 'u', schema: Schema })
    expect(res.data.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('échoue après MAX_RETRIES timeouts consécutifs', async () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' })
    const fetchMock = vi.fn().mockRejectedValue(abort)
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      callStructured({ systemPrompt: 's', userContent: 'u', schema: Schema })
    ).rejects.toThrow('timeout')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
