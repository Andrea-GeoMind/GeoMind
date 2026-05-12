export const PLAN_LIMITS = {
  free: { sites: 1, analyses: 3 },
  pro: { sites: 5, analyses: 30 },
  business: { sites: 10, analyses: 100 },
} as const

export type Plan = keyof typeof PLAN_LIMITS

export const PLAN_LABELS: Record<Plan, string> = {
  free: 'Gratuit',
  pro: 'Pro',
  business: 'Business',
}

export const PLAN_UPGRADE_URLS: Record<Plan, string | null> = {
  free: '/pricing',
  pro: '/pricing',
  business: null,
}
