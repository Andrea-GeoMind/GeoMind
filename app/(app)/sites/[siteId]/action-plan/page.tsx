import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { ListTodo, Hammer, CheckCircle2, Info, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserCredits } from '@/lib/credits'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestAnalysis } from '@/lib/db/queries/analyses'
import { getTechnicalIssuesByAnalysisId } from '@/lib/db/queries/technical-issues'
import { getContentIssuesByAnalysisId } from '@/lib/db/queries/content-issues'
import { getActionStatesBySiteId } from '@/lib/db/queries/action-states'
import { getActionFixesByRule } from '@/lib/analysis/action-fixes.server'
import { getOffSitePresenceByAnalysisId } from '@/lib/db/queries/off-site-presence'
import { buildAuthorityActions } from '@/lib/analysis/authority-actions'
import { OFF_SITE_PLATFORMS } from '@/lib/analysis/offsite-platforms'
import { NoAnalysisState } from '@/components/features/analysis/no-analysis-state'
import { ActionCard, type ActionItem } from '@/components/features/action-plan/action-card'
import { recoverablePoints } from '@/lib/analysis/scoring'

export const metadata: Metadata = {
  title: 'Plan d’action',
}

type Props = {
  params: Promise<{ siteId: string }>
}

export default async function ActionPlanPage({ params }: Props) {
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
    const credits = await getUserCredits(user.id)
    return (
      <NoAnalysisState
        siteId={siteId}
        siteName={site.name}
        creditBalance={Number.isFinite(credits.total) ? credits.total : null}
      />
    )
  }

  const [technical, content, states, fixesByRule, offSite] = await Promise.all([
    latest.status === 'success' ? getTechnicalIssuesByAnalysisId(latest.id) : Promise.resolve([]),
    latest.status === 'success' ? getContentIssuesByAnalysisId(latest.id) : Promise.resolve([]),
    getActionStatesBySiteId(siteId),
    // Correctifs prêts à coller indexés par ruleKey (fusion Studio → Plan d'action)
    getActionFixesByRule(site),
    latest.status === 'success' ? getOffSitePresenceByAnalysisId(latest.id) : Promise.resolve([]),
  ])

  // Le plan ne lisait que Technique et Contenu : il restait muet sur
  // l'autorité, même à 0. Les actions d'autorité sont dérivées de la note et
  // des plateformes où le site est absent — pas détectées sur une page.
  const platformNameById = new Map(OFF_SITE_PLATFORMS.map((p) => [p.id, p.name]))
  const absentPlatformNames = offSite
    .filter((p) => p.status === 'absent')
    .map((p) => platformNameById.get(p.platformId) ?? p.platformId)

  const authorityActions = buildAuthorityActions({
    authorityScore: latest.status === 'success' ? (latest.authorityScore ?? null) : null,
    absentPlatformNames,
  })

  const stateByKey = new Map(states.map((s) => [`${s.ruleKey}::${s.pageUrl}`, s]))

  // Issues de la dernière analyse, enrichies de leur état durable
  const items: ActionItem[] = [
    ...technical.map((i) => ({ ...i, source: 'technical' as const })),
    ...content.map((i) => ({ ...i, source: 'content' as const })),
  ].map((i) => {
    const key = `${i.ruleKey}::${i.pageUrl ?? ''}`
    const state = stateByKey.get(key)
    return {
      ruleKey: i.ruleKey,
      pageUrl: i.pageUrl ?? '',
      source: i.source,
      title: i.title,
      description: i.description,
      penalty: i.penalty,
      severity: i.severity,
      effort: i.effort,
      impact: i.impact,
      status: (state?.status ?? 'todo') as ActionItem['status'],
      verifiedAt: state?.verifiedAt?.toISOString() ?? null,
      fix: fixesByRule[i.ruleKey],
    }
  })

  // Actions d'autorité, enrichies de leur état durable comme les autres
  const authorityItems: ActionItem[] = authorityActions.map((a) => {
    const state = stateByKey.get(`${a.ruleKey}::`)
    return {
      ruleKey: a.ruleKey,
      pageUrl: '',
      source: 'authority' as const,
      title: a.title,
      description: a.description,
      // Ces actions ne retirent pas de points : elles décrivent le travail
      // hors site, pas un défaut constaté sur une page.
      penalty: 0,
      severity: a.severity,
      effort: a.effort,
      impact: a.impact,
      status: (state?.status ?? 'todo') as ActionItem['status'],
      verifiedAt: state?.verifiedAt?.toISOString() ?? null,
    }
  })
  items.push(...authorityItems)

  // Actions vérifiées dont la règle a disparu des analyses (le succès accumulé)
  const currentKeys = new Set(items.map((i) => `${i.ruleKey}::${i.pageUrl}`))
  const verifiedGone: ActionItem[] = states
    .filter((s) => s.status === 'verified' && !currentKeys.has(`${s.ruleKey}::${s.pageUrl}`))
    .map((s) => ({
      ruleKey: s.ruleKey,
      pageUrl: s.pageUrl,
      source: s.source as ActionItem['source'],
      title: s.ruleKey,
      description: 'Cette correction a été confirmée : la règle ne se déclenche plus.',
      penalty: 0,
      severity: 'minor',
      effort: 1,
      impact: 1,
      status: 'verified',
      verifiedAt: s.verifiedAt?.toISOString() ?? null,
    }))

  // Tri « ROI » : impact fort + effort faible d'abord, puis pénalité
  const byRoi = (a: ActionItem, b: ActionItem) =>
    b.impact / Math.max(b.effort, 1) - a.impact / Math.max(a.effort, 1) || b.penalty - a.penalty

  const todo = items.filter((i) => i.status === 'todo').sort(byRoi)
  const done = items.filter((i) => i.status === 'done').sort(byRoi)
  const verified = [...items.filter((i) => i.status === 'verified'), ...verifiedGone]

  const totalHandled = done.length + verified.length
  const total = items.length + verifiedGone.length
  const remainingPenalty = todo.reduce((sum, i) => sum + i.penalty, 0)
  // Gain réel d'une correction complète : l'écart au 100 sur les deux piliers
  // notés. La somme brute des pénalités annonçait 108 points quand les notes
  // n'en laissaient que 29 à reprendre.
  const recoverable =
    (recoverablePoints(latest.technicalScore) ?? 0) +
    (recoverablePoints(latest.contentScore) ?? 0)

  const COLUMNS: { title: string; icon: typeof ListTodo; hint: string; list: ActionItem[] }[] = [
    {
      title: 'À faire',
      icon: ListTodo,
      hint: 'Triées par retour sur effort : commencez en haut',
      list: todo,
    },
    {
      title: 'Fait — à vérifier',
      icon: Hammer,
      hint: 'Vérifié automatiquement à votre prochaine analyse',
      list: done,
    },
    {
      title: 'Vérifié',
      icon: CheckCircle2,
      hint: 'Corrections confirmées par une analyse',
      list: verified,
    },
  ]

  return (
    <div className="space-y-6 p-6 sm:p-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">
          Plan d&apos;action
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos corrections, une par une — GeoMind vérifie automatiquement celles que vous déclarez
          faites
        </p>
      </div>

      {/* Progression */}
      {total > 0 && (
        <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">
              {totalHandled}/{total} action{total > 1 ? 's' : ''} traitée
              {totalHandled > 1 ? 's' : ''}
            </p>
            {remainingPenalty > 0 && recoverable > 0 && (
              <p className="text-xs text-muted-foreground">
                Jusqu&apos;à <strong className="text-foreground">{recoverable} points</strong> à
                récupérer sur vos notes Technique et Contenu
              </p>
            )}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
              style={{ width: `${total > 0 ? Math.round((totalHandled / total) * 100) : 0}%` }}
            />
          </div>
        </section>
      )}

      {latest.status !== 'success' && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 px-4 py-3 text-sm font-medium text-primary">
          <RefreshCw size={15} className="shrink-0 animate-spin" />
          Analyse en cours — votre plan d&apos;action se met à jour à la fin
        </div>
      )}

      {total === 0 && latest.status === 'success' ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <Info size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Aucun point faible détecté à la dernière analyse — votre plan d&apos;action est vide, et
            c&apos;est une excellente nouvelle.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map(({ title, icon: Icon, hint, list }) => (
            <section key={title} className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="mb-3 px-1">
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <Icon size={14} className="text-primary" />
                  {title}
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {list.length}
                  </span>
                </h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
              </div>
              <div className="space-y-3">
                {list.map((item) => (
                  <ActionCard
                    key={`${item.source}-${item.ruleKey}-${item.pageUrl}`}
                    siteId={siteId}
                    item={item}
                  />
                ))}
                {list.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-muted-foreground/60">
                    Rien ici pour l&apos;instant
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
