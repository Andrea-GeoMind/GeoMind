'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSignInLinkEmail } from '@/lib/email/templates/sign-in-link'
import { env } from '@/lib/env'
import { trackEvent } from '@/lib/posthog'
import { humanizeAuthError } from '@/lib/auth-errors'

export async function signUp(
  email: string,
  password: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding`,
    },
  })

  if (error) {
    console.error('[auth] Supabase error:', error.code, error.message)
    return { error: humanizeAuthError(error) }
  }

  if (data.user) {
    trackEvent(data.user.id, 'signup', { method: 'email' })
  }

  redirect('/verify-email')
}

export async function signIn(
  email: string,
  password: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[auth] Supabase error:', error.code, error.message)
    return { error: humanizeAuthError(error) }
  }

  redirect('/dashboard')
}

export async function signInWithGoogle(): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Le callback échange le code puis route vers /dashboard (un nouveau
      // compte y voit l'état vide qui mène à l'onboarding).
      redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard`,
    },
  })

  if (error) {
    console.error('[auth] Supabase error:', error.code, error.message)
    return { error: humanizeAuthError(error) }
  }
  // data.url est l'URL externe de consentement Google — redirect typé refuse
  // une route inconnue, on caste comme pour le checkout Stripe.
  if (data.url) (redirect as (url: string) => never)(data.url)
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPassword(
  email: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password%3Fmode%3Dupdate`,
  })

  if (error) {
    console.error('[auth] Supabase error:', error.code, error.message)
    return { error: humanizeAuthError(error) }
  }

  redirect('/reset-password?sent=true')
}

export async function updatePassword(
  password: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error('[auth] Supabase error:', error.code, error.message)
    return { error: humanizeAuthError(error) }
  }

  redirect('/dashboard')
}

/**
 * Envoie un lien de connexion sans mot de passe.
 *
 * Le tunnel d'audit public crée des comptes sans mot de passe : leurs
 * titulaires n'avaient aucun moyen de revenir, sinon de « réinitialiser » un
 * mot de passe qu'ils n'avaient jamais choisi.
 *
 * On passe par `admin.generateLink` plutôt que par `signInWithOtp`, pour la
 * même raison que le tunnel d'audit : le lien par défaut de Supabase pointe
 * vers `/auth/v1/verify` en flux implicite et renvoie les jetons dans le
 * fragment d'URL, que le serveur ne reçoit jamais. Notre route `/auth/confirm`
 * vérifie le jeton côté serveur.
 *
 * La réponse est volontairement la même que le compte existe ou non : un
 * message différent transformerait ce formulaire en test d'existence d'adresse.
 */
export async function sendSignInLink(email: string): Promise<{ ok: true } | { error: string }> {
  const parsed = z.string().email().safeParse(email.trim().toLowerCase())
  if (!parsed.success) return { error: 'Adresse email invalide.' }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: parsed.data,
    })

    // Compte inconnu : on ne le dit pas, et on n'envoie rien.
    if (error || !data?.properties?.hashed_token) {
      if (error && !/not found|invalid/i.test(error.message)) {
        console.error('[auth] generateLink a échoué :', error.status, error.message)
      }
      return { ok: true }
    }

    const actionLink =
      `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm` +
      `?token_hash=${encodeURIComponent(data.properties.hashed_token)}` +
      `&type=${encodeURIComponent(data.properties.verification_type ?? 'magiclink')}` +
      `&next=${encodeURIComponent('/dashboard')}`

    await sendSignInLinkEmail({ to: parsed.data, actionLink })
  } catch (err) {
    // `sendEmail` loggue déjà le détail Resend. On ne renvoie pas l'erreur au
    // client : elle révélerait l'existence du compte.
    console.error('[auth] envoi du lien de connexion impossible :', err)
  }

  return { ok: true }
}
