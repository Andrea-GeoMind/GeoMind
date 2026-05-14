'use client'

import { ExternalLink, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PublisherRow } from '@/lib/db/queries/publishers'

const CATEGORY_LABELS: Record<PublisherRow['category'], string> = {
  media: 'Média FR',
  community: 'Communauté',
  public_base: 'Base publique',
}

const CATEGORY_COLORS: Record<PublisherRow['category'], string> = {
  media: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  community: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  public_base: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

const FREE_VISIBLE_COUNT = 3

type Props = {
  publishers: PublisherRow[]
  isFree: boolean
}

export function PublishersList({ publishers, isFree }: Props) {
  const groups: Record<PublisherRow['category'], PublisherRow[]> = {
    media: publishers.filter((p) => p.category === 'media'),
    community: publishers.filter((p) => p.category === 'community'),
    public_base: publishers.filter((p) => p.category === 'public_base'),
  }

  // Free plan: show first 3 across all categories, blur the rest
  const visibleIds = new Set(
    isFree ? publishers.slice(0, FREE_VISIBLE_COUNT).map((p) => p.id) : publishers.map((p) => p.id)
  )

  if (publishers.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucun publisher généré pour cette analyse.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      {(Object.entries(groups) as [PublisherRow['category'], PublisherRow[]][]).map(
        ([category, items]) => (
          <section key={category}>
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  CATEGORY_COLORS[category]
                )}
              >
                {CATEGORY_LABELS[category]}
              </span>
            </h3>

            <div className="space-y-3">
              {items.map((publisher) => {
                const isVisible = visibleIds.has(publisher.id)
                return (
                  <div
                    key={publisher.id}
                    className={cn(
                      'relative rounded-xl border border-border bg-card p-4 shadow-sm transition-all',
                      !isVisible && 'overflow-hidden'
                    )}
                  >
                    {!isVisible && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/60 backdrop-blur-sm">
                        <Lock size={16} className="text-muted-foreground" />
                        <p className="text-xs font-medium text-muted-foreground">
                          Passez en Pro pour voir tous les publishers
                        </p>
                      </div>
                    )}

                    <div className={cn('flex items-start justify-between gap-4', !isVisible && 'select-none blur-sm')}>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-foreground">{publisher.name}</p>
                          <a
                            href={publisher.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                            tabIndex={isVisible ? 0 : -1}
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground">{publisher.url}</p>
                        <p className="mt-2 text-sm text-foreground/80">{publisher.pitchAngle}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      )}

      {isFree && publishers.length > FREE_VISIBLE_COUNT && (
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">
            {publishers.length - FREE_VISIBLE_COUNT} publishers supplémentaires disponibles en Pro
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Passez au plan Pro pour accéder à toute la liste et commencer à construire votre autorité IA.
          </p>
          <a
            href="/pricing"
            className="mt-4 inline-flex items-center rounded-lg bg-[--brand-blue-500] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Voir les plans
          </a>
        </div>
      )}
    </div>
  )
}
