import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft, ExternalLink, FileDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SiteLogo } from '@/components/features/sites/site-logo'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestAnalysis, getLatestSuccessfulAnalyses } from '@/lib/db/queries/analyses'
import { SiteNav } from '@/components/features/sites/site-nav'
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
          <SiteLogo
            url={site.url}
            name={site.name}
            className="ring-primary/20"
            iconClassName="h-5 w-5 text-primary"
          />
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
          {/* Export PDF (PLAN item 24) — la page gère le gate par plan */}
          <Link
            href={`/sites/${siteId}/report`}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Rapport PDF</span>
          </Link>
        </div>
      </div>

      {/* Navigation du site : sidebar groupée (desktop) / barre horizontale (mobile) */}
      <div className="flex flex-1 flex-col lg:flex-row">
        <SiteNav siteId={siteId} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
