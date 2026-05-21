// components/features/authority/citations-bar-chart.tsx

import { cn } from '@/lib/utils'
import type { EngineStats } from '@/lib/analysis/authority-table'

interface CitationsBarChartProps {
  stats: EngineStats[]
}

const ENGINE_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  chatgpt:    { bar: 'bg-emerald-500',  bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  claude:     { bar: 'bg-violet-500',   bg: 'bg-violet-50',   text: 'text-violet-700' },
  gemini:     { bar: 'bg-blue-500',     bg: 'bg-blue-50',     text: 'text-blue-700' },
  perplexity: { bar: 'bg-amber-500',    bg: 'bg-amber-50',    text: 'text-amber-700' },
}

const FALLBACK_COLORS = { bar: 'bg-muted', bg: 'bg-muted', text: 'text-muted-foreground' }

export function CitationsBarChart({ stats }: CitationsBarChartProps) {
  const maxPct = Math.max(...stats.map((s) => s.percentage), 1)

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-6 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Citations par moteur IA
      </h2>

      <div className="flex items-end justify-around gap-4">
        {stats.map((s) => {
          const colors = ENGINE_COLORS[s.engine] ?? FALLBACK_COLORS
          const barHeight = Math.round((s.percentage / maxPct) * 96)

          return (
            <div key={s.engine} className="flex flex-1 flex-col items-center gap-2">
              {/* Bar column */}
              <div className="relative flex w-full flex-col items-center justify-end" style={{ height: 120 }}>
                <span className="mb-1.5 text-sm font-extrabold numeric text-foreground">
                  {s.percentage}%
                </span>
                <div
                  className={cn('w-full rounded-t-lg transition-all', colors.bar)}
                  style={{ height: `${barHeight}px`, minHeight: s.percentage > 0 ? 4 : 0 }}
                  aria-label={`${s.label} : ${s.cited}/${s.total} citations`}
                />
              </div>

              {/* Engine badge */}
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  colors.bg,
                  colors.text,
                )}
              >
                {s.label}
              </span>
              <span className="numeric text-xs text-muted-foreground">
                {s.cited}/{s.total}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
