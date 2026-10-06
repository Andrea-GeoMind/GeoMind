/**
 * lib/db/queries/chantiers.ts
 *
 * Espace client de chantier, côté GeoMind. Toutes les fonctions prennent
 * l'identifiant du propriétaire et filtrent dessus : un chantier n'est jamais
 * lu ni modifié par un autre compte, même admin (règle CLAUDE.md n°11).
 */

import { and, asc, desc, eq, inArray, max, ne } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  chantierAccessLogs,
  chantierAnswers,
  chantierEstablishments,
  chantierFiles,
  chantiers,
} from '@/lib/db/schema'
import { computeCompleteness, type Completeness } from '@/lib/chantiers/completeness'
import { generateChantierToken, tokenExpiryFrom } from '@/lib/chantiers/token'
import type { ChantierInput } from '@/lib/chantiers/validation'

export type ChantierRow = typeof chantiers.$inferSelect
export type ChantierEstablishmentRow = typeof chantierEstablishments.$inferSelect

export async function createChantier(ownerId: string, input: ChantierInput): Promise<string> {
  return db.transaction(async (tx) => {
    const [chantier] = await tx
      .insert(chantiers)
      .values({
        ownerId,
        clientName: input.clientName,
        contactEmail: input.contactEmail || null,
        options: { extraFields: input.extraFields, geomindAddress: input.geomindAddress },
      })
      .returning({ id: chantiers.id })
    if (!chantier) throw new Error('Création du chantier impossible')

    await tx.insert(chantierEstablishments).values(
      input.establishments.map((e, position) => ({
        chantierId: chantier.id,
        kind: e.kind,
        name: e.name,
        website: e.website || null,
        position,
        options: { addressOptions: e.addressOptions, extraFields: e.extraFields },
      }))
    )
    return chantier.id
  })
}

export async function findChantierByClientName(
  ownerId: string,
  clientName: string
): Promise<ChantierRow | null> {
  const [row] = await db
    .select()
    .from(chantiers)
    .where(and(eq(chantiers.ownerId, ownerId), eq(chantiers.clientName, clientName)))
    .limit(1)
  return row ?? null
}

export interface ChantierSummary {
  chantier: ChantierRow
  establishments: ChantierEstablishmentRow[]
  completeness: Completeness
  lastActivityAt: Date
}

/** Liste du tableau de bord : chantiers du propriétaire, du plus récent au plus ancien. */
export async function listChantierSummaries(ownerId: string): Promise<ChantierSummary[]> {
  const rows = await db
    .select()
    .from(chantiers)
    .where(eq(chantiers.ownerId, ownerId))
    .orderBy(desc(chantiers.createdAt))
  if (rows.length === 0) return []

  const ids = rows.map((c) => c.id)
  const [establishments, answers, files, accesses] = await Promise.all([
    db
      .select()
      .from(chantierEstablishments)
      .where(inArray(chantierEstablishments.chantierId, ids))
      .orderBy(asc(chantierEstablishments.position)),
    db
      .select({
        chantierId: chantierAnswers.chantierId,
        establishmentId: chantierAnswers.establishmentId,
        fieldKey: chantierAnswers.fieldKey,
        value: chantierAnswers.value,
        updatedAt: chantierAnswers.updatedAt,
      })
      .from(chantierAnswers)
      .where(inArray(chantierAnswers.chantierId, ids)),
    db
      .select({
        chantierId: chantierFiles.chantierId,
        establishmentId: chantierFiles.establishmentId,
        fieldKey: chantierFiles.fieldKey,
        status: chantierFiles.status,
        createdAt: chantierFiles.createdAt,
      })
      .from(chantierFiles)
      .where(and(inArray(chantierFiles.chantierId, ids), ne(chantierFiles.status, 'deleted'))),
    db
      .select({ chantierId: chantierAccessLogs.chantierId, last: max(chantierAccessLogs.createdAt) })
      .from(chantierAccessLogs)
      .where(and(inArray(chantierAccessLogs.chantierId, ids), eq(chantierAccessLogs.event, 'view')))
      .groupBy(chantierAccessLogs.chantierId),
  ])

  return rows.map((chantier) => {
    const own = <T extends { chantierId: string | null }>(list: T[]) =>
      list.filter((x) => x.chantierId === chantier.id)
    const ests = own(establishments)
    const ans = own(answers)
    const fls = own(files)
    const lastView = own(accesses)[0]?.last ?? null

    const completeness = computeCompleteness({
      chantierOptions: chantier.options,
      establishments: ests.map((e) => ({ id: e.id, name: e.name, kind: e.kind, options: e.options })),
      answers: ans,
      files: fls,
    })

    const lastActivityAt = new Date(
      Math.max(
        chantier.updatedAt.getTime(),
        ...ans.map((a) => a.updatedAt.getTime()),
        ...fls.map((f) => f.createdAt.getTime()),
        lastView?.getTime() ?? 0
      )
    )

    return { chantier, establishments: ests, completeness, lastActivityAt }
  })
}

/**
 * Émet un nouveau lien (premier lien ou régénération) : l'ancien cesse aussitôt
 * de fonctionner. Renvoie le lien en clair — la seule fois où il existe hors
 * du navigateur du client — ou null si le chantier n'appartient pas à ownerId.
 */
export async function issueChantierLink(
  ownerId: string,
  chantierId: string,
  ipTruncated: string,
  now: Date = new Date()
): Promise<string | null> {
  const { token, hash } = generateChantierToken()

  const [updated] = await db
    .update(chantiers)
    .set({
      tokenHash: hash,
      tokenExpiresAt: tokenExpiryFrom(now),
      tokenRevokedAt: null,
      updatedAt: now,
    })
    .where(and(eq(chantiers.id, chantierId), eq(chantiers.ownerId, ownerId), ne(chantiers.status, 'closed')))
    .returning({ id: chantiers.id, status: chantiers.status })
  if (!updated) return null

  if (updated.status === 'draft') {
    await db.update(chantiers).set({ status: 'open' }).where(eq(chantiers.id, chantierId))
  }
  await db.insert(chantierAccessLogs).values({ chantierId, event: 'link_issued', ipTruncated })
  return token
}

/** Un chantier et ses établissements, pour son propriétaire seulement. */
export async function getChantierForOwner(
  ownerId: string,
  chantierId: string
): Promise<{ chantier: ChantierRow; establishments: ChantierEstablishmentRow[] } | null> {
  const [chantier] = await db
    .select()
    .from(chantiers)
    .where(and(eq(chantiers.id, chantierId), eq(chantiers.ownerId, ownerId)))
  if (!chantier) return null
  const establishments = await db
    .select()
    .from(chantierEstablishments)
    .where(eq(chantierEstablishments.chantierId, chantierId))
    .orderBy(asc(chantierEstablishments.position))
  return { chantier, establishments }
}
