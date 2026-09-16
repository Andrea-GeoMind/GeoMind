import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /auth/confirm — vérification serveur d'un lien email (token_hash).
 *
 * Distinct de /auth/callback, qui échange un `?code=` (PKCE) et sert aux
 * parcours OAuth et mot de passe oublié.
 *
 * Raison d'être : les liens produits par `auth.admin.generateLink` pointent
 * vers /auth/v1/verify, qui fonctionne en flux implicite — il renvoie les
 * jetons dans le FRAGMENT de l'URL (#access_token=…). Un fragment n'est jamais
 * transmis au serveur : /auth/callback ne voyait donc aucun `code`, échouait,
 * et renvoyait l'utilisateur sur /login?error=auth-callback alors que son
 * authentification venait de réussir.
 *
 * Ici on reçoit le `token_hash` en clair dans la query, on le vérifie côté
 * serveur avec `verifyOtp`, ce qui pose les cookies de session, puis on
 * redirige. `next` voyage dans notre propre URL et ne dépend plus du
 * `redirect_to` de Supabase : il ne peut plus être perdu en route.
 */

/** Types de liens email acceptés — tout autre valeur est refusée. */
const ALLOWED_TYPES: readonly EmailOtpType[] = [
  'magiclink',
  'signup',
  'invite',
  'recovery',
  'email_change',
  'email',
]

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  // Même garde anti-open-redirect que /auth/callback.
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'

  if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.redirect(`${origin}/login?error=auth-callback`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

  if (error) {
    console.error('[auth/confirm] verifyOtp a échoué :', error.status, error.message)
    return NextResponse.redirect(`${origin}/login?error=auth-callback`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
