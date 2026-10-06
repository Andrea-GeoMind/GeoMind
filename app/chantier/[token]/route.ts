import { NextResponse, type NextRequest } from 'next/server'
import {
  CHANTIER_COOKIE,
  CHANTIER_COOKIE_PATH,
  checkChantierToken,
  logChantierAccess,
} from '@/lib/chantiers/access'
import { clientIpFromHeaders, truncateIp } from '@/lib/chantiers/ip'
import { CHANTIER_PRIVATE_HEADERS } from '@/lib/chantiers/headers'

export const dynamic = 'force-dynamic'

/**
 * Entrée de l'espace client : /chantier/[token].
 *
 * Le lien est vérifié, puis échangé contre un cookie httpOnly limité à
 * /chantier, et le navigateur est redirigé vers /chantier/espace. Le lien ne
 * reste ainsi ni dans la barre d'adresse, ni dans l'historique, ni dans ce que
 * voient PostHog, Sentry ou un éventuel site tiers (Referer).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const ip = truncateIp(clientIpFromHeaders(req.headers))
  const access = await checkChantierToken(token, 'view', ip)

  if (!access.ok) {
    const target = new URL('/chantier/statut', req.url)
    target.searchParams.set('raison', access.state)
    const expiresAt = access.chantier?.tokenExpiresAt
    if (access.state === 'expired' && expiresAt) {
      target.searchParams.set('date', expiresAt.toISOString().slice(0, 10))
    }
    return withPrivateHeaders(NextResponse.redirect(target, 303))
  }

  await logChantierAccess(access.chantier.id, 'link_opened', ip)
  const res = NextResponse.redirect(new URL('/chantier/espace', req.url), 303)
  res.cookies.set(CHANTIER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: CHANTIER_COOKIE_PATH,
    expires: access.chantier.tokenExpiresAt ?? undefined,
  })
  return withPrivateHeaders(res)
}

function withPrivateHeaders(res: NextResponse): NextResponse {
  for (const { key, value } of CHANTIER_PRIVATE_HEADERS) res.headers.set(key, value)
  return res
}
