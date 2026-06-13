'use client'

import { useState, useTransition } from 'react'
import { Check, Copy, Loader2, Radio } from 'lucide-react'
import { activatePixelAction } from '@/app/(app)/sites/[siteId]/pixel/actions'

/**
 * Activation du Pixel + snippet à copier (PLAN item 29). Le snippet est une
 * seule balise <script> avec la clé du site.
 */
export function PixelInstaller({
  siteId,
  initialKey,
  scriptUrl,
}: {
  siteId: string
  initialKey: string | null
  scriptUrl: string
}) {
  const [pixelKey, setPixelKey] = useState(initialKey)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function activate() {
    setError(null)
    startTransition(async () => {
      const res = await activatePixelAction(siteId)
      if ('error' in res) setError(res.error)
      else setPixelKey(res.pixelKey)
    })
  }

  const snippet = pixelKey
    ? `<script async src="${scriptUrl}" data-key="${pixelKey}"></script>`
    : ''

  async function copy() {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!pixelKey) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
          <Radio size={26} className="text-primary" />
        </div>
        <h2 className="text-base font-bold text-foreground">Activez la preuve par les chiffres</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Posez une petite balise sur votre site et GeoMind comptera les visiteurs qui arrivent
          depuis les IA — et ce qu’ils font (appels, formulaires, rendez-vous). Sans cookie,
          conforme RGPD.
        </p>
        <button
          type="button"
          onClick={activate}
          disabled={isPending}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? <Loader2 size={15} className="animate-spin" /> : <Radio size={15} />}
          Activer mon pixel
        </button>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Votre pixel — code à installer</h2>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Collez ce code juste avant la balise <code>&lt;/head&gt;</code> de votre site (toutes les
        pages). Une seule fois.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-[#0F172A] p-3 font-mono text-xs text-slate-200">
        {snippet}
      </pre>
      <p className="mt-3 text-xs text-muted-foreground">
        Pas à l’aise avec le code ? Envoyez cette ligne à votre webmaster en précisant « à coller
        dans le head de toutes les pages ». Les premières données apparaissent ici sous 24 à 48 h.
      </p>
    </div>
  )
}
