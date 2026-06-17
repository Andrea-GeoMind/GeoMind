import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { offSitePresence } from '@/lib/db/schema'

export type OffSitePresenceStatus = 'present' | 'absent' | 'unknown'

export type OffSitePresenceRow = {
  id: string
  analysisId: string
  siteId: string
  platformId: string
  status: OffSitePresenceStatus
  profileUrl: string | null
  evidence: string | null
  createdAt: Date
}

export type OffSitePresenceInput = {
  platformId: string
  status: OffSitePresenceStatus
  profileUrl: string | null
  evidence: string | null
}

export async function insertOffSitePresence(
  analysisId: string,
  siteId: string,
  items: OffSitePresenceInput[]
) {
  if (items.length === 0) return []
  const rows = items.map((p) => ({
    analysisId,
    siteId,
    platformId: p.platformId,
    status: p.status,
    profileUrl: p.profileUrl,
    evidence: p.evidence,
  }))
  return db.insert(offSitePresence).values(rows).returning()
}

export async function getOffSitePresenceByAnalysisId(
  analysisId: string
): Promise<OffSitePresenceRow[]> {
  return db.select().from(offSitePresence).where(eq(offSitePresence.analysisId, analysisId))
}

export async function deleteOffSitePresenceByAnalysisId(analysisId: string) {
  await db.delete(offSitePresence).where(eq(offSitePresence.analysisId, analysisId))
}
