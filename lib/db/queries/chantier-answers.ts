/**
 * lib/db/queries/chantier-answers.ts
 *
 * Réponses de l'espace client et leur historique. L'appelant a déjà vérifié
 * l'accès au chantier et validé la saisie (validateFieldSave).
 */

import { and, desc, eq, isNull, ne } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { db } from '@/lib/db/client'
import { chantierAnswerRevisions, chantierAnswers, chantierFiles, chantiers } from '@/lib/db/schema'
import { toStoredValue, type FieldDef } from '@/lib/chantiers/fields'
import { planRevision, type RevisionActor } from '@/lib/chantiers/revisions'

/** establishment_id = $1, ou IS NULL pour un champ du chantier entier */
const sameEstablishment = (column: AnyPgColumn, establishmentId: string | null) =>
  establishmentId === null ? isNull(column) : eq(column, establishmentId)

/**
 * Enregistre une réponse et met à jour l'historique, dans une transaction.
 * Renvoie la valeur conservée (horodatée par le serveur pour les accords).
 */
export async function saveChantierAnswer(params: {
  chantierId: string
  establishmentId: string | null
  field: FieldDef
  input: unknown
  actor: RevisionActor
  ipTruncated: string
  now?: Date
}): Promise<unknown> {
  const { chantierId, establishmentId, field, input, actor, ipTruncated } = params
  const now = params.now ?? new Date()

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ value: chantierAnswers.value })
      .from(chantierAnswers)
      .where(
        and(
          eq(chantierAnswers.chantierId, chantierId),
          sameEstablishment(chantierAnswers.establishmentId, establishmentId),
          eq(chantierAnswers.fieldKey, field.key)
        )
      )
      .for('update')

    const stored = toStoredValue(field, input, { now, ipTruncated, previous: existing?.value })

    await tx
      .insert(chantierAnswers)
      .values({ chantierId, establishmentId, fieldKey: field.key, value: stored, updatedBy: actor, updatedAt: now })
      .onConflictDoUpdate({
        target: [chantierAnswers.chantierId, chantierAnswers.establishmentId, chantierAnswers.fieldKey],
        set: { value: stored, updatedBy: actor, updatedAt: now },
      })

    const [last] = await tx
      .select({
        id: chantierAnswerRevisions.id,
        actor: chantierAnswerRevisions.actor,
        oldValue: chantierAnswerRevisions.oldValue,
        updatedAt: chantierAnswerRevisions.updatedAt,
      })
      .from(chantierAnswerRevisions)
      .where(
        and(
          eq(chantierAnswerRevisions.chantierId, chantierId),
          sameEstablishment(chantierAnswerRevisions.establishmentId, establishmentId),
          eq(chantierAnswerRevisions.fieldKey, field.key)
        )
      )
      .orderBy(desc(chantierAnswerRevisions.createdAt))
      .limit(1)

    const plan = planRevision({
      last: last ?? null,
      actor,
      previousValue: existing?.value,
      nextValue: stored,
      now,
    })
    if (plan.action === 'insert') {
      await tx.insert(chantierAnswerRevisions).values({
        chantierId,
        establishmentId,
        fieldKey: field.key,
        oldValue: plan.oldValue,
        newValue: plan.newValue,
        actor,
        createdAt: now,
        updatedAt: now,
      })
    } else if (plan.action === 'merge') {
      await tx
        .update(chantierAnswerRevisions)
        .set({ newValue: plan.newValue, updatedAt: now })
        .where(eq(chantierAnswerRevisions.id, plan.id))
    } else if (plan.action === 'discard') {
      await tx.delete(chantierAnswerRevisions).where(eq(chantierAnswerRevisions.id, plan.id))
    }

    if (plan.action !== 'skip') {
      await tx.update(chantiers).set({ updatedAt: now }).where(eq(chantiers.id, chantierId))
    }
    return stored
  })
}

export async function loadChantierState(chantierId: string) {
  const [answers, files] = await Promise.all([
    db
      .select({
        establishmentId: chantierAnswers.establishmentId,
        fieldKey: chantierAnswers.fieldKey,
        value: chantierAnswers.value,
      })
      .from(chantierAnswers)
      .where(eq(chantierAnswers.chantierId, chantierId)),
    db
      .select({
        establishmentId: chantierFiles.establishmentId,
        fieldKey: chantierFiles.fieldKey,
        status: chantierFiles.status,
      })
      .from(chantierFiles)
      .where(and(eq(chantierFiles.chantierId, chantierId), ne(chantierFiles.status, 'deleted'))),
  ])
  return { answers, files }
}

/** « J'ai terminé » : horodaté, le client peut encore modifier ensuite. */
export async function markChantierSubmitted(chantierId: string, now: Date = new Date()): Promise<Date> {
  await db
    .update(chantiers)
    .set({ submittedAt: now, status: 'submitted', updatedAt: now })
    .where(and(eq(chantiers.id, chantierId), ne(chantiers.status, 'closed')))
  return now
}

/** Réponses du chantier entier (attestations, décisions communes), par clé. */
export async function loadChantierLevelAnswers(chantierId: string): Promise<Map<string, unknown>> {
  const rows = await db
    .select({ fieldKey: chantierAnswers.fieldKey, value: chantierAnswers.value })
    .from(chantierAnswers)
    .where(and(eq(chantierAnswers.chantierId, chantierId), isNull(chantierAnswers.establishmentId)))
  return new Map(rows.map((r) => [r.fieldKey, r.value]))
}
