import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Scale, Search, FileText, ListChecks, MessageSquareQuote } from 'lucide-react'
import { ExpressAudit } from '@/components/features/marketing/express-audit'
import { ENGINE_COUNT } from '@/lib/ai/connectors/base'
import { IA_ENGINES, ENGINE_LABELS } from '@/lib/analysis/authority-table'
import { NEUTRAL_PROMPTS_COUNT } from '@/lib/ai/prompts/neutral-prompts'
import { SECTEURS, getSecteur, type SecteurConfig } from '@/lib/marketing/secteurs'

/**
 * Page secteur — gabarit unique rendu pour chaque entrée de SECTEURS.
 *
 * Tout le contenu vient de lib/marketing/secteurs.ts : ce fichier ne porte que
 * la mise en forme (calquée sur la landing) et les chiffres dérivés des
 * constantes produit, jamais écrits en dur.
 *
 * Balisage : WebPage + BreadcrumbList + Service + FAQPage, rattachés par @id à
 * l'Organization du layout marketing. Pas d'Article — la page n'est pas
 * éditoriale, et un type qui ne correspond pas au contenu est un signal négatif.
 */

const BASE = 'https://geomind.fr'

/** Nombre de réponses IA analysées : une par question et par moteur. */
const REPONSES_COUNT = NEUTRAL_PROMPTS_COUNT * ENGINE_COUNT

export function generateStaticParams() {
  return SECTEURS.map((s) => ({ secteur: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ secteur: string }>
}): Promise<Metadata> {
  const { secteur } = await params
  const config = getSecteur(secteur)
  if (!config) return {}

  const url = `${BASE}/secteurs/${config.slug}`
  return {
    title: config.metaTitle,
    description: config.metaDescription,
    keywords: [...config.keywords],
    alternates: { canonical: `/secteurs/${config.slug}` },
    openGraph: {
      type: 'website',
      url,
      title: config.ogTitle,
      description: config.metaDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: config.ogTitle,
      description: config.metaDescription,
    },
  }
}

/** FAQ commune à tous les secteurs — dépend des constantes produit. */
function sharedFaq() {
  return [
    {
      q: 'Combien de temps prend l’analyse ?',
      a: `L’audit express répond en une dizaine de secondes. L’analyse complète — les ${REPONSES_COUNT} réponses, la lecture du site, le plan de correction — prend deux à cinq minutes.`,
    },
  ]
}

function buildJsonLd(config: SecteurConfig) {
  const url = `${BASE}/secteurs/${config.slug}`
  const faq = [...config.faq, ...sharedFaq()]

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
        audience: {
          '@type': 'Audience',
          audienceType: config.audienceType,
          geographicArea: { '@type': 'Country', name: 'France' },
        },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: BASE },
          { '@type': 'ListItem', position: 2, name: config.label, item: url },
        ],
      },
      {
        '@type': 'Service',
        '@id': `${url}#service`,
        name: `Audit de visibilité dans les IA — ${config.label}`,
        serviceType: 'Audit de visibilité dans les moteurs de réponse IA',
        provider: { '@id': `${BASE}/#organization` },
        areaServed: { '@type': 'Country', name: 'France' },
        inLanguage: 'fr-FR',
        description: config.metaDescription,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
          description: 'Audit express gratuit, sans inscription ni carte bancaire',
          url,
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: faq.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  }
}

/* ─── Intitulé de section — même gabarit que la landing ─── */
function SectionHeading({
  kicker,
  title,
  intro,
}: {
  kicker: string
  title: string
  intro?: string
}) {
  return (
    <div className="mb-12 max-w-2xl">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{kicker}</p>
      <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{intro}</p>}
    </div>
  )
}

