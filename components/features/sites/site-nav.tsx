'use client'

import type { Route } from 'next'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TrendingUp, ListTodo, Swords, Radio, MessageSquareQuote, MapPin, Shield, Wrench, FileText, Globe, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { captureCoachEvent } from '@/components/features/coach/coach-analytics'

type NavItem = { label: string; segment: string; icon: LucideIcon }
type NavGroup = { label: string | null; items: NavItem[] }

// Navigation latérale groupée — 14 onglets répartis en 5 sections lisibles
// (cf. discussion IA : « Agir / Diagnostic / Marché / Résultats »).
const GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ label: "Vue d'ensemble", segment: 'overview', icon: LayoutDashboard }],
  },
  {
    label: 'Agir',
    items: [
      { label: 'Plan d’action', segment: 'action-plan', icon: ListTodo },
      { label: 'Coach', segment: 'coach', icon: Sparkles },
    ],
  },
  {
    label: 'Diagnostic',
    items: [
      { label: 'Autorité', segment: 'authority', icon: Shield },
      { label: 'Technique', segment: 'technical', icon: Wrench },
      { label: 'Contenu', segment: 'content', icon: FileText },
      { label: 'Local', segment: 'local', icon: MapPin },
    ],
  },
  {
    label: 'Marché',
    items: [
      { label: 'Concurrents', segment: 'competitors', icon: Swords },
      { label: 'Réputation', segment: 'reputation', icon: MessageSquareQuote },
      { label: 'Présence', segment: 'presence', icon: Globe },
    ],
  },
  {
    label: 'Résultats',
    items: [
      { label: 'Suivi', segment: 'trends', icon: TrendingUp },
      { label: 'Pixel', segment: 'pixel', icon: Radio },
    ],
  },
]

// Liste à plat pour le fallback horizontal mobile
const FLAT_ITEMS: NavItem[] = GROUPS.flatMap((group) => group.items)

type Props = {
  siteId: string
}

export function SiteNav({ siteId }: Props) {
  const pathname = usePathname()

  const hrefFor = (segment: string) => `/sites/${siteId}/${segment}`
  const isActive = (segment: string) => {
    const href = hrefFor(segment)
    return pathname === href || pathname.startsWith(`${href}/`)
  }
  const onClickFor = (segment: string, active: boolean) =>
    segment === 'coach' && !active
      ? () => captureCoachEvent('coach_opened', { source: 'tab' })
      : undefined

  return (
    <>
      {/* Mobile : barre horizontale scrollable (à plat) */}
      <nav
        aria-label="Navigation du site"
        className="flex overflow-x-auto border-b border-border bg-card px-4 gap-1 scrollbar-none lg:hidden"
      >
        {FLAT_ITEMS.map(({ label, segment, icon: Icon }) => {
          const active = isActive(segment)
          return (
            <Link
              key={segment}
              href={hrefFor(segment) as Route}
              onClick={onClickFor(segment, active)}
              className={cn(
                'relative inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors duration-150',
                active
                  ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t-full after:bg-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon size={14} aria-hidden />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Desktop : sidebar verticale groupée */}
      <aside
        aria-label="Navigation du site"
        className="hidden w-56 shrink-0 border-r border-border bg-card lg:block"
      >
        <nav className="sticky top-0 space-y-5 p-3">
          {GROUPS.map((group, index) => (
            <div key={group.label ?? `group-${index}`} className="space-y-0.5">
              {group.label && (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  {group.label}
                </p>
              )}
              {group.items.map(({ label, segment, icon: Icon }) => {
                const active = isActive(segment)
                return (
                  <Link
                    key={segment}
                    href={hrefFor(segment) as Route}
                    onClick={onClickFor(segment, active)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon size={16} className="shrink-0" aria-hidden />
                    {label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
