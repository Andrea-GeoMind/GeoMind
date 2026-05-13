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
        'w-full rounded-lg border border-border bg-card px-4 py-3',
        'flex items-center justify-between gap-4 text-left',
        'transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium text-foreground">{issue.title}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{issue.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <IssueSeverityBadge severity={severity} />
        <ChevronRight size={16} className="text-muted-foreground" />
      </div>
    </button>
  )
}
