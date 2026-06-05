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
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {siteList.length === 0
              ? 'Ajoutez votre premier site pour commencer.'
              : `${siteList.length} site${siteList.length > 1 ? 's' : ''} enregistré${siteList.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <SiteForm canAdd={userCanAdd} planUpgradeUrl={PLAN_UPGRADE_URLS.free} />
      </div>

      {siteList.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
            <Globe size={28} className="text-primary" />
          </div>
          <h2 className="mt-5 text-xl font-bold">Analysez votre premier site</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            En 60 secondes, découvrez si ChatGPT, Perplexity, Gemini et Claude vous citent —
            et ce que vous pouvez faire pour y apparaître.
          </p>
          <Button
            asChild
            className="mt-6 gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200 hover:from-indigo-500 hover:to-violet-500 dark:shadow-indigo-900/30"
          >
            <Link href="/onboarding">
              <Sparkles className="h-4 w-4" />
              Lancer mon audit gratuit
            </Link>
          </Button>
        </div>
      ) : (
        /* Site list */
        <div className="grid gap-3">
          {siteList.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  )
}
