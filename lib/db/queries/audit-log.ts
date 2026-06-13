/**
 * lib/db/queries/audit-log.ts
 *
 * Journal des mutations sensibles (PLAN item 38). Best-effort : un échec
 * d'écriture du log ne doit jamais faire échouer l'opération métier qu'il trace.
 */

import { db } from '@/lib/db/client'
import { auditLogs } from '@/lib/db/schema'

export type AuditAction =
  | 'account.deleted'
  | 'plan.changed'
  | 'credits.refunded'
  | 'credits.pack_purchased'

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
