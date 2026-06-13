import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { Wand2, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getSiteMetadataBySiteId } from '@/lib/db/queries/site-metadata'
import { getFirecrawlPagesBySiteId } from '@/lib/db/queries/firecrawl-pages'
import { detectCms, seedFaqEntries, type StudioSite, type CmsKind } from '@/lib/analysis/studio'
import { StudioPanel } from '@/components/features/studio/studio-panel'

export const metadata: Metadata = {
  title: 'Studio — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

export default async function StudioPage({ params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  const [metadata, pages] = await Promise.all([
    getSiteMetadataBySiteId(siteId),
    getFirecrawlPagesBySiteId(siteId),
  ])

  // Détection CMS depuis le tag generator de la page d'accueil crawlée
  const homeMeta = pages[0]?.metadata as Record<string, unknown> | null
  const generator =
    typeof homeMeta?.generator === 'string' ? homeMeta.generator : null
  const detectedCms: CmsKind = detectCms(generator)

  const studioSite: StudioSite = {
    name: site.name,
    url: site.url,
    language: site.language,
    country: site.country,
    description: metadata?.description ?? null,
    keywords: metadata?.keywords ?? [],
  }

  const seedFaq = seedFaqEntries(studioSite)

  return (
    <div className="space-y-6 p-6 sm:p-8">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-foreground">
          <Wand2 size={18} className="text-primary" />
          Studio de correctifs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          On ne se contente pas de pointer les problèmes : voici les fichiers corrigés de{' '}
          {site.name}, prêts à copier-coller — avec les instructions pour votre plateforme.
        </p>
      </div>

      {/* Note de confiance */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
        <Info size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Ces correctifs sont générés à partir des informations de votre site (nom, description,
          mots-clés). Vérifiez les champs marqués « — à compléter — » (adresse, horaires,
          téléphone) avant de publier. Pas à l’aise avec le code ? Utilisez « Envoyer tout à mon
          webmaster » : il recevra tout, prêt à poser.
        </p>
      </div>

      <StudioPanel site={studioSite} initialCms={detectedCms} initialFaq={seedFaq} />
    </div>
  )
}
