/**
 * ScoreCard — carte affichant un score de pilier GEO (Autorité, Technique, Contenu).
 * Utilise ScoreGauge en version "sm" + étiquette de pilier + tendance optionnelle.
 */

import { cn } from '@/lib/utils'
import { ScoreGauge } from '@/components/ui/score-gauge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Pillar = 'authority' | 'technical' | 'content' | 'global'
type Trend = 'up' | 'down' | 'stable'

interface ScoreCardProps {
  pillar: Pillar
  score: number
  /** Delta vs analyse précédente (ex : +8, -3) */
  delta?: number
  trend?: Trend
  className?: string
  onClick?: () => void
}

const PILLAR_LABELS: Record<Pillar, string> = {
  global: 'Score GEO',
  authority: 'Autorité',
  technical: 'Technique',
  content: 'Contenu',
}

export function ScoreCard({
  pillar,
  score,
  delta,
  trend,
  className,
  onClick,
}: ScoreCardProps) {
  const label = PILLAR_LABELS[pillar]
  const isClickable = typeof onClick === 'function'

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  const trendColor =
    trend === 'up'
      ? 'text-score-good'
      : trend === 'down'
        ? 'text-score-bad'
        : 'text-muted-foreground'

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-sm',
        'flex flex-col items-center gap-3',
        isClickable &&
          'cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>

      <ScoreGauge score={score} size="sm" showLabel={false} />

      {delta !== undefined && trend && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
          <TrendIcon size={12} aria-hidden />
          <span>
            {delta > 0 ? '+' : ''}
            {delta} pts
          </span>
        </div>
      )}
    </div>
  )
}
