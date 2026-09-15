import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  Globe,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Stethoscope,
  Zap,
} from 'lucide-react'
import { ExpressAudit } from '@/components/features/marketing/express-audit'
import { ENGINE_COUNT } from '@/lib/ai/connectors/base'
import { IA_ENGINES, ENGINE_LABELS, ENGINE_LIST } from '@/lib/analysis/authority-table'

/**
 * Page secteur « cabinets dentaires et médicaux » — déclinaison de la landing
 * pour une audience précise (chirurgiens-dentistes, médecins, kinés, cabinets
 * de groupe). Même structure que la home : constat → coût → mesure → CTA audit
 * express, avec le balisage Schema.org attendu sur les pages marketing
 * (WebPage + BreadcrumbList + FAQPage, rattachés à l'Organization du layout).
 *
 * Ton volontairement factuel et sans jargon : l'audience est médicale, pas
 * marketing, et la communication des professionnels de santé est encadrée
 * (art. R.4127-19-1 du code de la santé publique).
 */

const CANONICAL = 'https://geomind.fr/secteurs/cabinets-dentaires'

export const metadata: Metadata = {
  title: 'Visibilité des cabinets dentaires et médicaux dans les IA',
  description:
    'Quand un patient demande à ChatGPT ou Perplexity quel dentiste consulter, l’IA cite deux ou trois cabinets. GEOMIND vérifie si le vôtre en fait partie, et ce qui manque sinon.',
  keywords: [
    'visibilité cabinet dentaire',
    'ChatGPT dentiste',
    'référencement cabinet médical',
    'patients recherche IA',
    'chirurgien-dentiste visibilité en ligne',
  ],
  alternates: { canonical: '/secteurs/cabinets-dentaires' },
  openGraph: {
    type: 'article',
    url: CANONICAL,
    title: 'Votre cabinet est-il cité quand un patient interroge une IA ?',
    description:
      'Les patients demandent désormais à ChatGPT, Perplexity ou Gemini quel praticien consulter. GEOMIND mesure si votre cabinet apparaît dans ces réponses.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Votre cabinet est-il cité quand un patient interroge une IA ?',
    description:
      'GEOMIND mesure si votre cabinet apparaît dans les réponses de ChatGPT, Perplexity, Gemini et Claude.',
  },
}

// Questions réellement posées par des praticiens — source unique pour
// l'affichage ET le balisage FAQPage (les IA reprennent les réponses balisées).
const FAQ_ITEMS = [
  {
    q: 'Est-ce compatible avec les règles de communication des professionnels de santé ?',
    a: 'Oui. Depuis le décret du 22 décembre 2020, un praticien peut communiquer au public des informations sur son activité, à condition qu’elles soient exactes, vérifiables et sans caractère promotionnel comparatif. GEOMIND ne rédige aucune publicité : il vérifie que les informations factuelles de votre cabinet (spécialités, adresse, horaires, conventionnement) sont lisibles par les IA et ne sont pas déformées.',
  },
  {
    q: 'J’ai déjà une fiche Doctolib et une fiche Google. Ça ne suffit pas ?',
    a: 'Ce sont deux des sources que les IA consultent, et elles pèsent lourd. Mais une IA croise plusieurs sources avant de citer un nom : annuaires, site du cabinet, avis, presse locale. Si ces sources se contredisent — une adresse différente, un horaire obsolète, une spécialité absente — l’IA écarte le cabinet plutôt que de prendre le risque. C’est précisément ce que l’analyse détecte.',
  },
  {
    q: 'Mon cabinet ne prend plus de nouveaux patients. Est-ce utile ?',
    a: 'Moins pour l’acquisition, davantage pour l’exactitude. Une IA qui annonce de mauvais horaires, une adresse ancienne ou un praticien parti depuis deux ans génère des appels inutiles et des patients qui se déplacent pour rien. GEOMIND signale ces écarts entre ce que disent les IA et la réalité de votre cabinet.',
  },
  {
    q: 'Combien de temps prend l’analyse ?',
    a: 'L’audit express affiche un premier résultat en une dizaine de secondes, sans inscription. L’analyse complète — questions envoyées aux IA, lecture du site, plan d’action — prend entre 2 et 5 minutes.',
  },
  {
    q: 'Faut-il des compétences techniques ?',
    a: 'Non. Vous entrez l’adresse de votre site, et vous recevez une liste de points à corriger en langage clair, classés par priorité. Les corrections concrètes (fichiers, balises, textes) sont fournies prêtes à transmettre à la personne qui gère votre site.',
  },
  {
    q: 'Est-ce que ça remplace mon référencement Google ?',
    a: 'Non, les deux coexistent. Google reste le premier canal de recherche des patients. Les moteurs de réponse IA en captent une part croissante, avec des règles différentes : ils ne classent pas des liens, ils citent des sources. GEOMIND mesure uniquement cette seconde partie.',
  },
] as const

