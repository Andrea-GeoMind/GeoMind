import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { SiteTabs } from '@/components/features/sites/site-tabs'

type Props = {
  children: React.ReactNode
  params: Promise<{ siteId: string }>
}

export default async function SiteLayout({ children, params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  return (
    <div className="flex flex-col">
      <div className="border-b border-border bg-card px-6 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Site</p>
        <h1 className="mt-0.5 text-lg font-semibold">{site.name}</h1>
        <p className="text-sm text-muted-foreground">{site.url}</p>
      </div>

      <SiteTabs siteId={siteId} />

      <div className="flex-1">{children}</div>
    </div>
  )
}
