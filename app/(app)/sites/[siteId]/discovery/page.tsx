import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { Info, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getSiteMetadataBySiteId } from '@/lib/db/queries/site-metadata'
import { getCompetitorsBySiteId } from '@/lib/db/queries/competitors'
import { getPromptsBySiteId } from '@/lib/db/queries/prompts'
import { DescriptionEditor } from '@/components/features/discovery/DescriptionEditor'
import { KeywordsEditor } from '@/components/features/discovery/KeywordsEditor'
import { CompetitorsEditor } from '@/components/features/discovery/CompetitorsEditor'
import { PromptsEditor } from '@/components/features/discovery/PromptsEditor'
import { RunAnalysisButton } from '@/components/features/analysis/RunAnalysisButton'

export const metadata: Metadata = {
  title: 'Découverte — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

export default async function DiscoveryPage({ params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  const [siteMetadata, competitors, prompts] = await Promise.all([
    getSiteMetadataBySiteId(siteId),
    getCompetitorsBySiteId(siteId),
    getPromptsBySiteId(siteId),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Découverte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {site.name} — {site.url}
        </p>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 px-4 py-3.5">
        <Info size={15} className="mt-0.5 shrink-0 text-primary" />
        <p className="text-sm leading-relaxed text-foreground/80">
          <span className="font-semibold text-foreground">
            Plus vos prompts sont neutres, plus l&apos;analyse GEO est fiable.
          </span>{' '}
          Les prompts mentionnant votre domaine ou marque sont exclus du calcul — ils orienteraient
          les IAs vers votre site spécifiquement, biaisant le score.
        </p>
      </div>

      {!siteMetadata ? (
        /* Empty state — no analysis yet */
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <p className="font-extrabold tracking-tight text-foreground">Aucune analyse lancée pour ce site</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              GeoMind va crawler votre site, détecter votre activité et interroger les 4 moteurs IA
              (ChatGPT, Claude, Gemini, Perplexity) pour mesurer votre visibilité GEO.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <RunAnalysisButton siteId={siteId} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <DescriptionEditor siteId={siteId} initialValue={siteMetadata.description ?? ''} />
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <KeywordsEditor siteId={siteId} initialKeywords={siteMetadata.keywords} />
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <CompetitorsEditor
              siteId={siteId}
              initialCompetitors={competitors.map((c) => ({
                id: c.id,
                url: c.url,
                name: c.name,
              }))}
            />
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <PromptsEditor
              siteId={siteId}
              siteUrl={site.url}
              siteName={site.name}
              initialPrompts={prompts.map((p) => ({
                id: p.id,
                text: p.text,
                isNeutral: p.isNeutral,
              }))}
            />
          </section>

          {/* CTA section */}
          <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-6 shadow-sm">
            <h2 className="mb-1 text-base font-extrabold tracking-tight text-foreground">
              Prêt à lancer l&apos;analyse ?
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              GEOMIND va interroger les 4 moteurs IA (ChatGPT, Claude, Gemini, Perplexity) avec vos
              prompts neutres et analyser où votre site est cité.
            </p>
            <RunAnalysisButton siteId={siteId} />
          </section>
        </div>
      )}
    </div>
  )
}
