import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { publishers } from '@/lib/db/schema'
import type { PublisherItem } from '@/lib/ai/schemas'

export type PublisherRow = {
  id: string
  analysisId: string
  siteId: string
  name: string
  url: string
  category: 'media' | 'community' | 'public_base'
  pitchAngle: string
  createdAt: Date
}

export async function insertPublishers(
  analysisId: string,
  siteId: string,
  items: PublisherItem[]
) {
  const rows = items.map((p) => ({
    analysisId,
    siteId,
    name: p.name,
    url: p.url,
    category: p.category,
    pitchAngle: p.pitch_angle,
  }))

  return db.insert(publishers).values(rows).returning()
}

export async function getPublishersByAnalysisId(analysisId: string): Promise<PublisherRow[]> {
  return db.select().from(publishers).where(eq(publishers.analysisId, analysisId))
}

export async function deletePublishersByAnalysisId(analysisId: string) {
  await db.delete(publishers).where(eq(publishers.analysisId, analysisId))
}
