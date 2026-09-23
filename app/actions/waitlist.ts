'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { addToWaitlist } from '@/lib/db/queries/waitlist'
import { trackEvent } from '@/lib/posthog'

const inputSchema = z.object({
  email: z.email({ message: 'Email invalide. Vérifiez la saisie.' }),
  plan: z.enum(['solo', 'pro', 'business', 'pack']),
  source: z.enum(['pricing', 'billing', 'home']),
})

/**
 * Inscription à la liste d'attente des plans payants (lancement freemium).
 * Accessible sans compte (page tarifs) comme connecté (page facturation) —
 * dans ce dernier cas l'email de session fait foi.
 */
export async function joinWaitlistAction(input: {
  email?: string
  plan: string
  source: string
}): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const parsed = inputSchema.safeParse({
    // L'email de session prime sur la saisie pour un utilisateur connecté.
    email: user?.email ?? input.email,
    plan: input.plan,
    source: input.source,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Saisie invalide.' }
  }

  try {
    await addToWaitlist({
      email: parsed.data.email.toLowerCase().trim(),
      plan: parsed.data.plan,
      source: parsed.data.source,
      userId: user?.id,
    })
  } catch (err) {
    console.error('[joinWaitlistAction] DB error:', err)
    return { error: 'Une erreur est survenue. Veuillez réessayer.' }
  }

  if (user) {
    trackEvent(user.id, 'waitlist_joined', { plan: parsed.data.plan, source: parsed.data.source })
  }

  return { ok: true }
}
