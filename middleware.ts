import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { canonicalRedirectUrl } from '@/lib/canonical-host'

export async function middleware(request: NextRequest) {
  // Un seul hôte sert l'application. Les cookies de session sont liés à
  // l'hôte : si www et l'apex répondaient tous les deux, passer de l'un à
  // l'autre perdrait la session. 308 (et non 302) pour que la méthode et le
  // corps de la requête soient conservés, et que le cache la retienne.
  const canonical = canonicalRedirectUrl(request.url)
  if (canonical) return NextResponse.redirect(canonical, 308)

  return updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
