'use client'

import { cn } from '@/lib/utils'
import { getScoreMaturity } from '@/lib/analysis/scoring'
import { TrendingUp, TrendingDown, Minus, Shield, Wrench, FileText, BarChart2, ArrowRight } from 'lucide-react'

type Pillar = 'authority' | 'technical' | 'content' | 'global'
type Trend = 'up' | 'down' | 'stable'

interface ScoreCardProps {
  pillar: Pillar
  score: number
  delta?: number
  trend?: Trend
  className?: string
  onClick?: () => void
  /** Pass `true` from a Server Component to get hover styles without needing an onClick function. */
  clickable?: boolean
}

const PILLAR_LABELS: Record<Pillar, string> = {
  global: 'Score GEO',
  authority: 'Autorité',
  technical: 'Technique',
  content: 'Contenu',
}

const PILLAR_SUBLABELS: Record<Pillar, string> = {
  global: 'Score global',
  authority: 'Citations IA',
  technical: 'Lisibilité IA',
  content: 'Pertinence',
}

const PILLAR_ICONS: Record<Pillar, React.ElementType> = {
  global: BarChart2,
  authority: Shield,
  technical: Wrench,
  content: FileText,
}

const SCORE_BAR_COLORS: Record<string, string> = {
  expert: 'bg-[--score-good-500]',
  advanced: 'bg-[--score-good-500]',
  progressing: 'bg-[--score-mid-500]',
  beginner: 'bg-[--score-bad-500]',
}

const SCORE_TEXT_COLORS: Record<string, string> = {
  expert: 'text-[--score-good-600]',
  advanced: 'text-[--score-good-600]',
  progressing: 'text-[--score-mid-600]',
  beginner: 'text-[--score-bad-600]',
}

const MATURITY_BADGE_COLORS: Record<string, string> = {
  expert: 'text-[--score-good-600] bg-[--score-good-50]',
  advanced: 'text-[--score-good-600] bg-[--score-good-50]',
  progressing: 'text-[--score-mid-600] bg-[--score-mid-50]',
  beginner: 'text-[--score-bad-600] bg-[--score-bad-50]',
}

export function ScoreCard({
  pillar,
  score,
  delta,
  trend,
  className,
  onClick,
  clickable,
}: ScoreCardProps) {
  const label = PILLAR_LABELS[pillar]
  const sublabel = PILLAR_SUBLABELS[pillar]
  const Icon = PILLAR_ICONS[pillar]
  const isClickable = typeof onClick === 'function' || clickable === true
  const maturity = getScoreMaturity(score)
  const barColor = SCORE_BAR_COLORS[maturity.level] ?? SCORE_BAR_COLORS['beginner']!
  const textColor = SCORE_TEXT_COLORS[maturity.level] ?? SCORE_TEXT_COLORS['beginner']!
  const badgeColor = MATURITY_BADGE_COLORS[maturity.level] ?? MATURITY_BADGE_COLORS['beginner']!

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up'
      ? 'text-[--score-good-600]'
      : trend === 'down'
        ? 'text-[--score-bad-600]'
        : 'text-muted-foreground'

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable && onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
      className={cn(
        'group rounded-2xl border border-border bg-card p-5 shadow-sm',
        'flex flex-col gap-4',
        isClickable &&
          'cursor-pointer transition-all hover:shadow-md hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {/* Header: icône + label + flèche */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8">
            <Icon size={14} className="text-primary" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground">{sublabel}</p>
          </div>
        </div>
        {isClickable && (
          <ArrowRight
            size={14}
            className="text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden
          />
        )}
      </div>

      {/* Score + maturity */}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className={cn('text-3xl font-extrabold tabular-nums leading-none', textColor)}>
            {Math.round(score)}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', badgeColor)}>
          {maturity.label}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-700', barColor)}
          style={{ width: `${Math.min(100, Math.max(0, Math.round(score)))}%` }}
          aria-label={`${Math.round(score)}%`}
        />
      </div>

      {/* Delta */}
      {delta !== undefined && trend && (
        <div className={cn('flex items-center gap-1 text-xs font-semibold', trendColor)}>
          <TrendIcon size={11} aria-hidden />
          <span>
            {delta > 0 ? '+' : ''}
            {delta} pts vs précédent
          </span>
        </div>
      )}
    </div>
  )
}
