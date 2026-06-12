import { PostHog } from 'posthog-node'
import { env } from '@/lib/env'

let _client: PostHog | null = null

function getClient(): PostHog {
  if (!_client) {
    _client = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return _client
}

export type PostHogEvent =
  | 'signup'
  | 'site_created'
  | 'site_deleted'
  | 'discovery_started'
  | 'analysis_started'
  | 'analysis_completed'
  | 'plan_upgrade_started'
  | 'plan_upgraded'
  | 'credit_pack_checkout_started'
  | 'credit_pack_purchased'

export function trackEvent(
  userId: string,
  event: PostHogEvent,
  properties?: Record<string, unknown>
): void {
  const client = getClient()
  client.capture({
    distinctId: userId,
    event,
    properties: {
      $lib: 'posthog-node',
      ...properties,
    },
  })
  // Fire-and-forget flush — Server Actions are short-lived
  client.flush().catch(() => {})
}

export function _resetClientForTesting(): void {
  _client = null
}
