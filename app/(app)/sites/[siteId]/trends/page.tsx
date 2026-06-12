import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { TrendingUp, Radar, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getAnalysesBySiteId } from '@/lib/db/queries/analyses'
import {
  getCitationTrend,
  getRollingCitationRate,
} from '@/lib/db/queries/citation-checks'
import { TrendLineChart, type TrendSeries } from '@/components/charts/trend-line-chart'

export const metadata: Metadata = {
  title: 'Suivi — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

function formatDay(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default async function TrendsPage({ params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  const [allAnalyses, citationTrend, rolling] = await Promise.all([
    getAnalysesBySiteId(siteId),
    getCitationTrend(siteId, 90),
    getRollingCitationRate(siteId, 30, 'forced'),
  ])

  // Analyses réussies, de la plus ancienne à la plus récente
  const successful = allAnalyses
    .filter((a) => a.status === 'success' && a.globalScore !== null)
    .slice()
    .reverse()

  const scoreLabels = successful.map((a) => formatDay(a.createdAt))
  const scoreSeries: TrendSeries[] = [
    {
      label: 'Note globale',
      colorClass: 'text-indigo-600',
      values: successful.map((a) => a.globalScore),
    },
    {
      label: 'Autorité',
      colorClass: 'text-amber-500',
      values: successful.map((a) => a.authorityScore),
    },
    {
      label: 'Technique',
      colorClass: 'text-emerald-500',
      values: successful.map((a) => a.technicalScore),
    },
    {
      label: 'Contenu',
      colorClass: 'text-violet-500',
      values: successful.map((a) => a.contentScore),
    },
  ]

  const citationLabels = citationTrend.map((p) => formatDay(p.day))
  const citationSeries: TrendSeries[] = [
    {
      label: 'Taux de citation (% des mesures du jour)',
      colorClass: 'text-indigo-600',
      values: citationTrend.map((p) =>
        p.total > 0 ? Math.round((p.cited / p.total) * 100) : null
      ),
    },
  ]

  return (
    <div className="space-y-6 p-6 sm:p-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Suivi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          L&apos;évolution de la visibilité IA de {site.name} dans le temps — la tendance compte
          plus que le chiffre du jour
        </p>
      </div>

      {/* Moyenne 30 jours */}
      {rolling.rate !== null && (
        <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
              <Radar size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Taux de citation moyen sur 30 jours :{' '}
                <span className="text-2xl font-extrabold">{rolling.rate}%</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {rolling.cited} citations sur {rolling.total} mesures (analyses + surveillance
                automatique) — c&apos;est l&apos;indicateur le plus fiable de votre visibilité
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Courbe des scores */}
      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
          <TrendingUp size={16} className="text-primary" />
          Évolution de vos scores
        </h2>
        <p className="mb-5 text-xs text-muted-foreground">
          Une mesure par analyse complète ({successful.length} analyse
          {successful.length > 1 ? 's' : ''})
        </p>
        {successful.length >= 2 ? (
          <TrendLineChart labels={scoreLabels} series={scoreSeries} />
        ) : (
          <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 px-4 py-3">
            <Info size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Il faut au moins deux analyses complètes pour tracer une tendance.
              {successful.length === 1
                ? ' Relancez une analyse après avoir appliqué vos premières corrections : vous verrez ici l’effet de vos actions.'
                : ' Lancez votre première analyse depuis la Vue d’ensemble.'}
            </p>
          </div>
        )}
      </section>

      {/* Courbe des citations */}
      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
          <Radar size={16} className="text-primary" />
          Citations au fil des jours
        </h2>
        <p className="mb-5 text-xs text-muted-foreground">
          Chaque point agrège les mesures du jour (10 questions × 4 moteurs lors d&apos;une
          analyse, échantillon lors de la surveillance automatique). 90 derniers jours.
        </p>
        {citationTrend.length >= 2 ? (
          <TrendLineChart labels={citationLabels} series={citationSeries} height={150} />
        ) : (
          <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 px-4 py-3">
            <Info size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Les points de mesure s&apos;accumulent à chaque analyse et à chaque passage de la
              surveillance automatique (hebdomadaire sur les plans payants). Revenez dans
              quelques jours — la courbe se construit toute seule.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
