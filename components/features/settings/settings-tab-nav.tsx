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
    <nav className="mb-8 inline-flex rounded-xl border border-border bg-muted p-1.5 gap-1">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all',
              isActive
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
