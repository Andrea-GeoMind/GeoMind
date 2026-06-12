'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { setEmailNotificationsAction } from '@/app/(app)/settings/account/actions'

/**
 * Toggle des alertes email de visibilité (PLAN item 13) : première citation,
 * baisse de visibilité, analyse terminée. La vérité est serveur (profiles).
 */
export function EmailNotificationsToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleToggle() {
    const next = !enabled
    setEnabled(next)
    setError(null)
    startTransition(async () => {
      const result = await setEmailNotificationsAction(next)
      if (result?.error) {
        setEnabled(!next) // rollback
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">Alertes de visibilité par email</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Première citation détectée, baisse de visibilité, analyse terminée. Jamais de
          publicité.
        </p>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={handleToggle}
        disabled={isPending}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          enabled ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : 'bg-muted-foreground/30',
          isPending ? 'opacity-60' : '',
        ].join(' ')}
      >
        {isPending ? (
          <Loader2 size={12} className="mx-auto animate-spin text-white" />
        ) : (
          <span
            className={[
              'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
              enabled ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')}
          />
        )}
      </button>
    </div>
  )
}
