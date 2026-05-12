/**
 * ScoreGauge — arc SVG affichant la note GEO globale (0-100).
 * Couleur dynamique : rouge <30 / orange 30-59 / vert ≥60
 */

import { cn } from '@/lib/utils'

interface ScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showLabel?: boolean
}

function getScoreColor(score: number): {
  stroke: string
  text: string
  label: string
} {
  if (score >= 60) {
    return {
      stroke: 'var(--score-good-500)',
      text: 'var(--score-good-600)',
      label: 'Bon',
    }
  }
  if (score >= 30) {
    return {
      stroke: 'var(--score-mid-500)',
      text: 'var(--score-mid-600)',
      label: 'Moyen',
    }
  }
  return {
    stroke: 'var(--score-bad-500)',
    text: 'var(--score-bad-600)',
    label: 'Faible',
  }
}

const SIZE_CONFIG = {
  sm: { svgSize: 80, r: 30, strokeWidth: 6, fontSize: 18, subFontSize: 10 },
  md: { svgSize: 120, r: 46, strokeWidth: 8, fontSize: 28, subFontSize: 13 },
  lg: { svgSize: 160, r: 62, strokeWidth: 10, fontSize: 38, subFontSize: 16 },
}

export function ScoreGauge({
  score,
  size = 'md',
  className,
  showLabel = true,
}: ScoreGaugeProps) {
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)))
  const color = getScoreColor(clampedScore)
  const cfg = SIZE_CONFIG[size]

  const cx = cfg.svgSize / 2
  const cy = cfg.svgSize / 2
  const circumference = 2 * Math.PI * cfg.r
  // Arc de 270° : commence à 135° (bas-gauche), finit à 405° (bas-droite)
  const arcLength = (3 / 4) * circumference
  const dashOffset = arcLength - (clampedScore / 100) * arcLength

  // Rotation pour centrer l'arc (−135° pour démarrer en bas-gauche)
  const rotation = -135

  return (
    <div className={cn('inline-flex flex-col items-center gap-1', className)}>
      <svg
        width={cfg.svgSize}
        height={cfg.svgSize}
        viewBox={`0 0 ${cfg.svgSize} ${cfg.svgSize}`}
        aria-label={`Score GEO : ${clampedScore} sur 100`}
        role="img"
      >
        {/* Track (fond gris) */}
        <circle
          cx={cx}
          cy={cy}
          r={cfg.r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={cfg.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          transform={`rotate(${rotation}, ${cx}, ${cy})`}
        />
        {/* Progress (coloré) */}
        <circle
          cx={cx}
          cy={cy}
          r={cfg.r}
          fill="none"
          stroke={color.stroke}
          strokeWidth={cfg.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(${rotation}, ${cx}, ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
        {/* Score chiffre */}
        <text
          x={cx}
          y={cy + cfg.fontSize * 0.35}
          textAnchor="middle"
          fontSize={cfg.fontSize}
          fontWeight={800}
          fontFamily="var(--font-sans), system-ui, sans-serif"
          fill={color.text}
          className="numeric"
        >
          {clampedScore}
        </text>
        {/* Sous-label "/100" */}
        <text
          x={cx}
          y={cy + cfg.fontSize * 0.35 + cfg.subFontSize + 2}
          textAnchor="middle"
          fontSize={cfg.subFontSize}
          fontWeight={500}
          fontFamily="var(--font-sans), system-ui, sans-serif"
          fill="var(--muted-foreground)"
        >
          /100
        </text>
      </svg>

      {showLabel && (
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: color.text }}
        >
          {color.label}
        </span>
      )}
    </div>
  )
}
