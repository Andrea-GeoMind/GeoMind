import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { MapPin, Info, MessageCircleQuestion } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getSiteMetadataBySiteId } from '@/lib/db/queries/site-metadata'
import { detectCity, buildLocalPrompts, buildLocalChecklist } from '@/lib/analysis/local'
import { getActionStatesBySiteId } from '@/lib/db/queries/action-states'
import { LocalChecklist } from '@/components/features/local/local-checklist'
import Link from 'next/link'
import type { Route } from 'next'

export const metadata: Metadata = {
  title: 'Local',
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

  // Les coches vivent dans `action_states`, comme celles du plan d'action.
  const states = await getActionStatesBySiteId(siteId)
  const doneKeys = states
    .filter((s) => s.source === 'local' && s.status !== 'todo')
    .map((s) => s.ruleKey)

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
              la bonne,{' '}
              <Link
                href={`/sites/${siteId}/discovery` as Route}
                className="underline hover:text-foreground"
              >
                précisez votre ville dans la description
              </Link>{' '}
              pour des questions plus justes.
            </>
          ) : (
            <>
              Nous n’avons pas détecté votre ville.{' '}
              <Link
                href={`/sites/${siteId}/discovery` as Route}
                className="underline hover:text-foreground"
              >
                Ajoutez-la dans la description de votre site
              </Link>{' '}
              — les questions ci-dessous sont des modèles à compléter avec « [votre ville] ».
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
          pouvez aussi les{' '}
          <Link
            href={`/sites/${siteId}/discovery` as Route}
            className="underline hover:text-foreground"
          >
            ajouter à vos questions d’analyse
          </Link>
          .
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
        <LocalChecklist siteId={siteId} items={checklist} doneKeys={doneKeys} />
      </section>
    </div>
  )
}
