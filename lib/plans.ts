export const PLAN_LIMITS = {
  free: { sites: 1, analyses: 1 },
  pro: { sites: 3, analyses: 4 },
  business: { sites: 10, analyses: 30 },
  admin: { sites: Infinity, analyses: Infinity },
} as const

export type Plan = keyof typeof PLAN_LIMITS

export const PLAN_LABELS: Record<Plan, string> = {
  free: 'Gratuit',
  pro: 'Pro',
  business: 'Business',
  admin: 'Admin',
}

export const PLAN_UPGRADE_URLS: Record<Plan, '/pricing' | null> = {
  free: '/pricing',
  pro: '/pricing',
  business: null,
  admin: null,
}