export default async function SecteurPage({
  params,
}: {
  params: Promise<{ secteur: string }>
}) {
  const { secteur } = await params
  const config = getSecteur(secteur)
  if (!config) notFound()

  const faq = [...config.faq, ...sharedFaq()]

  const etapes = [
    {
      num: '1',
      icon: Search,
      titre: 'On lit votre site',
      corps: 'Vous donnez son adresse, rien d’autre. On en déduit votre spécialité, vos actes et votre zone.',
    },
    {
      num: '2',
      icon: MessageSquareQuote,
      titre: `On écrit ${NEUTRAL_PROMPTS_COUNT} questions de ${config.termeClient}`,
      corps: `Formulées comme un ${config.termeClient} les poserait, dans ses mots. Aucune ne contient le nom de votre cabinet — sinon l’IA le citerait forcément et le résultat ne voudrait rien dire.`,
    },
    {
      num: '3',
      icon: FileText,
      titre: `On les pose aux ${ENGINE_COUNT} IA`,
      corps: `${NEUTRAL_PROMPTS_COUNT} questions × ${ENGINE_COUNT} IA = ${REPONSES_COUNT} réponses complètes, avec les sources que chacune cite.`,
    },
    {
      num: '4',
      icon: ListChecks,
      titre: 'On compte',
      corps: `Sur ces ${REPONSES_COUNT} réponses : combien de fois votre cabinet est nommé, sur quelles questions, et quels confrères sont cités quand vous ne l’êtes pas.`,
    },
    {
      num: '5',
      icon: Scale,
      titre: 'On cherche pourquoi',
      corps: 'On rapproche ces résultats de ce que votre site donne à lire, et on vous remet la liste de ce qui bloque, classée par ordre d’importance.',
    },
  ]

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(config)) }}
      />

      {/* ── 1 · Accroche ─────────────────────────────────────────────── */}
      <section id="audit" className="relative overflow-hidden bg-[#16304B]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-[28%] h-[420px] w-[640px] -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-40 right-0 h-[380px] w-[520px] rounded-full bg-[--score-good-500]/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <div className="max-w-2xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-[#B2C8DE]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
              {config.label}
            </span>

            <h1 className="text-balance text-4xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-5xl">
              {config.h1} <span className="text-[#7FB5E6]">{config.h1Accent}</span>
            </h1>

            <ul className="mt-6 flex flex-wrap gap-2">
              {config.exempleQuestions.map((q) => (
                <li
                  key={q}
                  className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm text-[#B2C8DE]"
                >
                  «&nbsp;{q}&nbsp;»
                </li>
              ))}
            </ul>

            <p className="mt-6 text-balance text-lg text-[#B2C8DE]">{config.accroche}</p>

            <div className="mt-8">
              <ExpressAudit />
              <p className="mt-3 text-xs text-[#7C92AC]">
                Résultat en quelques secondes, sans inscription. Entrez l&apos;adresse de votre
                site.
              </p>
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-[#0F2236]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-7 gap-y-2 px-4 py-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7C92AC]">
              Interrogées à chaque audit
            </span>
            {IA_ENGINES.map((engine) => ENGINE_LABELS[engine]).map((name) => (
              <span key={name} className="text-sm font-medium text-white">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2 · Le constat ───────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            kicker="Le constat"
            title={config.constatTitre}
            intro={config.constatIntro}
          />
          <div className="max-w-3xl space-y-5">
            {config.constatParagraphes.map((p) => (
              <p key={p.slice(0, 40)} className="text-base leading-relaxed text-foreground/80">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 · Ce que ça coûte ──────────────────────────────────────── */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading kicker="Ce que ça coûte" title={config.coutTitre} intro={config.coutIntro} />

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="relative overflow-hidden rounded-2xl bg-[#16304B] p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-20 right-0 h-64 w-72 rounded-full bg-primary/30 blur-3xl"
              />
              <h3 className="relative text-xl font-bold text-white">
                Tous les actes ne pèsent pas pareil
              </h3>
              <p className="relative mt-3 max-w-lg text-sm leading-relaxed text-[#B2C8DE]">
                {config.acteLourd.actesCourants} {config.acteLourd.actesLourds}{' '}
                <strong className="font-semibold text-white">{config.acteLourd.enjeu}</strong>
              </p>
              <p className="relative mt-4 max-w-lg text-sm leading-relaxed text-[#B2C8DE]">
                Deux destinations quand vous n&apos;êtes pas cité : un confrère nommé à votre place
                — et il le sera sur toutes les questions du même type, pas seulement celle-là — ou{' '}
                {config.plateformeCaptive}.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-2 text-base font-bold text-foreground">
                Le calcul, vous êtes le seul à pouvoir le faire
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Il dépend de {config.variablesDuCalcul}. Nous vous donnons la seule variable que
                vous ne pouvez pas mesurer vous-même :{' '}
                <strong className="font-semibold text-foreground">
                  êtes-vous cité, oui ou non.
                </strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 · Ce qu'on mesure ──────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            kicker="Ce qu’on mesure"
            title={`${NEUTRAL_PROMPTS_COUNT} questions, ${ENGINE_COUNT} IA, ${REPONSES_COUNT} réponses.`}
            intro="Pas d’estimation ni d’indice théorique. On pose réellement les questions, on lit réellement les réponses."
          />

          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {etapes.map(({ num, icon: Icon, titre, corps }) => (
              <li
                key={num}
                className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-3 right-4 text-6xl font-extrabold text-foreground/[0.04]"
                >
                  {num}
                </span>
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon size={19} className="text-primary" aria-hidden />
                </span>
                <h3 className="mb-1.5 font-semibold text-foreground">{titre}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{corps}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 5 · Les problèmes fréquents ──────────────────────────────── */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            kicker="Ce qu’on trouve"
            title={config.problemesTitre}
            intro={config.problemesIntro}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {config.problemes.map(({ titre, corps }) => (
              <div key={titre} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-2 text-base font-bold text-foreground">{titre}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{corps}</p>
              </div>
            ))}
          </div>

          {config.problemesSource && (
            <p className="mt-6 text-xs text-muted-foreground">{config.problemesSource}</p>
          )}

          {config.cadreReglementaire && (
            <div className="mt-10 rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-2 text-base font-bold text-foreground">
                {config.cadreReglementaire.titre}
              </h3>
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {config.cadreReglementaire.corps}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <SectionHeading kicker="FAQ" title="Questions fréquentes." />
          <div className="divide-y divide-border">
            {faq.map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-foreground">
                  {q}
                  <span className="ml-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>

          <p className="mt-10 text-sm text-muted-foreground">
            Pour aller plus loin :{' '}
            <Link
              href="/blog/geo-commerce-local"
              className="font-medium text-primary underline underline-offset-4"
            >
              être visible dans les IA quand on reçoit une clientèle locale
            </Link>{' '}
            ·{' '}
            <Link
              href="/blog/savoir-si-chatgpt-parle-de-mon-entreprise"
              className="font-medium text-primary underline underline-offset-4"
            >
              savoir ce que ChatGPT dit de vous
            </Link>
          </p>
        </div>
      </section>

      {/* ── 6 · CTA ──────────────────────────────────────────────────── */}
      <section className="px-4 pb-20 sm:pb-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[#16304B] px-8 py-16 sm:px-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/3 h-72 w-96 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl"
          />
          <div className="relative max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {config.ctaTitre}
            </h2>
            <p className="mt-4 text-lg text-[#B2C8DE]">{config.ctaCorps}</p>
            <Button
              size="lg"
              asChild
              className="mt-8 gap-2 rounded-lg bg-[#34D399] px-8 font-semibold text-[#0B3B2E] shadow-lg shadow-black/20 hover:bg-[#2bbd88]"
            >
              <Link href="#audit">
                Lancer l&apos;audit express
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
