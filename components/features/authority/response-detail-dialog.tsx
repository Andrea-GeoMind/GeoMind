'use client'

import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
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
    i % 2 !== 0
      ? (
          <mark
            key={i}
            className="rounded bg-[--score-good-100] px-0.5 text-[--score-good-800]"
          >
            {part}
          </mark>
        )
      : part
  )
}

const ENGINE_BADGE_STYLES: Record<IAEngineName, { bg: string; text: string }> = {
  chatgpt:    { bg: 'bg-emerald-100',  text: 'text-emerald-800' },
  claude:     { bg: 'bg-violet-100',   text: 'text-violet-800' },
  gemini:     { bg: 'bg-blue-100',     text: 'text-blue-800' },
  perplexity: { bg: 'bg-amber-100',    text: 'text-amber-800' },
}

export function ResponseDetailDialog({
  open,
  onOpenChange,
  cell,
  promptText,
  clientDomain,
}: ResponseDetailDialogProps) {
  if (!cell) return null

  const badge = ENGINE_BADGE_STYLES[cell.engine]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold tracking-tight">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}
            >
              {ENGINE_LABELS[cell.engine]}
            </span>
            Réponse détaillée
          </DialogTitle>
        </DialogHeader>

        {/* Prompt */}
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Prompt
          </span>
          {promptText}
        </div>

        {/* Answer */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Réponse
          </span>
          <p className="whitespace-pre-wrap rounded-xl border border-border bg-background p-4 text-sm leading-relaxed">
            {highlightDomain(cell.answer, clientDomain)}
          </p>
        </div>

        {/* Sources */}
        {cell.sources.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Sources citées ({cell.sources.length})
            </span>
            <ul className="space-y-1.5">
              {cell.sources.map((source) => (
                <li
                  key={source.id}
                  className={[
                    'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs',
                    source.isClientDomain
                      ? 'border-[--score-good-200] bg-[--score-good-50] text-[--score-good-800]'
                      : 'border-border bg-muted/30 text-muted-foreground',
                  ].join(' ')}
                >
                  {source.isClientDomain ? (
                    <CheckCircle2 size={13} className="shrink-0 text-[--score-good-500]" />
                  ) : (
                    <XCircle size={13} className="shrink-0 text-muted-foreground/40" />
                  )}
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
