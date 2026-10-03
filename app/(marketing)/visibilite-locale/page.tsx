import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { LOCAL_VISIBILITY_SERVICE } from '@/lib/plans'
import { AUTHOR_ID } from '@/components/features/marketing/article-layout'

/**
 * app/(marketing)/visibilite-locale/page.tsx
 *
 * Offre de service « Visibilité locale » (étape S1 du plan). Une prestation
 * réalisée à la main, payée une fois à la livraison — pas un abonnement.
 *
 * Le texte est celui fourni par Andrea, à la lettre : seule la mise en page est
 * libre. Aucune promesse de place dans les réponses des IA ni dans Google — la
 * page dit explicitement le contraire, et c'est voulu.
 *
 * Les prix viennent de `lib/plans.ts` (règle : jamais de prix ailleurs).
 */

const PAGE_URL = 'https://geomind.fr/visibilite-locale'

/** Prise de rendez-vous — agenda de réservation Google. */
const BOOKING_URL =
  'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3XIEO9QKa4cHlL0fEbyogzvcPVzMBybAxr-HC1HOsPC81CfNZikzGsrSSCb9tD3OoY3lAPdmb0'

const { price, followUpMonthly } = LOCAL_VISIBILITY_SERVICE

const INTRO =
  "Aujourd'hui, vos clients vous cherchent sur Google Maps, et de plus en plus en demandant à ChatGPT. Dans les deux cas, ils tombent sur les mêmes informations : votre fiche Google, les annuaires de votre métier, et ce que votre site dit de vos prestations. Je m'occupe de ces trois points en une semaine."

const STEPS = [
  'Votre fiche Google, corrigée et complète : la bonne catégorie principale, une description claire, vos horaires, vos prestations, des photos.',
  '2 à 3 annuaires de votre métier, créés ou complétés : ceux que Google et les IA consultent vraiment dans votre secteur (Pages Jaunes, Houzz, Doctolib, Studiomaps...).',
  "Une page par prestation sur votre site : ce que vous faites, pour qui, à quel prix indicatif, en combien de temps. Si je n'ai pas accès à votre site, je vous fournis les textes prêts à coller.",
  "Une démarche d'avis clients : un QR code et un message type à envoyer après chaque prestation, pour que les avis arrivent régulièrement.",
] as const

/** Questions fréquentes — affichées sur la page et balisées en FAQPage. */
const FAQ_ITEMS = [
  {
    q: 'Dois-je vous donner mon mot de passe ?',
    a: "Non. Vous m'ajoutez comme gestionnaire de votre fiche Google, et vous pouvez me retirer quand vous voulez.",
  },
  {
    q: "Je n'ai pas de site.",
    a: "Le chantier porte alors sur votre fiche et vos annuaires, et je vous conseille sur une page simple si c'est utile.",
  },
  {
    q: 'Pourquoi payer à la livraison ?',
    a: 'Parce que vous devez voir le travail avant de le payer.',
  },
] as const

const SERVICE_JSON_LD = {
  '@type': 'Service',
  '@id': `${PAGE_URL}#service`,
  name: 'Visibilité locale',
  serviceType: 'Mise en ordre de la présence locale : fiche Google, annuaires, pages de prestation',
  description: INTRO,
  url: PAGE_URL,
  inLanguage: 'fr-FR',
  areaServed: { '@type': 'Country', name: 'France' },
  provider: {
    '@type': 'Person',
    '@id': AUTHOR_ID,
    name: 'Andrea Schwertz',
    worksFor: { '@id': 'https://geomind.fr/#organization' },
  },
  offers: [
    {
      '@type': 'Offer',
      '@id': `${PAGE_URL}#offer`,
      name: 'Visibilité locale',
      price: String(price),
      priceCurrency: 'EUR',
      // Paiement unique : aucune périodicité de facturation, ce qui distingue
      // la prestation des abonnements.
      priceSpecification: {
        '@type': 'PriceSpecification',
        price: String(price),
        priceCurrency: 'EUR',
      },
      description: 'Paiement unique, à la livraison.',
      availability: 'https://schema.org/InStock',
      url: PAGE_URL,
    },
    {
      '@type': 'Offer',
      '@id': `${PAGE_URL}#suivi`,
      name: 'Suivi mensuel',
      price: String(followUpMonthly),
      priceCurrency: 'EUR',
      // Facturation mensuelle, sans engagement.
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: String(followUpMonthly),
        priceCurrency: 'EUR',
        unitCode: 'MON',
        billingDuration: 'P1M',
        referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
      },
      description: 'Optionnel, sans engagement.',
      availability: 'https://schema.org/InStock',
      url: PAGE_URL,
    },
  ],
}

