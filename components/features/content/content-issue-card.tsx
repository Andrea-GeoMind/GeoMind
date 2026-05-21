'use client'

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IssueSeverityBadge } from '@/components/features/technical/issue-severity-badge'
import { penaltyToSeverity } from '@/components/features/technical/issue-card'

export interface ContentIssueRow {
  id: string
  ruleKey: string
  category: 'readability' | 'metadata' | 'structure' | 'coverage'
  title: string
  description: string
  sampleUrls: string[]
  penalty: number
}

interface ContentIssueCardProps {
  issue: ContentIssueRow
  onClick: (issue: ContentIssueRow) => void
}

export function ContentIssueCard({ issue, onClick }: ContentIssueCardProps) {
  const severity = penaltyToSeverity(issue.penalty)

  return (
    <button
      type="button"
      onClick={() => onClick(issue)}
      className={cn(
        'w-full rounded-xl border border-border bg-card px-4 py-3.5',
        'flex items-center justify-between gap-4 text-left',
        'transition-all hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-semibold text-foreground">{issue.title}</p>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{issue.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <IssueSeverityBadge severity={severity} />
        <ChevronRight size={15} className="text-muted-foreground/60" />
      </div>
    </button>
  )
}
