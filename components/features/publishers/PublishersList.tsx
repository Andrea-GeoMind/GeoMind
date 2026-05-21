'use client'

import { ExternalLink, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PublisherRow } from '@/lib/db/queries/publishers'

const CATEGORY_LABELS: Record<PublisherRow['category'], string> = {
  media: 'Média FR',
  community: 'Communauté',
  public_base: 'Base publique',
}

const CATEGORY_STYLES: Record<PublisherRow['category'], { badge: string }> = {
  media:       { badge: 'bg-blue-100 text-blue-700' },
  community:   { badge: 'bg-violet-100 text-violet-700' },
  public_base: { badge: 'bg-emerald-100 text-emerald-700' },
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
      <p className="rounded-2xl border border-border bg-muted/30 py-10 text-center text-sm text-muted-foreground">
        Aucun publisher généré pour cette analyse.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      {(Object.entries(groups) as [PublisherRow['category'], PublisherRow[]][])
        .filter(([, items]) => items.length > 0)
        .map(([category, items]) => (
          <section key={category}>
            {/* Category header */}
            <div className="mb-3 flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  CATEGORY_STYLES[category].badge
                )}
              >
                {CATEGORY_LABELS[category]}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {items.length}
              </span>
            </div>

            <div className="space-y-3">
              {items.map((publisher) => {
                const isVisible = visibleIds.has(publisher.id)
                return (
                  <div
                    key={publisher.id}
                    className={cn(
                      'relative rounded-2xl border border-border bg-card p-4 shadow-sm transition-all',
                      isVisible && 'hover:border-primary/20 hover:shadow-md',
                      !isVisible && 'overflow-hidden'
                    )}
                  >
                    {/* Lock overlay */}
                    {!isVisible && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-background/60 backdrop-blur-sm">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
                          <Lock size={15} className="text-primary" />
                        </div>
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
                            className="shrink-0 text-muted-foreground/60 transition-colors hover:text-primary"
                            tabIndex={isVisible ? 0 : -1}
                            aria-label={`Visiter ${publisher.name}`}
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{publisher.url}</p>
                        <p className="mt-2 text-sm leading-relaxed text-foreground/80">{publisher.pitchAngle}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

      {/* Upsell card */}
      {isFree && publishers.length > FREE_VISIBLE_COUNT && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            {publishers.length - FREE_VISIBLE_COUNT} publishers supplémentaires disponibles en Pro
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Passez au plan Pro pour accéder à toute la liste et commencer à construire votre autorité IA.
          </p>
          <a
            href="/pricing"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Voir les plans
          </a>
        </div>
      )}
    </div>
  )
}
