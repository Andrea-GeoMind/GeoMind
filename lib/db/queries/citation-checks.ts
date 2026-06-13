/**
 * lib/db/queries/citation-checks.ts
 *
 * Série temporelle de la visibilité (PLAN item 11). Les checks sont écrits par
 * l'analyse d'autorité (et demain par la surveillance planifiée) ; les pages de
 * suivi les agrègent par jour/moteur pour afficher des tendances.
 */

import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { citationChecks } from '@/lib/db/schema'

export type CitationCheckInsert = {
  siteId: string
  promptId: string
  analysisId: string | null
  engine: 'chatgpt' | 'claude' | 'gemini' | 'perplexity'
  mode: 'spontaneous' | 'forced'
  cited: boolean
  position: number | null
}

export async function insertCitationChecks(checks: CitationCheckInsert[]) {
  if (checks.length === 0) return []
  return db.insert(citationChecks).values(checks).returning({ id: citationChecks.id })
}

export interface CitationTrendPoint {
  /** Jour (date UTC tronquée) */
  day: string
  /** Nombre de checks ce jour-là */
  total: number
  /** Nombre de checks où le site était cité */
  cited: number
}

/**
 * Tendance agrégée par jour sur les `days` derniers jours (tous moteurs
 * confondus, mode forcé uniquement pour rester comparable dans le temps).
 */
export async function getCitationTrend(
  siteId: string,
  days = 90
): Promise<CitationTrendPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const rows = (await db.execute(sql`
    SELECT date_trunc('day', checked_at)::date::text AS day,
           count(*)::int AS total,
           count(*) FILTER (WHERE cited)::int AS cited
    FROM citation_checks
    WHERE site_id = ${siteId} AND checked_at >= ${since.toISOString()} AND mode = 'forced'
    GROUP BY 1
    ORDER BY 1 ASC
  `)) as Array<{ day: string; total: number; cited: number }>
  return rows
}

/**
 * Taux de citation sur une fenêtre [since, until[ — utilisé par les alertes
 * pour comparer « avant ce passage de surveillance » vs « ce passage ».
 */
export async function getCitationRateBetween(
  siteId: string,
  since: Date,
  until: Date,
  mode: 'forced' | 'spontaneous' = 'forced'
): Promise<{ total: number; cited: number; rate: number | null }> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      cited: sql<number>`count(*) FILTER (WHERE ${citationChecks.cited})::int`,
    })
    .from(citationChecks)
    .where(
      and(
        eq(citationChecks.siteId, siteId),
        eq(citationChecks.mode, mode),
        gte(citationChecks.checkedAt, since),
        sql`${citationChecks.checkedAt} < ${until}`
      )
    )
  const total = row?.total ?? 0
  const cited = row?.cited ?? 0
  return { total, cited, rate: total > 0 ? Math.round((cited / total) * 100) : null }
}

/** Derniers checks d'un site (debug / détail). */
export async function getRecentCitationChecks(siteId: string, limit = 100) {
  return db
    .select()
    .from(citationChecks)
    .where(eq(citationChecks.siteId, siteId))
    .orderBy(desc(citationChecks.checkedAt))
    .limit(limit)
}

/**
 * Taux de citation sur une fenêtre glissante — la « moyenne 30 jours » qui
 * amortit la variance naturelle des LLMs. Mode 'forced' pour le score
 * comparable, 'spontaneous' pour la citation naturelle (échantillon).
 */
export async function getRollingCitationRate(
  siteId: string,
  days = 30,
  mode: 'forced' | 'spontaneous' = 'forced'
): Promise<{ total: number; cited: number; rate: number | null }> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      cited: sql<number>`count(*) FILTER (WHERE ${citationChecks.cited})::int`,
    })
    .from(citationChecks)
    .where(
      and(
        eq(citationChecks.siteId, siteId),
        eq(citationChecks.mode, mode),
        gte(citationChecks.checkedAt, since)
      )
    )
  const total = row?.total ?? 0
  const cited = row?.cited ?? 0
  return { total, cited, rate: total > 0 ? Math.round((cited / total) * 100) : null }
}
