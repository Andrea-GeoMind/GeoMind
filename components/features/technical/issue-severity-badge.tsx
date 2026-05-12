import { cn } from '@/lib/utils'

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low'

interface IssueSeverityBadgeProps {
  severity: IssueSeverity
  className?: string
}

const SEVERITY_CONFIG: Record<
  IssueSeverity,
  { label: string; dot: string; badge: string }
> = {
  critical: {
    label: 'Critique',
    dot: 'bg-[--score-bad-500]',
    badge: 'bg-[--score-bad-50] text-[--score-bad-700] ring-[--score-bad-100]',
  },
  high: {
    label: 'Élevée',
    dot: 'bg-[--score-mid-500]',
    badge: 'bg-[--score-mid-50] text-[--score-mid-700] ring-[--score-mid-100]',
  },
  medium: {
    label: 'Moyenne',
    dot: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  low: {
    label: 'Faible',
    dot: 'bg-muted-foreground',
    badge: 'bg-muted text-muted-foreground ring-border',
  },
}

export function IssueSeverityBadge({ severity, className }: IssueSeverityBadgeProps) {
  const cfg = SEVERITY_CONFIG[severity]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        'ring-1 ring-inset',
        cfg.badge,
        className,
      )}
    >
      <span
        className={cn('size-1.5 rounded-full flex-shrink-0', cfg.dot)}
        aria-hidden
      />
      {cfg.label}
    </span>
  )
}
