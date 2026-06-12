import type { Metadata } from 'next'
import type { Route } from 'next'
import Link from 'next/link'
import { ARTICLES } from '@/lib/marketing/articles'

export const metadata: Metadata = {
  title: 'Blog — guides GEO en français pour TPE et PME',
  description:
    'Guides pratiques pour être visible dans ChatGPT, Perplexity, Gemini et Claude : GEO expliqué simplement, sans jargon, pour les petites entreprises françaises.',
  alternates: { canonical: '/blog' },
}

export default function BlogIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">Blog</p>
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
        Les guides GEO, en français courant
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Comment être visible dans les réponses des IA — expliqué pour des patrons, pas pour des
        experts SEO.
      </p>

      <div className="mt-12 space-y-6">
        {ARTICLES.map((a) => (
          <Link
            key={a.slug}
            href={`/blog/${a.slug}` as Route}
            className="block rounded-xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-100/50"
          >
            <p className="text-xs text-muted-foreground">
              <time dateTime={a.datePublished}>
                {new Date(a.datePublished).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>{' '}
              · {a.readingMinutes} min
            </p>
            <h2 className="mt-2 text-xl font-bold text-foreground">{a.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.description}</p>
            <p className="mt-3 text-sm font-semibold text-primary">Lire le guide →</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
