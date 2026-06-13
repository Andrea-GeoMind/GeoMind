import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { MessageSquareQuote, AlertTriangle, Info, Smile, Meh, Frown } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestReputationRun } from '@/lib/db/queries/reputation'
import {
  summarizeReputation,
  SENTIMENT_LABELS,
  type ReputationResultLite,
  type Sentiment,
} from '@/lib/analysis/reputation'
import { ENGINE_LABELS } from '@/lib/analysis/authority-table'
import { RunReputationButton } from '@/components/features/reputation/run-reputation-button'

export const metadata: Metadata = {
  title: 'Réputation — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

const SENTIMENT_ICON: Record<Sentiment, typeof Smile> = {
  positive: Smile,
  neutral: Meh,
  negative: Frown,
  unknown: Meh,
}

export default async function ReputationPage({ params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  const latest = await getLatestReputationRun(siteId)
  const running = latest?.run.status === 'pending' || latest?.run.status === 'running'
  const isError = latest?.run.status === 'error'

  const results: ReputationResultLite[] = (latest?.results ?? []).map((r) => ({
    engine: r.engine,
    sentiment: r.sentiment as Sentiment,
    knowsBusiness: r.knowsBusiness,
    claims: r.claims,
  }))
  const summary = summarizeReputation(results)
  const hasResults = latest?.run.status === 'success' && results.length > 0
  const OverallIcon = SENTIMENT_ICON[summary.overallSentiment]

  return (
    <div className="space-y-6 p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-foreground">
            <MessageSquareQuote size={18} className="text-primary" />
            Réputation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ce que les IA <strong>disent</strong> de {site.name} — et où elles se trompent.
          </p>
        </div>
        {!running && <RunReputationButton siteId={siteId} running={false} label={hasResults ? 'Relancer l’analyse' : 'Analyser ma réputation'} />}
      </div>

      {running && <RunReputationButton siteId={siteId} running />}

      {isError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{latest?.run.errorMessage ?? 'L’analyse a échoué.'}</span>
        </div>
      )}

      {/* État initial */}
      {!latest && !running && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            Découvrez ce que les IA racontent sur votre entreprise
          </p>
          <p className="mx-auto mt-1 max-w-lg text-xs text-muted-foreground">
            On demande à ChatGPT, Perplexity, Gemini et Claude ce qu’ils savent de vous, puis on
            repère les informations fausses ou contradictoires (horaires, adresse, prix). Une IA
            qui se trompe sur vous fait fuir des clients.
          </p>
        </div>
      )}

      {hasResults && (
        <>
          {/* Sentiment + couverture */}
          <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
                <OverallIcon size={22} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Tonalité dominante : {SENTIMENT_LABELS[summary.overallSentiment]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.knownByEngines.length > 0
                    ? `Connu de : ${summary.knownByEngines.map((e) => ENGINE_LABELS[e]).join(', ')}`
                    : 'Aucune IA ne connaît encore votre entreprise — premier signal à travailler.'}
                </p>
              </div>
            </div>
          </section>

          {/* Hallucinations / désaccords */}
          {summary.disagreements.length > 0 && (
            <section className="rounded-xl border border-amber-300/50 bg-amber-50 p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-amber-800">
                <AlertTriangle size={15} />
                {summary.disagreements.length} information
                {summary.disagreements.length > 1 ? 's' : ''} contradictoire
                {summary.disagreements.length > 1 ? 's' : ''} entre les IA
              </h2>
              <p className="mt-1 text-xs text-amber-700">
                Les IA ne sont pas d’accord sur ces points — au moins l’une se trompe. Corrigez
                l’info officielle sur votre site et vos fiches (Google, annuaires).
              </p>
              <div className="mt-3 space-y-3">
                {summary.disagreements.map((d) => (
                  <div key={d.type} className="rounded-lg bg-white/70 p-3">
                    <p className="text-xs font-semibold text-amber-900">{d.label}</p>
                    <ul className="mt-1 space-y-0.5">
                      {d.variants.map((v) => (
                        <li key={v.value} className="text-xs text-amber-800">
                          « {v.value} » —{' '}
                          <span className="text-amber-700">
                            {v.engines.map((e) => ENGINE_LABELS[e]).join(', ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Ce que les IA affirment */}
          {summary.claimsByType.length > 0 && (
            <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-foreground">
                Ce que les IA affirment sur vous
              </h2>
              <div className="space-y-3">
                {summary.claimsByType.map((c) => (
                  <div key={c.type} className="border-b border-border/60 pb-2 last:border-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {c.label}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {c.values.map((v) => (
                        <li key={v.value} className="text-sm text-foreground">
                          {v.value}{' '}
                          <span className="text-xs text-muted-foreground">
                            ({v.engines.map((e) => ENGINE_LABELS[e]).join(', ')})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                <Info size={13} className="mt-0.5 shrink-0" />
                Vérifiez chaque ligne : si une info est fausse, c’est une priorité — une IA qui
                donne un mauvais horaire ou téléphone vous coûte des clients directement.
              </p>
            </section>
          )}
        </>
      )}
    </div>
  )
}
