// components/features/authority/citations-bar-chart.tsx

import { cn } from '@/lib/utils'
import type { EngineStats } from '@/lib/analysis/authority-table'

interface CitationsBarChartProps {
  stats: EngineStats[]
}

const ENGINE_COLORS: Record<string, string> = {
  chatgpt: 'bg-emerald-500',
  claude: 'bg-violet-500',
  gemini: 'bg-blue-500',
  perplexity: 'bg-amber-500',
}

export function CitationsBarChart({ stats }: CitationsBarChartProps) {
  const maxPct = Math.max(...stats.map((s) => s.percentage), 1)

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Citations par moteur IA
      </h2>

      <div className="flex items-end justify-around gap-4">
        {stats.map((s) => (
          <div key={s.engine} className="flex flex-1 flex-col items-center gap-2">
            {/* Bar */}
            <div className="relative flex w-full flex-col items-center justify-end" style={{ height: 120 }}>
              <span className="mb-1 text-xs font-semibold tabular-nums text-foreground">
                {s.percentage}%
              </span>
              <div
                className={cn('w-full rounded-t-md transition-all', ENGINE_COLORS[s.engine] ?? 'bg-muted')}
                style={{ height: `${Math.round((s.percentage / maxPct) * 80)}px`, minHeight: s.percentage > 0 ? 4 : 0 }}
                aria-label={`${s.label} : ${s.cited}/${s.total} citations`}
              />
            </div>

            {/* Label */}
            <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {s.cited}/{s.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
