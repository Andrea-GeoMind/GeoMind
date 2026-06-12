import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { IAEngine, IAResponse } from '@/lib/ai/connectors/base'

// ─── Mocks DB ─────────────────────────────────────────────────────────────────

vi.mock('@/lib/db/queries/analyses', () => ({
  getAnalysisById: vi.fn(),
}))
vi.mock('@/lib/db/queries/sites', () => ({
  getSiteById: vi.fn(),
}))
vi.mock('@/lib/db/queries/prompts', () => ({
  getPromptsBySiteId: vi.fn(),
}))
vi.mock('@/lib/db/queries/authority-results', () => ({
  insertAuthorityResult: vi.fn(),
}))
vi.mock('@/lib/db/queries/authority-sources', () => ({
  insertAuthoritySources: vi.fn(),
}))
vi.mock('@/lib/ai/cost', () => ({
  logEstimatedBatchCost: vi.fn(),
}))

// ─── Mocks connecteurs ────────────────────────────────────────────────────────

vi.mock('@/lib/ai/connectors/chatgpt', () => ({ ChatGPTConnector: vi.fn() }))
vi.mock('@/lib/ai/connectors/claude', () => ({ ClaudeConnector: vi.fn() }))
vi.mock('@/lib/ai/connectors/gemini', () => ({ GeminiConnector: vi.fn() }))
vi.mock('@/lib/ai/connectors/perplexity', () => ({ PerplexityConnector: vi.fn() }))

import { getAnalysisById } from '@/lib/db/queries/analyses'
import { getSiteById } from '@/lib/db/queries/sites'
import { getPromptsBySiteId } from '@/lib/db/queries/prompts'
import { insertAuthorityResult } from '@/lib/db/queries/authority-results'
import { insertAuthoritySources } from '@/lib/db/queries/authority-sources'
import { ChatGPTConnector } from '@/lib/ai/connectors/chatgpt'
import { ClaudeConnector } from '@/lib/ai/connectors/claude'
import { GeminiConnector } from '@/lib/ai/connectors/gemini'
import { PerplexityConnector } from '@/lib/ai/connectors/perplexity'
import { runAuthorityAnalysis } from '@/lib/analysis/authority'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeIAResponse(overrides: Partial<IAResponse> = {}): IAResponse {
  return {
    engine: 'chatgpt',
    prompt: 'test',
    answer: 'Voici une réponse.',
    sources: [],
    partial_response: false,
    tokens_input: 100,
    tokens_output: 200,
    cost_usd: 0.0001,
    ...overrides,
  }
}

function makeEngine(name: IAEngineName, response: IAResponse): IAEngine {
  return { name, query: vi.fn().mockResolvedValue(response) }
}

