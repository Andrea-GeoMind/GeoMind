import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Globe, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSitesByUserId } from '@/lib/db/queries/sites'
import { canAddSite } from '@/lib/quotas'
import { PLAN_UPGRADE_URLS } from '@/lib/plans'
import { SiteCard } from '@/components/features/sites/site-card'
import { SiteForm } from '@/components/features/sites/site-form'
import { Button } from '@/components/ui/button'

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
    <div className="p-4 sm:p-8">
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Globe size={32} className="text-primary" />
          </div>
          <h2 className="mt-5 text-xl font-bold">Analysez votre premier site</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            En 60 secondes, découvrez si ChatGPT, Perplexity, Gemini et Claude vous citent —
            et ce que vous pouvez faire pour y apparaître.
          </p>
          <Button asChild className="mt-6 gap-2">
            <Link href="/onboarding">
              <Sparkles className="h-4 w-4" />
              Lancer mon audit gratuit
            </Link>
          </Button>
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
