import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Glossaire GEO (app/(marketing)/glossaire) — contenu définitionnel, le format
 * le plus facilement cité par les moteurs de réponses IA. Chaque terme est aussi
 * exposé en JSON-LD DefinedTermSet pour que les IA extraient les définitions
 * proprement (le cordonnier se chausse : c'est une règle GEO que le produit audite).
 */

export const metadata: Metadata = {
  title: 'Glossaire GEO — tous les termes de la visibilité IA expliqués',
  description:
    'Définitions claires des termes du GEO (Generative Engine Optimization) : moteur de réponse, citation IA, llms.txt, AI Overviews, données structurées, E-E-A-T… en français simple.',
  alternates: { canonical: '/glossaire' },
}

interface Term {
  term: string
  definition: string
}

const TERMS: Term[] = [
  {
    term: 'GEO (Generative Engine Optimization)',
    definition:
      "Ensemble des pratiques qui permettent à un site d'être cité dans les réponses générées par les intelligences artificielles (ChatGPT, Perplexity, Gemini, Claude) lorsqu'un internaute pose une question. Équivalent du SEO, mais pour les moteurs de réponse plutôt que pour les listes de liens.",
  },
  {
    term: 'SEO (Search Engine Optimization)',
    definition:
      "Optimisation pour les moteurs de recherche classiques comme Google : l'objectif est d'apparaître haut dans la liste de liens bleus. Le SEO reste le socle technique sur lequel s'appuie le GEO.",
  },
  {
    term: 'Moteur de réponse',
    definition:
      "Outil qui, au lieu de renvoyer une liste de liens, rédige directement une réponse à la question posée (Perplexity, ChatGPT, Google AI Overviews). Il cite généralement un petit nombre de sources : on y est cité, ou on est invisible.",
  },
  {
    term: 'Citation IA',
    definition:
      "Apparition du nom, de la marque ou du domaine d'une entreprise dans une réponse générée par une IA, souvent accompagnée d'un lien vers la source. C'est la métrique centrale du GEO.",
  },
  {
    term: 'AI Overviews (Aperçus IA)',
    definition:
      "Réponse rédigée par l'IA de Google, affichée tout en haut des résultats de recherche, au-dessus des liens classiques. Y être cité offre une visibilité maximale.",
  },
  {
    term: 'llms.txt',
    definition:
      "Fichier texte placé à la racine d'un site (comme robots.txt) qui présente aux IA, en langage clair, l'entreprise et ses pages importantes. Il aide les moteurs de réponse à comprendre et à citer correctement le site.",
  },
  {
    term: 'Données structurées (Schema.org)',
    definition:
      "Balises invisibles aux visiteurs qui décrivent le contenu d'une page dans un format que les machines comprennent (entreprise, produit, FAQ, avis, horaires). Elles facilitent l'extraction et la citation par les IA.",
  },
  {
    term: 'robots.txt',
    definition:
      "Fichier qui indique aux robots d'exploration ce qu'ils ont le droit de lire. En GEO, il ne doit pas bloquer les agents des IA (GPTBot, PerplexityBot, ClaudeBot, Google-Extended), sous peine d'être invisible pour elles.",
  },
  {
    term: 'GPTBot',
    definition:
      "Robot d'exploration d'OpenAI (ChatGPT). D'autres existent : PerplexityBot (Perplexity), ClaudeBot (Claude), Google-Extended (Gemini). Ils doivent être autorisés dans le robots.txt pour que ces IA puissent lire votre site.",
  },
  {
    term: 'Autorité (GEO)',
    definition:
      "Niveau de confiance qu'une IA accorde à une source. Elle se construit largement en dehors de votre site : mentions dans la presse, fiches d'annuaires, avis clients, présence sur des plateformes reconnues.",
  },
  {
    term: 'E-E-A-T',
    definition:
      "Acronyme pour Experience, Expertise, Authoritativeness, Trust (expérience, expertise, autorité, fiabilité). Critères de qualité utilisés par Google et repris implicitement par les IA pour juger si une source mérite d'être citée.",
  },
  {
    term: 'Prompt neutre',
    definition:
      "Question posée à une IA sans citer la marque ou le domaine que l'on teste (par exemple « meilleur comptable à Lille » plutôt que « avis sur l'entreprise X »). C'est la seule façon de mesurer honnêtement sa visibilité réelle.",
  },
  {
    term: 'Contenu citable',
    definition:
      "Contenu facile à extraire et à reformuler par une IA : réponse directe en tête de page, définition claire, liste structurée, fourchette de prix, FAQ. À l'opposé du contenu vague qui n'est jamais repris.",
  },
  {
    term: 'Fraîcheur',
    definition:
      "Caractère récent et à jour d'un contenu. Les IA privilégient les pages récemment mises à jour, surtout sur les sujets qui évoluent. Une date de publication visible est un signal de fraîcheur.",
  },
  {
    term: 'Recherche zéro clic',
    definition:
      "Situation où l'internaute obtient sa réponse directement dans l'IA ou dans les résultats, sans cliquer vers un site. Être cité reste précieux : cela construit la notoriété et la préférence de marque, même sans visite.",
  },
  {
    term: 'Google Business Profile',
    definition:
      "Fiche d'établissement gratuite de Google (anciennement Google My Business). Source majeure pour les recommandations locales des IA : horaires, avis, catégorie et adresse y sont puisés.",
  },
]

export default function GlossairePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Glossaire du GEO (Generative Engine Optimization)',
    url: 'https://geomind.fr/glossaire',
    inLanguage: 'fr-FR',
    hasDefinedTerm: TERMS.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.definition,
    })),
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
        Glossaire
      </p>
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
        Le vocabulaire du GEO, en français clair
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Tous les termes de la visibilité dans les IA, définis simplement — sans jargon réservé aux
        experts.
      </p>

      <dl className="mt-12 space-y-8">
        {TERMS.map((t) => (
          <div key={t.term} className="border-l-2 border-indigo-100 pl-5">
            <dt className="text-lg font-bold text-foreground">{t.term}</dt>
            <dd className="mt-2 text-base leading-relaxed text-foreground/80">{t.definition}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-10 text-center shadow-xl shadow-indigo-200">
        <p className="mb-2 text-lg font-bold text-white">
          Et vous, les IA vous citent-elles déjà ?
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
    </div>
  )
}