// Sources que les moteurs de réponse recoupent avant de citer un cabinet.
const SOURCES = [
  {
    icon: CalendarCheck,
    title: 'Plateformes de prise de rendez-vous',
    body: 'Doctolib en tête : spécialités déclarées, conventionnement, actes proposés, disponibilités. C’est souvent la fiche la plus structurée qui existe sur un praticien.',
  },
  {
    icon: MapPin,
    title: 'Fiche Google et annuaires',
    body: 'Fiche d’établissement, Pages Jaunes, annuaires ordinaux et sectoriels. Les IA y lisent l’adresse, les horaires, la catégorie exacte du cabinet.',
  },
  {
    icon: Star,
    title: 'Avis de patients',
    body: 'Volume, note et surtout fraîcheur des avis. Un cabinet dont les derniers avis datent de trois ans pèse moins qu’un confrère régulièrement commenté.',
  },
  {
    icon: Globe,
    title: 'Le site du cabinet',
    body: 'Pages par acte, équipe, horaires, accès, tarifs. C’est la seule source que vous contrôlez entièrement — et souvent la plus mal lue par les IA.',
  },
] as const

const FAQ_JSON_LD = {
  '@type': 'FAQPage',
  '@id': `${CANONICAL}#faq`,
  mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

const PAGE_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${CANONICAL}#webpage`,
      url: CANONICAL,
      name: 'Visibilité des cabinets dentaires et médicaux dans les IA',
      description:
        'Quand un patient demande à une IA quel praticien consulter, deux ou trois cabinets sont cités. GEOMIND mesure si le vôtre en fait partie et ce qui manque sinon.',
      inLanguage: 'fr-FR',
      isPartOf: { '@id': 'https://geomind.fr/#website' },
      about: { '@id': 'https://geomind.fr/#software' },
      audience: {
        '@type': 'Audience',
        audienceType:
          'Chirurgiens-dentistes, médecins généralistes et spécialistes, cabinets de groupe, centres de santé',
        geographicArea: { '@type': 'Country', name: 'France' },
      },
      primaryImageOfPage: { '@type': 'ImageObject', url: 'https://geomind.fr/logo-mark.png' },
      breadcrumb: { '@id': `${CANONICAL}#breadcrumb` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${CANONICAL}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://geomind.fr' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Secteurs',
          item: 'https://geomind.fr/secteurs/cabinets-dentaires',
        },
        { '@type': 'ListItem', position: 3, name: 'Cabinets dentaires et médicaux' },
      ],
    },
    {
      '@type': 'Service',
      '@id': `${CANONICAL}#service`,
      name: 'Audit de visibilité IA pour cabinets dentaires et médicaux',
      serviceType: 'Audit de visibilité dans les moteurs de réponse IA',
      provider: { '@id': 'https://geomind.fr/#organization' },
      areaServed: { '@type': 'Country', name: 'France' },
      inLanguage: 'fr-FR',
      description:
        'Mesure si un cabinet dentaire ou médical est cité par ChatGPT, Perplexity, Gemini et Claude lorsqu’un patient cherche un praticien, et identifie les informations manquantes ou erronées.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        description: 'Audit express gratuit, sans inscription ni carte bancaire',
        url: CANONICAL,
      },
    },
    FAQ_JSON_LD,
  ],
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

