'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Globe, Settings, LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Route } from 'next'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'

type NavItem = {
  href: Route
  label: string
  icon: LucideIcon
  match?: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/sites', label: 'Mes sites', icon: Globe },
  { href: '/settings/account', label: 'Paramètres', icon: Settings, match: '/settings' },
]

type Props = {
  userEmail: string
}

export default function Sidebar({ userEmail }: Props) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          GEOMIND
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const isActive = pathname === href || pathname.startsWith((match ?? href) + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <p className="mb-2 truncate px-3 text-xs text-muted-foreground">{userEmail}</p>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Déconnexion
          </Button>
        </form>
      </div>
    </aside>
  )
}
