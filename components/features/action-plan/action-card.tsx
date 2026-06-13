'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, Undo2, Copy, Check, Download, Wand2, ChevronDown } from 'lucide-react'
import { setActionStatusAction } from '@/app/(app)/sites/[siteId]/action-plan/actions'
import type { ActionSource } from '@/lib/db/queries/action-states'
import type { ActionFix } from '@/lib/analysis/action-fixes'

export interface ActionItem {
  ruleKey: string
  pageUrl: string
  source: ActionSource
  title: string
  description: string
  penalty: number
  severity: string
  effort: number
  impact: number
  status: 'todo' | 'done' | 'verified'
  verifiedAt: string | null
  /** Correctif prêt à coller, si la règle en a un (fusion Studio → Plan d'action). */
  fix?: ActionFix
}

/** Bloc dépliable « correctif prêt à coller » : code + copier/télécharger + instruction CMS. */
function FixDetails({ fix }: { fix: ActionFix }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(fix.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    const blob = new Blob([fix.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fix.filename ?? 'correctif.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <details className="group mt-3 rounded-lg border border-indigo-100 bg-indigo-50/40">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700">
        <Wand2 size={13} className="shrink-0" />
        Voir le correctif prêt à coller
        <ChevronDown
          size={13}
          className="ml-auto shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-2 px-3 pb-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">{fix.what}</p>
        <pre className="overflow-x-auto rounded-lg bg-[#0F172A] p-3 font-mono text-[11px] leading-relaxed text-slate-200">
          {fix.content}
        </pre>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
          {fix.format === 'txt' && (
            <button
              type="button"
              onClick={download}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Download size={12} />
              Télécharger
            </button>
          )}
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Où l’installer ({fix.cmsLabel}) :</span>{' '}
          {fix.cmsInstruction}
        </p>
      </div>
    </details>
  )
}

const SEVERITY_LABEL: Record<string, { label: string; cls: string }> = {
  major: { label: 'Majeur', cls: 'bg-red-50 text-red-700 ring-red-200' },
  moderate: { label: 'Modéré', cls: 'bg-orange-50 text-orange-700 ring-orange-200' },
  minor: { label: 'Mineur', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  opportunity: { label: 'Opportunité', cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
}

const EFFORT_LABEL: Record<number, string> = { 1: 'Rapide', 2: 'Moyen', 3: 'Long' }

export function ActionCard({ siteId, item }: { siteId: string; item: ActionItem }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const severity = SEVERITY_LABEL[item.severity] ?? SEVERITY_LABEL.minor

  function update(status: 'todo' | 'done') {
    setError(null)
    startTransition(async () => {
      const result = await setActionStatusAction({
        siteId,
        ruleKey: item.ruleKey,
        pageUrl: item.pageUrl,
        source: item.source,
        status,
      })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${severity.cls}`}
        >
          {severity.label}
        </span>
        {item.penalty > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            −{item.penalty} pts
          </span>
        )}
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {EFFORT_LABEL[item.effort] ?? 'Moyen'}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-snug text-foreground">{item.title}</p>
      {item.pageUrl && (
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground" title={item.pageUrl}>
          {item.pageUrl}
        </p>
      )}
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {item.description}
      </p>

      {item.fix && item.status !== 'verified' && <FixDetails fix={item.fix} />}

      {item.status === 'verified' ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <CheckCircle2 size={13} />
          Vérifié — correction confirmée par l&apos;analyse
          {item.penalty > 0 ? ` (+${item.penalty} pts récupérés)` : ''}
        </p>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          {item.status === 'todo' ? (
            <button
              onClick={() => update('done')}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              J&apos;ai corrigé
            </button>
          ) : (
            <button
              onClick={() => update('todo')}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            >
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <Undo2 size={12} />}
              Repasser à faire
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
