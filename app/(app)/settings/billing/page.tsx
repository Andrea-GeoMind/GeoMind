import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubscriptionByUserId } from '@/lib/db/queries/subscriptions'
import { createCheckoutSession, createPortalSession } from '@/app/actions/stripe'
import { PLAN_LABELS, PLAN_LIMITS } from '@/lib/plans'

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

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-gray-900">Facturation</h1>
      <p className="mb-8 text-sm text-gray-500">Gérez votre abonnement GeoMind.</p>

      {showSuccess && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Paiement effectué — votre plan a été mis à jour.
        </div>
      )}
      {showCanceled && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Paiement annulé — aucun changement apporté.
        </div>
      )}

      {/* Plan actuel */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Plan actuel
            </p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{PLAN_LABELS[plan]}</p>
            <p className="mt-1 text-sm text-gray-500">
              {PLAN_LIMITS[plan].sites} site{PLAN_LIMITS[plan].sites > 1 ? 's' : ''} ·{' '}
              {PLAN_LIMITS[plan].analyses} analyses / mois
            </p>
          </div>
          <div className="text-right">
            {status === 'active' && plan !== 'free' && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Actif
              </span>
            )}
            {status === 'past_due' && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                Paiement en retard
              </span>
            )}
            {status === 'canceled' && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                Annulé
              </span>
            )}
            {currentPeriodEnd && (
              <p className="mt-1 text-xs text-gray-400">
                Renouvellement le{' '}
                {currentPeriodEnd.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>

        {hasStripe && (
          <form
            action={createPortalSession}
            className="mt-4 border-t border-gray-100 pt-4"
          >
            <button
              type="submit"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Gérer l&apos;abonnement (changer carte, annuler…) →
            </button>
          </form>
        )}
      </div>

      {/* Offres */}
      {plan === 'free' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <PlanCard
            name="Pro"
            price="49"
            sites={5}
            analyses={30}
            action={createCheckoutSession.bind(null, 'pro')}
            highlighted
          />
          <PlanCard
            name="Business"
            price="149"
            sites={10}
            analyses={100}
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
            analyses={100}
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
      className={`rounded-xl border p-6 shadow-sm ${
        highlighted ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
      }`}
    >
      <p className="text-lg font-semibold text-gray-900">{name}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">
        {price}€<span className="text-base font-normal text-gray-500">/mois</span>
      </p>
      <ul className="mt-4 space-y-1 text-sm text-gray-600">
        <li>
          ✓ {sites} site{sites > 1 ? 's' : ''}
        </li>
        <li>✓ {analyses} analyses / mois</li>
      </ul>
      <form action={action} className="mt-5">
        <button
          type="submit"
          className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            highlighted
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {label ?? `Passer ${name}`}
        </button>
      </form>
    </div>
  )
}