const FAQ_JSON_LD = {
  '@type': 'FAQPage',
  '@id': `${PAGE_URL}#faq`,
  mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [SERVICE_JSON_LD, FAQ_JSON_LD],
}

export const metadata: Metadata = {
  title: 'Visibilité locale clé en main : fiche Google, annuaires, pages de prestation',
  description: `Votre fiche Google, 2 à 3 annuaires de votre métier et une page par prestation, mis en ordre en une semaine. ${price} €, payés à la livraison.`,
  alternates: { canonical: '/visibilite-locale' },
}

function BookingButton() {
  return (
    <Button
      asChild
      size="lg"
      className="rounded-lg bg-[#34D399] px-8 font-semibold text-[#0B3B2E] hover:bg-[#2bbd88]"
    >
      <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
        Réserver un appel de 10 minutes
      </a>
    </Button>
  )
}

export default function VisibiliteLocalePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Plus de clients qui vous trouvent, sur Google et dans les IA
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-foreground/85">{INTRO}</p>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-foreground">Ce que je fais</h2>
        <ol className="mt-5 space-y-4">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <p className="pt-0.5 text-base leading-relaxed text-foreground/85">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-muted/40 p-6">
        <dl className="space-y-2 text-base text-foreground/85">
          <div>
            <dt className="inline font-semibold text-foreground">Délai</dt>
            <dd className="inline"> : une semaine.</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-foreground">Prix</dt>
            <dd className="inline">
              {' '}
              : {price}&nbsp;€, payés à la livraison, une fois que vous voyez chaque modification
              en ligne.
            </dd>
          </div>
          <div>
            <dt className="inline font-semibold text-foreground">Votre temps</dt>
            <dd className="inline">
              {' '}
              : 30 minutes au début pour me donner les accès et répondre à mes questions.
            </dd>
          </div>
        </dl>
        <div className="mt-6">
          <BookingButton />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-foreground">Comment on mesure</h2>
        <p className="mt-3 text-base leading-relaxed text-foreground/85">
          Votre fiche Google affiche elle-même vos appels, vos demandes d&apos;itinéraire et vos
          clics vers votre site. Je relève ces chiffres avant, puis 30 et 60 jours après. Vous
          les voyez aussi.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-foreground">Ce que je ne promets pas</h2>
        <p className="mt-3 text-base leading-relaxed text-foreground/85">
          Personne ne peut garantir une place dans les réponses de ChatGPT ou en tête de Google.
          Je garantis les travaux ; les résultats, on les mesure ensemble.
        </p>
      </section>

      <section className="mt-10 rounded-2xl border border-dashed border-border p-6">
        <p className="text-base leading-relaxed text-foreground/85">
          Ensuite, si vous le souhaitez : le suivi à {followUpMonthly}&nbsp;€/mois, sans
          engagement. Je réponds à vos avis, je publie 2 actualités par mois sur votre fiche, je
          relance vos clients pour de nouveaux avis, et vous recevez chaque mois vos chiffres
          d&apos;appels et de visites.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-bold text-foreground">Questions fréquentes</h2>
        <dl className="mt-6 space-y-6">
          {FAQ_ITEMS.map(({ q, a }) => (
            <div key={q}>
              <dt className="text-base font-semibold text-foreground">{q}</dt>
              <dd className="mt-2 text-base leading-relaxed text-foreground/85">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-14 rounded-2xl bg-[#16304B] px-8 py-10 text-center shadow-xl">
        <BookingButton />
      </div>
    </div>
  )
}
