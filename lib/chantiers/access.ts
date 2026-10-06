import 'server-only'
import { cookies, headers } from 'next/headers'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { chantierAccessLogs, chantierEstablishments, chantiers } from '@/lib/db/schema'
import { consumeRateLimit } from '@/lib/db/queries/rate-limits'
import { rateLimitKey } from '@/lib/rate-limit'
import { CHANTIER_RATE_LIMITS, type ChantierRateLimitName } from '@/lib/chantiers/rate-limits'
import { hashChantierToken, isWellFormedToken, tokenState, type TokenState } from '@/lib/chantiers/token'
import { clientIpFromHeaders, truncateIp } from '@/lib/chantiers/ip'

/**
 * Accès du client à son espace, sans compte.
 *
 * Le lien /chantier/[token] est échangé contre un cookie httpOnly (route.ts),
 * pour que le lien ne reste ni dans la barre d'adresse, ni dans l'historique,
 * ni dans les outils de mesure. Chaque page et chaque Server Action de
 * l'espace appelle requireChantierAccess(), qui revérifie le lien à partir de
 * ce cookie : existant, non expiré, non révoqué, chantier ouvert ; puis
 * applique la limite de débit de l'opération.
 */

export const CHANTIER_COOKIE = 'geomind_chantier'
export const CHANTIER_COOKIE_PATH = '/chantier'

export type ChantierRow = typeof chantiers.$inferSelect
export type ChantierEstablishmentRow = typeof chantierEstablishments.$inferSelect

export type DeniedState = Exclude<TokenState, 'valid'> | 'rate_limited'

export type ChantierAccess =
  | {
      ok: true
      chantier: ChantierRow
      establishments: ChantierEstablishmentRow[]
      ipTruncated: string
    }
  | { ok: false; state: DeniedState; chantier: ChantierRow | null }

export async function currentIpTruncated(): Promise<string> {
  return truncateIp(clientIpFromHeaders(await headers()))
}

export async function findChantierByToken(token: string): Promise<ChantierRow | null> {
  if (!isWellFormedToken(token)) return null
  const [row] = await db
    .select()
    .from(chantiers)
    .where(eq(chantiers.tokenHash, hashChantierToken(token)))
    .limit(1)
  return row ?? null
}

export async function logChantierAccess(
  chantierId: string | null,
  event: string,
  ipTruncated: string
): Promise<void> {
  await db.insert(chantierAccessLogs).values({ chantierId, event, ipTruncated })
}

/**
 * Vérifie un lien et consomme la limite adaptée. Partagé par la route
 * d'entrée (lien dans l'URL) et requireChantierAccess (lien dans le cookie).
 */
export async function checkChantierToken(
  token: string | undefined,
  limit: ChantierRateLimitName,
  ipTruncated: string
): Promise<ChantierAccess> {
  const chantier = token ? await findChantierByToken(token) : null
  const state = tokenState(chantier, new Date())

  if (state !== 'valid' || !chantier) {
    // Un faux lien coûte : 10 par heure et par IP, puis plus rien n'est vérifié
    const verdict = await consumeRateLimit(
      rateLimitKey('chantier', 'badtoken', ipTruncated),
      CHANTIER_RATE_LIMITS.badToken
    )
    const denied: DeniedState = state === 'valid' ? 'unknown' : state
    await logChantierAccess(chantier?.id ?? null, `${denied}_token`, ipTruncated)
    return { ok: false, state: verdict.allowed ? denied : 'rate_limited', chantier }
  }

  const subject = limit === 'view' ? ipTruncated : chantier.id
  const verdict = await consumeRateLimit(
    rateLimitKey('chantier', limit, subject),
    CHANTIER_RATE_LIMITS[limit]
  )
  if (!verdict.allowed) {
    await logChantierAccess(chantier.id, 'rate_limited', ipTruncated)
    return { ok: false, state: 'rate_limited', chantier }
  }

  const establishments = await db
    .select()
    .from(chantierEstablishments)
    .where(eq(chantierEstablishments.chantierId, chantier.id))
    .orderBy(asc(chantierEstablishments.position))

  return { ok: true, chantier, establishments, ipTruncated }
}

/** Garde de toute page et de toute Server Action de l'espace client. */
export async function requireChantierAccess(limit: ChantierRateLimitName): Promise<ChantierAccess> {
  const token = (await cookies()).get(CHANTIER_COOKIE)?.value
  return checkChantierToken(token, limit, await currentIpTruncated())
}
