import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DeleteAccountButton } from '@/components/features/settings/delete-account-button'

export const metadata: Metadata = {
  title: 'Compte — GEOMIND',
}

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Email */}
      <div className="rounded-xl border bg-card shadow-sm p-6">
        <p className="text-base font-semibold mb-4">Informations du compte</p>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Adresse e-mail
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{user.email}</p>
        </div>
      </div>

      {/* Password */}
      <div className="rounded-xl border bg-card shadow-sm p-6">
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
      <div className="rounded-xl border border-destructive/30 bg-card shadow-sm p-6">
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
