import 'server-only'
import { and, asc, eq, gt, isNotNull, isNull, lte } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  chantierAnswerRevisions,
  chantierAnswers,
  chantierEstablishments,
  chantierFiles,
  chantiers,
} from '@/lib/db/schema'
import { env } from '@/lib/env'
import { sendEmail } from '@/lib/email/send'
import { alertEmailFor } from '@/lib/chantiers/copy'
import {
  EXPIRY_REMINDER_DAYS,
  buildActivityDigest,
  buildExpiryReminder,
} from '@/lib/chantiers/notifications'

/**
 * Alertes e-mail de l'espace chantier, appelées par les fonctions Inngest
 * chantier-activity-digest et chantier-expiry-reminder.
 */

export function dashboardUrlFor(chantierId: string): string {
  return `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/dashboard/chantiers/${chantierId}`
}

async function loadAll(chantierId: string) {
  const [chantier] = await db.select().from(chantiers).where(eq(chantiers.id, chantierId))
  if (!chantier) return null
  const [establishments, answers, files] = await Promise.all([
    db
      .select()
      .from(chantierEstablishments)
      .where(eq(chantierEstablishments.chantierId, chantierId))
      .orderBy(asc(chantierEstablishments.position)),
    db.select().from(chantierAnswers).where(eq(chantierAnswers.chantierId, chantierId)),
    db.select().from(chantierFiles).where(eq(chantierFiles.chantierId, chantierId)),
  ])
  return { chantier, establishments, answers, files }
}

export type DigestOutcome = 'sent' | 'nothing_new' | 'closed' | 'missing' | 'send_failed'

/**
 * E-mail groupé : tout ce que le client a fait depuis le dernier e-mail,
 * jusqu'à maintenant. La borne n'avance que si l'e-mail est parti, pour qu'un
 * envoi raté soit repris à la vague suivante.
 */
export async function sendActivityDigest(chantierId: string, until: Date = new Date()): Promise<DigestOutcome> {
  const data = await loadAll(chantierId)
  if (!data) return 'missing'
  if (data.chantier.status === 'closed') return 'closed'

  const since = data.chantier.activityNotifiedThrough
  const revisions = await db
    .select()
    .from(chantierAnswerRevisions)
    .where(
      and(
        eq(chantierAnswerRevisions.chantierId, chantierId),
        eq(chantierAnswerRevisions.actor, 'client'),
        lte(chantierAnswerRevisions.updatedAt, until),
        since ? gt(chantierAnswerRevisions.updatedAt, since) : undefined
      )
    )

  const email = buildActivityDigest({ ...data, revisions, since, until, dashboardUrl: dashboardUrlFor(chantierId) })
  if (!email) {
    await db.update(chantiers).set({ activityNotifiedThrough: until }).where(eq(chantiers.id, chantierId))
    return 'nothing_new'
  }

  const sent = await sendEmail('chantier-activity', { to: alertEmailFor(data.chantier.options), ...email })
  if (!sent) return 'send_failed'
  await db.update(chantiers).set({ activityNotifiedThrough: until }).where(eq(chantiers.id, chantierId))
  return 'sent'
}

/**
 * Alerte 7 jours avant l'expiration du lien, une fois par lien, si le client
 * n'a pas cliqué sur « J'ai terminé ».
 */
export async function sendExpiryReminders(now: Date = new Date()): Promise<{ sent: number; failed: number }> {
  const horizon = new Date(now.getTime() + EXPIRY_REMINDER_DAYS * 86_400_000)
  const due = await db
    .select({ id: chantiers.id })
    .from(chantiers)
    .where(
      and(
        eq(chantiers.status, 'open'),
        isNull(chantiers.submittedAt),
        isNotNull(chantiers.tokenHash),
        isNull(chantiers.tokenRevokedAt),
        isNull(chantiers.expiryReminderSentAt),
        gt(chantiers.tokenExpiresAt, now),
        lte(chantiers.tokenExpiresAt, horizon)
      )
    )

  let sent = 0
  let failed = 0
  for (const { id } of due) {
    const data = await loadAll(id)
    const email = data && buildExpiryReminder({ ...data, now, dashboardUrl: dashboardUrlFor(id) })
    if (!data || !email) continue
    if (await sendEmail('chantier-expiry', { to: alertEmailFor(data.chantier.options), ...email })) {
      await db.update(chantiers).set({ expiryReminderSentAt: now }).where(eq(chantiers.id, id))
      sent++
    } else {
      failed++
    }
  }
  return { sent, failed }
}
