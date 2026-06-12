/**
 * lib/inngest/functions/monthly-report.ts
 *
 * Rapport mensuel par email (PLAN item 15). Cron le 2 du mois à 08:00 UTC
 * (après le passage de surveillance du 1er) : un email par utilisateur ayant
 * au moins un site analysé et les notifications actives.
 * Fan-out par utilisateur, concurrence bornée.
 */

import { desc, eq } from 'drizzle-orm'
import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db/client'
import { profiles, sites } from '@/lib/db/schema'
import { getAnalysesBySiteId } from '@/lib/db/queries/analyses'
import { getCitationRateBetween } from '@/lib/db/queries/citation-checks'
import { getTechnicalIssuesByAnalysisId } from '@/lib/db/queries/technical-issues'
import { getContentIssuesByAnalysisId } from '@/lib/db/queries/content-issues'
import {
  sendMonthlyReportEmail,
  type MonthlySiteReport,
} from '@/lib/email/templates/monthly-report'

const DAY_MS = 24 * 60 * 60 * 1000

async function buildSiteReport(siteId: string, siteName: string): Promise<MonthlySiteReport | null> {
  const analysesList = await getAnalysesBySiteId(siteId)
  const latest = analysesList.find((a) => a.status === 'success')
  // Pas d'analyse réussie → rien à raconter sur ce site
  if (!latest) return null

  const now = new Date()
  const [current, previous] = await Promise.all([
    getCitationRateBetween(siteId, new Date(now.getTime() - 30 * DAY_MS), now),
    getCitationRateBetween(
      siteId,
      new Date(now.getTime() - 60 * DAY_MS),
      new Date(now.getTime() - 30 * DAY_MS)
    ),
  ])

  const [technical, content] = await Promise.all([
    getTechnicalIssuesByAnalysisId(latest.id),
    getContentIssuesByAnalysisId(latest.id),
  ])
  const topActions = [...technical, ...content]
    .sort((a, b) => b.penalty - a.penalty)
    .slice(0, 3)
    .map((i) => i.title)

  return {
    siteId,
    siteName,
    globalScore: latest.globalScore,
    rollingRate: current.rate,
    previousRate: previous.rate,
    topActions,
  }
}

/** Cron : fan-out un événement par utilisateur notifiable. */
export const monthlyReportCronFunction = inngest.createFunction(
  { id: 'monthly-report-cron', triggers: [{ cron: '0 8 2 * *' }] },
  async ({ step }) => {
    const users = await step.run('list-users', async () => {
      const rows = await db
        .select({ userId: profiles.id })
        .from(profiles)
        .innerJoin(sites, eq(sites.userId, profiles.id))
        .where(eq(profiles.emailNotifications, true))
        .groupBy(profiles.id)
      return rows.map((r) => r.userId)
    })
    if (users.length === 0) return { dispatched: 0 }

    await step.sendEvent(
      'fan-out-reports',
      users.map((userId) => ({ name: 'user.monthly-report.requested', data: { userId } }))
    )
    return { dispatched: users.length }
  }
)

/** Construit et envoie le rapport d'un utilisateur. */
export const monthlyReportSendFunction = inngest.createFunction(
  {
    id: 'monthly-report-send',
    concurrency: { limit: 4 },
    retries: 2,
    triggers: [{ event: 'user.monthly-report.requested' }],
  },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string }

    const sent = await step.run('build-and-send', async () => {
      const [profile] = await db
        .select({ email: profiles.email, emailNotifications: profiles.emailNotifications })
        .from(profiles)
        .where(eq(profiles.id, userId))
      if (!profile || !profile.emailNotifications) return false

      const userSites = await db
        .select({ id: sites.id, name: sites.name })
        .from(sites)
        .where(eq(sites.userId, userId))
        .orderBy(desc(sites.createdAt))

      const reports = (
        await Promise.all(userSites.map((s) => buildSiteReport(s.id, s.name)))
      ).filter((r): r is MonthlySiteReport => r !== null)

      if (reports.length === 0) return false

      await sendMonthlyReportEmail({ to: profile.email, sites: reports })
      return true
    })

    return { sent }
  }
)
