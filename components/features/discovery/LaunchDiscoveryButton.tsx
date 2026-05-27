'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { launchDiscoveryAction } from '@/app/(app)/sites/[siteId]/discovery/launch-action'

type Props = {
  siteId: string
}

export function LaunchDiscoveryButton({ siteId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [launched, setLaunched] = useState(false)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await launchDiscoveryAction(siteId)
      if (result.error) {
        setError(result.error)
        return
      }
      setLaunched(true)
      setTimeout(() => router.refresh(), 3000)
    })
  }

  if (launched) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Sparkles size={20} className="text-green-600" />
        </div>
        <p className="text-sm font-medium text-foreground">Découverte lancée !</p>
        <p className="text-xs text-muted-foreground">
          GeoMind crawle votre site et analyse votre activité. Revenez dans quelques minutes.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-[--brand-blue-500] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Lancement…
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Lancer la découverte
          </>
        )}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
