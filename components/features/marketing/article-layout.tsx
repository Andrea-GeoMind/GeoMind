import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { ArticleMeta } from '@/lib/marketing/articles'

/**
 * Gabarit d'article de blog (PLAN item 22) : en-tête avec date visible
 * (signal de fraîcheur), JSON-LD Article, typographie de lecture, CTA final.
 */
export function ArticleLayout({
  meta,
  children,
}: {
  meta: ArticleMeta
  children: React.ReactNode
}) {
  const url = `https://geomind.fr/blog/${meta.slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: meta.title,
        description: meta.description,
        datePublished: meta.datePublished,
        dateModified: meta.datePublished,
        inLanguage: 'fr-FR',
        image: `${url}/opengraph-image`,
        author: { '@type': 'Organization', name: 'GEOMIND', url: 'https://geomind.fr' },
        publisher: { '@id': 'https://geomind.fr/#organization' },
        isPartOf: { '@id': 'https://geomind.fr/#website' },
        mainEntityOfPage: url,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://geomind.fr' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://geomind.fr/blog' },
          { '@type': 'ListItem', position: 3, name: meta.title, item: url },
        ],
      },
    ],
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
        ← Tous les guides
      </Link>
      <h1 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {meta.title}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        <time dateTime={meta.datePublished}>
          {new Date(meta.datePublished).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </time>{' '}
        · {meta.readingMinutes} min de lecture · par l&apos;équipe GeoMind
      </p>

      <div className="prose-geomind mt-10 space-y-5 text-base leading-relaxed text-foreground/85 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
        {children}
      </div>

      <div className="mt-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-10 text-center shadow-xl shadow-indigo-200">
        <p className="mb-2 text-lg font-bold text-white">
          Et votre site, les IA le citent-elles ?
        </p>
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
