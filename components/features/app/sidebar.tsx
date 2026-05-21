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
  const initial = userEmail.charAt(0).toUpperCase()

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
            <span className="text-xs font-black text-white">G</span>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-foreground">
            Geo
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Mind
            </span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const isActive = pathname === href || pathname.startsWith((match ?? href) + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon
                className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? 'text-primary' : '')}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t p-3">
        <div className="mb-1 flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {initial}
          </div>
          <p className="min-w-0 truncate text-xs text-muted-foreground">{userEmail}</p>
        </div>
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
