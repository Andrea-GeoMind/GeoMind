import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getSiteMetadataBySiteId } from '@/lib/db/queries/site-metadata'
import { getCompetitorsBySiteId } from '@/lib/db/queries/competitors'
import { getPromptsBySiteId } from '@/lib/db/queries/prompts'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const metadata = await getSiteMetadataBySiteId(siteId)
  if (!metadata) {
    return NextResponse.json({ ready: false })
  }

  const [competitors, prompts] = await Promise.all([
    getCompetitorsBySiteId(siteId),
    getPromptsBySiteId(siteId),
  ])

  return NextResponse.json({
    ready: true,
    data: {
      description: metadata.description ?? '',
      keywords: metadata.keywords ?? [],
      competitors: competitors.map((c) => ({ id: c.id, url: c.url, name: c.name ?? '' })),
      prompts: prompts.map((p) => ({ id: p.id, text: p.text, isNeutral: p.isNeutral })),
    },
  })
}
