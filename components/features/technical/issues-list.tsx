'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { IssueCard, type TechnicalIssueRow } from './issue-card'
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

  const grouped = CATEGORY_ORDER.reduce<Record<string, TechnicalIssueRow[]>>((acc, cat) => {
    const items = issues.filter((i) => i.category === cat)
    if (items.length > 0) acc[cat] = items.sort((a, b) => b.penalty - a.penalty)
    return acc
  }, {})

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-[--score-good-100] bg-[--score-good-50] px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[--score-good-100]">
          <CheckCircle2 className="h-6 w-6 text-[--score-good-600]" />
        </div>
        <p className="font-semibold text-[--score-good-700]">Aucun point faible détecté</p>
        <p className="text-sm text-[--score-good-700]/70">
          Votre site respecte toutes les règles GEO techniques analysées.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {(Object.entries(grouped) as [TechnicalIssueRow['category'], TechnicalIssueRow[]][]).map(
          ([cat, items]) => (
            <section key={cat}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {CATEGORY_LABELS[cat]}
                <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/70">
                  ({items.length})
                </span>
              </h3>
              <div className="space-y-2">
                {items.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} onClick={setSelected} />
                ))}
              </div>
            </section>
          ),
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
