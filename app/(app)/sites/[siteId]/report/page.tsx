import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/client'
import { subscriptions } from '@/lib/db/schema'
import { PLAN_FEATURES } from '@/lib/plans'
import { getSiteById } from '@/lib/db/queries/sites'
import { getAnalysesBySiteId } from '@/lib/db/queries/analyses'
import { getTechnicalIssuesByAnalysisId } from '@/lib/db/queries/technical-issues'
import { getContentIssuesByAnalysisId } from '@/lib/db/queries/content-issues'
import { getRollingCitationRate } from '@/lib/db/queries/citation-checks'
import { getScoreMaturity } from '@/lib/analysis/scoring'
import { NoAnalysisState } from '@/components/features/analysis/no-analysis-state'
import { PrintButton } from '@/components/features/report/print-button'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Rapport PDF — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
  searchParams: Promise<{ whitelabel?: string }>
}

const SEVERITY_LABEL: Record<string, string> = {
  major: 'Majeur',
  moderate: 'Modéré',
  minor: 'Mineur',
  opportunity: 'Opportunité',
}

export default async function ReportPage({ params, searchParams }: Props) {
  const { siteId } = await params
  const { whitelabel } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
    columns: { plan: true },
  })
  const features = PLAN_FEATURES[sub?.plan ?? 'free']

  // Gate par plan (§17.2) : 'none' → écran d'upsell honnête
  if (features.pdfExport === 'none') {
    return (
      <div className="flex flex-col items-center gap-5 px-6 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
          <Lock size={26} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Export PDF des rapports</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Générez un rapport complet à partager avec votre équipe ou votre webmaster.
            Disponible à partir du plan Pro (white-label avec votre logo sur Business).
          </p>
        </div>
        <Button
          asChild
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90"
        >
          <Link href="/settings/billing">Voir les plans</Link>
        </Button>
      </div>
    )
  }

  const analysesList = await getAnalysesBySiteId(siteId)
  const latest = analysesList.find((a) => a.status === 'success')
  if (!latest) return <NoAnalysisState siteId={siteId} />

  const [technical, content, rolling] = await Promise.all([
    getTechnicalIssuesByAnalysisId(latest.id),
    getContentIssuesByAnalysisId(latest.id),
    getRollingCitationRate(siteId, 30, 'forced'),
  ])

  const topIssues = (list: { title: string; severity: string; penalty: number }[]) =>
    [...list].sort((a, b) => b.penalty - a.penalty).slice(0, 8)

  const isWhiteLabel = features.pdfExport === 'white_label' && whitelabel === '1'
  const canWhiteLabel = features.pdfExport === 'white_label'

  const scores = [
    { label: 'Note GEO globale', value: latest.globalScore },
    { label: 'Autorité (citations IA)', value: latest.authorityScore },
    { label: 'Technique', value: latest.technicalScore },
    { label: 'Contenu', value: latest.contentScore },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 sm:p-8">
      {/* Barre d'actions — masquée à l'impression */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Rapport PDF</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cliquez sur « Télécharger en PDF » puis choisissez « Enregistrer en PDF » dans la
            fenêtre d&apos;impression.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canWhiteLabel && (
            <Link
              href={
                isWhiteLabel
                  ? `/sites/${siteId}/report`
                  : `/sites/${siteId}/report?whitelabel=1`
              }
              className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              {isWhiteLabel ? 'Afficher la marque GeoMind' : 'Version white-label'}
            </Link>
          )}
          <PrintButton />
        </div>
      </div>

      {/* ── Le rapport imprimable ── */}
      <div className="print-report space-y-8 rounded-xl border border-border bg-white p-8 shadow-sm print:rounded-none print:border-0 print:shadow-none">
        {/* En-tête */}
        <div className="flex items-start justify-between border-b border-border pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Rapport de visibilité IA
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
              {site.name}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{site.url}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>
              {new Date(latest.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            {!isWhiteLabel && <p className="mt-1 font-bold text-foreground">GEOMIND</p>}
          </div>
        </div>

        {/* Scores */}
        <section>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Scores
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {scores.map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-border p-4 text-center">
                <p className="text-3xl font-extrabold text-foreground">
                  {value ?? '—'}
                  <span className="text-sm font-medium text-muted-foreground">/100</span>
                </p>
                <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</p>
                {value !== null && (
                  <p className="mt-0.5 text-[11px] font-semibold text-foreground">
                    {getScoreMaturity(value).label}
                  </p>
                )}
              </div>
            ))}
          </div>
          {rolling.rate !== null && (
            <p className="mt-3 text-xs text-muted-foreground">
              Taux de citation moyen sur 30 jours : <strong>{rolling.rate}%</strong> (
              {rolling.cited}/{rolling.total} mesures). Les réponses des IA varient naturellement
              — la tendance compte plus que le chiffre du jour.
            </p>
          )}
        </section>

        {/* Points faibles */}
        {[
          { title: 'Points faibles techniques', list: topIssues(technical) },
          { title: 'Points faibles de contenu', list: topIssues(content) },
        ].map(({ title, list }) => (
          <section key={title}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {title}
            </h3>
            {list.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun point faible détecté. 👏</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-semibold">Problème</th>
                    <th className="py-2 pr-4 font-semibold">Sévérité</th>
                    <th className="py-2 text-right font-semibold">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((i) => (
                    <tr key={i.title} className="border-b border-border/60">
                      <td className="py-2 pr-4 text-foreground">{i.title}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {SEVERITY_LABEL[i.severity] ?? i.severity}
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {i.penalty > 0 ? `−${i.penalty} pts` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ))}

        {/* Pied de rapport */}
        {!isWhiteLabel && (
          <p className="border-t border-border pt-4 text-center text-[11px] text-muted-foreground">
            Rapport généré par GEOMIND — audit de visibilité IA pour TPE &amp; PME ·
            geomind.fr
          </p>
        )}
      </div>
    </div>
  )
}