// Import after mocks
import type { IAEngineName } from '@/lib/ai/connectors/base'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('runAuthorityAnalysis', () => {
  beforeEach(() => {
    vi.mocked(getAnalysisById).mockResolvedValue({
      id: 'analysis-1',
      siteId: 'site-1',
      rulesVersion: 2,
      userId: 'user-1',
      status: 'running',
      errorMessage: null,
      globalScore: null,
      authorityScore: null,
      technicalScore: null,
      contentScore: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(getSiteById).mockResolvedValue({
      id: 'site-1',
      userId: 'user-1',
      name: 'Mon Site',
      url: 'https://www.monsite.fr',
      language: 'fr',
      country: 'FR',
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(insertAuthorityResult).mockResolvedValue({
      id: 'result-1',
      analysisId: 'analysis-1',
      promptId: 'prompt-1',
      engine: 'chatgpt',
      answer: 'test',
      promptIsNeutral: true,
      partialResponse: false,
      tokensInput: 100,
      tokensOutput: 200,
      costUsd: '0.0001',
      createdAt: new Date(),
    })
    vi.mocked(insertAuthoritySources).mockResolvedValue([])
  })

  it('retourne totalCalls=0 si aucun prompt neutre', async () => {
    vi.mocked(getPromptsBySiteId).mockResolvedValue([])

    const result = await runAuthorityAnalysis('analysis-1')

    expect(result.totalCalls).toBe(0)
    expect(result.successfulCalls).toBe(0)
  })

  it('exécute 1 prompt × 4 IAs = 4 appels', async () => {
    vi.mocked(getPromptsBySiteId).mockResolvedValue([
      { id: 'prompt-1', siteId: 'site-1', text: 'Meilleur outil SEO ?', isNeutral: true, createdAt: new Date() },
    ])

    const mockResponse = makeIAResponse()
    const engines = [
      makeEngine('chatgpt', mockResponse),
      makeEngine('claude', mockResponse),
      makeEngine('gemini', mockResponse),
      makeEngine('perplexity', mockResponse),
    ] as IAEngine[]

    vi.mocked(ChatGPTConnector).mockImplementation(() => engines[0] as unknown as InstanceType<typeof ChatGPTConnector>)
    vi.mocked(ClaudeConnector).mockImplementation(() => engines[1] as unknown as InstanceType<typeof ClaudeConnector>)
    vi.mocked(GeminiConnector).mockImplementation(() => engines[2] as unknown as InstanceType<typeof GeminiConnector>)
    vi.mocked(PerplexityConnector).mockImplementation(() => engines[3] as unknown as InstanceType<typeof PerplexityConnector>)

    const result = await runAuthorityAnalysis('analysis-1')

    expect(result.totalCalls).toBe(4)
    expect(result.successfulCalls).toBe(4)
  })

  it('détecte le domaine client dans les sources', async () => {
    vi.mocked(getPromptsBySiteId).mockResolvedValue([
      { id: 'prompt-1', siteId: 'site-1', text: 'Outil de gestion ?', isNeutral: true, createdAt: new Date() },
    ])

    const mockResponse = makeIAResponse({
      sources: [
        { url: 'https://monsite.fr/page', title: 'Accueil', domain: 'monsite.fr' },
        { url: 'https://concurrent.com/', title: 'Concurrent', domain: 'concurrent.com' },
      ],
    })

    const engine = makeEngine('chatgpt', mockResponse)
    vi.mocked(ChatGPTConnector).mockImplementation(() => engine as unknown as InstanceType<typeof ChatGPTConnector>)
    vi.mocked(ClaudeConnector).mockImplementation(() => engine as unknown as InstanceType<typeof ClaudeConnector>)
    vi.mocked(GeminiConnector).mockImplementation(() => engine as unknown as InstanceType<typeof GeminiConnector>)
    vi.mocked(PerplexityConnector).mockImplementation(() => engine as unknown as InstanceType<typeof PerplexityConnector>)

    const result = await runAuthorityAnalysis('analysis-1')

    // 4 IAs × 2 sources = 8 citations ; 4 sont le domaine client (monsite.fr)
    expect(result.citationsFound).toBe(8)
    expect(result.clientCitationsFound).toBe(4)
  })

  it('continue si une IA échoue (partial failure)', async () => {
    vi.mocked(getPromptsBySiteId).mockResolvedValue([
      { id: 'prompt-1', siteId: 'site-1', text: 'Outil IA ?', isNeutral: true, createdAt: new Date() },
    ])

    const okEngine = makeEngine('chatgpt', makeIAResponse())
    const failEngine: IAEngine = {
      name: 'claude',
      query: vi.fn().mockRejectedValue(new Error('Timeout')),
    }

    vi.mocked(ChatGPTConnector).mockImplementation(() => okEngine as unknown as InstanceType<typeof ChatGPTConnector>)
    vi.mocked(ClaudeConnector).mockImplementation(() => failEngine as unknown as InstanceType<typeof ClaudeConnector>)
    vi.mocked(GeminiConnector).mockImplementation(() => okEngine as unknown as InstanceType<typeof GeminiConnector>)
    vi.mocked(PerplexityConnector).mockImplementation(() => okEngine as unknown as InstanceType<typeof PerplexityConnector>)

    const result = await runAuthorityAnalysis('analysis-1')

    expect(result.totalCalls).toBe(4)
    // 3 IAs OK, 1 en erreur
    expect(result.successfulCalls).toBe(3)
  })

  it('exclut les prompts non-neutres de l analyse', async () => {
    vi.mocked(getPromptsBySiteId).mockResolvedValue([
      { id: 'prompt-neutral', siteId: 'site-1', text: 'Outil SEO ?', isNeutral: true, createdAt: new Date() },
      { id: 'prompt-biased', siteId: 'site-1', text: 'monsite.fr est-il cité ?', isNeutral: false, createdAt: new Date() },
    ])

    const engine = makeEngine('chatgpt', makeIAResponse())
    vi.mocked(ChatGPTConnector).mockImplementation(() => engine as unknown as InstanceType<typeof ChatGPTConnector>)
    vi.mocked(ClaudeConnector).mockImplementation(() => engine as unknown as InstanceType<typeof ClaudeConnector>)
    vi.mocked(GeminiConnector).mockImplementation(() => engine as unknown as InstanceType<typeof GeminiConnector>)
    vi.mocked(PerplexityConnector).mockImplementation(() => engine as unknown as InstanceType<typeof PerplexityConnector>)

    const result = await runAuthorityAnalysis('analysis-1')

    // Seulement le prompt neutre → 4 appels (1 prompt × 4 IAs)
    expect(result.totalCalls).toBe(4)
  })

  it('lève une erreur si l analyse est introuvable', async () => {
    vi.mocked(getAnalysisById).mockResolvedValue(undefined)

    await expect(runAuthorityAnalysis('unknown')).rejects.toThrow('Analyse introuvable')
  })
})
