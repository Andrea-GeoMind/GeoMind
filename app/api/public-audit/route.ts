/**
 * POST /api/public-audit — audit express public sans inscription (PLAN item 20).
 * Aucun LLM, aucun crédit : vérifications HTTP rapides (lib/analysis/express-audit).
 * Garde-fous : validation Zod, anti-SSRF, cache 24 h par domaine, rate limit
 * 5 audits/heure par IP (hash).
 */

import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { publicAudits } from '@/lib/db/schema'
import {
  normalizePublicUrl,
  runExpressAudit,
  type ExpressAuditResult,
} from '@/lib/analysis/express-audit'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const BodySchema = z.object({ url: z.string().min(3).max(2_000) })

const CACHE_HOURS = 24
/** Audits réellement calculés (fetches réseau) par IP et par heure. */
const RATE_LIMIT_PER_HOUR = 5
/**
 * Plafond sur le nombre total de lignes créées par IP et par heure, cache
 * compris. Depuis qu'une ligne est insérée à chaque requête (pour donner à
 * chaque visiteur son propre jeton), un domaine déjà en cache ne coûte aucun
 * fetch mais crée une ligne : sans ce second plafond, on pourrait remplir la
 * table sans jamais toucher la limite ci-dessus.
 */
const ROW_LIMIT_PER_HOUR = 30

function hashIp(ip: string): string {
  return createHash('sha256').update(`geomind-public-audit:${ip}`).digest('hex').slice(0, 32)
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Adresse invalide.' }, { status: 400 })
  }

  const target = normalizePublicUrl(parsed.data.url)
  if (!target) {
    return NextResponse.json(
      { error: 'Adresse invalide — exemple : https://monentreprise.fr' },
      { status: 400 }
    )
  }

  const domain = target.hostname.replace(/^www\./, '')
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const ipHash = hashIp(ip)

  // Cache 24 h par domaine — un domaine déjà audité ne refait pas les fetches
  const since = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000)
  const [cached] = await db
    .select()
    .from(publicAudits)
    .where(and(eq(publicAudits.domain, domain), gte(publicAudits.createdAt, since)))
    .orderBy(desc(publicAudits.createdAt))
    .limit(1)

  // Compteurs de rate limit sur la dernière heure. On distingue le travail
  // réellement effectué (fetches) du simple nombre de lignes créées.
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const [{ computed, rows }] = (await db
    .select({
      computed: sql<number>`count(*) filter (where ${publicAudits.fromCache} = false)::int`,
      rows: sql<number>`count(*)::int`,
    })
    .from(publicAudits)
    .where(and(eq(publicAudits.ipHash, ipHash), gte(publicAudits.createdAt, hourAgo)))) as [
    { computed: number; rows: number },
  ]

  if (rows >= ROW_LIMIT_PER_HOUR) {
    return NextResponse.json(
      { error: 'Trop de requêtes — réessayez dans une heure.' },
      { status: 429 }
    )
  }

  // Cache 24 h : on réutilise les RÉSULTATS (aucun fetch refait), mais on
  // insère toujours une ligne propre à ce visiteur. Renvoyer la ligne cachée
  // telle quelle partagerait son claim_token — et donc laisserait ce visiteur
  // réclamer l'audit, et l'email, de celui qui l'a lancé avant lui.
  if (cached) {
    const [row] = await db
      .insert(publicAudits)
      .values({
        domain,
        score: cached.score,
        checks: cached.checks,
        ipHash,
        fromCache: true,
      })
      .returning({ claimToken: publicAudits.claimToken })

    return NextResponse.json({
      domain,
      score: cached.score,
      checks: cached.checks,
      claimToken: row.claimToken,
      cached: true,
    })
  }

  if (computed >= RATE_LIMIT_PER_HOUR) {
    return NextResponse.json(
      { error: 'Limite atteinte — réessayez dans une heure, ou créez un compte gratuit pour un audit complet.' },
      { status: 429 }
    )
  }

  let result: ExpressAuditResult | null
  try {
    result = await runExpressAudit(target)
  } catch (err) {
    console.error('[public-audit] erreur:', err)
    result = null
  }

  if (!result) {
    return NextResponse.json(
      {
        error:
          'Impossible de joindre ce site. Vérifiez l’adresse, ou réessayez dans quelques minutes.',
      },
      { status: 422 }
    )
  }

  const [row] = await db
    .insert(publicAudits)
    .values({
      domain: result.domain,
      score: result.score,
      checks: result.checks,
      ipHash,
      fromCache: false,
    })
    .returning({ claimToken: publicAudits.claimToken })

  return NextResponse.json({
    domain: result.domain,
    score: result.score,
    checks: result.checks,
    claimToken: row.claimToken,
    cached: false,
  })
}
