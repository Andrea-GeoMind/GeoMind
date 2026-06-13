import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { Swords, Info, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestAnalysis } from '@/lib/db/queries/analyses'
import { getAuthorityResultsByAnalysisId } from '@/lib/db/queries/authority-results'
import { getCompetitorsBySiteId } from '@/lib/db/queries/competitors'
import { analyzeCompetitors } from '@/lib/analysis/competitors'
import type { AuthorityResultRow } from '@/lib/analysis/authority-table'
import { ENGINE_LABELS } from '@/lib/analysis/authority-table'
import { NoAnalysisState } from '@/components/features/analysis/no-analysis-state'

export const metadata: Metadata = {
  title: 'Concurrents — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

export default async function CompetitorsPage({ params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  const latest = await getLatestAnalysis(siteId)
  if (!latest) return <NoAnalysisState siteId={siteId} />

  const [rawResults, declared] = await Promise.all([
    latest.status === 'success'
      ? getAuthorityResultsByAnalysisId(latest.id)
      : Promise.resolve([]),
    getCompetitorsBySiteId(siteId),
  ])

  const results: AuthorityResultRow[] = rawResults.map((r) => ({
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
    prompt: { id: r.prompt.id, text: r.prompt.text, isNeutral: r.prompt.isNeutral },
  }))

  const analysis = analyzeCompetitors(
    results,
    site.url,
    declared.map((c) => ({ url: c.url, name: c.name })),
  )

  const maxShare = Math.max(...analysis.standings.map((s) => s.shareOfVoice), 1)

  return (
    <div className="space-y-6 p-6 sm:p-8">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-foreground">
          <Swords size={18} className="text-primary" />
          Concurrents
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sur les questions de votre secteur, qui les IA citent-elles le plus — vous, ou vos
          concurrents ?
        </p>
      </div>

      {latest.status !== 'success' ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <Info size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Le classement concurrentiel s’affichera dès que votre analyse sera terminée.
          </p>
        </div>
      ) : analysis.totalResponses === 0 ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <Info size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Aucune réponse exploitable pour ce classement. Relancez une analyse pour collecter les
            citations.
          </p>
        </div>
      ) : (
        <>
          {/* Verdict client */}
          <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
                <Trophy size={22} className="text-primary" />
              </div>
              <div>
                {analysis.clientRank !== null ? (
                  <p className="text-sm font-semibold text-foreground">
                    Vous êtes <span className="text-2xl font-extrabold">{analysis.clientRank}</span>
                    <sup>{analysis.clientRank === 1 ? 'er' : 'e'}</sup> sur{' '}
                    {analysis.standings.filter((s) => s.citedResponses > 0).length} acteurs cités —
                    part de voix {analysis.clientStanding?.shareOfVoice ?? 0}%
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-foreground">
                    Vous n’êtes encore cité sur aucune des questions testées.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Sur {analysis.totalResponses} réponses IA analysées. La part de voix = pourcentage
                  de réponses où le domaine apparaît.
                </p>
              </div>
            </div>
          </section>

          {/* Classement */}
          <section className="space-y-3">
            {analysis.standings.map((s) => (
              <div
                key={s.domain}
                className={
                  s.kind === 'client'
                    ? 'rounded-xl border-2 border-primary/40 bg-indigo-50/40 p-4 shadow-sm'
                    : 'rounded-xl border border-border bg-card p-4 shadow-sm'
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{s.label}</span>
                    {s.kind === 'client' && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Vous
                      </span>
                    )}
                    {s.kind === 'declared' && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Concurrent déclaré
                      </span>
                    )}
                    {s.kind === 'discovered' && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
                        Découvert
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-extrabold text-foreground">{s.shareOfVoice}%</span>
                </div>

                {/* Barre de part de voix */}
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={
                      s.kind === 'client'
                        ? 'h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500'
                        : 'h-full rounded-full bg-muted-foreground/40'
                    }
                    style={{ width: `${Math.round((s.shareOfVoice / maxShare) * 100)}%` }}
                  />
                </div>

                {s.citedResponses > 0 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Cité par : <strong>{s.engines.map((e) => ENGINE_LABELS[e]).join(', ')}</strong>
                    </span>
                    {s.sampleUrls.length > 0 && s.kind !== 'client' && (
                      <span className="truncate">
                        Page citée :{' '}
                        <a
                          href={s.sampleUrls[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-foreground"
                        >
                          {s.sampleUrls[0].replace(/^https?:\/\//, '').slice(0, 50)}
                        </a>
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {s.kind === 'client'
                      ? 'Jamais cité sur les questions testées — votre marge de progression.'
                      : 'Pas cité non plus sur ces questions.'}
                  </p>
                )}
              </div>
            ))}
          </section>

          {/* Conseil actionnable */}
          <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <Info size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Comment les rattraper ?</strong> Ouvrez les pages
              citées de vos concurrents (liens ci-dessus) : repérez ce qu’ils ont et qu’il vous
              manque (FAQ, avis, page détaillée, données chiffrées), puis appliquez les correctifs
              proposés dans votre <strong className="text-foreground">Plan d’action</strong>.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
