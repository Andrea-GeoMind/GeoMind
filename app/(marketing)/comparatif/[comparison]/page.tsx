import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { COMPARISONS, getComparison, type ComparisonConfig } from '@/lib/marketing/comparisons'
import {
  GEOMIND_TOOL,
  GEO_TOOLS_CHECKED_ON_LABEL,
  getGeoTool,
  type GeoTool,
} from '@/lib/marketing/geo-tools'

/**
 * Page de comparaison — gabarit unique rendu pour chaque entrée de
 * COMPARISONS (/comparatif/geomind-vs-<slug>).
 *
 * Les faits viennent de lib/marketing/geo-tools.ts, partagé avec l'article
 * /blog/meilleurs-outils-geo-2026 : un prix qui change se corrige là-bas, et
 * les deux surfaces bougent ensemble.
 *
 * Balisage : WebPage + BreadcrumbList + FAQPage. Pas d'Article — ce n'est pas
 * une page éditoriale datée — et pas d'ItemList : un face-à-face n'est pas
 * une liste.
 */

const BASE = 'https://geomind.fr'

/**
 * Le segment dynamique porte l'URL entière (« geomind-vs-otterly ») : Next.js
 * n'accepte pas de segment partiellement dynamique comme `geomind-vs-[slug]`.
 * Le préfixe est donc retiré ici pour retrouver le slug de l'outil.
 */
const PREFIX = 'geomind-vs-'

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ comparison: `${PREFIX}${c.toolSlug}` }))
}

function configFromParam(comparison: string) {
  if (!comparison.startsWith(PREFIX)) return undefined
  return getComparison(comparison.slice(PREFIX.length))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ comparison: string }>
}): Promise<Metadata> {
  const { comparison } = await params
  const config = configFromParam(comparison)
  if (!config) return {}

  const url = `${BASE}/comparatif/geomind-vs-${config.toolSlug}`
  return {
    title: config.metaTitle,
    description: config.metaDescription,
    alternates: { canonical: `/comparatif/geomind-vs-${config.toolSlug}` },
    openGraph: {
      type: 'website',
      url,
      title: config.metaTitle,
      description: config.metaDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: config.metaTitle,
      description: config.metaDescription,
    },
  }
}

function buildJsonLd(config: ComparisonConfig, other: GeoTool) {
  const url = `${BASE}/comparatif/geomind-vs-${config.toolSlug}`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: config.metaTitle,
        description: config.metaDescription,
        inLanguage: 'fr-FR',
        isPartOf: { '@id': `${BASE}/#website` },
        about: { '@id': `${BASE}/#software` },
        // Date du relevé : c'est elle qui date la page, pas sa publication.
        dateModified: GEO_TOOLS_CHECKED_ON_LABEL,
        mentions: [
          { '@type': 'SoftwareApplication', name: other.name, url: other.website },
          { '@type': 'SoftwareApplication', name: GEOMIND_TOOL.name, url: GEOMIND_TOOL.website },
        ],
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: BASE },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Comparatif des outils GEO',
            item: `${BASE}/blog/meilleurs-outils-geo-2026`,
          },
          { '@type': 'ListItem', position: 3, name: config.h1, item: url },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        inLanguage: 'fr-FR',
        mainEntity: config.faq.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  }
}

