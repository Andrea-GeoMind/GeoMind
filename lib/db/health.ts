/**
 * lib/db/health.ts
 *
 * Sonde de la base, appelée par le healthcheck quotidien.
 *
 * Raison d'être : le 2026-10-03, le projet Supabase s'est mis en pause pour
 * inactivité — le plan gratuit suspend un projet après sept jours sans requête.
 * Le site est resté debout en apparence, ses pages publiques étant rendues
 * statiquement, mais la connexion, le tableau de bord et l'audit gratuit
 * renvoyaient des erreurs. Personne n'a rien vu avant de l'essayer à la main.
 *
 * Le healthcheck quotidien existait déjà, mais il ne sondait que les moteurs IA
 * et l'envoi d'email : aucune requête en base, donc aucune activité aux yeux de
 * Supabase. Cette sonde fait les deux à la fois — elle vérifie que la base
 * répond, et ce faisant elle la garde éveillée.
 *
 * La requête est volontairement minuscule : lire l'heure du serveur ne touche
 * aucune table et ne dépend d'aucune donnée.
 */

import { sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'

export interface DatabaseHealth {
  ok: boolean
  /** Aller-retour complet, en millisecondes. */
  durationMs: number
  error?: string
}

/** Au-delà, la base répond mais si lentement que l'app est inutilisable. */
export const SLOW_QUERY_MS = 5_000

export async function probeDatabase(): Promise<DatabaseHealth> {
  const startedAt = Date.now()
  try {
    await db.execute(sql`select 1 as ok`)
    return { ok: true, durationMs: Date.now() - startedAt }
  } catch (err) {
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
