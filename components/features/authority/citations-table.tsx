'use client'

import { useState } from 'react'
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
      <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  'border-b border-border last:border-0',
                  rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                )}
              >
                <td className="max-w-xs px-4 py-3 text-xs text-foreground">
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
                            'inline-flex items-center justify-center rounded-md px-2 py-1 text-base transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          )}
                          title="Voir la réponse complète"
                          aria-label={`Voir réponse ${ENGINE_LABELS[engine]} pour : ${row.promptText}`}
                        >
                          {cell.partial ? '⚠️' : cell.cited ? '✅' : '❌'}
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
