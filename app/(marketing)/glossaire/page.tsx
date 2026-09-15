import type { Metadata } from 'next'
import type { Route } from 'next'
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
  /** Ancre stable de la définition — sert d'`@id` au DefinedTerm et de cible de lien. */
  slug: string
  /** Guide du blog qui développe le terme (maillage interne). */
  guide?: { slug: string; label: string }
}

const TERMS: Term[] = [
  {
    term: 'GEO (Generative Engine Optimization)',
    slug: 'geo',
    guide: { slug: 'quest-ce-que-le-geo', label: 'Qu’est-ce que le GEO ?' },
    definition:
      "Ensemble des pratiques qui permettent à un site d'être cité dans les réponses générées par les intelligences artificielles (ChatGPT, Perplexity, Gemini, Claude) lorsqu'un internaute pose une question. Équivalent du SEO, mais pour les moteurs de réponse plutôt que pour les listes de liens.",
  },
  {
    term: 'SEO (Search Engine Optimization)',
    slug: 'seo',
    guide: { slug: 'geo-vs-seo', label: 'GEO vs SEO : ce qui change' },
    definition:
      "Optimisation pour les moteurs de recherche classiques comme Google : l'objectif est d'apparaître haut dans la liste de liens bleus. Le SEO reste le socle technique sur lequel s'appuie le GEO.",
  },
  {
    term: 'Moteur de réponse',
    slug: 'moteur-de-reponse',
    guide: { slug: 'etre-visible-perplexity', label: 'Apparaître dans Perplexity' },
    definition:
      "Outil qui, au lieu de renvoyer une liste de liens, rédige directement une réponse à la question posée (Perplexity, ChatGPT, Google AI Overviews). Il cite généralement un petit nombre de sources : on y est cité, ou on est invisible.",
  },
  {
    term: 'Citation IA',
    slug: 'citation-ia',
    guide: { slug: 'suivre-citations-ia', label: 'Suivre ses citations dans les IA' },
    definition:
      "Apparition du nom, de la marque ou du domaine d'une entreprise dans une réponse générée par une IA, souvent accompagnée d'un lien vers la source. C'est la métrique centrale du GEO.",
  },
  {
    term: 'AI Overviews (Aperçus IA)',
    slug: 'ai-overviews',
    guide: { slug: 'apparaitre-google-ai-overviews', label: 'Apparaître dans les AI Overviews' },
    definition:
      "Réponse rédigée par l'IA de Google, affichée tout en haut des résultats de recherche, au-dessus des liens classiques. Y être cité offre une visibilité maximale.",
  },
  {
    term: 'llms.txt',
    slug: 'llms-txt',
    guide: { slug: 'fichiers-qui-parlent-aux-ia', label: 'Les fichiers qui parlent aux IA' },
    definition:
      "Fichier texte placé à la racine d'un site (comme robots.txt) qui présente aux IA, en langage clair, l'entreprise et ses pages importantes. Il aide les moteurs de réponse à comprendre et à citer correctement le site.",
  },
  {
    term: 'Données structurées (Schema.org)',
    slug: 'donnees-structurees',
    guide: { slug: 'fichiers-qui-parlent-aux-ia', label: 'Les fichiers qui parlent aux IA' },
    definition:
      "Balises invisibles aux visiteurs qui décrivent le contenu d'une page dans un format que les machines comprennent (entreprise, produit, FAQ, avis, horaires). Elles facilitent l'extraction et la citation par les IA.",
  },
  {
    term: 'robots.txt',
    slug: 'robots-txt',
    guide: { slug: 'erreurs-geo-frequentes', label: 'Les 7 erreurs GEO fréquentes' },
    definition:
      "Fichier qui indique aux robots d'exploration ce qu'ils ont le droit de lire. En GEO, il ne doit pas bloquer les agents des IA (GPTBot, PerplexityBot, ClaudeBot, Google-Extended), sous peine d'être invisible pour elles.",
  },
  {
    term: 'GPTBot',
    slug: 'gptbot',
    guide: { slug: 'comment-etre-cite-par-chatgpt', label: 'Être cité par ChatGPT' },
    definition:
      "Robot d'exploration d'OpenAI (ChatGPT). D'autres existent : PerplexityBot (Perplexity), ClaudeBot (Claude), Google-Extended (Gemini). Ils doivent être autorisés dans le robots.txt pour que ces IA puissent lire votre site.",
  },
  {
    term: 'Autorité (GEO)',
    slug: 'autorite',
    guide: { slug: 'entreprise-pas-citee-chatgpt', label: 'Mon entreprise n’apparaît pas dans ChatGPT' },
    definition:
      "Niveau de confiance qu'une IA accorde à une source. Elle se construit largement en dehors de votre site : mentions dans la presse, fiches d'annuaires, avis clients, présence sur des plateformes reconnues.",
  },
  {
    term: 'E-E-A-T',
    slug: 'e-e-a-t',
    guide: { slug: 'choisir-outil-visibilite-ia', label: 'Choisir un outil de visibilité IA' },
    definition:
      "Acronyme pour Experience, Expertise, Authoritativeness, Trust (expérience, expertise, autorité, fiabilité). Critères de qualité utilisés par Google et repris implicitement par les IA pour juger si une source mérite d'être citée.",
  },
  {
    term: 'Prompt neutre',
    slug: 'prompt-neutre',
    guide: { slug: 'savoir-si-chatgpt-parle-de-mon-entreprise', label: 'Savoir si ChatGPT parle de vous' },
    definition:
      "Question posée à une IA sans citer la marque ou le domaine que l'on teste (par exemple « meilleur comptable à Lille » plutôt que « avis sur l'entreprise X »). C'est la seule façon de mesurer honnêtement sa visibilité réelle.",
  },
  {
    term: 'Contenu citable',
    slug: 'contenu-citable',
    guide: { slug: 'comment-etre-cite-par-chatgpt', label: 'Être cité par ChatGPT' },
    definition:
      "Contenu facile à extraire et à reformuler par une IA : réponse directe en tête de page, définition claire, liste structurée, fourchette de prix, FAQ. À l'opposé du contenu vague qui n'est jamais repris.",
  },
  {
    term: 'Fraîcheur',
    slug: 'fraicheur',
    guide: { slug: 'erreurs-geo-frequentes', label: 'Les 7 erreurs GEO fréquentes' },
    definition:
      "Caractère récent et à jour d'un contenu. Les IA privilégient les pages récemment mises à jour, surtout sur les sujets qui évoluent. Une date de publication visible est un signal de fraîcheur.",
  },
  {
    term: 'Recherche zéro clic',
    slug: 'recherche-zero-clic',
    guide: { slug: 'apparaitre-dans-gemini', label: 'Apparaître dans Google Gemini' },
    definition:
      "Situation où l'internaute obtient sa réponse directement dans l'IA ou dans les résultats, sans cliquer vers un site. Être cité reste précieux : cela construit la notoriété et la préférence de marque, même sans visite.",
  },
  {
    term: 'Google Business Profile',
    slug: 'google-business-profile',
    guide: { slug: 'geo-commerce-local', label: 'GEO local : être recommandé près de chez soi' },
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
      // Adressable : une IA qui reprend la définition peut pointer la bonne ancre.
      '@id': `https://geomind.fr/glossaire#${t.slug}`,
      url: `https://geomind.fr/glossaire#${t.slug}`,
      name: t.term,
      description: t.definition,
      inDefinedTermSet: 'https://geomind.fr/glossaire',
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

      {/* Chaque terme est un H2 ancré : sans titres, les crawlers IA n'ont aucun
          point d'accroche pour découper la page et citer la bonne définition. */}
      <div className="mt-12 space-y-8">
        {TERMS.map((t) => (
          <section key={t.slug} id={t.slug} className="scroll-mt-24 border-l-2 border-indigo-100 pl-5">
            <h2 className="text-lg font-bold text-foreground">{t.term}</h2>
            <p className="mt-2 text-base leading-relaxed text-foreground/80">{t.definition}</p>
            {t.guide ? (
              <p className="mt-2 text-sm">
                <Link
                  href={`/blog/${t.guide.slug}` as Route}
                  className="font-medium text-primary hover:underline"
                >
                  {t.guide.label}
                </Link>
              </p>
            ) : null}
          </section>
        ))}
      </div>

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
