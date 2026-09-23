import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ExpressAuditBand } from '@/components/features/marketing/express-audit-band'

/**
 * app/(marketing)/verifier-visibilite-chatgpt/page.tsx
 *
 * Page outil dédiée (pas un article) : cible la requête « comment savoir si
 * ChatGPT parle de mon site ». L'audit express (lib/analysis/express-audit.ts)
 * y est présenté sans détour, avec la même honnêteté que partout ailleurs —
 * ce test vérifie l'accessibilité technique, pas la citation réelle.
 *
 * Distincte de /blog/savoir-si-chatgpt-parle-de-mon-entreprise (la méthode
 * manuelle, à la main) : les deux se renvoient l'une à l'autre plutôt que de
 * se disputer la même requête.
 */

const PAGE_URL = 'https://geomind.fr/verifier-visibilite-chatgpt'

const FAQ_ITEMS = [
  {
    q: 'Comment savoir si ChatGPT parle de mon site ?',
    a: "Deux niveaux. D'abord un test technique immédiat et gratuit (celui de cette page) : il vérifie si GPTBot, le robot de ChatGPT, peut lire votre site — la condition minimale pour être cité. Ensuite, une vérification réelle : poser de vraies questions à ChatGPT et regarder s'il vous cite. Le premier est instantané ; le second demande l'analyse complète, qui interroge vraiment l'IA.",
  },
  {
    q: 'Ce test interroge-t-il vraiment ChatGPT ?',
    a: "Non. C'est une série de vérifications techniques — accessibilité du site, robots.txt, données structurées… — en quelques secondes, sans appel à une IA. Interroger réellement ChatGPT, lui poser une question et lire sa réponse, c'est ce que fait l'analyse complète.",
  },
  {
    q: 'Pourquoi ChatGPT ne cite-t-il pas mon site alors qu’il est bien classé sur Google ?',
    a: "Parce que le classement Google (SEO) et la citation par une IA (GEO) reposent sur des logiques différentes : l'un mesure une position dans une liste de liens, l'autre mesure si votre contenu répond assez clairement à une question pour être repris dans une réponse rédigée. Les deux se travaillent différemment.",
  },
  {
    q: 'Ce test est-il vraiment gratuit ?',
    a: 'Oui, sans inscription, sans carte bancaire, et sans limite de nombre de sites testés.',
  },
  {
    q: 'Combien de temps ça prend ?',
    a: "Quelques secondes pour ce test technique. Comptez 2 à 5 minutes pour l'analyse complète, qui interroge réellement ChatGPT, Perplexity, Gemini et Claude avec des questions de client.",
  },
] as const

const WEBAPP_JSON_LD = {
  '@type': 'WebApplication',
  '@id': `${PAGE_URL}#webapp`,
  name: 'Vérificateur de visibilité ChatGPT — GEOMIND',
  url: PAGE_URL,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  inLanguage: 'fr-FR',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  publisher: { '@id': 'https://geomind.fr/#organization' },
  description:
    'Test gratuit et sans inscription qui vérifie si GPTBot, ClaudeBot, PerplexityBot et les autres robots des IA peuvent lire un site — la condition minimale pour être cité par ChatGPT.',
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
  '@graph': [WEBAPP_JSON_LD, FAQ_JSON_LD],
}

export const metadata: Metadata = {
  title: 'ChatGPT parle-t-il de votre site ? Vérifiez gratuitement',
  description:
    "Test gratuit, sans inscription : vérifiez si GPTBot peut lire votre site. Puis découvrez si ChatGPT vous cite vraiment, avec l'analyse complète.",
  alternates: { canonical: '/verifier-visibilite-chatgpt' },
}

export default function VerifierVisibiliteChatgptPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
        Vérification gratuite
      </p>
      <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Vérifiez si ChatGPT parle de votre site
      </h1>

      <div className="mt-6 space-y-3 text-base leading-relaxed text-foreground/85">
        <p>
          Ce test gratuit vérifie en quelques secondes si <strong>GPTBot</strong>, le robot
          d&apos;exploration de ChatGPT, peut lire votre site — la condition minimale pour être
          cité.
        </p>
        <p>
          Il ne vous dit pas si ChatGPT vous cite réellement dans ses réponses : ça, seule une
          vraie question posée à l&apos;IA peut le révéler.
        </p>
        <p>
          Pour ça, l&apos;analyse complète interroge ChatGPT, Perplexity, Gemini et Claude avec de
          vraies questions de client — gratuite pour votre premier site.
        </p>
      </div>

      <div className="mt-10">
        <ExpressAuditBand
          title="Testez votre site maintenant"
          subtitle="Gratuit, sans inscription : les vérifications techniques de base, puis ce qu'il faudrait interroger auprès des IA pour savoir si elles vous citent vraiment."
        />
      </div>

      <div className="mt-4 space-y-5 text-base leading-relaxed text-foreground/85">
        <h2 className="mt-10 text-xl font-bold text-foreground">Ce que ce test vérifie</h2>
        <p>
          Une série de vérifications HTTP, groupées en quatre familles — le détail complet
          s&apos;affiche après votre test :
        </p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            <strong className="text-foreground">Accessibilité</strong> — votre site répond-il, et
            assez vite pour qu&apos;un robot ne l&apos;abandonne pas en cours de lecture ?
          </li>
          <li>
            <strong className="text-foreground">Structure de la page</strong> — titre, meta
            description, H1, langue déclarée : les repères de base que lit toute IA.
          </li>
          <li>
            <strong className="text-foreground">Signaux pour les IA</strong> — données structurées
            (Schema.org), balises Open Graph.
          </li>
          <li>
            <strong className="text-foreground">Ouverture aux robots</strong> — votre robots.txt
            autorise-t-il GPTBot, ClaudeBot et PerplexityBot ? Votre sitemap et votre llms.txt
            existent-ils ?
          </li>
        </ul>
        <p>
          Un robots.txt qui bloque les robots des IA pèse lourd dans la note : c&apos;est
          rédhibitoire pour être cité, quelle que soit la qualité du reste de votre site.
        </p>

        <h2 className="mt-10 text-xl font-bold text-foreground">
          Ce que ce test ne vous dit pas encore
        </h2>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            <strong className="text-foreground">ChatGPT vous cite-t-il ?</strong> Non mesuré ici —
            il faut lui poser de vraies questions de client et lire les sources qu&apos;il
            affiche.
          </li>
          <li>
            <strong className="text-foreground">Qui est cité à votre place ?</strong> Non mesuré
            ici — les concurrents que ChatGPT nomme quand il ne vous nomme pas, vous.
          </li>
          <li>
            <strong className="text-foreground">Que raconte ChatGPT sur vous ?</strong> Non mesuré
            ici — horaires, adresse, activité peuvent être faux sans que vous le sachiez.
          </li>
        </ul>
        <p>Ces trois réponses, seule l&apos;analyse complète les donne.</p>
        <p>
          Vous préférez tester sans outil ? Notre guide détaille la{' '}
          <Link
            href="/blog/savoir-si-chatgpt-parle-de-mon-entreprise"
            className="font-medium text-primary underline underline-offset-4"
          >
            méthode manuelle en 15 minutes
          </Link>
          .
        </p>
      </div>

      <div className="mt-12 rounded-2xl bg-[#16304B] px-8 py-10 text-center shadow-xl">
        <p className="mb-2 text-lg font-bold text-white">
          Le test ci-dessus couvre un pilier sur trois.
        </p>
        <p className="mb-5 text-sm text-[#B2C8DE]">
          L&apos;analyse complète interroge vraiment ChatGPT, Perplexity, Gemini et Claude avec les
          questions de vos clients, et vous dit qui est cité à votre place. Gratuite pour votre
          premier site, sans carte bancaire.
        </p>
        <Button asChild className="rounded-lg bg-[#34D399] px-8 font-semibold text-[#0B3B2E] hover:bg-[#2bbd88]">
          <Link href="/signup">Analyser mon site gratuitement</Link>
        </Button>
      </div>

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
    </div>
  )
}
