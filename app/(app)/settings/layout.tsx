import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsTabNav } from '@/components/features/settings/settings-tab-nav'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Paramètres</h1>
      <SettingsTabNav />
      {children}
    </div>
  )
}
