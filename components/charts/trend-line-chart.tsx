// components/charts/trend-line-chart.tsx
// Courbe de tendance multi-séries en SVG pur (Server Component, zéro JS client).
// Utilisée par l'onglet Suivi (PLAN item 14) pour les scores et les citations.

export interface TrendSeries {
  label: string
  /** Couleur de trait (classe Tailwind text-*) appliquée via currentColor */
  colorClass: string
  /** Valeurs 0-100, alignées sur `labels` ; null = pas de donnée ce jour-là */
  values: (number | null)[]
}

interface TrendLineChartProps {
  /** Étiquettes de l'axe X (dates courtes) */
  labels: string[]
  series: TrendSeries[]
  /** Hauteur du tracé en px (largeur fluide) */
  height?: number
}

const VIEW_W = 600
const PAD_X = 8
const PAD_Y = 10

function buildPath(values: (number | null)[], count: number, viewH: number): string {
  const stepX = count > 1 ? (VIEW_W - PAD_X * 2) / (count - 1) : 0
  let d = ''
  let penDown = false
  values.forEach((v, i) => {
    if (v === null) {
      penDown = false
      return
    }
    const x = PAD_X + i * stepX
    const y = PAD_Y + (1 - v / 100) * (viewH - PAD_Y * 2)
    d += `${penDown ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
    penDown = true
  })
  return d
}

export function TrendLineChart({ labels, series, height = 180 }: TrendLineChartProps) {
  const count = labels.length
  const viewH = 200

  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW_W} ${viewH}`}
        role="img"
        aria-label={`Tendance : ${series.map((s) => s.label).join(', ')}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        {/* Lignes de repère 0/50/100 */}
        {[0, 50, 100].map((v) => {
          const y = PAD_Y + (1 - v / 100) * (viewH - PAD_Y * 2)
          return (
            <line
              key={v}
              x1={PAD_X}
              x2={VIEW_W - PAD_X}
              y1={y}
              y2={y}
              className="stroke-border"
              strokeWidth={1}
              strokeDasharray={v === 0 || v === 100 ? undefined : '4 4'}
            />
          )
        })}
        {series.map((s) => (
          <path
            key={s.label}
            d={buildPath(s.values, count, viewH)}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={s.colorClass}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {/* Points de la première série (lisibilité quand peu de données) */}
        {count <= 20 &&
          series.map((s) =>
            s.values.map((v, i) => {
              if (v === null) return null
              const stepX = count > 1 ? (VIEW_W - PAD_X * 2) / (count - 1) : 0
              const x = PAD_X + i * stepX
              const y = PAD_Y + (1 - v / 100) * (viewH - PAD_Y * 2)
              return (
                <circle
                  key={`${s.label}-${i}`}
                  cx={x}
                  cy={y}
                  r={3}
                  className={`fill-current ${s.colorClass}`}
                />
              )
            })
          )}
      </svg>

      {/* Axe X : première / milieu / dernière étiquette */}
      {count > 0 && (
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{labels[0]}</span>
          {count > 2 && <span>{labels[Math.floor(count / 2)]}</span>}
          <span>{labels[count - 1]}</span>
        </div>
      )}

      {/* Légende */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`h-0.5 w-4 rounded-full bg-current ${s.colorClass}`} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
