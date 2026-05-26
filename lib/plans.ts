export const PLAN_LIMITS = {
  free:     { sites: 1,        analyses: 1,        coachMessagesPerMonth: 0 },
  pro:      { sites: 3,        analyses: 4,        coachMessagesPerMonth: 20 },
  business: { sites: 10,       analyses: 30,       coachMessagesPerMonth: Infinity },
  admin:    { sites: Infinity,  analyses: Infinity, coachMessagesPerMonth: Infinity },
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
