'use client'

import { useState } from 'react'
import {
  Check,
  X,
  HelpCircle,
  ChevronDown,
  ExternalLink,
  ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  OFF_SITE_CATEGORY_LABELS,
  type OffSitePlatform,
  type OffSitePlatformCategory,
} from '@/lib/analysis/offsite-platforms'
import type { OffSitePresenceStatus } from '@/lib/db/queries/off-site-presence'

export type PresenceItem = {
  platform: OffSitePlatform
  status: OffSitePresenceStatus
  profileUrl: string | null
  evidence: string | null
}

const STATUS_META: Record<
  OffSitePresenceStatus,
  { label: string; icon: typeof Check; badge: string; dot: string }
> = {
  present: {
    label: 'Présent',
    icon: Check,
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'text-emerald-600',
  },
  absent: {
    label: 'Absent',
    icon: X,
    badge: 'bg-rose-100 text-rose-700',
    dot: 'text-rose-600',
  },
  unknown: {
    label: 'À vérifier',
    icon: HelpCircle,
    badge: 'bg-amber-100 text-amber-700',
    dot: 'text-amber-600',
  },
}

const CATEGORY_ORDER: OffSitePlatformCategory[] = [
  'identite',
  'encyclopedie',
  'avis',
  'annuaire',
  'communaute',
]

type Props = {
  items: PresenceItem[]
}

export function PresenceList({ items }: Props) {
  const [open, setOpen] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: items
      .filter((it) => it.platform.category === cat)
      .sort((a, b) => a.platform.priority - b.platform.priority),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-8">
      {grouped.map(({ category, items: catItems }) => (
        <section key={category}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {OFF_SITE_CATEGORY_LABELS[category]}
          </h3>

          <div className="space-y-3">
            {catItems.map(({ platform, status, profileUrl }) => {
              const meta = STATUS_META[status]
              const StatusIcon = meta.icon
              const isOpen = open.has(platform.id)
              return (
                <div
                  key={platform.id}
                  className="rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/20"
                >
                  {/* Header row */}
                  <div className="flex items-start gap-3 p-4">
                    <StatusIcon size={18} className={cn('mt-0.5 shrink-0', meta.dot)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{platform.name}</p>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            meta.badge
                          )}
                        >
                          {meta.label}
                        </span>
                        {platform.priority === 1 && (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                            Incontournable
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {platform.why}
                      </p>

                      {status === 'present' && profileUrl && (
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Voir le profil <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Démarche (pour absent / à vérifier) */}
                  {status !== 'present' && (
                    <div className="border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => toggle(platform.id)}
                        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-medium text-foreground/80 transition-colors hover:bg-muted/40"
                      >
                        <span className="inline-flex items-center gap-2">
                          <ListChecks size={15} className="text-primary" />
                          Démarche à suivre pour s’y inscrire
                        </span>
                        <ChevronDown
                          size={16}
                          className={cn('shrink-0 transition-transform', isOpen && 'rotate-180')}
                        />
                      </button>
                      {isOpen && (
                        <div className="space-y-2.5 px-4 pb-4">
                          {platform.steps.map((stepText, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
                                {i + 1}
                              </span>
                              <p className="text-sm leading-relaxed text-foreground/80">
                                {stepText}
                              </p>
                            </div>
                          ))}
                          {!platform.selfServeFree && (
                            <p className="pl-7 text-xs italic text-muted-foreground">
                              ⚠️ Pas en libre accès gratuit (validation / critères spécifiques).
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
