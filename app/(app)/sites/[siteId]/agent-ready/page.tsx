import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { Bot, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getFirecrawlPagesBySiteId } from '@/lib/db/queries/firecrawl-pages'
import { ScoreGauge } from '@/components/charts/score-gauge'
import { computeAgentReady, agentReadyLabel, type AgentCheckStatus } from '@/lib/analysis/agent-ready'
import { NoAnalysisState } from '@/components/features/analysis/no-analysis-state'

export const metadata: Metadata = {
  title: 'Agent-Ready — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

const STATUS_ICON: Record<AgentCheckStatus, typeof CheckCircle2> = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
}
const STATUS_COLOR: Record<AgentCheckStatus, string> = {
  pass: 'text-[--score-good-500]',
  warn: 'text-[--score-mid-500]',
  fail: 'text-[--score-bad-500]',
}

export default async function AgentReadyPage({ params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  const pages = await getFirecrawlPagesBySiteId(siteId)
  if (pages.length === 0) return <NoAnalysisState siteId={siteId} />

  const result = computeAgentReady(
    pages.map((p) => {
      const meta = p.metadata as Record<string, unknown> | null
      const html = typeof meta?.rawHtml === 'string' ? meta.rawHtml : null
      return { url: p.url, markdown: p.markdown, html }
    })
  )

  return (
    <div className="space-y-6 p-6 sm:p-8">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-foreground">
          <Bot size={18} className="text-primary" />
          Agent-Ready
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Demain, les IA ne se contentent plus de répondre — elles agissent. Un agent peut-il vous
          trouver, vous comprendre et vous contacter sans humain ?
        </p>
      </div>

      {/* Score */}
      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <ScoreGauge score={result.score} size="lg" />
          <div>
            <p className="text-base font-semibold text-foreground">
              {agentReadyLabel(result.score)}
            </p>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              Plus le score est élevé, plus une IA agentique (qui réserve, appelle, contacte pour
              le compte d’un utilisateur) peut interagir avec vous automatiquement. C’est un
              avantage que presque aucune entreprise n’a encore.
            </p>
          </div>
        </div>
      </section>

      {/* Checks */}
      <section className="space-y-3">
        {result.checks.map((c) => {
          const Icon = STATUS_ICON[c.status]
          return (
            <div key={c.key} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Icon size={18} className={`mt-0.5 shrink-0 ${STATUS_COLOR[c.status]}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{c.label}</p>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {c.weight} pts
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.what}</p>
                  {c.status !== 'pass' && (
                    <p className="mt-1 text-xs text-indigo-600/90">→ {c.fix}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
        <Info size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          La plupart de ces correctifs (données structurées, identité) se génèrent en un clic dans
          l’onglet <strong className="text-foreground">Studio</strong>. Le téléphone cliquable et le
          lien de réservation se règlent directement dans votre site.
        </p>
      </div>
    </div>
  )
}
