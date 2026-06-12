import { redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { getUsageStats } from '@/lib/quotas'
import { formatCreditsAmount, formatCreditsAsUsage } from '@/lib/credits-shared'
import Sidebar from '@/components/features/app/sidebar'
import { AnalysisLockProvider } from '@/components/features/analysis/analysis-lock-provider'
import { LowCreditsBanner } from '@/components/features/credits/low-credits-banner'

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

  const stats = await getUsageStats(user.id)
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
      <div className="flex h-screen overflow-hidden">
        <Sidebar userEmail={user.email ?? ''} credits={credits} />
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
    </AnalysisLockProvider>
  )
}
