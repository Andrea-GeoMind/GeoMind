'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Globe, Settings, LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Route } from 'next'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { useAnalysisLock } from '@/components/features/analysis/analysis-lock-context'

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
  const { locked } = useAnalysisLock()

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-[#0F172A]">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-800 px-5">
        <div
          className={cn(
            'flex items-center gap-2.5',
            locked && 'pointer-events-none opacity-50'
          )}
          title={locked ? 'Analyse en cours…' : undefined}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600">
              <span className="text-xs font-black text-white">G</span>
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white">
              Geo
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Mind
              </span>
            </span>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const isActive = pathname === href || pathname.startsWith((match ?? href) + '/')
          return (
            <div
              key={href}
              className={cn(locked && 'pointer-events-none')}
              title={locked ? 'Analyse en cours…' : undefined}
            >
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                  locked && 'opacity-50'
                )}
              >
                <Icon
                  className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? 'text-indigo-400' : '')}
                />
                {label}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-800 p-3">
        <div className="mb-1 flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
            {initial}
          </div>
          <p className="min-w-0 truncate text-xs text-slate-400">{userEmail}</p>
        </div>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={locked}
            className="w-full justify-start gap-3 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            title={locked ? 'Analyse en cours…' : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Déconnexion
          </Button>
        </form>
      </div>
    </aside>
  )
}
