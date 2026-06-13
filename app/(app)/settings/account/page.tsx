import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/client'
import { profiles } from '@/lib/db/schema'
import { DeleteAccountButton } from '@/components/features/settings/delete-account-button'
import { EmailNotificationsToggle } from '@/components/features/settings/email-notifications-toggle'

export const metadata: Metadata = {
  title: 'Compte — GEOMIND',
}

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db
    .select({ emailNotifications: profiles.emailNotifications })
    .from(profiles)
    .where(eq(profiles.id, user.id))

  return (
    <div className="space-y-4">
      {/* Email */}
      <div className="rounded-xl border border-border bg-white shadow-sm p-6">
        <p className="text-base font-semibold mb-4">Informations du compte</p>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Adresse e-mail
          </p>
          <p className="mt-1.5 text-sm font-medium text-foreground">{user.email}</p>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-border bg-white shadow-sm p-6">
        <p className="text-base font-semibold mb-4">Notifications</p>
        <EmailNotificationsToggle initialEnabled={profile?.emailNotifications ?? true} />
      </div>

      {/* Password */}
      <div className="rounded-xl border border-border bg-white shadow-sm p-6">
        <p className="text-base font-semibold mb-1">Mot de passe</p>
        <p className="text-sm text-muted-foreground mb-4">
          Recevez un lien par e-mail pour réinitialiser votre mot de passe.
        </p>
        <Link
          href="/reset-password"
          className="text-sm font-medium text-primary hover:opacity-80 transition-opacity"
        >
          Changer de mot de passe →
        </Link>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-destructive/30 bg-white shadow-sm p-6">
        <p className="text-base font-semibold text-destructive mb-1">Zone dangereuse</p>
        <p className="text-sm text-muted-foreground mb-4">
          La suppression de votre compte est définitive. Toutes vos données (sites, analyses,
          résultats) seront effacées conformément au RGPD.
        </p>
        <DeleteAccountButton />
      </div>
    </div>
  )
}
