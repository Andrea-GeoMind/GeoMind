import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestAnalysis } from '@/lib/db/queries/analyses'
import { getAuthorityResultsByAnalysisId } from '@/lib/db/queries/authority-results'
import { buildEngineStats, buildCrossTable } from '@/lib/analysis/authority-table'
import type { AuthorityResultRow } from '@/lib/analysis/authority-table'
import { ScoreGauge } from '@/components/charts/score-gauge'
import { Skeleton } from '@/components/ui/skeleton'
import { CitationsBarChart } from '@/components/features/authority/citations-bar-chart'
import { CitationsTable } from '@/components/features/authority/citations-table'
import { RunAuthorityButton } from '@/components/features/authority/run-authority-button'
import { OverviewPolling } from '@/components/features/overview/overview-polling'
import { RetryAnalysisButton } from '@/components/features/overview/retry-analysis-button'
import { NoAnalysisState } from '@/components/features/analysis/no-analysis-state'

export const metadata: Metadata = {
  title: 'Autorité — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default async function AuthorityPage({ params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  const latest = await getLatestAnalysis(siteId)

  if (!latest) {
    return <NoAnalysisState siteId={siteId} />
  }

  const isInProgress = latest.status === 'pending' || latest.status === 'running'
  const isError = latest.status === 'error'

  const rawResults =
    latest.status === 'success'
      ? await getAuthorityResultsByAnalysisId(latest.id)
      : []

  const mappedResults: AuthorityResultRow[] = rawResults.map((r) => ({
    id: r.id,
    engine: r.engine,
    answer: r.answer,
    promptIsNeutral: r.promptIsNeutral,
    partialResponse: r.partialResponse,
    sources: r.sources.map((s) => ({
      id: s.id,
      url: s.url,
      title: s.title,
      domain: s.domain,
      isClientDomain: s.isClientDomain,
    })),
    prompt: {
      id: r.prompt.id,
      text: r.prompt.text,
      isNeutral: r.prompt.isNeutral,
    },
  }))

  const engineStats = buildEngineStats(mappedResults)
  const crossTableRows = buildCrossTable(mappedResults)
  const clientDomain = extractDomain(site.url)

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <OverviewPolling status={latest.status} />

      {/* Error banner */}
      {isError && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">
            L&apos;analyse a échoué.{' '}
            {latest.errorMessage ?? 'Une erreur inattendue est survenue.'}
          </span>
          <RetryAnalysisButton siteId={siteId} />
        </div>
      )}

      {/* Running banner */}
      {isInProgress && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 px-4 py-3 text-sm font-medium text-primary">
          <RefreshCw size={15} className="shrink-0 animate-spin" />
          Analyse en cours — la page se met à jour automatiquement…
        </div>
      )}

      {/* Score Autorité hero card */}
      <section className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Score Autorité
        </p>
        {isInProgress ? (
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-40 w-40 rounded-full" />
            <Skeleton className="h-3 w-28 rounded-full" />
          </div>
        ) : latest.authorityScore !== null ? (
          <ScoreGauge score={latest.authorityScore} size="lg" />
        ) : (
          <p className="text-sm text-muted-foreground">Score non disponible</p>
        )}
      </section>

      {/* Citations bar chart */}
      {isInProgress ? (
        <Skeleton className="h-52 rounded-2xl" />
      ) : latest.status === 'success' ? (
        <CitationsBarChart stats={engineStats} />
      ) : null}

      {/* Cross-table */}
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Réponses par prompt et par IA
        </h2>
        {isInProgress ? (
          <div className="space-y-2">
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
          </div>
        ) : latest.status === 'success' ? (
          <CitationsTable rows={crossTableRows} clientDomain={clientDomain} />
        ) : null}
      </section>

      {/* Relaunch section */}
      <section className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-6 py-5 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-foreground">Nouvelle analyse Autorité</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Relance uniquement la phase Autorité (prompts × moteurs IA).
          </p>
        </div>
        <RunAuthorityButton siteId={siteId} />
      </section>
    </div>
  )
}
