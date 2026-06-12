/**
 * lib/db/queries/action-states.ts
 *
 * État durable du Plan d'action (PLAN item 16). Clé fonctionnelle :
 * (siteId, ruleKey, pageUrl) — '' pour les issues site-scope.
 */

import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { actionStates } from '@/lib/db/schema'

export type ActionStatus = 'todo' | 'done' | 'verified'
export type ActionSource = 'technical' | 'content'

export async function getActionStatesBySiteId(siteId: string) {
  return db.select().from(actionStates).where(eq(actionStates.siteId, siteId))
}

/** Marque une action « corrigée » (ou la repasse à faire). Upsert. */
export async function setActionStatus(params: {
  siteId: string
  ruleKey: string
  pageUrl: string
  source: ActionSource
  status: 'todo' | 'done'
}): Promise<void> {
  const now = new Date()
  await db
    .insert(actionStates)
    .values({
      siteId: params.siteId,
      ruleKey: params.ruleKey,
      pageUrl: params.pageUrl,
      source: params.source,
      status: params.status,
      markedDoneAt: params.status === 'done' ? now : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [actionStates.siteId, actionStates.ruleKey, actionStates.pageUrl],
      set: {
        status: params.status,
        markedDoneAt: params.status === 'done' ? now : null,
        // Repasser à 'todo'/'done' annule une éventuelle vérification passée
        verifiedAt: null,
        updatedAt: now,
      },
    })
}

/**
 * Réconciliation après une analyse (vérification automatique) :
 * toute action « done » dont la règle n'apparaît PLUS dans l'analyse fraîche
 * passe à « verified » — la correction a réellement fonctionné.
 * `currentIssueKeys` = clés `${ruleKey}::${pageUrl}` présentes dans l'analyse.
 */
export async function reconcileActionStates(
  siteId: string,
  currentIssueKeys: Set<string>
): Promise<number> {
  const states = await db
    .select()
    .from(actionStates)
    .where(and(eq(actionStates.siteId, siteId), eq(actionStates.status, 'done')))

  const verifiedIds = states
    .filter((s) => !currentIssueKeys.has(`${s.ruleKey}::${s.pageUrl}`))
    .map((s) => s.id)

  if (verifiedIds.length === 0) return 0

  const now = new Date()
  await db
    .update(actionStates)
    .set({ status: 'verified', verifiedAt: now, updatedAt: now })
    .where(inArray(actionStates.id, verifiedIds))

  return verifiedIds.length
}
