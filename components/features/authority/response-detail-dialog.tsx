'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ENGINE_LABELS } from '@/lib/analysis/authority-table'
import type { CellData } from '@/lib/analysis/authority-table'
import type { IAEngineName } from '@/lib/ai/connectors/base'

interface ResponseDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cell: CellData | null
  promptText: string
  clientDomain: string
}

function highlightDomain(text: string, domain: string): React.ReactNode[] {
  if (!domain) return [text]
  const escaped = domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part)
      ? (
          <mark
            key={i}
            className="rounded bg-green-100 px-0.5 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          >
            {part}
          </mark>
        )
      : part
  )
}

const ENGINE_BADGE_COLORS: Record<IAEngineName, string> = {
  chatgpt: 'bg-emerald-100 text-emerald-800',
  claude: 'bg-violet-100 text-violet-800',
  gemini: 'bg-blue-100 text-blue-800',
  perplexity: 'bg-amber-100 text-amber-800',
}

export function ResponseDetailDialog({
  open,
  onOpenChange,
  cell,
  promptText,
  clientDomain,
}: ResponseDetailDialogProps) {
  if (!cell) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ENGINE_BADGE_COLORS[cell.engine]}`}
            >
              {ENGINE_LABELS[cell.engine]}
            </span>
            Réponse détaillée
          </DialogTitle>
        </DialogHeader>

        {/* Prompt */}
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider">Prompt</span>
          {promptText}
        </div>

        {/* Answer */}
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Réponse
          </span>
          <p className="whitespace-pre-wrap rounded-lg border border-border bg-background p-4 text-sm leading-relaxed">
            {highlightDomain(cell.answer, clientDomain)}
          </p>
        </div>

        {/* Sources */}
        {cell.sources.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sources citées ({cell.sources.length})
            </span>
            <ul className="space-y-1.5">
              {cell.sources.map((source) => (
                <li
                  key={source.id}
                  className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${
                    source.isClientDomain
                      ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800/30 dark:bg-green-900/10 dark:text-green-300'
                      : 'border-border bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <span className="mt-0.5 shrink-0">{source.isClientDomain ? '✅' : '•'}</span>
                  <span className="min-w-0 break-all">{source.title ?? source.url}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
