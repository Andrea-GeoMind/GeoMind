'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Coins,
  TrendingUp,
  ListTodo,
  Swords,
  Radio,
  MessageSquareQuote,
  MapPin,
  Shield,
  Wrench,
  FileText,
  Globe,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Route } from 'next'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/logo'
import { SiteLogo } from '@/components/features/sites/site-logo'
import { useAnalysisLock } from '@/components/features/analysis/analysis-lock-context'
import { captureCoachEvent } from '@/components/features/coach/coach-analytics'

type GlobalItem = {
  href: Route
  label: string
  icon: LucideIcon
  match?: string
}

const GLOBAL_ITEMS: GlobalItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/settings/account', label: 'Paramètres', icon: Settings, match: '/settings' },
]

type SiteNavItem = { label: string; segment: string; icon: LucideIcon }
type SiteNavGroup = { label: string | null; items: SiteNavItem[] }

// Sections d'un site — affichées dans la sidebar UNIQUEMENT quand un site est
// ouvert (sidebar contextuelle façon Linear : une seule barre, pas de 2e panneau).
const SITE_GROUPS: SiteNavGroup[] = [
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

type SiteLite = { id: string; name: string; url: string }

type Props = {
  userEmail: string
  /** Solde de crédits formaté côté serveur — null si non disponible */
  credits?: { amount: string; usage: string } | null
  /** Sites de l'utilisateur — sert à résoudre le nom du site ouvert. */
  sites?: SiteLite[]
}

export default function Sidebar({ userEmail, credits, sites = [] }: Props) {
  const pathname = usePathname()
  const initial = userEmail.charAt(0).toUpperCase()
  const { locked } = useAnalysisLock()

  // Site ouvert détecté depuis l'URL /sites/<id>/...
  const currentSiteId = pathname.match(/^\/sites\/([^/]+)/)?.[1] ?? null
  const currentSite = currentSiteId ? (sites.find((s) => s.id === currentSiteId) ?? null) : null

  const isGlobalActive = (item: GlobalItem) => {
    const base = item.match ?? item.href
    return pathname === item.href || pathname.startsWith(base + '/')
  }
  const isSiteActive = (segment: string) => {
    if (!currentSiteId) return false
    const href = `/sites/${currentSiteId}/${segment}`
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-[#16304B]">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <div
          className={cn('flex items-center gap-2.5', locked && 'pointer-events-none opacity-50')}
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

      {/* Navigation (scrollable) */}
      <nav className="flex-1 overflow-y-auto p-3">
        {/* Niveau global */}
        <div className="space-y-0.5">
          {GLOBAL_ITEMS.map((item) => {
            const isActive = isGlobalActive(item)
            return (
              <div
                key={item.href}
                className={cn(locked && 'pointer-events-none')}
                title={locked ? 'Analyse en cours…' : undefined}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-[#31649B] text-white'
                      : 'text-[#B2C8DE] hover:bg-white/10 hover:text-white',
                    locked && 'opacity-50'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </div>
            )
          })}
        </div>

        {/* Contexte du site ouvert — la sidebar devient celle du site */}
        {currentSite && (
          <div className="mt-5">
            <div className="my-2 h-px bg-white/10" />

            {/* Identité du site (remplace le statique « Mes sites ») */}
            <Link
              href={`/sites/${currentSite.id}/overview` as Route}
              className="mb-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
            >
              <SiteLogo
                url={currentSite.url}
                name={currentSite.name}
                className="h-8 w-8 ring-white/15"
              />
              <span className="min-w-0 truncate text-sm font-bold tracking-tight text-white">
                {currentSite.name}
              </span>
            </Link>

            {SITE_GROUPS.map((group, index) => (
              <div key={group.label ?? `group-${index}`} className="mt-2 space-y-0.5">
                {group.label && (
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#577196]">
                    {group.label}
                  </p>
                )}
                {group.items.map(({ label, segment, icon: Icon }) => {
                  const active = isSiteActive(segment)
                  return (
                    <Link
                      key={segment}
                      href={`/sites/${currentSite.id}/${segment}` as Route}
                      onClick={
                        segment === 'coach' && !active
                          ? () => captureCoachEvent('coach_opened', { source: 'tab' })
                          : undefined
                      }
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                        active
                          ? 'bg-[#31649B] text-white'
                          : 'text-[#B2C8DE] hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-3">
        {credits && (
          <div className={cn(locked && 'pointer-events-none opacity-50')}>
            <Link
              href="/settings/usage"
              title={credits.usage}
              className="mb-1 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[#B2C8DE] transition-colors hover:bg-white/10 hover:text-white"
            >
              <Coins className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="truncate">{credits.amount} crédits</span>
            </Link>
          </div>
        )}
        <div className="mb-1 flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#31649B] text-xs font-bold text-white">
            {initial}
          </div>
          <p className="min-w-0 truncate text-xs text-[#B2C8DE]">{userEmail}</p>
        </div>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={locked}
            className="w-full justify-start gap-3 text-[#B2C8DE] hover:bg-white/10 hover:text-white"
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
