'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Download, Plus, X } from 'lucide-react'

/**
 * Générateur llms.txt gratuit (PLAN item 23) — outil public sans inscription.
 * 100 % côté client : aucune donnée envoyée, génération instantanée.
 */

interface KeyPage {
  label: string
  url: string
}

function buildLlmsTxt(params: {
  name: string
  description: string
  siteUrl: string
  email: string
  pages: KeyPage[]
}): string {
  const lines: string[] = []
  lines.push(`# ${params.name || 'Mon entreprise'}`)
  lines.push('')
  lines.push(`> ${params.description || 'Description de votre activité en une ou deux phrases.'}`)
  lines.push('')
  const validPages = params.pages.filter((p) => p.url.trim())
  if (validPages.length > 0) {
    lines.push('## Pages principales')
    lines.push('')
    for (const p of validPages) {
      lines.push(`- [${(p.label || p.url).replace(/[\[\]]/g, '')}](${p.url.replace(/[()]/g, '')})`)
    }
    lines.push('')
  }
  if (params.email || params.siteUrl) {
    lines.push('## Contact')
    lines.push('')
    if (params.siteUrl) lines.push(`- Site : ${params.siteUrl}`)
    if (params.email) lines.push(`- Email : ${params.email}`)
    lines.push('')
  }
  return lines.join('\n')
}

export function LlmsTxtGenerator() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [email, setEmail] = useState('')
  const [pages, setPages] = useState<KeyPage[]>([
    { label: 'Accueil', url: '' },
    { label: 'Services', url: '' },
  ])
  const [copied, setCopied] = useState(false)

  const output = useMemo(
    () => buildLlmsTxt({ name, description, siteUrl, email, pages }),
    [name, description, siteUrl, email, pages]
  )

  async function copy() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'llms.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const inputCls =
    'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary'

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Formulaire */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="llms-name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Nom de votre entreprise
          </label>
          <input
            id="llms-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Boulangerie Dupont"
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="llms-desc" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Votre activité en 1-2 phrases (la partie la plus importante)
          </label>
          <textarea
            id="llms-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Boulangerie artisanale à Lyon 3e : pains au levain, viennoiseries maison, gâteaux sur commande. Ouvert du mardi au dimanche."
            className={`${inputCls} resize-none`}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="llms-url" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Adresse du site
            </label>
            <input
              id="llms-url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://exemple.fr"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="llms-email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Email de contact
            </label>
            <input
              id="llms-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@exemple.fr"
              className={inputCls}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Vos pages importantes
          </p>
          {pages.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={p.label}
                onChange={(e) =>
                  setPages((prev) => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                }
                placeholder="Nom de la page"
                aria-label={`Nom de la page ${i + 1}`}
                className={`${inputCls} w-1/3`}
              />
              <input
                value={p.url}
                onChange={(e) =>
                  setPages((prev) => prev.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
                }
                placeholder="https://exemple.fr/services"
                aria-label={`URL de la page ${i + 1}`}
                className={`${inputCls} flex-1`}
              />
              <button
                type="button"
                onClick={() => setPages((prev) => prev.filter((_, j) => j !== i))}
                aria-label="Retirer cette page"
                className="text-muted-foreground hover:text-destructive"
              >
                <X size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPages((prev) => [...prev, { label: '', url: '' }])}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus size={12} /> Ajouter une page
          </button>
        </div>
      </div>

      {/* Aperçu */}
      <div>
        <div className="sticky top-24 rounded-xl border border-border bg-[#0F172A] p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-xs text-slate-400">llms.txt</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copy}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
              <button
                type="button"
                onClick={download}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Download size={12} />
                Télécharger
              </button>
            </div>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-200">
            {output}
          </pre>
        </div>
      </div>
    </div>
  )
}
