'use client'

import { useState } from 'react'
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
}

export function IssuesList({ issues, isPro }: IssuesListProps) {
  const [selected, setSelected] = useState<TechnicalIssueRow | null>(null)

  const grouped = CATEGORY_ORDER.reduce<Record<string, TechnicalIssueRow[]>>((acc, cat) => {
    const items = issues.filter((i) => i.category === cat)
    if (items.length > 0) acc[cat] = items.sort((a, b) => b.penalty - a.penalty)
    return acc
  }, {})

  if (issues.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        Aucun point faible détecté — votre configuration technique est optimale.
      </p>
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
        onClose={() => setSelected(null)}
      />
    </>
  )
}
