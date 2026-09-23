import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubscriptionByUserId } from '@/lib/db/queries/subscriptions'
import { getUserCredits } from '@/lib/credits'
import {
  formatCreditsAmount,
  formatCreditsAsUsage,
} from '@/lib/credits-shared'
import { createPortalSession } from '@/app/actions/stripe'
import { PLAN_LABELS, PLAN_LIMITS, PLAN_PRICES, type PaidPlan } from '@/lib/plans'
import { WaitlistButton } from '@/components/features/billing/waitlist-button'

// Sans cet export, la page héritait du titre de l'accueil : l'onglet du
// navigateur affichait « GEOMIND — Êtes-vous cité par ChatGPT ?… » sur les
// réglages de facturation.
export const metadata: Metadata = {
  title: 'Facturation',
}

interface PageProps {
  searchParams: Promise<{ success?: string; canceled?: string; pack_success?: string }>
}

export default async function BillingPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [subscription, credits] = await Promise.all([
    getSubscriptionByUserId(user.id),
    getUserCredits(user.id),
  ])
  const plan = subscription?.plan ?? 'free'
  const status = subscription?.status ?? 'active'
  const currentPeriodEnd = subscription?.currentPeriodEnd
  const hasStripe = !!subscription?.stripeCustomerId
  const creditsPerMonth = PLAN_LIMITS[plan].creditsPerMonth

  const params = await searchParams
  const showSuccess = params.success === '1'
  const showCanceled = params.canceled === '1'
  const showPackSuccess = params.pack_success === '1'

  const planBadgeClass =
    plan === 'business'
      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
      : plan === 'pro'
        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
        : 'bg-muted text-muted-foreground'

  const monthlyPct =
    Number.isFinite(creditsPerMonth) && creditsPerMonth > 0
      ? Math.min(100, Math.round((credits.monthly / creditsPerMonth) * 100))
      : null

  return (
    <div className="space-y-4">
      {/* Banners */}
      {showSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Paiement effectué — votre plan a été mis à jour.
        </div>
      )}
      {showPackSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Pack acheté — vos crédits ont été ajoutés à votre compte.
        </div>
      )}
      {showCanceled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Paiement annulé — aucun changement apporté.
        </div>
      )}

      {/* Plan actuel */}
      <div className="rounded-xl border border-border bg-white shadow-sm p-6">
        <p className="text-base font-semibold mb-4">Plan actuel</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${planBadgeClass}`}>
                {PLAN_LABELS[plan]}
              </span>
              {status === 'active' && plan !== 'free' && (
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
                  Actif
                </span>
              )}
              {status === 'past_due' && (
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-destructive">
                  Paiement en retard
                </span>
              )}
              {status === 'canceled' && (
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                  Annulé
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {PLAN_LIMITS[plan].sites} site{PLAN_LIMITS[plan].sites > 1 ? 's' : ''} ·{' '}
              {creditsPerMonth === 0
                ? 'crédits de bienvenue, sans renouvellement'
                : `${formatCreditsAmount(creditsPerMonth)} crédits / mois`}
            </p>
          </div>
          {currentPeriodEnd && (
            <p className="text-xs text-muted-foreground text-right shrink-0">
              Renouvellement le{' '}
              <span className="font-medium text-foreground">
                {currentPeriodEnd.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </p>
          )}
        </div>

        {hasStripe && (
          <div className="mt-4 border-t pt-4">
            <form action={createPortalSession}>
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
              >
                Gérer mon abonnement →
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Crédits */}
      <div className="rounded-xl border border-border bg-white shadow-sm p-6">
        <div className="flex items-baseline justify-between mb-1">
          <p className="text-base font-semibold">Crédits</p>
          <p className="text-sm text-muted-foreground">
            {formatCreditsAsUsage(credits.total)}
          </p>
        </div>
        <p className="text-3xl font-extrabold tracking-tight">
          {formatCreditsAmount(credits.total)}
          <span className="text-base font-normal text-muted-foreground"> crédits disponibles</span>
        </p>

        {monthlyPct !== null && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
              <span>Allocation mensuelle</span>
              <span>
                {formatCreditsAmount(credits.monthly)} / {formatCreditsAmount(creditsPerMonth)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                style={{ width: `${monthlyPct}%` }}
              />
            </div>
            {credits.purchased > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                + {formatCreditsAmount(credits.purchased)} crédits achetés (n&apos;expirent jamais)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Plans payants — lancement freemium : checkout Stripe désactivé,
          inscription à la liste d'attente à la place */}
      {upgradeTargets(plan).length > 0 && (
        <div
          className={`grid gap-4 ${
            upgradeTargets(plan).length >= 3
              ? 'sm:grid-cols-3'
              : upgradeTargets(plan).length === 2
                ? 'sm:grid-cols-2'
                : 'sm:grid-cols-1'
          }`}
        >
          {upgradeTargets(plan).map((target) => (
            <PlanCard
              key={target}
              plan={target}
              name={PLAN_LABELS[target]}
              price={String(PLAN_PRICES[target].monthly)}
              annualPrice={String(PLAN_PRICES[target].annual)}
              sites={PLAN_LIMITS[target].sites}
              creditsPerMonth={PLAN_LIMITS[target].creditsPerMonth}
              highlighted={target === 'pro'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Plans supérieurs proposés depuis le plan courant. */
function upgradeTargets(plan: string): PaidPlan[] {
  switch (plan) {
    case 'free':
      return ['solo', 'pro', 'business']
    case 'solo':
      return ['pro', 'business']
    case 'pro':
      return ['business']
    default:
      return []
  }
}

function PlanCard({
  plan,
  name,
  price,
  annualPrice,
  sites,
  creditsPerMonth,
  highlighted = false,
}: {
  plan: PaidPlan
  name: string
  price: string
  annualPrice: string
  sites: number
  creditsPerMonth: number
  highlighted?: boolean
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-white shadow-sm p-6 transition-shadow hover:shadow-md ${
        highlighted ? 'ring-1 ring-primary/20' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-base font-semibold">{name}</p>
        {highlighted && (
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
            Recommandé
          </span>
        )}
      </div>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">
        {price}€<span className="text-base font-normal text-muted-foreground">/mois</span>
      </p>
      <p className="text-xs text-muted-foreground">ou {annualPrice} €/mois en annuel (−20 %)</p>
      <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <span className="text-emerald-500 font-semibold">✓</span>
          {sites} site{sites > 1 ? 's' : ''}
        </li>
        <li className="flex items-center gap-2">
          <span className="text-emerald-500 font-semibold">✓</span>
          {formatCreditsAmount(creditsPerMonth)} crédits / mois
        </li>
        <li className="flex items-center gap-2">
          <span className="text-emerald-500 font-semibold">✓</span>
          {formatCreditsAsUsage(creditsPerMonth)}
        </li>
      </ul>
      <WaitlistButton plan={plan} highlighted={highlighted} />
    </div>
  )
}
