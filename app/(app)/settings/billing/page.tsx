import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubscriptionByUserId } from '@/lib/db/queries/subscriptions'
import { getUserCredits } from '@/lib/credits'
import {
  formatCreditsAmount,
  formatCreditsAsUsage,
} from '@/lib/credits-shared'
import {
  createCheckoutSession,
  createPortalSession,
  createCreditPackCheckout,
} from '@/app/actions/stripe'
import {
  PLAN_LABELS,
  PLAN_LIMITS,
  PLAN_PRICES,
  CREDIT_PACKS,
  type CreditPackId,
  type PaidPlan,
} from '@/lib/plans'
import { CREDIT_PACK_PRICE_IDS, STRIPE_PLAN_PRICE_IDS } from '@/lib/stripe'

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

      {/* Packs de crédits — seuls les packs réellement achetables sont affichés
          (PLAN item 25 : « Bientôt disponible » interdit, pas d'UI morte) */}
      {plan !== 'free' &&
        (Object.keys(CREDIT_PACKS) as CreditPackId[]).some(
          (packId) => !!CREDIT_PACK_PRICE_IDS[packId]
        ) && (
        <div className="rounded-xl border border-border bg-white shadow-sm p-6">
          <p className="text-base font-semibold mb-1">Acheter des crédits</p>
          <p className="text-sm text-muted-foreground mb-4">
            Besoin d&apos;un coup de pouce ponctuel ? Les crédits achetés n&apos;expirent jamais.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(CREDIT_PACKS) as CreditPackId[])
              .filter((packId) => !!CREDIT_PACK_PRICE_IDS[packId])
              .map((packId) => {
                const pack = CREDIT_PACKS[packId]
                return (
                  <div
                    key={packId}
                    className="rounded-lg border border-border p-4 text-center"
                  >
                    <p className="text-sm font-semibold">{pack.label}</p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight">
                      {formatCreditsAmount(pack.credits)}
                    </p>
                    <p className="text-xs text-muted-foreground">crédits</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatCreditsAsUsage(pack.credits)}
                    </p>
                    <form action={createCreditPackCheckout.bind(null, packId)} className="mt-3">
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-foreground px-3 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                      >
                        {pack.priceEur} €
                      </button>
                    </form>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Offres disponibles (upgrades depuis le plan courant) — seuls les plans
          réellement souscriptibles sont affichés (PLAN item 25) */}
      {availableUpgradeTargets(plan).length > 0 && (
        <div
          className={`grid gap-4 ${
            availableUpgradeTargets(plan).length >= 3
              ? 'sm:grid-cols-3'
              : availableUpgradeTargets(plan).length === 2
                ? 'sm:grid-cols-2'
                : 'sm:grid-cols-1'
          }`}
        >
          {availableUpgradeTargets(plan).map((target) => (
            <PlanCard
              key={target}
              name={PLAN_LABELS[target]}
              price={String(PLAN_PRICES[target].monthly)}
              annualPrice={String(PLAN_PRICES[target].annual)}
              sites={PLAN_LIMITS[target].sites}
              creditsPerMonth={PLAN_LIMITS[target].creditsPerMonth}
              action={createCheckoutSession.bind(null, target, 'monthly')}
              available
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

/** Upgrades dont le price ID Stripe est configuré — pas de bouton mort. */
function availableUpgradeTargets(plan: string): PaidPlan[] {
  return upgradeTargets(plan).filter((target) => !!STRIPE_PLAN_PRICE_IDS[target].monthly)
}

function PlanCard({
  name,
  price,
  annualPrice,
  sites,
  creditsPerMonth,
  action,
  available,
  highlighted = false,
}: {
  name: string
  price: string
  annualPrice: string
  sites: number
  creditsPerMonth: number
  action: () => Promise<void>
  available: boolean
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
      <form action={action} className="mt-5">
        <button
          type="submit"
          disabled={!available}
          title={available ? undefined : 'Bientôt disponible'}
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${
            highlighted
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
              : 'bg-foreground text-background'
          }`}
        >
          Passer {name}
        </button>
      </form>
    </div>
  )
}
