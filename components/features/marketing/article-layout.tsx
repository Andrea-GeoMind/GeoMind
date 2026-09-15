import Link from 'next/link'
import type { Route } from 'next'
import { Button } from '@/components/ui/button'
import { ARTICLES, getRelatedArticles, type ArticleMeta } from '@/lib/marketing/articles'

/**
 * Gabarit d'article de blog (PLAN item 22) : en-tête avec date visible
 * (signal de fraîcheur), JSON-LD BlogPosting + BreadcrumbList (+ HowTo sur les
 * guides pas-à-pas), sommaire ancré, typographie de lecture, CTA final.
 *
 * L'auteur est déclaré en `Person` et non en `Organization` : les IA accordent
 * plus de crédit à un contenu signé par quelqu'un d'identifiable (E-E-A-T).
 */

export const AUTHOR_ID = 'https://geomind.fr/#andrea-schwertz'

const AUTHOR_JSON_LD = {
  '@type': 'Person',
  '@id': AUTHOR_ID,
  name: 'Andrea Schwertz',
  jobTitle: 'Fondateur de GEOMIND',
  url: 'https://geomind.fr/about',
  worksFor: { '@id': 'https://geomind.fr/#organization' },
  knowsAbout: [
    'Generative Engine Optimization',
    'Visibilité dans les moteurs de réponses IA',
    'Référencement naturel',
  ],
  // À compléter dès que le profil personnel est public :
  // sameAs: ['https://www.linkedin.com/in/…'],
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ArticleLayout({
  meta,
  children,
}: {
  meta: ArticleMeta
  children: React.ReactNode
}) {
  const url = `https://geomind.fr/blog/${meta.slug}`
  const related = getRelatedArticles(meta.slug)
  const dateModified = meta.dateModified ?? meta.datePublished

  const graph: Array<Record<string, unknown>> = [
    {
      '@type': 'BlogPosting',
      headline: meta.title,
      description: meta.description,
      datePublished: meta.datePublished,
      dateModified,
      inLanguage: 'fr-FR',
      image: `${url}/opengraph-image`,
      author: { '@id': AUTHOR_ID },
      publisher: { '@id': 'https://geomind.fr/#organization' },
      isPartOf: { '@id': 'https://geomind.fr/#website' },
      mainEntityOfPage: url,
    },
    AUTHOR_JSON_LD,
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://geomind.fr' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://geomind.fr/blog' },
        { '@type': 'ListItem', position: 3, name: meta.title, item: url },
      ],
    },
  ]

  // Guides « Comment… » : le balisage HowTo découpe la marche à suivre en étapes,
  // le format que les moteurs de réponse reprennent le plus volontiers.
  if (meta.howTo) {
    graph.push({
      '@type': 'HowTo',
      name: meta.howTo.name,
      description: meta.description,
      inLanguage: 'fr-FR',
      step: meta.howTo.steps.map((s, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: s.name,
        text: s.text,
        url: `${url}#${s.id}`,
      })),
    })
  }

  const jsonLd = { '@context': 'https://schema.org', '@graph': graph }

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
        ← Tous les guides
      </Link>

      {/* La ligne date/lecture/auteur passe AVANT le titre : placée après, elle
          s'intercalait entre le H1 et la réponse, et c'est elle que les IA
          lisaient comme premier paragraphe de la page. */}
      <p className="mt-4 text-sm text-muted-foreground">
        <time dateTime={meta.datePublished}>{formatDate(meta.datePublished)}</time>
        {meta.dateModified ? <> · mis à jour le {formatDate(meta.dateModified)}</> : null} ·{' '}
        {meta.readingMinutes} min de lecture · par Andrea Schwertz
      </p>

      <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {meta.title}
      </h1>

      {meta.toc && meta.toc.length > 0 ? (
        <nav aria-label="Sommaire" className="mt-8 rounded-xl border border-border bg-muted/40 p-5">
          <p className="text-sm font-bold text-foreground">Au sommaire</p>
          <ol className="mt-3 space-y-2 text-sm">
            {meta.toc.map((entry, i) => (
              <li key={entry.id}>
                <a href={`#${entry.id}`} className="text-primary hover:underline">
                  {i + 1}. {entry.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="prose-geomind mt-10 space-y-5 text-base leading-relaxed text-foreground/85 [&_h2]:mt-10 [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
        {children}
      </div>

      {/* Bloc « À retenir » : c'est le passage que les IA reprennent le plus
          volontiers en citation, parce qu'il condense la réponse. */}
      {meta.takeaways && meta.takeaways.length > 0 ? (
        <section className="mt-12 rounded-xl border border-indigo-100 bg-indigo-50/60 p-6">
          <h2 className="text-lg font-bold text-foreground">À retenir</h2>
          <ul className="mt-3 space-y-2 text-base text-foreground/85">
            {meta.takeaways.map((t) => (
              <li key={t} className="ml-5 list-disc">
                {t}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12 rounded-xl border border-border p-6">
        <h2 className="text-base font-bold text-foreground">Rédigé par Andrea Schwertz</h2>
        <p className="mt-2 text-sm text-foreground/80">
          Fondateur de GEOMIND. Il travaille depuis Cavaillon sur la visibilité des TPE et PME
          françaises dans les moteurs de réponses IA, et écrit ces guides à partir des audits
          réels menés avec l&apos;outil.{' '}
          <Link href="/about" className="font-medium text-primary hover:underline">
            En savoir plus
          </Link>
        </p>
      </section>

      <aside className="mt-12 border-t border-border pt-8">
        <h2 className="text-base font-bold text-foreground">Continuer la lecture</h2>
        <ul className="mt-4 space-y-3">
          {related.map((a) => (
            <li key={a.slug} className="!ml-0 !list-none">
              <Link
                href={`/blog/${a.slug}` as Route}
                className="font-medium text-primary hover:underline"
              >
                {a.title}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Un terme vous échappe ?{' '}
          <Link href="/glossaire" className="font-medium text-primary hover:underline">
            Le glossaire du GEO
          </Link>{' '}
          définit le vocabulaire employé dans ces guides.
        </p>
      </aside>

      <div className="mt-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-10 text-center shadow-xl shadow-indigo-200">
        <p className="mb-2 text-lg font-bold text-white">Et votre site, les IA le citent-elles ?</p>
        <p className="mb-5 text-sm text-indigo-100">
          Analyse complète offerte — ChatGPT, Perplexity, Gemini et Claude, sans carte bancaire.
        </p>
        <Button
          asChild
          className="rounded-lg bg-white px-8 font-semibold text-indigo-700 hover:bg-indigo-50"
        >
          <Link href="/signup">Tester mon site gratuitement</Link>
        </Button>
      </div>
    </article>
  )
}

export { ARTICLES }
