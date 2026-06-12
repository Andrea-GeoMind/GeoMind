'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PLAN_LIMITS, PLAN_PRICES, type BillingPeriod } from '@/lib/plans'
import {
  WELCOME_BONUS_CREDITS,
  formatCreditsAmount,
  formatCreditsAsUsage,
} from '@/lib/credits-shared'

interface PlanCardData {
  name: string
  description: string
  monthly: number
  annual: number
  credits: number
  features: string[]
  cta: string
  highlighted?: boolean
}

const PLANS: PlanCardData[] = [
  {
    name: 'Gratuit',
    description: 'Pour découvrir votre visibilité IA',
    monthly: 0,
    annual: 0,
    credits: PLAN_LIMITS.free.creditsPerMonth,
    features: [
      '1 site',
      '1 analyse complète offerte',
      'Coach IA GEO (selon crédits)',
      '3 publishers visibles',
      'Historique 30 jours',
    ],
    cta: 'Commencer gratuitement',
  },
  {
    name: 'Solo',
    description: 'Pour les indépendants',
    monthly: PLAN_PRICES.solo.monthly,
    annual: PLAN_PRICES.solo.annual,
    credits: PLAN_LIMITS.solo.creditsPerMonth,
    features: [
      '2 sites',
      'Analyse page par page (5 pages)',
      'Mémoire du coach IA',
      'Les 15 publishers',
      'Historique 90 jours',
    ],
    cta: 'Essayer Solo',
  },
  {
    name: 'Pro',
    description: 'Pour les PME qui veulent progresser',
    monthly: PLAN_PRICES.pro.monthly,
    annual: PLAN_PRICES.pro.annual,
    credits: PLAN_LIMITS.pro.creditsPerMonth,
    features: [
      '5 sites',
      'Analyse page par page (10 pages)',
      'Recommandations complètes (IA avancée)',
      'Export PDF des rapports',
      'Historique 1 an',
    ],
    cta: 'Essayer Pro',
    highlighted: true,
  },
  {
    name: 'Business',
    description: 'Pour les agences et équipes',
    monthly: PLAN_PRICES.business.monthly,
    annual: PLAN_PRICES.business.annual,
    credits: PLAN_LIMITS.business.creditsPerMonth,
    features: [
      '15 sites',
      'Tout le plan Pro',
      'Export PDF white-label (votre logo)',
      'Support prioritaire (< 24 h)',
      'Historique illimité',
    ],
    cta: 'Essayer Business',
  },
]

export function PricingPlans() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly')

  return (
    <div>
      {/* Toggle mensuel / annuel */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setPeriod('monthly')}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
            period === 'monthly'
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Mensuel
        </button>
        <button
          type="button"
          onClick={() => setPeriod('annual')}
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
            period === 'annual'
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Annuel
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            −20 %
          </span>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const price = period === 'annual' ? plan.annual : plan.monthly
          return (
            <div
              key={plan.name}
              className={cn(
                'relative flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm',
                plan.highlighted && 'ring-2 ring-primary shadow-lg shadow-indigo-100'
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-xs font-semibold text-white">
                  Le plus populaire
                </span>
              )}
              <h2 className="text-lg font-bold text-foreground">{plan.name}</h2>
              <p className="mt-1 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-foreground">{price} €</span>
                <span className="text-sm text-muted-foreground">/mois</span>
              </div>
              {period === 'annual' && price > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  facturé {price * 12} € par an
                </p>
              )}

              {/* Crédits + équivalence humaine */}
              <div className="mt-4 rounded-lg bg-muted/60 px-3 py-2.5">
                {plan.credits === 0 ? (
                  <>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCreditsAmount(WELCOME_BONUS_CREDITS)} crédits de bienvenue
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatCreditsAsUsage(WELCOME_BONUS_CREDITS)} — sans renouvellement
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCreditsAmount(plan.credits)} crédits / mois
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatCreditsAsUsage(plan.credits)}
                    </p>
                  </>
                )}
              </div>

              <Button
                asChild
                variant={plan.highlighted ? 'default' : 'outline'}
                className={cn(
                  'mt-5 rounded-lg',
                  plan.highlighted &&
                    'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200 hover:opacity-90 transition-opacity'
                )}
              >
                <Link href="/signup">{plan.cta}</Link>
              </Button>

              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Besoin d&apos;un coup de pouce ponctuel ? Des packs de crédits sont disponibles à partir
        de 5 € — sans abonnement, ils n&apos;expirent jamais.
      </p>
    </div>
  )
}
