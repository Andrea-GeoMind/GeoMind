import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Globe, ChevronLeft, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestAnalysis, getLatestSuccessfulAnalyses } from '@/lib/db/queries/analyses'
import { SiteTabs } from '@/components/features/sites/site-tabs'
import { AnalysisLockInit } from '@/components/features/analysis/analysis-lock-init'
import { CoachSiteBinding } from '@/components/features/coach/coach-site-binding'

type Props = {
  children: React.ReactNode
  params: Promise<{ siteId: string }>
}

export default async function SiteLayout({ children, params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [site, latestAnalysis, successfulAnalyses] = await Promise.all([
    getSiteById(siteId),
    getLatestAnalysis(siteId),
    getLatestSuccessfulAnalyses(siteId, 1),
  ])
  if (!site || site.userId !== user.id) notFound()

  const isInProgress =
    latestAnalysis?.status === 'pending' || latestAnalysis?.status === 'running'

  const latestSuccess = successfulAnalyses[0] ?? null

  return (
    <div className="flex flex-col">
      {isInProgress && latestAnalysis && (
        <AnalysisLockInit
          analysisId={latestAnalysis.id}
          siteId={siteId}
          siteName={site.name}
        />
      )}

      {/* Enregistre le site courant pour GEO (bouton flottant + chips, §16.5) */}
      <CoachSiteBinding
        siteId={siteId}
        hasAnalysis={latestSuccess !== null}
        globalScore={latestSuccess?.globalScore ?? null}
        technicalScore={latestSuccess?.technicalScore ?? null}
        contentScore={latestSuccess?.contentScore ?? null}
      />

      {/* Site header */}
      <div className="border-b border-border bg-card px-6 py-4">
        {/* Breadcrumb */}
        <Link
          href="/dashboard"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Tableau de bord
        </Link>

        {/* Site identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
            <Globe className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold tracking-tight">{site.name}</h1>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 truncate text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {site.url}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <SiteTabs siteId={siteId} />

      <div className="flex-1">{children}</div>
    </div>
  )
}
