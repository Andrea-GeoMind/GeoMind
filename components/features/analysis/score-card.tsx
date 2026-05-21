import { cn } from '@/lib/utils'
import { ScoreGauge } from '@/components/charts/score-gauge'
import { TrendingUp, TrendingDown, Minus, Shield, Wrench, FileText, BarChart2 } from 'lucide-react'

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

const PILLAR_ICONS: Record<Pillar, React.ElementType> = {
  global: BarChart2,
  authority: Shield,
  technical: Wrench,
  content: FileText,
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
  const Icon = PILLAR_ICONS[pillar]
  const isClickable = typeof onClick === 'function'

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  const trendColor =
    trend === 'up'
      ? 'text-[--score-good-600] bg-[--score-good-50]'
      : trend === 'down'
        ? 'text-[--score-bad-600] bg-[--score-bad-50]'
        : 'text-muted-foreground bg-muted'

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
        'rounded-2xl border border-border bg-card p-5 shadow-sm',
        'flex flex-col items-center gap-3',
        isClickable &&
          'cursor-pointer transition-all hover:shadow-md hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
        <Icon size={16} className="text-primary" aria-hidden />
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>

      <ScoreGauge score={score} size="sm" showLabel={false} />

      {delta !== undefined && trend && (
        <div className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', trendColor)}>
          <TrendIcon size={11} aria-hidden />
          <span>
            {delta > 0 ? '+' : ''}
            {delta} pts
          </span>
        </div>
      )}
    </div>
  )
}
