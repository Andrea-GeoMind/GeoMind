'use client'

import { useState } from 'react'
import { CheckCircle2, Zap, Sparkles, FileText, ChevronDown } from 'lucide-react'
import { IssueCard, isQuickWinRow, type TechnicalIssueRow } from './issue-card'
import { RecommendationSheet } from '@/components/features/coach/recommendation-sheet'

const CATEGORY_LABELS: Record<TechnicalIssueRow['category'], string> = {
  accessibility: 'Accessibilité',
  structure: 'Structure',
  schema_org: 'Schema.org',
  performance: 'Performance',
}

const CATEGORY_ORDER: TechnicalIssueRow['category'][] = [
  'accessibility',
  'structure',
  'schema_org',
  'performance',
]

interface IssuesListProps {
  issues: TechnicalIssueRow[]
  isPro: boolean
  isBusiness: boolean
}

export function IssuesList({ issues, isPro, isBusiness }: IssuesListProps) {
  const [selected, setSelected] = useState<TechnicalIssueRow | null>(null)

  const opportunities = issues.filter((i) => i.severity === 'opportunity')
  const realIssues = issues.filter((i) => i.severity !== 'opportunity')
  const quickWins = realIssues
    .filter(isQuickWinRow)
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))
    .slice(0, 3)

  const siteIssues = realIssues.filter((i) => !i.pageUrl)
  const pageIssues = realIssues.filter((i) => i.pageUrl)

  const grouped = CATEGORY_ORDER.reduce<Record<string, TechnicalIssueRow[]>>((acc, cat) => {
    const items = siteIssues.filter((i) => i.category === cat)
    if (items.length > 0) acc[cat] = items.sort((a, b) => b.penalty - a.penalty)
    return acc
  }, {})

  // Issues de page groupées par URL (§18.7) — pages les plus touchées d'abord
  const byPage = new Map<string, TechnicalIssueRow[]>()
  for (const issue of pageIssues) {
    const key = issue.pageUrl as string
    if (!byPage.has(key)) byPage.set(key, [])
    byPage.get(key)!.push(issue)
  }
  const pageGroups = [...byPage.entries()].sort((a, b) => b[1].length - a[1].length)

  return (
    <>
      <div className="space-y-8">
        {/* Quick wins — facile et rentable, à corriger en premier (§18.7) */}
        {quickWins.length > 0 && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Zap size={15} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-emerald-900">
                Commencez ici — corrections rapides à fort impact
              </h3>
            </div>
            <div className="space-y-2">
              {quickWins.map((issue) => (
                <IssueCard key={issue.id} issue={issue} onClick={setSelected} />
              ))}
            </div>
          </section>
        )}

        {/* Aucun point faible */}
        {realIssues.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-[--score-good-200] bg-[--score-good-50] px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[--score-good-100]">
              <CheckCircle2 className="h-6 w-6 text-[--score-good-600]" />
            </div>
            <p className="font-semibold text-[--score-good-800]">Aucun point faible détecté</p>
            <p className="text-sm text-[--score-good-700]/80">
              Votre site respecte toutes les règles GEO techniques analysées. Jetez un œil aux
              pistes ci-dessous pour aller plus loin.
            </p>
          </div>
        )}

        {/* Vue globale — issues au niveau site */}
        {Object.keys(grouped).length > 0 && (
          <div className="space-y-8">
            {(Object.entries(grouped) as [TechnicalIssueRow['category'], TechnicalIssueRow[]][]).map(
              ([cat, items]) => (
                <section key={cat}>
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {CATEGORY_LABELS[cat]}
                    </h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} onClick={setSelected} />
                    ))}
                  </div>
                </section>
              ),
            )}
          </div>
        )}

        {/* Analyse page par page (§18.2) */}
        {pageGroups.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileText size={13} className="text-muted-foreground" />
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Analyse page par page
              </h3>
            </div>
            <div className="space-y-2">
              {pageGroups.map(([url, items]) => (
                <details
                  key={url}
                  className="group rounded-xl border border-border bg-card"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {pagePath(url)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {items.length} point{items.length > 1 ? 's' : ''} faible
                        {items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <ChevronDown
                      size={15}
                      className="shrink-0 text-muted-foreground/60 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <div className="space-y-2 border-t border-border p-3">
                    {items
                      .sort((a, b) => b.penalty - a.penalty)
                      .map((issue) => (
                        <IssueCard key={issue.id} issue={issue} onClick={setSelected} />
                      ))}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Pour aller plus loin — opportunités sans pénalité (§18.6) */}
        {opportunities.length > 0 && (
          <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-violet-50/60 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={15} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-indigo-900">Pour aller plus loin</h3>
              <span className="text-xs text-indigo-700/70">
                Des pistes bonus — elles ne pénalisent pas votre score
              </span>
            </div>
            <div className="space-y-2">
              {opportunities.map((issue) => (
                <IssueCard key={issue.id} issue={issue} onClick={setSelected} />
              ))}
            </div>
          </section>
        )}
      </div>

      <RecommendationSheet
        issue={selected}
        isPro={isPro}
        isBusiness={isBusiness}
        onClose={() => setSelected(null)}
      />
    </>
  )
}

function pagePath(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname === '/' ? `Accueil (${u.hostname})` : u.pathname
  } catch {
    return url
  }
}
