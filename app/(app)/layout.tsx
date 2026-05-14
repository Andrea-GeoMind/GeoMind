import { redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/features/app/sidebar'

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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userEmail={user.email ?? ''} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
