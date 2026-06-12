'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IA_ENGINES, ENGINE_LABELS } from '@/lib/analysis/authority-table'
import { ResponseDetailDialog } from '@/components/features/authority/response-detail-dialog'
import type { CrossTableRow, CellData } from '@/lib/analysis/authority-table'

interface CitationsTableProps {
  rows: CrossTableRow[]
  clientDomain: string
}

export function CitationsTable({ rows, clientDomain }: CitationsTableProps) {
  const [selected, setSelected] = useState<{ cell: CellData; promptText: string } | null>(null)

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucune réponse enregistrée pour cette analyse.
      </p>
    )
  }

  return (
    <>
      {/* Légende des symboles (PLAN item 18) — un patron ne devine pas */}
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-[--score-good-500]" /> Votre site est cité
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5 text-[--score-mid-500]" /> Réponse partielle
          (sources illisibles)
        </span>
        <span className="flex items-center gap-1">
          <XCircle className="h-3.5 w-3.5 text-[--score-bad-500]" /> Non cité
        </span>
        <span className="text-muted-foreground/70">Cliquez sur une case pour lire la réponse</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
        <table className="w-full min-w-[540px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Prompt
              </th>
              {IA_ENGINES.map((engine) => (
                <th
                  key={engine}
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {ENGINE_LABELS[engine]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={row.promptId}
                className={cn(
                  'group border-b border-border transition-colors last:border-0 hover:bg-muted/40',
                  rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                )}
              >
                <td className="sticky left-0 z-10 max-w-xs bg-inherit px-4 py-3 text-xs text-foreground">
                  <span className="line-clamp-2">{row.promptText}</span>
                </td>
                {IA_ENGINES.map((engine) => {
                  const cell = row.cells[engine]
                  return (
                    <td key={engine} className="px-4 py-3 text-center">
                      {cell ? (
                        <button
                          type="button"
                          onClick={() => setSelected({ cell, promptText: row.promptText })}
                          className={cn(
                            'inline-flex items-center justify-center rounded-md px-2 py-1 text-base transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          )}
                          title="Voir la réponse complète"
                          aria-label={`Voir réponse ${ENGINE_LABELS[engine]} pour : ${row.promptText}`}
                        >
                          {cell.partial ? (
                            <AlertTriangle className="h-5 w-5 text-[--score-mid-500]" />
                          ) : cell.cited ? (
                            <CheckCircle2 className="h-5 w-5 text-[--score-good-500]" />
                          ) : (
                            <XCircle className="h-5 w-5 text-[--score-bad-500]" />
                          )}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-right text-[11px] text-muted-foreground sm:hidden">
        ← Faites glisser pour voir toutes les colonnes
      </p>

      <ResponseDetailDialog
        open={selected !== null}
        onOpenChange={(open) => { if (!open) setSelected(null) }}
        cell={selected?.cell ?? null}
        promptText={selected?.promptText ?? ''}
        clientDomain={clientDomain}
      />
    </>
  )
}
