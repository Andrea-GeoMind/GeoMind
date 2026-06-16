import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('apparaitre-dans-gemini')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <p>
        Google Gemini est aujourd&apos;hui intégré à la recherche Google, à Android et à Google
        Workspace. Chaque jour, des millions d&apos;utilisateurs posent leurs questions directement
        à Gemini et obtiennent une réponse rédigée, accompagnée d&apos;une poignée de sources. Si
        votre entreprise y est citée, vous captez une attention qualifiée à un moment clé du
        parcours d&apos;achat. Si vous êtes absent, c&apos;est un concurrent qui prend cette place.
        Voici comment construire votre visibilité dans Gemini, pas à pas.
      </p>

      <h2>Comment Gemini choisit ses sources</h2>
      <p>
        Contrairement à ChatGPT, qui s&apos;appuie principalement sur sa base de connaissance
        interne, Gemini est profondément ancré dans l&apos;index Google. Il consulte les pages
        que Google a déjà crawlées et évaluées, en leur appliquant les mêmes signaux de
        confiance que Search : fraîcheur du contenu, autorité du domaine, qualité des données
        structurées et respect des critères E-E-A-T (Expérience, Expertise, Autorité,
        Fiabilité). Pour les recherches à dimension locale — « plombier à Lyon »,
        « restaurant végétarien à Bordeaux » —, Gemini intègre également les informations
        issues de Google Business Profile. En clair : si Google vous fait confiance, Gemini
        vous cite. Si Google vous ignore, Gemini vous ignore aussi.
      </p>

      <h2>Votre socle : un SEO Google solide</h2>
      <p>
        Gemini hérite directement de votre référencement naturel. Un site que Google ne
        comprend pas, ne crawle pas ou ne valorise pas sera invisible dans les réponses
        Gemini, quelle que soit la qualité de votre contenu brut. Avant toute optimisation
        spécifique, assurez-vous que vos bases sont en ordre.
      </p>
      <ul>
        <li>
          <strong>Accessibilité technique :</strong> HTTPS, temps de chargement rapide
          (Core Web Vitals dans le vert), pas d&apos;erreurs 404 en masse, sitemap XML
          soumis à Google Search Console.
        </li>
        <li>
          <strong>Fichier robots.txt neutre :</strong> ne bloquez pas les crawlers Google
          ni les agents IA. Un robots.txt trop restrictif coupe la source d&apos;information
          de Gemini.
        </li>
        <li>
          <strong>Autorité du domaine :</strong> des backlinks depuis des sites reconnus
          (presse sectorielle, annuaires de référence, partenaires institutionnels) renforcent
          le signal de confiance auprès de Google et, par ricochet, auprès de Gemini.
        </li>
        <li>
          <strong>Fraîcheur :</strong> mettez à jour vos pages clés régulièrement. Gemini
          privilégie les contenus récents pour les sujets qui évoluent (tarifs, réglementations,
          disponibilités).
        </li>
      </ul>

      <h2>Les données structurées, langage natif de Google</h2>
      <p>
        Les données structurées (schema.org) sont le moyen le plus direct d&apos;indiquer à
        Google — et donc à Gemini — ce que vous êtes, ce que vous faites et pour qui vous
        le faites. Elles permettent à Gemini d&apos;extraire des informations précises sans
        avoir à interpréter votre contenu.
      </p>
      <ul>
        <li>
          <strong>Organization :</strong> nom légal, logo, site officiel, réseaux sociaux,
          secteur d&apos;activité. C&apos;est la carte d&apos;identité numérique de votre
          entreprise. Elle alimente le Knowledge Graph de Google et améliore directement
          votre présence dans Gemini.
        </li>
        <li>
          <strong>LocalBusiness :</strong> adresse, horaires, numéro de téléphone, zone de
          service. Indispensable pour toute entreprise avec une dimension physique ou locale.
        </li>
        <li>
          <strong>FAQPage :</strong> balisez vos questions-réponses. Gemini adore les formats
          Q/R car ils correspondent exactement à sa façon de structurer ses réponses.
        </li>
        <li>
          <strong>Product / Service :</strong> nom, description, prix, disponibilité. Si vous
          vendez des produits ou des prestations définies, ces balises permettent à Gemini de
          vous citer dans des comparatifs ou des recommandations.
        </li>
      </ul>
      <p>
        Implémentez ces balises en JSON-LD dans le{' '}
        <strong>&lt;head&gt;</strong> de vos pages. Validez-les avec le Rich Results Test de
        Google et surveillez leur état dans Search Console.
      </p>

      <h2>Google Business Profile : décisif pour le local</h2>
      <p>
        Pour une TPE ou une PME avec une clientèle locale, Google Business Profile (GBP) est
        peut-être le levier le plus puissant pour apparaître dans Gemini. Lorsqu&apos;un
        utilisateur pose une question locale à Gemini, l&apos;IA s&apos;appuie directement sur
        les données GBP pour citer des établissements.
      </p>
      <ul>
        <li>
          <strong>Fiche complète à 100 % :</strong> catégorie principale précise, description
          rédigée avec vos mots-clés métier, horaires à jour (y compris les jours fériés),
          photos récentes.
        </li>
        <li>
          <strong>Avis clients :</strong> la note moyenne et le volume d&apos;avis influencent
          directement votre position dans les réponses Gemini locales. Encouragez vos clients
          satisfaits à laisser un avis et répondez systématiquement, qu&apos;il soit positif
          ou négatif.
        </li>
        <li>
          <strong>Posts GBP réguliers :</strong> les actualités et offres publiées sur votre
          fiche sont indexées par Google et peuvent être reprises par Gemini pour signaler
          votre activité récente.
        </li>
        <li>
          <strong>Cohérence NAP :</strong> votre Nom, Adresse et numéro de téléPhone doivent
          être strictement identiques sur votre site, votre fiche GBP et tous les annuaires
          où vous êtes référencé.
        </li>
      </ul>

      <h2>Du contenu qui répond aux questions</h2>
      <p>
        Gemini est un moteur de réponses, pas un moteur de liens. Il cherche des contenus qui
        répondent directement à une question, avec une réponse claire dès les premières lignes.
        Voici les formats qui fonctionnent le mieux.
      </p>
      <ul>
        <li>
          <strong>La réponse en tête :</strong> placez la réponse principale dans le premier
          paragraphe, avant les explications. Gemini extrait souvent ce premier bloc pour
          construire sa réponse synthétique.
        </li>
        <li>
          <strong>Les FAQ intégrées :</strong> ajoutez une section « Questions fréquentes »
          en bas de chaque page clé. Formulez les questions exactement comme vos clients les
          posent (y compris en langage familier ou vocal).
        </li>
        <li>
          <strong>Les chiffres et faits vérifiables :</strong> « nos délais de livraison sont
          de 48 h » ou « notre tarif démarre à 350 € HT » sont des informations que Gemini
          peut citer précisément. Le vague ne se cite pas.
        </li>
        <li>
          <strong>La mise à jour régulière :</strong> mentionnez la date de dernière révision
          de vos articles. Gemini favorise les contenus dont la fraîcheur est documentée.
        </li>
      </ul>
      <p>
        Pour aller plus loin sur la création de contenu optimisé pour les IA, consultez notre
        guide{' '}
        <Link href="/blog/fichiers-qui-parlent-aux-ia">
          les formats de fichiers que les IA préfèrent
        </Link>
        .
      </p>

      <h2>Gemini vs ChatGPT vs Perplexity</h2>
      <p>
        Ces trois outils sont complémentaires dans le parcours de vos prospects, mais ils
        fonctionnent différemment. Comprendre ces différences vous aide à prioriser vos efforts.
      </p>
      <ul>
        <li>
          <strong>Gemini</strong> est le plus dépendant de votre présence Google. Si vous êtes
          bien référencé sur Google Search, vous avez une base solide pour Gemini. Le GBP et
          les données structurées sont des leviers spécifiques à activer en priorité.
        </li>
        <li>
          <strong>ChatGPT</strong> (avec la navigation web activée) consulte des sources plus
          variées et accorde un poids important aux mentions dans la presse, les forums et les
          sites communautaires. La stratégie off-site est plus déterminante.
        </li>
        <li>
          <strong>Perplexity</strong> fonctionne comme un moteur de recherche en temps réel
          qui synthétise plusieurs sources. La fraîcheur du contenu et la richesse des pages
          de référence (Wikipédia, presse spécialisée) y jouent un rôle clé.
        </li>
      </ul>
      <p>
        La bonne nouvelle : il existe un socle commun efficace pour les trois. Un site
        techniquement solide, un contenu qui répond aux questions et une présence cohérente
        sur le web améliorent votre visibilité dans tous ces outils simultanément. Gemini
        requiert simplement que vous soigniez en plus vos signaux Google spécifiques.
      </p>
      <p>
        Pour comparer votre approche entre les différentes IA, lisez aussi notre article sur
        les{' '}
        <Link href="/blog/apparaitre-google-ai-overviews">
          Google AI Overviews et comment y apparaître
        </Link>
        .
      </p>

      <h2>Plan d&apos;action</h2>
      <ul>
        <li>
          <strong>Semaine 1 — Audit :</strong> posez à Gemini les 5 à 10 questions que vos
          prospects posent habituellement. Notez qui est cité et qui ne l&apos;est pas. Vérifiez
          l&apos;état de votre fiche Google Business Profile et lancez un audit technique via
          Google Search Console.
        </li>
        <li>
          <strong>Semaine 2 — Technique :</strong> implémentez les balises schema.org
          (Organization, LocalBusiness, FAQPage) sur votre site. Corrigez les erreurs
          remontées par Search Console. Vérifiez la cohérence NAP sur tous vos annuaires.
        </li>
        <li>
          <strong>Semaine 3 — Google Business Profile :</strong> complétez votre fiche à 100 %,
          mettez à jour les horaires et les photos, publiez votre premier post GBP. Mettez en
          place un processus de sollicitation d&apos;avis auprès de vos clients.
        </li>
        <li>
          <strong>Semaine 4 — Contenu :</strong> rédigez ou restructurez vos pages clés avec
          la réponse en tête. Ajoutez une section FAQ balisée sur chaque page importante.
          Mentionnez la date de mise à jour.
        </li>
        <li>
          <strong>En continu — Mesure :</strong> répétez l&apos;audit Gemini chaque mois pour
          suivre l&apos;évolution de vos citations. Un outil comme GeoMind automatise ce suivi
          et vous alerte dès que votre visibilité progresse ou régresse.
        </li>
      </ul>
    </ArticleLayout>
  )
}
