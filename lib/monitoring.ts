/**
 * lib/monitoring.ts
 *
 * Signalement à Sentry des échecs qui, sinon, passeraient inaperçus :
 * moteurs IA en panne, jobs Inngest plantés, webhooks Stripe rejetés,
 * emails non partis.
 *
 * Le point clé est le `fingerprint` : une panne de connecteur échoue sur
 * *chaque* prompt d'une analyse (40 fois de suite). Sans regroupement, Sentry
 * noie l'alerte sous 40 issues identiques. Ici, toutes les pannes d'un même
 * moteur se regroupent en UNE issue par moteur — celle qu'on veut voir.
 *
 * Précédent à ne pas reproduire : OpenRouter a retiré le modèle de ChatGPT,
 * le connecteur a renvoyé 404 sur chaque appel pendant des semaines, et
 * personne ne l'a su (console.error seul, invisible en prod).
 */

import * as Sentry from '@sentry/nextjs'
import type { IAEngineName } from '@/lib/ai/connectors/base'

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

/** Extrait le code HTTP d'un message d'erreur de connecteur ("… error 404: …"). */
function extractStatus(message: string): string | null {
  return message.match(/\berror (\d{3})\b/)?.[1] ?? null
}

/**
 * Panne d'un moteur IA lors d'une requête.
 * Regroupé par (moteur, code HTTP) : une issue « chatgpt / 404 », pas une par prompt.
 */
export function captureEngineFailure(
  engine: IAEngineName,
  error: unknown,
  context: { step: string; siteId?: string; analysisId?: string; promptId?: string } = {
    step: 'query',
  }
): void {
  const err = toError(error)
  const status = extractStatus(err.message)

  Sentry.withScope((scope) => {
    scope.setLevel('error')
    scope.setTag('failure_kind', 'ai_engine')
    scope.setTag('engine', engine)
    if (status) scope.setTag('http_status', status)
    scope.setContext('engine_call', { engine, ...context, message: err.message })
    // Une issue par moteur et par code — pas une par prompt.
    scope.setFingerprint(['ai-engine-failure', engine, status ?? 'unknown'])
    Sentry.captureException(err)
  })
}

/**
 * Bilan d'une phase d'interrogation : alerte si un moteur a TOUT raté.
 * Complète `captureEngineFailure` — un moteur qui échoue partout est une
 * panne, un échec isolé est du bruit réseau.
 */
export function captureEngineOutage(
  engine: IAEngineName,
  context: { attempted: number; failed: number; step: string; analysisId?: string }
): void {
  if (context.failed === 0 || context.failed < context.attempted) return

  Sentry.withScope((scope) => {
    scope.setLevel('error')
    scope.setTag('failure_kind', 'ai_engine_outage')
    scope.setTag('engine', engine)
    scope.setContext('outage', context)
    scope.setFingerprint(['ai-engine-outage', engine])
    Sentry.captureMessage(
      `Moteur ${engine} injoignable : ${context.failed}/${context.attempted} appels en échec (${context.step})`
    )
  })
}

/** Échec d'une fonction Inngest (job de fond : personne ne regarde). */
export function captureJobFailure(
  job: string,
  error: unknown,
  context: Record<string, unknown> = {}
): void {
  const err = toError(error)
  Sentry.withScope((scope) => {
    scope.setLevel('error')
    scope.setTag('failure_kind', 'inngest_job')
    scope.setTag('job', job)
    scope.setContext('job', { job, ...context })
    scope.setFingerprint(['inngest-job-failure', job])
    Sentry.captureException(err)
  })
}

/** Échec de traitement d'un webhook Stripe — un paiement non enregistré ne se rattrape pas seul. */
export function capturePaymentFailure(
  stage: string,
  error: unknown,
  context: { eventType?: string; eventId?: string; userId?: string } = {}
): void {
  const err = toError(error)
  Sentry.withScope((scope) => {
    scope.setLevel('fatal')
    scope.setTag('failure_kind', 'stripe_webhook')
    scope.setTag('stage', stage)
    if (context.eventType) scope.setTag('stripe_event', context.eventType)
    scope.setContext('stripe', { stage, ...context })
    scope.setFingerprint(['stripe-webhook-failure', stage, context.eventType ?? 'unknown'])
    Sentry.captureException(err)
  })
}

/** Échec d'envoi d'email — Resend renvoie une erreur au lieu de lever, d'où l'oubli facile. */
export function captureEmailFailure(
  template: string,
  error: unknown,
  context: { to?: string; siteId?: string } = {}
): void {
  const err = toError(error)
  Sentry.withScope((scope) => {
    scope.setLevel('error')
    scope.setTag('failure_kind', 'email')
    scope.setTag('template', template)
    // L'adresse est une donnée personnelle : on ne garde que le domaine.
    const domain = context.to?.split('@')[1]
    scope.setContext('email', { template, recipientDomain: domain, siteId: context.siteId })
    scope.setFingerprint(['email-failure', template])
    Sentry.captureException(err)
  })
}
