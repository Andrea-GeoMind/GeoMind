import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { Radio, Users, MousePointerClick, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/client'
import { eq } from 'drizzle-orm'
import { sites } from '@/lib/db/schema'
import { env } from '@/lib/env'
import { getPixelEvents } from '@/lib/db/queries/pixel'
import { summarizePixelEvents, actionLabel, type ActionKind } from '@/lib/analysis/pixel'
import { PixelInstaller } from '@/components/features/pixel/pixel-installer'

export const metadata: Metadata = {
  title: 'Pixel — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

export default async function PixelPage({ params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [site] = await db
    .select({ id: sites.id, userId: sites.userId, name: sites.name, pixelKey: sites.pixelKey })
    .from(sites)
    .where(eq(sites.id, siteId))
    .limit(1)
  if (!site || site.userId !== user.id) notFound()

  const events = site.pixelKey ? await getPixelEvents(siteId, 30) : []
  const summary = summarizePixelEvents(events)
  const scriptUrl = `${env.NEXT_PUBLIC_SITE_URL}/api/pixel/script.js`

  const hasData = events.length > 0

  return (
    <div className="space-y-6 p-6 sm:p-8">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-foreground">
          <Radio size={18} className="text-primary" />
          Pixel — la preuve par les chiffres
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Combien de visiteurs les IA vous amènent réellement, et ce qu’ils font sur votre site.
        </p>
      </div>

      {/* Dashboard (si données) */}
      {hasData && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Users, label: 'Visiteurs venus d’une IA', value: summary.aiVisitors },
              { icon: Eye, label: 'Pages vues', value: summary.aiPageviews },
              { icon: MousePointerClick, label: 'Actions (appels, devis…)', value: summary.aiActions },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon size={15} className="text-primary" />
                  <span className="text-xs font-medium">{label}</span>
                </div>
                <p className="mt-2 text-3xl font-extrabold text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">30 derniers jours.</p>

          {/* Par source IA */}
          {summary.bySource.length > 0 && (
            <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-foreground">D’où viennent ces visiteurs</h2>
              <div className="space-y-2">
                {summary.bySource.map((s) => (
                  <div key={s.source} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{s.label}</span>
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{s.visitors}</strong> visiteur
                      {s.visitors > 1 ? 's' : ''} · {s.pageviews} page{s.pageviews > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Par action */}
          {summary.byAction.length > 0 && (
            <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-foreground">
                Ce que ces visiteurs ont fait
              </h2>
              <div className="space-y-2">
                {summary.byAction.map((a) => (
                  <div key={a.kind} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{actionLabel(a.kind as ActionKind)}</span>
                    <strong className="text-foreground">{a.count}</strong>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* État vide avec pixel actif */}
      {site.pixelKey && !hasData && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-6 text-center">
          <p className="text-sm font-medium text-foreground">Pixel actif — en attente de données</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
            Dès qu’un visiteur arrivera sur votre site depuis ChatGPT, Perplexity, Gemini ou
            Copilot, il apparaîtra ici. Vérifiez que le code est bien installé sur toutes vos
            pages.
          </p>
        </div>
      )}

      {/* Installation */}
      <PixelInstaller siteId={siteId} initialKey={site.pixelKey} scriptUrl={scriptUrl} />
    </div>
  )
}
