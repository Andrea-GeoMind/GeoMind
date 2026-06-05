'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'
import { cn } from '@/lib/utils'

const TABS = [
  { label: "Vue d'ensemble", segment: 'overview' },
  { label: 'Autorité',       segment: 'authority' },
  { label: 'Technique',      segment: 'technical' },
  { label: 'Contenu',        segment: 'content' },
  { label: 'Découverte',     segment: 'discovery' },
  { label: 'Publishers',     segment: 'publishers' },
  { label: 'Coach',          segment: 'coach' },
]

export function SiteTabNav({ siteId }: { siteId: string }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Onglets du site"
      className="flex gap-0 overflow-x-auto border-b border-border bg-background px-4 sm:px-6"
    >
      {TABS.map((tab) => {
        const href = `/sites/${siteId}/${tab.segment}` as Route
        const isActive = pathname.endsWith(`/${tab.segment}`)
        return (
          <Link
            key={tab.segment}
            href={href}
            className={cn(
              'whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors',
              isActive
                ? 'border-indigo-600 font-semibold text-indigo-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
