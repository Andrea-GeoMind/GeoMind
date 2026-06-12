'use client'

import { ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { explainJargon } from '@/lib/analysis/glossary'
import { useCoach } from '@/components/features/coach/coach-provider'
import { IssueSeverityBadge } from '@/components/features/technical/issue-severity-badge'
import { displaySeverity, type DbIssueSeverity } from '@/components/features/technical/issue-card'

export interface ContentIssueRow {
  id: string
  ruleKey: string
  category: 'readability' | 'metadata' | 'structure' | 'coverage'
  title: string
  description: string
  sampleUrls: string[]
  penalty: number
  /** Champs V2 (§18) — absents sur les analyses antérieures à la V2 */
  severity?: DbIssueSeverity
  effort?: number
  impact?: number
  pageUrl?: string | null
}

interface ContentIssueCardProps {
  issue: ContentIssueRow
  onClick: (issue: ContentIssueRow) => void
}

export function ContentIssueCard({ issue, onClick }: ContentIssueCardProps) {
  const severity = displaySeverity(issue)
  const { openWithIssue } = useCoach()

  // Carte cliquable (ouvre la fiche de recommandation) avec un bouton GEO
  // imbriqué : le conteneur est un div role="button" pour éviter un <button>
  // dans un <button> (HTML invalide).
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(issue)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(issue)
        }
      }}
      className={cn(
        'w-full cursor-pointer rounded-xl border border-border bg-card px-4 py-3.5',
        'flex items-center justify-between gap-4 text-left',
        'transition-all hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-semibold text-foreground">{issue.title}</p>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{issue.description}</p>
        {explainJargon(issue.title) && (
          <p className="text-[11px] leading-relaxed text-indigo-600/90">
            💡 {explainJargon(issue.title)}
          </p>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            openWithIssue({ title: issue.title, description: issue.description })
          }}
          onKeyDown={(e) => e.stopPropagation()}
          className="mt-0.5 inline-flex items-center gap-1 rounded text-[11px] font-semibold text-indigo-600 transition-colors hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Sparkles size={11} aria-hidden />
          Demander à GEO
        </button>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <IssueSeverityBadge severity={severity} />
        <ChevronRight size={15} className="text-muted-foreground/60" />
      </div>
    </div>
  )
}
