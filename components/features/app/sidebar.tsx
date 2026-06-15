'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Globe, Settings, LogOut, Coins } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Route } from 'next'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/logo'
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
  /** Solde de crédits formaté côté serveur — null si non disponible */
  credits?: { amount: string; usage: string } | null
}

export default function Sidebar({ userEmail, credits }: Props) {
  const pathname = usePathname()
  const initial = userEmail.charAt(0).toUpperCase()
  const { locked } = useAnalysisLock()

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-[#16304B]">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <div
          className={cn(
            'flex items-center gap-2.5',
            locked && 'pointer-events-none opacity-50'
          )}
          title={locked ? 'Analyse en cours…' : undefined}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <LogoMark size={32} />
            <span className="text-lg font-extrabold tracking-tight text-white">
              GEO<span className="text-white/70">MIND</span>
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
        {credits && (
          <div className={cn(locked && 'pointer-events-none opacity-50')}>
            <Link
              href="/settings/usage"
              title={credits.usage}
              className="mb-1 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
            >
              <Coins className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="truncate">
                {credits.amount} crédits
              </span>
            </Link>
          </div>
        )}
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
