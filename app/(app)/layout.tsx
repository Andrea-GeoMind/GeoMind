import { redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { getUsageStats } from '@/lib/quotas'
import { getSitesByUserId } from '@/lib/db/queries/sites'
import { formatCreditsAmount, formatCreditsAsUsage } from '@/lib/credits-shared'
import Sidebar from '@/components/features/app/sidebar'
import { MobileSidebar } from '@/components/features/app/mobile-sidebar'
import { AnalysisLockProvider } from '@/components/features/analysis/analysis-lock-provider'
import { LowCreditsBanner } from '@/components/features/credits/low-credits-banner'
import { CoachProvider } from '@/components/features/coach/coach-provider'
import { CoachFloatingButton } from '@/components/features/coach/coach-floating-button'
import { CoachFloatingPanel } from '@/components/features/coach/coach-floating-panel'

const LOW_CREDIT_BANNER_RATIO = 0.2

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Set user context for Sentry error tracking
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email ?? undefined })
  }

  const [stats, siteRows] = await Promise.all([getUsageStats(user.id), getSitesByUserId(user.id)])
  const sites = siteRows.map((s) => ({ id: s.id, name: s.name, url: s.url }))
  const credits = Number.isFinite(stats.credits.total)
    ? {
        amount: formatCreditsAmount(stats.credits.total),
        usage: formatCreditsAsUsage(stats.credits.total),
      }
    : null

  const showLowCreditsBanner =
    Number.isFinite(stats.creditsPerMonth) &&
    stats.creditsPerMonth > 0 &&
    stats.credits.monthly < Math.floor(stats.creditsPerMonth * LOW_CREDIT_BANNER_RATIO)

  return (
    <AnalysisLockProvider>
      <CoachProvider>
        <div className="flex h-screen flex-col overflow-hidden lg:flex-row">
          {/* Mobile : barre supérieure + drawer (PLAN item 19) */}
          <MobileSidebar>
            <Sidebar userEmail={user.email ?? ''} credits={credits} sites={sites} />
          </MobileSidebar>
          {/* Desktop : sidebar fixe */}
          <div className="hidden lg:block">
            <Sidebar userEmail={user.email ?? ''} credits={credits} sites={sites} />
          </div>
          <main className="flex-1 overflow-y-auto">
            {showLowCreditsBanner && (
              <LowCreditsBanner
                monthlyRemaining={stats.credits.monthly}
                allowance={stats.creditsPerMonth}
              />
            )}
            {children}
          </main>
        </div>
        <CoachFloatingButton creditsBadge={credits?.amount ?? null} />
        <CoachFloatingPanel />
      </CoachProvider>
    </AnalysisLockProvider>
  )
}
