'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: "Vue d'ensemble", segment: 'overview' },
  { label: 'Autorité', segment: 'authority' },
  { label: 'Technique', segment: 'technical' },
  { label: 'Contenu', segment: 'content' },
  { label: 'Publishers', segment: 'publishers' },
  { label: 'Découverte', segment: 'discovery' },
]

type Props = {
  siteId: string
}

export function SiteTabs({ siteId }: Props) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Onglets du site"
      className="flex overflow-x-auto border-b border-border bg-card px-4"
    >
      {TABS.map((tab) => {
        const href = `/sites/${siteId}/${tab.segment}`
        const isActive = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={tab.segment}
            href={href as Route}
            className={[
              'whitespace-nowrap px-4 py-3 text-sm transition-colors',
              isActive
                ? 'border-b-2 border-primary font-medium text-primary'
                : 'border-b-2 border-transparent font-medium text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
