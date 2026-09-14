'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
