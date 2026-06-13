'use client'

import { useState } from 'react'
import { Copy, Check, Download, Wand2, ChevronDown } from 'lucide-react'
import type { ActionFix } from '@/lib/analysis/action-fixes'

/**
 * Bloc dépliable « correctif prêt à coller » : code + copier/télécharger +
 * instruction d'installation selon la plateforme. Partagé par le Plan d'action
 * et les fiches de recommandation (onglets Technique / Contenu).
 */
export function FixDetails({ fix }: { fix: ActionFix }) {
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
    <details className="group rounded-lg border border-indigo-100 bg-indigo-50/40">
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
