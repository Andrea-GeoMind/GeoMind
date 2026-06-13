/**
 * POST /api/pixel — collecteur d'événements du Pixel GeoMind (PLAN item 29).
 *
 * Appelé par le snippet posé sur le site du CLIENT, depuis le navigateur de SES
 * visiteurs. Donc : pas de session GeoMind, CORS ouvert, traitement best-effort
 * (on ne casse jamais le site du client). On ne stocke QUE le trafic venant
 * d'une IA (detectAiSource non nul) — le reste est ignoré.
 *
 * RGPD : aucune IP ni user-agent en clair stockés — un hash anonyme par
 * visiteur+jour permet le comptage de visiteurs uniques sans traçage durable.
 */

import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSiteByPixelKey, insertPixelEvent, countRecentPixelEvents } from '@/lib/db/queries/pixel'
import { detectAiSource, isValidActionKind } from '@/lib/analysis/pixel'

export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Plafond anti-flood par site et par heure (le pixel d'un site normal en génère peu).
const MAX_EVENTS_PER_HOUR = 5_000

const BodySchema = z.object({
  k: z.string().min(8).max(64), // pixel key
  t: z.enum(['pageview', 'action']), // type
  r: z.string().max(2_000).nullish(), // referrer
  p: z.string().max(2_000).nullish(), // path
  a: z.string().max(32).nullish(), // action kind
})

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: Request) {
  // Réponse 204 quoi qu'il arrive : ne jamais perturber le site du client.
  const ok = () => new NextResponse(null, { status: 204, headers: CORS })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return ok()
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return ok()
  const { k, t, r, p, a } = parsed.data

  // Le pixel ne stocke que le trafic venant d'une IA
  const aiSource = detectAiSource(r)
  if (!aiSource) return ok()

  try {
    const site = await getSiteByPixelKey(k)
    if (!site) return ok()

    if ((await countRecentPixelEvents(site.id)) >= MAX_EVENTS_PER_HOUR) return ok()

    // Hash visiteur anonyme = sha256(ip + ua + jour + siteId), tronqué.
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'na'
    const ua = req.headers.get('user-agent') ?? 'na'
    const day = new Date().toISOString().slice(0, 10)
    const visitorHash = createHash('sha256')
      .update(`${ip}|${ua}|${day}|${site.id}`)
      .digest('hex')
      .slice(0, 32)

    let path = '/'
    try {
      path = p ? new URL(p, 'https://x').pathname.slice(0, 512) : '/'
    } catch {
      path = '/'
    }

    await insertPixelEvent({
      siteId: site.id,
      type: t,
      aiSource,
      path,
      actionKind: t === 'action' && isValidActionKind(a) ? a : null,
      visitorHash,
    })
  } catch (err) {
    console.error('[pixel] ingestion error:', err)
  }

  return ok()
}
