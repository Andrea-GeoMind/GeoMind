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
vi.mock('@/lib/db/queries/authority-failures', () => ({
  insertAuthorityFailures: vi.fn(),
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

    const result = await runAuthorityAnalysis('analysis-1', { retryDelaysMs: [0, 0] })

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

// ─── Régressions du 23/09/2026 ────────────────────────────────────────────────

import { insertAuthorityFailures } from '@/lib/db/queries/authority-failures'
import { isRetryableEngineError, failureReason } from '@/lib/analysis/authority'

// `tier: 'free'` supprime la seconde salve « spontanée », qui repose les mêmes
// questions et doublerait les compteurs d'appels sans rien apporter à ces
// régressions-ci. Un test dédié couvre l'interaction avec le mode spontané.
const NO_WAIT = { retryDelaysMs: [0, 0], tier: 'free' as const }

/** Même socle que le describe principal : analyse et site résolvables. */
function setupBaseMocks() {
  // Les compteurs d'appels s'accumulaient d'un test à l'autre : les mocks sont
  // au niveau module, et rien ne les remettait à zéro.
  vi.clearAllMocks()
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
  vi.mocked(insertAuthorityFailures).mockResolvedValue([])
}


describe('C1 — le score compte des réponses, pas des sources', () => {
  beforeEach(() => {
    setupBaseMocks()
    vi.mocked(getPromptsBySiteId).mockResolvedValue([
      { id: 'prompt-1', siteId: 'site-1', text: 'Outil IA ?', isNeutral: true, createdAt: new Date() },
    ])
  })

  it('une réponse citant trois pages du domaine ne vaut qu’une citation', async () => {
    // Le bug du 15/09 : `clientCitationsFound` additionnait les sources. Une
    // analyse à 13 sources sur 32 réponses donnait 41/100 quand le taux réel
    // de citation était de 38 %.
    const response = makeIAResponse({
      sources: [
        { url: 'https://www.monsite.fr/a', domain: 'monsite.fr', title: 'A' },
        { url: 'https://www.monsite.fr/b', domain: 'monsite.fr', title: 'B' },
        { url: 'https://www.monsite.fr/c', domain: 'monsite.fr', title: 'C' },
      ],
    })
    vi.mocked(createEngines).mockReturnValue(
      Array.from({ length: ENGINE_COUNT }, () => makeEngine('chatgpt', response))
    )

    const result = await runAuthorityAnalysis('analysis-1', NO_WAIT)

    expect(result.successfulCalls).toBe(ENGINE_COUNT)
    // Une citation par réponse, jamais plus.
    expect(result.clientCitationsFound).toBe(ENGINE_COUNT)
    // Le total de sources reste comptabilisé à part, lui.
    expect(result.citationsFound).toBe(ENGINE_COUNT * 3)
  })

  it('ne peut jamais dépasser le nombre d’appels réussis', async () => {
    const response = makeIAResponse({
      sources: Array.from({ length: 9 }, (_, i) => ({
        url: `https://www.monsite.fr/p${i}`,
        domain: 'monsite.fr',
        title: null,
      })),
    })
    vi.mocked(createEngines).mockReturnValue(
      Array.from({ length: ENGINE_COUNT }, () => makeEngine('chatgpt', response))
    )

    const result = await runAuthorityAnalysis('analysis-1', NO_WAIT)

    expect(result.clientCitationsFound).toBeLessThanOrEqual(result.successfulCalls)
  })

  it('ne compte pas une réponse qui ne cite qu’un autre domaine', async () => {
    const response = makeIAResponse({
      sources: [{ url: 'https://concurrent.fr/x', domain: 'concurrent.fr', title: null }],
    })
    vi.mocked(createEngines).mockReturnValue(
      Array.from({ length: ENGINE_COUNT }, () => makeEngine('chatgpt', response))
    )

    const result = await runAuthorityAnalysis('analysis-1', NO_WAIT)

    expect(result.clientCitationsFound).toBe(0)
    expect(result.citationsFound).toBe(ENGINE_COUNT)
  })
})

describe('C2 — une question sans réponse est signalée, pas tue', () => {
  beforeEach(setupBaseMocks)

  const twoPrompts = [
    { id: 'prompt-1', siteId: 'site-1', text: 'Question qui passe', isNeutral: true, createdAt: new Date() },
    { id: 'prompt-2', siteId: 'site-1', text: 'Question qui casse', isNeutral: true, createdAt: new Date() },
  ]

  it('remonte la question dont aucun moteur n’a répondu', async () => {
    vi.mocked(getPromptsBySiteId).mockResolvedValue(twoPrompts)
    // Le moteur échoue sur la deuxième question seulement — le cas réel du 15/09.
    const engine: IAEngine = {
      name: 'chatgpt',
      query: vi.fn(async (prompt: string) => {
        if (prompt.includes('casse')) throw new Error('429 rate limit exceeded')
        return makeIAResponse()
      }),
    }
    vi.mocked(createEngines).mockReturnValue(
      Array.from({ length: ENGINE_COUNT }, () => engine)
    )

    const result = await runAuthorityAnalysis('analysis-1', NO_WAIT)

    expect(result.unansweredPromptIds).toEqual(['prompt-2'])
    expect(result.failedCalls).toBe(ENGINE_COUNT)
    expect(result.successfulCalls).toBe(ENGINE_COUNT)
  })

  it('persiste le motif et le nombre de tentatives', async () => {
    vi.mocked(getPromptsBySiteId).mockResolvedValue([twoPrompts[1]!])
    vi.mocked(createEngines).mockReturnValue(
      Array.from({ length: ENGINE_COUNT }, () => ({
        name: 'claude' as IAEngineName,
        query: vi.fn().mockRejectedValue(new Error('503 Service Unavailable')),
      }))
    )

    await runAuthorityAnalysis('analysis-1', NO_WAIT)

    expect(insertAuthorityFailures).toHaveBeenCalledTimes(1)
    const rows = vi.mocked(insertAuthorityFailures).mock.calls[0]![0]
    expect(rows).toHaveLength(ENGINE_COUNT)
    expect(rows[0]).toMatchObject({
      analysisId: 'analysis-1',
      promptId: 'prompt-2',
      mode: 'forced',
      attempts: 3,
    })
    expect(rows[0]!.reason).toContain('503')
  })

  it('un échec en mode spontané ne rend pas la question manquante', async () => {
    // La salve spontanée ne nourrit que la série temporelle : son échec ne doit
    // ni compter dans `failedCalls` ni faire croire la question sans réponse.
    vi.mocked(getPromptsBySiteId).mockResolvedValue([twoPrompts[0]!])
    const engine: IAEngine = {
      name: 'chatgpt',
      query: vi.fn(async (prompt: string) => {
        // Le mode forcé ajoute le suffixe ; le spontané envoie la question brute.
        if (!prompt.includes('IMPORTANT')) throw new Error('503 Service Unavailable')
        return makeIAResponse()
      }),
    }
    vi.mocked(createEngines).mockReturnValue(
      Array.from({ length: ENGINE_COUNT }, () => engine)
    )

    const result = await runAuthorityAnalysis('analysis-1', {
      retryDelaysMs: [0, 0],
      tier: 'full',
    })

    expect(result.unansweredPromptIds).toEqual([])
    expect(result.failedCalls).toBe(0)
    const rows = vi.mocked(insertAuthorityFailures).mock.calls[0]![0]
    expect(rows.every((r) => r.mode === 'spontaneous')).toBe(true)
  })

  it('n’annonce aucune question manquante quand tout répond', async () => {
    vi.mocked(getPromptsBySiteId).mockResolvedValue(twoPrompts)
    vi.mocked(createEngines).mockReturnValue(
      Array.from({ length: ENGINE_COUNT }, () => makeEngine('chatgpt', makeIAResponse()))
    )

    const result = await runAuthorityAnalysis('analysis-1', NO_WAIT)

    expect(result.unansweredPromptIds).toEqual([])
    expect(result.failedCalls).toBe(0)
    expect(insertAuthorityFailures).not.toHaveBeenCalled()
  })

  it('une question partiellement répondue n’est pas déclarée manquante', async () => {
    vi.mocked(getPromptsBySiteId).mockResolvedValue([twoPrompts[0]!])
    const ok = makeEngine('chatgpt', makeIAResponse())
    const ko: IAEngine = { name: 'claude', query: vi.fn().mockRejectedValue(new Error('500')) }
    vi.mocked(createEngines).mockReturnValue([
      ko,
      ...Array.from({ length: ENGINE_COUNT - 1 }, () => ok),
    ])

    const result = await runAuthorityAnalysis('analysis-1', NO_WAIT)

    // Trois réponses sur quatre : la question a bien été mesurée.
    expect(result.unansweredPromptIds).toEqual([])
    expect(result.failedCalls).toBe(1)
  })
})

describe('reprise sur erreur passagère', () => {
  beforeEach(() => {
    setupBaseMocks()
    vi.mocked(getPromptsBySiteId).mockResolvedValue([
      { id: 'prompt-1', siteId: 'site-1', text: 'Q', isNeutral: true, createdAt: new Date() },
    ])
  })

  it('réessaie une saturation et réussit au deuxième essai', async () => {
    let calls = 0
    const flaky: IAEngine = {
      name: 'chatgpt',
      query: vi.fn(async () => {
        calls++
        if (calls === 1) throw new Error('429 Too Many Requests')
        return makeIAResponse()
      }),
    }
    vi.mocked(createEngines).mockReturnValue([flaky])

    const result = await runAuthorityAnalysis('analysis-1', NO_WAIT)

    expect(result.successfulCalls).toBe(1)
    expect(result.failedCalls).toBe(0)
    expect(flaky.query).toHaveBeenCalledTimes(2)
  })

  it('ne réessaie pas une erreur définitive', async () => {
    const refused: IAEngine = {
      name: 'chatgpt',
      query: vi.fn().mockRejectedValue(new Error('400 invalid_request: prompt rejeté')),
    }
    vi.mocked(createEngines).mockReturnValue([refused])

    const result = await runAuthorityAnalysis('analysis-1', NO_WAIT)

    expect(refused.query).toHaveBeenCalledTimes(1)
    expect(result.failedCalls).toBe(1)
  })

  it('classe correctement les erreurs', () => {
    for (const m of ['429 rate limit', 'HTTP 503', 'timeout', 'ETIMEDOUT', 'fetch failed', 'Overloaded']) {
      expect(isRetryableEngineError(new Error(m))).toBe(true)
    }
    for (const m of ['400 bad request', 'invalid api key', 'content policy violation']) {
      expect(isRetryableEngineError(new Error(m))).toBe(false)
    }
  })

  it('borne le motif enregistré', () => {
    expect(failureReason(new Error('a\n  b   c'))).toBe('a b c')
    expect(failureReason(new Error('x'.repeat(500)))).toHaveLength(300)
  })
})
