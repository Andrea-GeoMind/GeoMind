import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { Info } from 'lucide-react'
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Découverte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {site.name} — {site.url}
        </p>
      </div>

      <div className="flex gap-3 rounded-lg border border-[--brand-blue-100] bg-[--brand-blue-50] px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-[--brand-blue-500]" />
        <p className="text-sm text-[--brand-blue-700]">
          <span className="font-medium">
            💡 Plus vos prompts sont neutres, plus l&apos;analyse GEO est fiable.
          </span>{' '}
          Les prompts mentionnant votre domaine ou marque sont exclus du calcul — ils orienteraient
          les IAs vers votre site spécifiquement, biaisant le score.
        </p>
      </div>

      {!siteMetadata ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
          L&apos;analyse de découverte n&apos;a pas encore été lancée pour ce site.
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <DescriptionEditor siteId={siteId} initialValue={siteMetadata.description ?? ''} />
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <KeywordsEditor siteId={siteId} initialKeywords={siteMetadata.keywords} />
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <CompetitorsEditor
              siteId={siteId}
              initialCompetitors={competitors.map((c) => ({
                id: c.id,
                url: c.url,
                name: c.name,
              }))}
            />
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
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

          <section className="rounded-xl border border-[--brand-blue-200] bg-[--brand-blue-50] p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-[--brand-blue-800]">
              Prêt à lancer l&apos;analyse ?
            </h2>
            <p className="mb-4 text-sm text-[--brand-blue-700]">
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