/** Colonne d'un outil dans une section : sous-titre + contenu. */
function ToolColumn({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-foreground">{name}</h3>
      <div className="mt-2 space-y-2 text-base leading-relaxed text-foreground/85">{children}</div>
    </div>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="ml-5 list-disc">
          {item}
        </li>
      ))}
    </ul>
  )
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ comparison: string }>
}) {
  const { comparison } = await params
  const config = configFromParam(comparison)
  if (!config) notFound()

  const other = getGeoTool(config.toolSlug)
  if (!other) notFound()

  const geomind = GEOMIND_TOOL
  const rows: { label: string; geomind: string; other: string }[] = [
    { label: 'Prix', geomind: geomind.priceSummary, other: other.priceSummary },
    { label: 'Moteurs', geomind: geomind.engineSummary, other: other.engineSummary },
    { label: 'Langue', geomind: geomind.language, other: other.language },
    { label: 'Cible', geomind: geomind.target, other: other.target },
  ]

  const sources = [...other.sources, ...geomind.sources]

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(config, other)) }}
      />

      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
        Comparatif
      </p>
      <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {config.h1}
      </h1>

      <div className="mt-6 space-y-3 text-base leading-relaxed text-foreground/85">
        {config.shortAnswer.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      {/* La mention d'intérêt est juste sous la réponse courte, pas en bas de
          page : c'est là que le lecteur décide s'il nous croit. */}
      <p className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
        <strong className="font-semibold text-foreground">Nous éditons GeoMind</strong> — l’un des
        deux outils comparés ici. Les données de {other.name} viennent de ses pages officielles,
        relevées le {GEO_TOOLS_CHECKED_ON_LABEL} et listées en{' '}
        <a href="#sources" className="text-primary hover:underline">
          bas de page
        </a>
        . Nos limites sont écrites au même endroit que les siennes ; si un prix a changé depuis, la
        page de l’éditeur fait foi.
      </p>

      {/* ── Tableau deux colonnes ─────────────────────────────────────── */}
      <div className="not-prose mt-10 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">
            {geomind.name} et {other.name} — prix, moteurs, langue et cible, relevé du{' '}
            {GEO_TOOLS_CHECKED_ON_LABEL}
          </caption>
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                &nbsp;
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                {geomind.name}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                {other.name}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.label} className="align-top">
                <th scope="row" className="px-4 py-3 font-semibold text-foreground">
                  {row.label}
                </th>
                <td className="px-4 py-3 text-foreground/85">{row.geomind}</td>
                <td className="px-4 py-3 text-foreground/85">{row.other}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 space-y-10">
        {/* ── Prix ────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-foreground">Le prix</h2>
          <div className="mt-4 space-y-6">
            <ToolColumn name={geomind.name}>
              <p>{geomind.priceDetail}</p>
              <p>
                <Link href="/pricing" className="font-medium text-primary hover:underline">
                  Voir le détail des plans
                </Link>
              </p>
            </ToolColumn>
            <ToolColumn name={other.name}>
              <p>{other.priceDetail}</p>
            </ToolColumn>
          </div>
        </section>

        {/* ── Moteurs ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-foreground">Les moteurs couverts</h2>
          <div className="mt-4 space-y-6">
            <ToolColumn name={geomind.name}>
              <p>{geomind.engineDetail}</p>
            </ToolColumn>
            <ToolColumn name={other.name}>
              <p>{other.engineDetail}</p>
            </ToolColumn>
          </div>
        </section>

        {/* ── Langue ──────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-foreground">La langue</h2>
          <div className="mt-4 space-y-6">
            <ToolColumn name={geomind.name}>
              <p>{geomind.languageDetail}</p>
            </ToolColumn>
            <ToolColumn name={other.name}>
              <p>{other.languageDetail}</p>
            </ToolColumn>
          </div>
        </section>

        {/* ── Fonctions ───────────────────────────────────────────────── */}
        {geomind.features && other.features ? (
          <section>
            <h2 className="text-xl font-bold text-foreground">Les fonctions</h2>
            <div className="mt-4 space-y-6">
              <ToolColumn name={geomind.name}>
                <Bullets items={geomind.features} />
              </ToolColumn>
              <ToolColumn name={other.name}>
                <Bullets items={other.features} />
              </ToolColumn>
            </div>
          </section>
        ) : null}

        {/* ── Limites des deux ────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-foreground">Les limites des deux outils</h2>
          <div className="mt-4 space-y-6">
            <ToolColumn name={geomind.name}>
              {geomind.weaknesses.length === 1 ? (
                <p>{geomind.weaknesses[0]}</p>
              ) : (
                <Bullets items={geomind.weaknesses} />
              )}
            </ToolColumn>
            <ToolColumn name={other.name}>
              {other.weaknesses.length === 1 ? (
                <p>{other.weaknesses[0]}</p>
              ) : (
                <Bullets items={other.weaknesses} />
              )}
            </ToolColumn>
          </div>
        </section>

        {/* ── Pour qui ────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-foreground">Pour qui, chacun</h2>
          <div className="mt-4 space-y-6">
            <ToolColumn name={geomind.name}>
              <p>{config.verdictGeoMind}</p>
            </ToolColumn>
            <ToolColumn name={other.name}>
              <p>{config.verdictOther}</p>
            </ToolColumn>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <section>
          <h2 id="faq" className="scroll-mt-24 text-xl font-bold text-foreground">
            Questions fréquentes
          </h2>
          <dl className="mt-6 space-y-6">
            {config.faq.map(({ q, a }) => (
              <div key={q}>
                <dt className="text-base font-semibold text-foreground">{q}</dt>
                <dd className="mt-2 text-base leading-relaxed text-foreground/85">{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Sources ─────────────────────────────────────────────────── */}
        <section>
          <h2 id="sources" className="scroll-mt-24 text-xl font-bold text-foreground">
            Sources
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Pages consultées le {GEO_TOOLS_CHECKED_ON_LABEL}. Les prix changent ; en cas d’écart, la
            page de l’éditeur fait foi.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {sources.map((source) => (
              <li key={source.href} className="ml-5 list-disc text-foreground/85">
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-12 rounded-2xl bg-[#16304B] px-8 py-10 text-center shadow-xl">
        <p className="mb-2 text-lg font-bold text-white">Les quatorze outils du marché, comparés</p>
        <p className="mb-5 text-sm text-[#B2C8DE]">
          Prix réels, moteurs couverts, langue et limites de chacun — les nôtres comprises.
        </p>
        <Button
          asChild
          className="rounded-lg bg-[#34D399] px-8 font-semibold text-[#0B3B2E] hover:bg-[#2bbd88]"
        >
          <Link href="/blog/meilleurs-outils-geo-2026">Lire le comparatif complet</Link>
        </Button>
      </div>
    </div>
  )
}
