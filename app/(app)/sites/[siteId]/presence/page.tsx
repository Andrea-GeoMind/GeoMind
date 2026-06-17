import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, RefreshCw, Globe, Lock } from 'lucide-react'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/client'
import { PLAN_FEATURES } from '@/lib/plans'
import { subscriptions } from '@/lib/db/schema'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestAnalysis } from '@/lib/db/queries/analyses'
import { getPublishersByAnalysisId } from '@/lib/db/queries/publishers'
import { getOffSitePresenceByAnalysisId } from '@/lib/db/queries/off-site-presence'
import { OFF_SITE_PLATFORMS } from '@/lib/analysis/offsite-platforms'
import { Skeleton } from '@/components/ui/skeleton'
import { PresenceList, type PresenceItem } from '@/components/features/presence/PresenceList'
import { PublishersList } from '@/components/features/publishers/PublishersList'
import { OverviewPolling } from '@/components/features/overview/overview-polling'

export const metadata: Metadata = {
  title: 'Présence off-site — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

export default async function PresencePage({ params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  const [latest, sub] = await Promise.all([
    getLatestAnalysis(siteId),
    db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, user.id),
      columns: { plan: true },
    }),
  ])

  const isFree = !PLAN_FEATURES[sub?.plan ?? 'free'].publishersFull

  if (!latest) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
          <Globe className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-2 text-lg font-extrabold tracking-tight text-foreground">
          Aucune analyse disponible
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Lancez une analyse pour diagnostiquer votre présence sur les plateformes clés du GEO.
        </p>
        <Link
          href={`/sites/${siteId}/discovery`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Lancer la découverte
        </Link>
      </div>
    )
  }

  const isInProgress = latest.status === 'pending' || latest.status === 'running'
  const isError = latest.status === 'error'
  const isSuccess = latest.status === 'success'

  const [presenceRows, publishers] = isSuccess
    ? await Promise.all([
        getOffSitePresenceByAnalysisId(latest.id),
        getPublishersByAnalysisId(latest.id),
      ])
    : [[], []]

  // La détection auto a-t-elle tourné ? (réservée aux plans payants)
  const detectionRan = presenceRows.length > 0
  const byPlatform = new Map(presenceRows.map((r) => [r.platformId, r]))

  const items: PresenceItem[] = OFF_SITE_PLATFORMS.map((platform) => {
    const row = byPlatform.get(platform.id)
    return {
      platform,
      status: row?.status ?? 'unknown',
      profileUrl: row?.profileUrl ?? null,
      evidence: row?.evidence ?? null,
    }
  })

  const presentCount = items.filter((i) => i.status === 'present').length
  const totalKey = OFF_SITE_PLATFORMS.length

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <OverviewPolling status={latest.status} />

      {/* Page header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Présence off-site</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Où les IA vous trouvent (ou pas) : votre présence sur les plateformes qui font l’autorité
          GEO, et la démarche pour combler les trous.
        </p>
      </div>

      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span>
            L&apos;analyse a échoué. {latest.errorMessage ?? 'Une erreur inattendue est survenue.'}
          </span>
        </div>
      )}

      {isInProgress && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 px-4 py-3 text-sm font-medium text-primary">
          <RefreshCw size={15} className="shrink-0 animate-spin" />
          Analyse en cours — la page se met à jour automatiquement…
        </div>
      )}

      {isInProgress ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : isSuccess ? (
        <>
          {/* Score de couverture */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Couverture des plateformes clés
              </p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
                {detectionRan ? `${presentCount} / ${totalKey}` : `— / ${totalKey}`}
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  plateformes couvertes
                </span>
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
              <Globe className="h-7 w-7 text-primary" />
            </div>
          </div>

          {/* Upsell détection auto (plan gratuit) */}
          {!detectionRan && (
            <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-5 shadow-sm">
              <Lock size={18} className="mt-0.5 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Détection automatique réservée aux plans payants
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Passez en Pro et GeoMind vérifie automatiquement, plateforme par plateforme, où
                  vous êtes déjà présent et où il vous manque une fiche. En attendant, voici les
                  plateformes clés et la démarche pour chacune.
                </p>
                <Link
                  href="/pricing"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Voir les plans
                </Link>
              </div>
            </div>
          )}

          {/* Diagnostic plateformes clés */}
          <PresenceList items={items} />

          {/* Publishers sectoriels (fusionnés depuis l'ancien onglet) */}
          {publishers.length > 0 && (
            <section className="pt-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Publishers de votre secteur
              </h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                Médias, communautés et bases publiques où vous faire mentionner pour gagner en
                autorité — sélectionnés pour {site.name}.
              </p>
              <PublishersList publishers={publishers} isFree={isFree} />
            </section>
          )}
        </>
      ) : null}
    </div>
  )
}
