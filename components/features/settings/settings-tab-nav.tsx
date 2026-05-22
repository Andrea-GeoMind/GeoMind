'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Route } from 'next'

const TABS: { label: string; href: Route }[] = [
  { label: 'Compte', href: '/settings/account' },
  { label: 'Facturation', href: '/settings/billing' },
  { label: 'Utilisation', href: '/settings/usage' },
]

export function SettingsTabNav() {
  const pathname = usePathname()

  return (
    <nav className="mb-8 flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? '-mb-px border-primary text-primary'
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
