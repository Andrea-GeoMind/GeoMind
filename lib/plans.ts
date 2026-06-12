export const PLAN_LIMITS = {
  free:     { sites: 1,        creditsPerMonth: 500 },
  pro:      { sites: 3,        creditsPerMonth: 20_000 },
  business: { sites: 10,       creditsPerMonth: 80_000 },
  admin:    { sites: Infinity, creditsPerMonth: Infinity },
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

// ─── Packs de crédits (achat à la carte, cahier-des-charges §17.3) ────────────
// Paiement one-shot Stripe — les crédits achetés n'expirent jamais.
// Le prix au crédit des packs reste volontairement supérieur à celui des
// abonnements : le pack dépanne, l'upgrade de plan reste la meilleure affaire.

export const CREDIT_PACKS = {
  starter: { label: 'Starter', credits: 500, priceEur: 5 },
  growth: { label: 'Growth', credits: 2_000, priceEur: 15 },
  power: { label: 'Power', credits: 8_000, priceEur: 49 },
} as const

export type CreditPackId = keyof typeof CREDIT_PACKS
