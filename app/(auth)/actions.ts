'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

export async function signUp(
  email: string,
  password: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding`,
    },
  })

  if (error) return { error: error.message }

  redirect('/verify-email')
}

export async function signIn(
  email: string,
  password: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  redirect('/dashboard')
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

  if (error) return { error: error.message }

  redirect('/reset-password?sent=true')
}

export async function updatePassword(
  password: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }

  redirect('/dashboard')
}
