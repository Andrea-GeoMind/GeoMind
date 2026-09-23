'use client'

import { useOptimistic, useTransition } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { setActionStatusAction } from '@/app/(app)/sites/[siteId]/action-plan/actions'
import type { LocalChecklistItem } from '@/lib/analysis/local'
import { cn } from '@/lib/utils'

/**
 * Checklist de présence locale, réellement cochable.
 *
 * Elle affichait « Cochez mentalement ce qui est déjà fait » avec des puces
 * inertes, alors que la page Tarifs vend « Local : questions géolocalisées +
 * checklist ». Les états sont rangés dans `action_states`, comme ceux du plan
 * d'action : rien de neuf à maintenir, et le client retrouve ses coches.
 *
 * Ces points ne sont pas vérifiables automatiquement — personne ne peut lire
 * votre fiche Google à votre place. C'est un suivi qu'on tient soi-même, et le
 * texte le dit plutôt que de laisser croire à une mesure.
 */
export function LocalChecklist({
  siteId,
  items,
  doneKeys,
}: {
  siteId: string
  items: LocalChecklistItem[]
  doneKeys: string[]
}) {
  const [optimisticDone, toggleOptimistic] = useOptimistic(
    new Set(doneKeys),
    (current: Set<string>, key: string) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    }
  )
  const [, startTransition] = useTransition()

  function onToggle(key: string) {
    const willBeDone = !optimisticDone.has(key)
    startTransition(async () => {
      toggleOptimistic(key)
      await setActionStatusAction({
        siteId,
        ruleKey: key,
        pageUrl: '',
        source: 'local',
        status: willBeDone ? 'done' : 'todo',
      })
    })
  }

  const doneCount = items.filter((i) => optimisticDone.has(i.key)).length

  return (
    <div>
      <p className="mt-1 text-xs text-muted-foreground">
        Les sources que les IA recoupent pour répondre aux recherches locales — {doneCount} sur{' '}
        {items.length} cochées. Ces points ne sont pas vérifiables automatiquement : c&apos;est
        votre suivi, pas une mesure.
      </p>
      <ul className="mt-4 space-y-4">
        {items.map((item) => {
          const done = optimisticDone.has(item.key)
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onToggle(item.key)}
                aria-pressed={done}
                className="flex w-full items-start gap-3 rounded-lg p-1 text-left transition-colors hover:bg-muted/50"
              >
                {done ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                ) : (
                  <Circle size={16} className="mt-0.5 shrink-0 text-muted-foreground/40" />
                )}
                <span>
                  <span
                    className={cn(
                      'block text-sm font-semibold text-foreground',
                      done && 'text-muted-foreground line-through'
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">{item.why}</span>
                  {!done && (
                    <span className="mt-1 block text-xs text-indigo-600/90">→ {item.action}</span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
