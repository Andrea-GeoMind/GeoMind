import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSitesByUserId } from '@/lib/db/queries/sites'
import { canAddSite } from '@/lib/quotas'
import { PLAN_UPGRADE_URLS } from '@/lib/plans'
import { SiteCard } from '@/components/features/sites/site-card'
import { SiteForm } from '@/components/features/sites/site-form'

export const metadata: Metadata = {
  title: 'Tableau de bord — GEOMIND',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [siteList, userCanAdd] = await Promise.all([
    getSitesByUserId(user.id),
    canAddSite(user.id),
  ])

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {siteList.length === 0
              ? 'Ajoutez votre premier site pour commencer.'
              : `${siteList.length} site${siteList.length > 1 ? 's' : ''} enregistré${siteList.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <SiteForm canAdd={userCanAdd} planUpgradeUrl={PLAN_UPGRADE_URLS.free} />
      </div>

      {siteList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">Aucun site pour l&apos;instant.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {siteList.map((site) => (
            <li key={site.id}>
              <SiteCard site={site} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
