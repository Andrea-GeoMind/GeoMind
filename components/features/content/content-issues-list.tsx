'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { ContentIssueCard, type ContentIssueRow } from './content-issue-card'
import { ContentRecommendationSheet } from './content-recommendation-sheet'

const CATEGORY_LABELS: Record<ContentIssueRow['category'], string> = {
  readability: 'Lisibilité',
  metadata: 'Métadonnées',
  structure: 'Structure',
  coverage: 'Couverture',
}

const CATEGORY_ORDER: ContentIssueRow['category'][] = [
  'readability',
  'metadata',
  'structure',
  'coverage',
]

interface ContentIssuesListProps {
  issues: ContentIssueRow[]
  isPro: boolean
  isBusiness: boolean
}

export function ContentIssuesList({ issues, isPro, isBusiness }: ContentIssuesListProps) {
  const [selected, setSelected] = useState<ContentIssueRow | null>(null)

  const grouped = CATEGORY_ORDER.reduce<Record<string, ContentIssueRow[]>>((acc, cat) => {
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
          Votre site respecte toutes les règles GEO de contenu analysées.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {(Object.entries(grouped) as [ContentIssueRow['category'], ContentIssueRow[]][]).map(
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
                  <ContentIssueCard key={issue.id} issue={issue} onClick={setSelected} />
                ))}
              </div>
            </section>
          ),
        )}
      </div>

      <ContentRecommendationSheet
        issue={selected}
        isPro={isPro}
        isBusiness={isBusiness}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
