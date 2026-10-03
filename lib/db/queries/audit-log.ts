/**
 * lib/db/queries/audit-log.ts
 *
 * Journal des mutations sensibles (PLAN item 38). Best-effort : un échec
 * d'écriture du log ne doit jamais faire échouer l'opération métier qu'il trace.
 */

import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { auditLogs } from '@/lib/db/schema'

export type AuditAction =
  | 'account.deleted'
  | 'plan.changed'
  | 'credits.refunded'
  | 'credits.pack_purchased'
  /**
   * Passage du healthcheck quotidien. Une ligne par jour, `userId` null.
   *
   * Sans elle, « est-ce que le cron tourne ? » n'avait aucune réponse
   * consultable : les sondes n'écrivaient nulle part, et le constat se faisait
   * à l'envers — le 2026-10-03, en découvrant que Supabase s'était mis en pause
   * faute d'activité depuis sept jours.
   */
  | 'healthcheck.ran'

export async function logAudit(
  action: AuditAction,
  userId: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await db.insert(auditLogs).values({ userId, action, metadata })
  } catch (err) {
    console.error(`[audit] échec écriture log ${action}:`, err)
  }
}

/** Derniers passages enregistrés d'une action — pour vérifier qu'un cron tourne. */
export async function getRecentAuditLogs(action: AuditAction, limit = 10) {
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.action, action))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
}
