'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Download, Mail, FileCode, FileText, Tag } from 'lucide-react'
import {
  buildStudioFixes,
  cmsInstructions,
  CMS_LABELS,
  type StudioSite,
  type CmsKind,
  type FaqEntry,
  type StudioFix,
} from '@/lib/analysis/studio'

const CMS_ORDER: CmsKind[] = [
  'unknown',
  'wordpress',
  'shopify',
  'wix',
  'webflow',
  'squarespace',
]

const FORMAT_ICON = {
  txt: FileText,
  html: FileCode,
  meta: Tag,
} as const

function CopyDownload({ fix }: { fix: StudioFix }) {
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
    a.download = fix.filename ?? `${fix.key}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
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
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Download size={12} />
          Télécharger
        </button>
      )}
    </div>
  )
}

export function StudioPanel({
  site,
  initialCms,
  initialFaq,
}: {
  site: StudioSite
  initialCms: CmsKind
  initialFaq: FaqEntry[]
}) {
  const [cms, setCms] = useState<CmsKind>(initialCms)
  const [faq, setFaq] = useState<FaqEntry[]>(initialFaq)

  const fixes = useMemo(() => buildStudioFixes(site, faq), [site, faq])

  // E-mail « envoyer à mon webmaster » avec tous les correctifs en clair
  const webmasterMailto = useMemo(() => {
    const body = [
      `Bonjour,`,
      ``,
      `Voici les correctifs à appliquer sur ${site.name} (${site.url}) pour améliorer notre visibilité dans les IA. Générés avec GeoMind.`,
      ``,
      ...fixes.map(
        (f) =>
          `═══ ${f.label} ═══\n${f.placement}\n\n${f.content}\n`
      ),
      `Merci !`,
    ].join('\n')
    return `mailto:?subject=${encodeURIComponent(`Correctifs GEO pour ${site.name}`)}&body=${encodeURIComponent(body)}`
  }, [fixes, site])

  return (
    <div className="space-y-6">
      {/* Sélecteur CMS + envoyer au webmaster */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="space-y-1.5">
          <label
            htmlFor="cms-select"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Votre site est sur…
          </label>
          <select
            id="cms-select"
            value={cms}
            onChange={(e) => setCms(e.target.value as CmsKind)}
            className="block rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {CMS_ORDER.map((k) => (
              <option key={k} value={k}>
                {CMS_LABELS[k]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Les instructions d’installation s’adaptent à votre plateforme.
          </p>
        </div>
        <a
          href={webmasterMailto}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Mail size={15} />
          Envoyer tout à mon webmaster
        </a>
      </div>

      {/* Éditeur FAQ (alimente le JSON-LD FAQ) */}
      <details className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          Personnaliser la FAQ (recommandé)
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">
          Remplacez par vos vraies questions clients et des réponses concrètes (prix, délais) — le
          bloc « Données structurées — FAQ » se met à jour automatiquement.
        </p>
        <div className="mt-4 space-y-3">
          {faq.map((entry, i) => (
            <div key={i} className="space-y-1.5 rounded-lg bg-muted/40 p-3">
              <input
                value={entry.question}
                onChange={(e) =>
                  setFaq((prev) => prev.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))
                }
                placeholder="Question"
                aria-label={`Question ${i + 1}`}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <textarea
                value={entry.answer}
                onChange={(e) =>
                  setFaq((prev) => prev.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))
                }
                placeholder="Réponse"
                aria-label={`Réponse ${i + 1}`}
                rows={2}
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      </details>

      {/* Liste des correctifs */}
      <div className="space-y-4">
        {fixes.map((fix) => {
          const Icon = FORMAT_ICON[fix.format]
          return (
            <div key={fix.key} className="rounded-xl border border-border bg-card shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{fix.label}</p>
                    <p className="text-xs text-muted-foreground">{fix.what}</p>
                  </div>
                </div>
                <CopyDownload fix={fix} />
              </div>

              <pre className="mx-4 overflow-x-auto rounded-lg bg-[#0F172A] p-3 font-mono text-xs leading-relaxed text-slate-200">
                {fix.content}
              </pre>

              <p className="flex items-start gap-2 p-4 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Où l’installer :</span>
                <span>{cmsInstructions(cms, fix)}</span>
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
