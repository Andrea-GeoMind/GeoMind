import { describe, it, expect, vi, beforeEach } from 'vitest'

const captureException = vi.fn()
const captureMessage = vi.fn()
const scope = {
  setLevel: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  setFingerprint: vi.fn(),
}

vi.mock('@sentry/nextjs', () => ({
  withScope: (cb: (s: typeof scope) => void) => cb(scope),
  captureException: (...args: unknown[]) => captureException(...args),
  captureMessage: (...args: unknown[]) => captureMessage(...args),
}))

import {
  captureEngineFailure,
  captureEngineOutage,
  captureJobFailure,
  capturePaymentFailure,
  captureEmailFailure,
} from '@/lib/monitoring'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('captureEngineFailure', () => {
  it('regroupe par moteur et code HTTP — une issue, pas une par prompt', () => {
    const err = new Error('ChatGPT OpenRouter error 404: No endpoints found')
    captureEngineFailure('chatgpt', err, { step: 'authority', promptId: 'p1' })
    captureEngineFailure('chatgpt', err, { step: 'authority', promptId: 'p2' })

    expect(captureException).toHaveBeenCalledTimes(2)
    // Même empreinte → Sentry regroupe en une seule issue
    expect(scope.setFingerprint).toHaveBeenNthCalledWith(1, ['ai-engine-failure', 'chatgpt', '404'])
    expect(scope.setFingerprint).toHaveBeenNthCalledWith(2, ['ai-engine-failure', 'chatgpt', '404'])
  })

  it('sépare les moteurs entre eux', () => {
    captureEngineFailure('perplexity', new Error('Perplexity error 401: Invalid API key'))
    expect(scope.setFingerprint).toHaveBeenCalledWith([
      'ai-engine-failure',
      'perplexity',
      '401',
    ])
    expect(scope.setTag).toHaveBeenCalledWith('engine', 'perplexity')
  })

  it('accepte une erreur non-Error', () => {
    captureEngineFailure('gemini', 'boom')
    expect(captureException).toHaveBeenCalledTimes(1)
    expect(scope.setFingerprint).toHaveBeenCalledWith([
      'ai-engine-failure',
      'gemini',
      'unknown',
    ])
  })
})

describe('captureEngineOutage', () => {
  it('alerte quand le moteur a tout raté', () => {
    captureEngineOutage('perplexity', { attempted: 10, failed: 10, step: 'authority' })
    expect(captureMessage).toHaveBeenCalledTimes(1)
    expect(scope.setFingerprint).toHaveBeenCalledWith(['ai-engine-outage', 'perplexity'])
  })

  it('reste silencieux sur un échec partiel (aléa réseau)', () => {
    captureEngineOutage('chatgpt', { attempted: 10, failed: 3, step: 'authority' })
    expect(captureMessage).not.toHaveBeenCalled()
  })

  it('reste silencieux quand tout va bien', () => {
    captureEngineOutage('claude', { attempted: 10, failed: 0, step: 'authority' })
    expect(captureMessage).not.toHaveBeenCalled()
  })
})

describe('capturePaymentFailure', () => {
  it('remonte en fatal — un paiement perdu ne se rattrape pas', () => {
    capturePaymentFailure('handle_event', new Error('DB down'), {
      eventType: 'invoice.payment_succeeded',
      eventId: 'evt_1',
    })
    expect(scope.setLevel).toHaveBeenCalledWith('fatal')
    expect(scope.setTag).toHaveBeenCalledWith('stripe_event', 'invoice.payment_succeeded')
  })
})

describe('captureEmailFailure', () => {
  it("ne transmet jamais l'adresse complète à Sentry (RGPD)", () => {
    captureEmailFailure('analysis-complete', new Error('quota exceeded'), {
      to: 'client@exemple.fr',
      siteId: 's1',
    })
    const ctx = scope.setContext.mock.calls.find((c) => c[0] === 'email')?.[1] as Record<
      string,
      unknown
    >
    expect(ctx.recipientDomain).toBe('exemple.fr')
    expect(JSON.stringify(ctx)).not.toContain('client@')
  })
})

describe('captureJobFailure', () => {
  it('regroupe par job', () => {
    captureJobFailure('run-full-analysis', new Error('timeout'), { analysisId: 'a1' })
    expect(scope.setFingerprint).toHaveBeenCalledWith([
      'inngest-job-failure',
      'run-full-analysis',
    ])
    expect(scope.setTag).toHaveBeenCalledWith('job', 'run-full-analysis')
  })
})
