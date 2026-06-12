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
const RATE_LIMIT_PER_HOUR = 5

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

  if (cached) {
    return NextResponse.json({
      domain,
      score: cached.score,
      checks: cached.checks,
      cached: true,
    })
  }

  // Rate limit par IP
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const [{ count }] = (await db
    .select({ count: sql<number>`count(*)::int` })
    .from(publicAudits)
    .where(and(eq(publicAudits.ipHash, ipHash), gte(publicAudits.createdAt, hourAgo)))) as [
    { count: number },
  ]
  if (count >= RATE_LIMIT_PER_HOUR) {
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

  await db.insert(publicAudits).values({
    domain: result.domain,
    score: result.score,
    checks: result.checks,
    ipHash,
  })

  return NextResponse.json({
    domain: result.domain,
    score: result.score,
    checks: result.checks,
    cached: false,
  })
}
