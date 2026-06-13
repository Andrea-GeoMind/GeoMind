import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { MapPin, Info, CheckCircle2, MessageCircleQuestion } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getSiteMetadataBySiteId } from '@/lib/db/queries/site-metadata'
import { detectCity, buildLocalPrompts, buildLocalChecklist } from '@/lib/analysis/local'

export const metadata: Metadata = {
  title: 'Local — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

export default async function LocalPage({ params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  const metadata = await getSiteMetadataBySiteId(siteId)
  const keywords = metadata?.keywords ?? []
  const description = metadata?.description ?? ''
  const city = detectCity([description, ...keywords, site.name])
  const activity = keywords[0] ?? description.split(/[.,]/)[0]?.trim().slice(0, 40) ?? 'prestataire'

  const ctx = { activity, city, siteName: site.name }
  const prompts = buildLocalPrompts(ctx)
  const checklist = buildLocalChecklist(ctx)

  return (
    <div className="space-y-6 p-6 sm:p-8">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-foreground">
          <MapPin size={18} className="text-primary" />
          Local
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pour être trouvé quand un client cherche un {activity}{' '}
          {city ? `à ${city}` : 'près de chez lui'} dans une IA.
        </p>
      </div>

      {/* Ville détectée */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
        <Info size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {city ? (
            <>
              Zone détectée : <strong className="text-foreground">{city}</strong>. Si ce n’est pas
              la bonne, précisez votre ville dans la description (onglet Découverte) pour des
              questions plus justes.
            </>
          ) : (
            <>
              Nous n’avons pas détecté votre ville. Ajoutez-la dans la description de votre site
              (onglet Découverte) — les questions ci-dessous sont des modèles à compléter avec «
              [votre ville] ».
            </>
          )}
        </p>
      </div>

      {/* Questions géolocalisées */}
      <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <MessageCircleQuestion size={15} className="text-primary" />
          Les questions locales de vos clients
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Testez-les vous-même dans ChatGPT ou Perplexity : sortez-vous dans les réponses ? Vous
          pouvez aussi les ajouter à vos questions d’analyse (onglet Découverte).
        </p>
        <ul className="mt-3 space-y-2">
          {prompts.map((p) => (
            <li
              key={p}
              className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground"
            >
              « {p} »
            </li>
          ))}
        </ul>
      </section>

      {/* Checklist présence locale */}
      <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-foreground">Votre présence locale, point par point</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Les sources que les IA recoupent pour répondre aux recherches locales. Cochez mentalement
          ce qui est déjà fait.
        </p>
        <div className="mt-4 space-y-4">
          {checklist.map((item) => (
            <div key={item.key} className="flex items-start gap-3">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.why}</p>
                <p className="mt-1 text-xs text-indigo-600/90">→ {item.action}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
