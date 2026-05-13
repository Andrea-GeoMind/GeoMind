import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { authoritySources } from '@/lib/db/schema'

export type AuthoritySourceInsert = {
  authorityResultId: string
  url: string
  title: string | null
  domain: string
  isClientDomain: boolean
}

export async function insertAuthoritySources(items: AuthoritySourceInsert[]) {
  if (items.length === 0) return []
  return db.insert(authoritySources).values(items).returning()
}

export async function getAuthoritySourcesByResultId(authorityResultId: string) {
  return db
    .select()
    .from(authoritySources)
    .where(eq(authoritySources.authorityResultId, authorityResultId))
}
