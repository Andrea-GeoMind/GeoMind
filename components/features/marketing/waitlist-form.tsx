'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { joinWaitlistAction } from '@/app/actions/waitlist'
import { cn } from '@/lib/utils'

interface WaitlistFormProps {
  plan: 'solo' | 'pro' | 'business'
  source: 'pricing' | 'billing'
  highlighted?: boolean
}

/**
 * Capture d'email pour la liste d'attente des plans payants
 * (lancement freemium : les checkouts Stripe sont désactivés).
 */
export function WaitlistForm({ plan, source, highlighted = false }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await joinWaitlistAction({ email, plan, source })
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
        Vous êtes sur la liste — on vous prévient au lancement !
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Bientôt disponible
      </p>
      <div className="flex flex-col gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
          aria-label={`Email pour la liste d'attente du plan ${plan}`}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
        />
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'w-full rounded-lg px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60',
            highlighted
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200'
              : 'border border-border bg-background text-foreground hover:bg-muted'
          )}
        >
          {isPending ? 'Inscription…' : "Rejoindre la liste d'attente"}
        </button>
      </div>
      {error && <p className="mt-2 text-center text-xs text-destructive">{error}</p>}
    </form>
  )
}
