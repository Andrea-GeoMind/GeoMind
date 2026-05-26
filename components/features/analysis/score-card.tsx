import { cn } from '@/lib/utils'
import { ScoreGauge } from '@/components/charts/score-gauge'
import { getScoreMaturity } from '@/lib/analysis/scoring'
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

/** Description pédagogique affichée sous le score — répond à "qu'est-ce que ça mesure ?" */
const PILLAR_DESCRIPTIONS: Record<Pillar, string> = {
  global: 'Moyenne de vos 3 piliers GEO : Autorité, Technique et Contenu.',
  authority: 'Fréquence à laquelle les IAs citent votre site dans leurs réponses.',
  technical: 'Qualité technique de votre site pour être lu et compris par les IAs.',
  content: 'Pertinence et structure de votre contenu pour apparaître dans les réponses IA.',
}

const PILLAR_ICONS: Record<Pillar, React.ElementType> = {
  global: BarChart2,
  authority: Shield,
  technical: Wrench,
  content: FileText,
}

const MATURITY_COLORS: Record<string, string> = {
  expert: 'text-[--score-good-600] bg-[--score-good-50] ring-[--score-good-200]',
  advanced: 'text-[--score-good-600] bg-[--score-good-50] ring-[--score-good-200]',
  progressing: 'text-[--score-mid-600] bg-[--score-mid-50] ring-[--score-mid-200]',
  beginner: 'text-[--score-bad-600] bg-[--score-bad-50] ring-[--score-bad-200]',
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
  const description = PILLAR_DESCRIPTIONS[pillar]
  const Icon = PILLAR_ICONS[pillar]
  const isClickable = typeof onClick === 'function'
  const maturity = getScoreMaturity(score)
  const maturityColor = MATURITY_COLORS[maturity.level] ?? MATURITY_COLORS['beginner']!

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
      {/* Icône + label */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
          <Icon size={16} className="text-primary" aria-hidden />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>

      {/* Jauge */}
      <ScoreGauge score={score} size="sm" showLabel={false} />

      {/* Badge maturité */}
      <span
        className={cn(
          'rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1',
          maturityColor,
        )}
      >
        {maturity.label}
      </span>

      {/* Description pédagogique */}
      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        {description}
      </p>

      {/* Delta vs analyse précédente */}
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
