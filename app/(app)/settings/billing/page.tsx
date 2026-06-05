import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubscriptionByUserId } from '@/lib/db/queries/subscriptions'
import { createCheckoutSession, createPortalSession } from '@/app/actions/stripe'
import { PLAN_LABELS, PLAN_LIMITS } from '@/lib/plans'
import { SettingsTabNav } from '@/components/features/settings/settings-tab-nav'

interface PageProps {
  searchParams: Promise<{ success?: string; canceled?: string }>
}

export default async function BillingPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const subscription = await getSubscriptionByUserId(user.id)
  const plan = subscription?.plan ?? 'free'
  const status = subscription?.status ?? 'active'
  const currentPeriodEnd = subscription?.currentPeriodEnd
  const hasStripe = !!subscription?.stripeCustomerId

  const params = await searchParams
  const showSuccess = params.success === '1'
  const showCanceled = params.canceled === '1'

  const planBadgeClass =
    plan === 'business'
      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
      : plan === 'pro'
        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
        : 'bg-muted text-muted-foreground'

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6 sm:p-8">
      {/* Page header */}
      <h1 className="text-2xl font-extrabold tracking-tight mb-6">Paramètres</h1>
      <SettingsTabNav />

      {/* Banners */}
      {showSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Paiement effectué — votre plan a été mis à jour.
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
              {plan === 'free'
                ? `${PLAN_LIMITS[plan].analyses} analyse à vie`
                : `${PLAN_LIMITS[plan].analyses} analyses / mois`}
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

      {/* Offres disponibles */}
      {plan === 'free' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <PlanCard
            name="Pro"
            price="49"
            sites={3}
            analyses={4}
            action={createCheckoutSession.bind(null, 'pro')}
            highlighted
          />
          <PlanCard
            name="Business"
            price="149"
            sites={10}
            analyses={30}
            action={createCheckoutSession.bind(null, 'business')}
          />
        </div>
      )}

      {plan === 'pro' && (
        <div className="grid gap-4 sm:grid-cols-1">
          <PlanCard
            name="Business"
            price="149"
            sites={10}
            analyses={30}
            action={createCheckoutSession.bind(null, 'business')}
            label="Passer Business"
          />
        </div>
      )}
    </div>
  )
}

function PlanCard({
  name,
  price,
  sites,
  analyses,
  action,
  highlighted = false,
  label,
}: {
  name: string
  price: string
  sites: number
  analyses: number
  action: () => Promise<void>
  highlighted?: boolean
  label?: string
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
      <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <span className="text-emerald-500 font-semibold">✓</span>
          {sites} site{sites > 1 ? 's' : ''}
        </li>
        <li className="flex items-center gap-2">
          <span className="text-emerald-500 font-semibold">✓</span>
          {analyses} analyses / mois
        </li>
      </ul>
      <form action={action} className="mt-5">
        <button
          type="submit"
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 ${
            highlighted
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
              : 'bg-foreground text-background'
          }`}
        >
          {label ?? `Passer ${name}`}
        </button>
      </form>
    </div>
  )
}
