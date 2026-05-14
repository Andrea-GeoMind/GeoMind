import type { Route } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'

type Props = {
  children: React.ReactNode
  params: Promise<{ siteId: string }>
}

const TABS = [
  { label: "Vue d'ensemble", segment: 'overview' },
  { label: 'Autorité',       segment: 'authority' },
  { label: 'Technique',      segment: 'technical' },
  { label: 'Contenu',        segment: 'content' },
  { label: 'Publishers',     segment: 'publishers' },
  { label: 'Découverte',     segment: 'discovery' },
]

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

      <nav
        aria-label="Onglets du site"
        className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4"
      >
        {TABS.map((tab) => (
          <Link
            key={tab.segment}
            href={`/sites/${siteId}/${tab.segment}` as Route}
            className="whitespace-nowrap px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="flex-1">{children}</div>
    </div>
  )
}
