import posthog from 'posthog-js'

/**
 * Events PostHog de GEO (§16.12) — capture côté client uniquement si le
 * provider PostHog est initialisé (consentement cookies « all »), sinon
 * skip silencieux. Module client-only : à importer depuis des composants
 * 'use client' exclusivement.
 */

export type CoachAnalyticsEvent =
  | 'coach_opened'
  | 'coach_suggestion_clicked'
  | 'coach_code_copied'
  | 'coach_memory_cleared'

export function captureCoachEvent(
  event: CoachAnalyticsEvent,
  properties?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return
  posthog.capture(event, properties)
}
