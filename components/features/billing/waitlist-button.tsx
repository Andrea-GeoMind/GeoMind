'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { joinWaitlistAction } from '@/app/actions/waitlist'

interface WaitlistButtonProps {
  plan: 'solo' | 'pro' | 'business'
  highlighted?: boolean
}

/**
 * Inscription un clic à la liste d'attente depuis l'app (utilisateur connecté :
 * l'email de session est utilisé côté serveur).
 */
export function WaitlistButton({ plan, highlighted = false }: WaitlistButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await joinWaitlistAction({ plan, source: 'billing' })
      if ('error' in result) {
        setError(result.error)
        return
      }
      setJoined(true)
    })
  }

  if (joined) {
    return (
      <div className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Vous êtes sur la liste !
      </div>
    )
  }

  return (
    <div className="mt-5">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Bientôt disponible
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 ${
          highlighted
            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
            : 'bg-foreground text-background'
        }`}
      >
        {isPending ? 'Inscription…' : "Rejoindre la liste d'attente"}
      </button>
      {error && <p className="mt-2 text-center text-xs text-destructive">{error}</p>}
    </div>
  )
}
