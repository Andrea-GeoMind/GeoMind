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
vi.mock('@/lib/db/queries/citation-checks', () => ({
  insertCitationChecks: vi.fn(),
}))
vi.mock('@/lib/ai/cost', () => ({
  logEstimatedBatchCost: vi.fn(),
}))

// ─── Mocks connecteurs ────────────────────────────────────────────────────────

// On mocke le registre plutôt que chaque connecteur : le test ne dépend plus
// de la composition exacte de la liste des moteurs.
vi.mock('@/lib/ai/engines', () => ({
  createEngines: vi.fn(() => []),
  ENGINE_MODELS: {
    chatgpt: 'openai/gpt-5-mini',
    claude: 'anthropic/claude-haiku-4-5:beta',
    gemini: 'google/gemini-2.5-flash',
    perplexity: 'perplexity/sonar',
  },
}))

import { getAnalysisById } from '@/lib/db/queries/analyses'
import { getSiteById } from '@/lib/db/queries/sites'
import { getPromptsBySiteId } from '@/lib/db/queries/prompts'
import { insertAuthorityResult } from '@/lib/db/queries/authority-results'
import { insertAuthoritySources } from '@/lib/db/queries/authority-sources'
import { createEngines } from '@/lib/ai/engines'
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
import { ENGINE_COUNT, type IAEngineName } from '@/lib/ai/connectors/base'

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
      coachIntroSeen: false,
      pixelKey: null,
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

    vi.mocked(createEngines).mockReturnValue(engines)

    const result = await runAuthorityAnalysis('analysis-1')

    // 1 prompt × N moteurs × 2 modes (forcé + spontané, prompt dans l'échantillon)
    expect(result.totalCalls).toBe(ENGINE_COUNT * 2)
    expect(result.successfulCalls).toBe(ENGINE_COUNT) // forcés uniquement (dénominateur du score)
    expect(result.spontaneousSuccessfulCalls).toBe(ENGINE_COUNT)
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
    vi.mocked(createEngines).mockReturnValue(Array.from({ length: ENGINE_COUNT }, () => engine))

    const result = await runAuthorityAnalysis('analysis-1')

    // N moteurs × 2 sources ; une par moteur est le domaine client (monsite.fr)
    expect(result.citationsFound).toBe(ENGINE_COUNT * 2)
    expect(result.clientCitationsFound).toBe(ENGINE_COUNT)
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

    // Un seul moteur en panne, les autres opérationnels — quel que soit leur nombre.
    vi.mocked(createEngines).mockReturnValue([
      failEngine,
      ...Array.from({ length: ENGINE_COUNT - 1 }, () => okEngine),
    ])

    const result = await runAuthorityAnalysis('analysis-1')

    expect(result.totalCalls).toBe(ENGINE_COUNT * 2) // forcés + spontanés
    // Tous les moteurs OK sauf un, en mode forcé
    expect(result.successfulCalls).toBe(ENGINE_COUNT - 1)
  })

  it('exclut les prompts non-neutres de l analyse', async () => {
    vi.mocked(getPromptsBySiteId).mockResolvedValue([
      { id: 'prompt-neutral', siteId: 'site-1', text: 'Outil SEO ?', isNeutral: true, createdAt: new Date() },
      { id: 'prompt-biased', siteId: 'site-1', text: 'monsite.fr est-il cité ?', isNeutral: false, createdAt: new Date() },
    ])

    const engine = makeEngine('chatgpt', makeIAResponse())
    vi.mocked(createEngines).mockReturnValue(Array.from({ length: ENGINE_COUNT }, () => engine))

    const result = await runAuthorityAnalysis('analysis-1')

    // Seulement le prompt neutre → 8 appels (1 prompt × 4 IAs × 2 modes)
    expect(result.totalCalls).toBe(8)
  })

  it('lève une erreur si l analyse est introuvable', async () => {
    vi.mocked(getAnalysisById).mockResolvedValue(undefined)

    await expect(runAuthorityAnalysis('unknown')).rejects.toThrow('Analyse introuvable')
  })
})