export default function CabinetsDentairesPage() {
  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_JSON_LD) }}
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section id="audit" className="relative overflow-hidden bg-[#16304B]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-[28%] h-[420px] w-[640px] -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-40 right-0 h-[380px] w-[520px] rounded-full bg-[--score-good-500]/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <div className="max-w-2xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-[#B2C8DE]">
              <Stethoscope className="h-3.5 w-3.5" aria-hidden />
              Cabinets dentaires &amp; médicaux
            </span>

            <h1 className="text-balance text-4xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-5xl">
              Vos patients demandent à une IA quel praticien consulter.{' '}
              <span className="text-[#7FB5E6]">Cite-t-elle votre cabinet&nbsp;?</span>
            </h1>

            <p className="mt-5 text-balance text-lg text-[#B2C8DE]">
              « Quel dentiste pour une urgence à Nantes ? », « Un orthodontiste pour adulte près de
              chez moi ». Les IA répondent en nommant deux ou trois cabinets. GEOMIND vérifie si le
              vôtre en fait partie — et ce qui manque quand ce n&apos;est pas le cas.
            </p>

            <div className="mt-8">
              <ExpressAudit />
              <p className="mt-3 text-xs text-[#7C92AC]">
                Résultat en quelques secondes, sans inscription. Entrez l&apos;adresse du site de
                votre cabinet.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-sm text-[#B2C8DE]">
              <span>
                <strong className="font-semibold text-white">{ENGINE_COUNT} IA</strong> interrogées
                à chaque audit
              </span>
              <span className="text-white/20">·</span>
              <span>
                Aucune publicité rédigée —{' '}
                <strong className="font-semibold text-white">des faits vérifiables</strong>
              </span>
              <span className="text-white/20">·</span>
              <span>
                Données hébergées <strong className="font-semibold text-white">en Europe</strong>
              </span>
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

      {/* ── Le constat ───────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            kicker="Le constat"
            title="La recherche d’un praticien a changé de porte d’entrée."
            intro="Un patient qui cherchait « dentiste + sa ville » sur Google parcourait une liste et choisissait. Aujourd’hui, une partie de ces patients pose la question à une IA — et reçoit une réponse rédigée, avec deux ou trois noms."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: 'La question est plus précise',
                body: 'Plus personne ne tape trois mots-clés. On écrit « dentiste qui accepte les urgences le samedi à Rennes, conventionné secteur 1 ». L’IA filtre sur ces critères — s’ils ne figurent nulle part à votre sujet, vous sortez de la sélection.',
              },
              {
                icon: ClipboardList,
                title: 'La réponse est courte',
                body: 'Une page de résultats Google affiche dix cabinets, plus la carte. Une IA en nomme deux ou trois. Il n’y a pas de deuxième page : on y est, ou on n’existe pas dans cette réponse.',
              },
              {
                icon: AlertTriangle,
                title: 'Les informations peuvent être fausses',
                body: 'Les IA recomposent leurs réponses à partir de sources hétérogènes. Un associé parti, une adresse ancienne, des horaires d’avant travaux : l’erreur circule sans que personne au cabinet ne le sache.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6">
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon size={19} className="text-primary" aria-hidden />
                </span>
                <h3 className="mb-1.5 font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ce que ça coûte ──────────────────────────────────────────── */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            kicker="Ce que ça coûte"
            title="Une absence qui ne fait aucun bruit."
            intro="Un cabinet ne voit jamais les patients qu’il n’a pas eus. Il n’y a ni appel manqué ni créneau annulé : la demande est simplement allée ailleurs, et rien dans votre agenda ne le signale."
          />

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="relative overflow-hidden rounded-2xl bg-[#16304B] p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-20 right-0 h-64 w-72 rounded-full bg-primary/30 blur-3xl"
              />
              <h3 className="relative text-xl font-bold text-white">
                Le calcul, vous êtes le seul à pouvoir le faire
              </h3>
              <p className="relative mt-3 max-w-lg text-sm leading-relaxed text-[#B2C8DE]">
                Prenez le nombre de nouveaux patients que votre cabinet accueille chaque mois, et ce
                que représente un patient sur une année de suivi. Multipliez par la part de ces
                patients qui, aujourd&apos;hui, commencent leur recherche dans une IA plutôt que
                dans Google. Ce chiffre-là, nous ne l&apos;inventons pas à votre place : nous vous
                donnons seulement la première variable, celle que vous ne pouvez pas mesurer
                seul — êtes-vous cité, oui ou non.
              </p>
              <ul className="relative mt-6 space-y-2.5 text-sm text-[#B2C8DE]">
                {[
                  'Un patient qui ne vous a pas trouvé ne vous le dira jamais.',
                  'Un confrère cité à votre place l’est sur toutes les questions du même type.',
                  'Une information fausse coûte deux fois : le patient perdu, et l’appel pour rien.',
                ].map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#34D399]" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4">
              {[
                {
                  icon: Stethoscope,
                  title: 'Les actes les plus rentables sont les plus cherchés',
                  body: 'Implantologie, orthodontie de l’adulte, esthétique, parodontie : ce sont des soins que le patient choisit, compare et cherche activement. C’est exactement là que les IA sont consultées.',
                },
                {
                  icon: ShieldCheck,
                  title: 'La réputation se joue aussi hors de votre site',
                  body: 'Ce qu’une IA dit de votre cabinet vient d’avis, d’annuaires et de pages que vous ne contrôlez pas. Savoir ce qui en ressort est la première étape pour le corriger.',
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-border bg-card p-6">
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                  </span>
                  <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Comment on mesure ────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            kicker="Comment on mesure"
            title="On pose les questions de vos patients, et on lit les réponses."
            intro="Aucune estimation, aucun indice théorique : les questions sont réellement envoyées aux IA, et les réponses réellement analysées."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                num: '1',
                icon: Globe,
                title: 'On part de votre site',
                body: 'Vous donnez l’adresse du site du cabinet. GEOMIND en déduit votre spécialité, votre zone et les questions qu’un patient poserait — sans jamais nommer votre cabinet dans ces questions, sinon le résultat serait faussé.',
              },
              {
                num: '2',
                icon: Zap,
                title: `On interroge les ${ENGINE_COUNT} IA`,
                body: `Ces questions partent vers ${ENGINE_LIST}. On récupère les réponses complètes et les sources citées, puis on vérifie si votre cabinet y figure — et à quelle place.`,
              },
              {
                num: '3',
                icon: ClipboardList,
                title: 'On dit quoi corriger',
                body: 'Vous obtenez le détail par question : qui est cité à votre place, quelles informations manquent sur votre site, lesquelles sont contredites ailleurs. Chaque point est classé par priorité.',
              },
            ].map(({ num, icon: Icon, title, body }) => (
              <div
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
                <h3 className="mb-1.5 font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Les sources lues par les IA ──────────────────────────────── */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            kicker="Ce qu’on regarde"
            title="Quatre sources décident de votre présence."
            intro="Une IA ne cite pas un cabinet sur la foi d’une seule page. Elle recoupe, et elle écarte ce qui se contredit. L’analyse vérifie la cohérence de l’ensemble."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {SOURCES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6">
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                </span>
                <h3 className="mb-1.5 text-base font-bold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-2 text-base font-bold text-foreground">
              Et le cadre déontologique&nbsp;?
            </h3>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Depuis le décret n°&nbsp;2020-1658 du 22 décembre 2020, un professionnel de santé peut
              communiquer au public des informations sur son exercice, dès lors qu&apos;elles sont
              exactes, vérifiables et dépourvues de caractère promotionnel ou comparatif. GEOMIND ne
              rédige aucune publicité et ne produit aucun classement de praticiens : l&apos;outil
              vérifie que vos informations factuelles — spécialités, actes, adresse, horaires,
              conventionnement, accessibilité — sont présentes, cohérentes et lisibles par les IA.
              La responsabilité éditoriale de ce qui est publié reste la vôtre.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <SectionHeading kicker="FAQ" title="Questions fréquentes des praticiens." />
          <div className="divide-y divide-border">
            {FAQ_ITEMS.map(({ q, a }) => (
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
              être visible dans les IA quand on est un établissement local
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

      {/* ── CTA final ────────────────────────────────────────────────── */}
      <section className="px-4 pb-20 sm:pb-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[#16304B] px-8 py-16 sm:px-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/3 h-72 w-96 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl"
          />
          <div className="relative max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Vérifiez ce que les IA disent de votre cabinet.
            </h2>
            <p className="mt-4 text-lg text-[#B2C8DE]">
              L&apos;audit express prend une dizaine de secondes, ne demande ni inscription ni carte
              bancaire, et vous dit immédiatement où vous en êtes.
            </p>
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
