'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Shield, Wrench, FileText, BookOpen, Search } from 'lucide-react'

const TABS = [
  { label: "Vue d'ensemble", segment: 'overview', icon: LayoutDashboard },
  { label: 'Autorité', segment: 'authority', icon: Shield },
  { label: 'Technique', segment: 'technical', icon: Wrench },
  { label: 'Contenu', segment: 'content', icon: FileText },
  { label: 'Publishers', segment: 'publishers', icon: BookOpen },
  { label: 'Découverte', segment: 'discovery', icon: Search },
]

type Props = {
  siteId: string
}

export function SiteTabs({ siteId }: Props) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Onglets du site"
      className="flex overflow-x-auto border-b border-border bg-card px-4 gap-1 scrollbar-none"
    >
      {TABS.map((tab) => {
        const href = `/sites/${siteId}/${tab.segment}`
        const isActive = pathname === href || pathname.startsWith(`${href}/`)
        const Icon = tab.icon
        return (
          <Link
            key={tab.segment}
            href={href as Route}
            className={[
              'relative inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors duration-150',
              isActive
                ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t-full after:bg-gradient-to-r after:from-indigo-600 after:to-violet-600'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <Icon size={14} aria-hidden />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
