'use client'

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IssueSeverityBadge, type IssueSeverity } from './issue-severity-badge'

export interface TechnicalIssueRow {
  id: string
  ruleKey: string
  category: 'accessibility' | 'structure' | 'schema_org' | 'performance'
  title: string
  description: string
  sampleUrls: string[]
  penalty: number
}

export function penaltyToSeverity(penalty: number): IssueSeverity {
  if (penalty >= 15) return 'critical'
  if (penalty >= 10) return 'high'
  if (penalty >= 5) return 'medium'
  return 'low'
}

interface IssueCardProps {
  issue: TechnicalIssueRow
  onClick: (issue: TechnicalIssueRow) => void
}

export function IssueCard({ issue, onClick }: IssueCardProps) {
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
