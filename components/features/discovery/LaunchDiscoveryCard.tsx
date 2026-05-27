'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'

type Props = {
  onLaunch: () => Promise<{ error?: string }>
}

export function LaunchDiscoveryCard({ onLaunch }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await onLaunch()
      if (result.error) {
        setError(result.error)
        return
      }
      // Redirige vers ?discovering=true → la page serveur affiche DiscoveryLoadingPoller
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(`${pathname}?discovering=true` as any)
    })
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[--brand-blue-100]">
          <Loader2 size={24} className="animate-spin text-[--brand-blue-500]" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-foreground">Lancement en cours…</p>
          <p className="text-sm text-muted-foreground">
            GeoMind démarre l&apos;analyse de votre site.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
      <div className="space-y-1">
        <p className="font-medium text-foreground">Aucune découverte lancée</p>
        <p className="text-sm text-muted-foreground">
          GeoMind va crawler votre site, analyser votre activité et générer automatiquement
          la description, les mots-clés, les concurrents et les prompts neutres.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-2 rounded-lg bg-[--brand-blue-500] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Sparkles size={16} />
          Lancer la découverte
        </button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
