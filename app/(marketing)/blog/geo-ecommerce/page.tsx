import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('geo-ecommerce')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <p>
        Chaque semaine, des millions de consommateurs tapent dans ChatGPT ou Perplexity des
        questions comme « quel robot pâtissier choisir pour moins de 300 euros », « meilleure
        tente de camping familiale étanche » ou « où acheter des chaussures de randonnée larges
        en France ». L&apos;IA répond directement : elle nomme des produits, cite des boutiques,
        explique pourquoi. Pour les e-commerçants, ce nouveau canal est à la fois une menace et
        une opportunité. Une menace si vos concurrents y sont cités et pas vous. Une opportunité
        si vous comprenez ce qui rend une fiche produit ou une boutique recommandable par une
        IA — et si vous agissez avant que le marché ne se structure. Ce guide vous donne les
        clés concrètes du GEO (Generative Engine Optimization) appliqué au e-commerce.
      </p>

      <h2>Comment les IA recommandent des produits</h2>
      <p>
        Les moteurs de réponse IA ne fonctionnent pas comme Google Shopping. Ils ne lisent pas
        votre flux de produits en temps réel. Ils ont été entraînés sur d&apos;énormes volumes
        de texte web, et leur connaissance de votre boutique dépend de ce que le web a écrit
        sur vous. Concrètement, une IA recroupe plusieurs types de sources pour formuler une
        recommandation produit :
      </p>
      <ul>
        <li>
          <strong>Les fiches produits elles-mêmes</strong>, si elles sont indexées et rédigées
          avec suffisamment de substance factuelle pour être extractibles.
        </li>
        <li>
          <strong>Les avis consommateurs</strong> publiés sur votre site, sur les marketplaces
          (Amazon, Cdiscount, Fnac) ou sur des plateformes tierces (Trustpilot, Google Reviews).
        </li>
        <li>
          <strong>Les comparatifs et guides d&apos;achat</strong> rédigés par des médias
          spécialisés, des blogueurs ou des comparateurs (Idealo, Ledenicheur, etc.).
        </li>
        <li>
          <strong>Les discussions communautaires</strong> — forums, Reddit, groupes Facebook —
          où de vraies personnes mentionnent vos produits en contexte.
        </li>
        <li>
          <strong>Les données structurées</strong> (schema.org) que vous publiez dans le code
          de vos pages, qui permettent à l&apos;IA de comprendre précisément ce qu&apos;est
          le produit, son prix et sa note.
        </li>
      </ul>
      <p>
        L&apos;IA croise ces signaux pour évaluer si un produit ou une boutique mérite une
        recommandation. Plus votre présence est cohérente et substantielle sur ces différents
        canaux, plus vous avez de chances d&apos;être cité.
      </p>

      <h2>Vos fiches produits : ce qui les rend citables</h2>
      <p>
        La fiche produit est votre unité de base en GEO. Une fiche bien construite peut être
        citée directement dans une réponse IA. Une fiche pauvre ne sera jamais mentionnée,
        quelle que soit la qualité de votre boutique par ailleurs.
      </p>
      <h3>Des titres précis et factuels</h3>
      <p>
        Évitez les titres génériques comme « Chaussure de sport homme ». Préférez « Chaussure
        de trail imperméable homme — semelle Vibram, drop 6 mm, coloris noir ». L&apos;IA
        cherche à répondre à des questions précises : elle cite les produits dont le titre
        répond directement à la requête de l&apos;utilisateur. Un titre qui intègre le cas
        d&apos;usage, les caractéristiques clés et éventuellement le segment de prix est
        infiniment plus citable qu&apos;un titre générique.
      </p>
      <h3>Des descriptions riches et factuelles</h3>
      <p>
        Les descriptions marketing creuses — « découvrez notre gamme premium au service de
        votre confort » — ne sont jamais citées. Les IA extraient des faits : matière,
        dimensions, poids, autonomie, compatibilité, certifications. Rédigez vos descriptions
        comme un journaliste spécialisé : une phrase d&apos;introduction qui résume le
        positionnement, puis des informations vérifiables. Intégrez le cas d&apos;usage
        principal (« idéal pour les randonnées de plusieurs jours en terrain humide »), les
        avantages concurrentiels réels, et les limites si elles existent — les IA apprécient
        l&apos;honnêteté, qui renforce la crédibilité.
      </p>
      <h3>Des spécifications complètes</h3>
      <p>
        Un tableau de spécifications — poids, dimensions, matériaux, capacité, norme de
        résistance, pays de fabrication — est l&apos;une des structures les plus faciles à
        extraire pour une IA. Ne cachez pas vos specs derrière un onglet masqué par défaut :
        assurez-vous qu&apos;elles sont dans le HTML visible et indexable.
      </p>
      <h3>Le prix visible dans le code</h3>
      <p>
        Une IA qui répond à « quel est le meilleur robot multifonction pour 200 euros » a
        besoin de connaître vos prix. Si votre prix n&apos;est affiché que via du JavaScript
        côté client, sans être présent dans le HTML initial, il est invisible pour les robots.
        Publiez votre prix dans les données structurées (voir ci-dessous) et dans le HTML
        serveur.
      </p>
      <h3>Les avis clients sur la fiche</h3>
      <p>
        La présence d&apos;avis clients directement sur la fiche produit — note moyenne, nombre
        d&apos;avis, extraits de verbatims — est un signal de confiance fort pour les IA. Un
        produit noté 4,6/5 sur 238 avis sera préféré à un produit sans avis, toutes choses
        égales par ailleurs.
      </p>
      <h3>Les données structurées Product, Offer et AggregateRating</h3>
      <p>
        Le balisage schema.org est le moyen le plus direct de communiquer des informations
        structurées aux IA et aux moteurs de recherche. Pour chaque fiche produit, implémentez
        au minimum les types <strong>Product</strong> (nom, description, image, marque),{' '}
        <strong>Offer</strong> (prix, devise, disponibilité, URL) et{' '}
        <strong>AggregateRating</strong> (note moyenne, nombre d&apos;avis). Ces trois types
        combinés donnent à une IA toutes les données factuelles dont elle a besoin pour
        recommander votre produit avec précision.
      </p>

      <h2>Le contenu éditorial qui déclenche les citations</h2>
      <p>
        Au-delà des fiches produits, c&apos;est votre contenu éditorial qui positionne votre
        boutique comme une référence aux yeux des IA. Les sites e-commerce qui sont le plus
        souvent cités publient du contenu qui aide les acheteurs à décider, pas seulement à
        acheter.
      </p>
      <p>
        Trois formats fonctionnent particulièrement bien en GEO e-commerce :
      </p>
      <ul>
        <li>
          <strong>Les guides d&apos;achat</strong> : « Comment choisir son vélo électrique en
          2025 », « Guide d&apos;achat : les meilleures poussettes pour jumeaux ». Ces articles
          répondent exactement aux requêtes que les acheteurs posent aux IA avant de passer à
          l&apos;acte. Structurez-les avec des critères clairs (budget, usage, profil
          d&apos;utilisateur) et des recommandations produits liées à vos fiches.
        </li>
        <li>
          <strong>Les comparatifs</strong> : « Comparatif : robot pâtissier 200-400 euros —
          notre sélection 2025 ». Un comparatif factuel, avec un tableau de synthèse et une
          conclusion par profil d&apos;acheteur, est l&apos;un des formats les plus
          fréquemment repris par les IA.
        </li>
        <li>
          <strong>Les FAQ produit enrichies</strong> : une page FAQ dédiée à une catégorie —
          « Questions fréquentes sur les matelas mémoire de forme » — répond directement
          aux questions longue traîne que les acheteurs posent aux IA. Chaque question doit
          avoir une réponse complète et autonome, pas un renvoi vers une autre page.
        </li>
      </ul>
      <p>
        Consultez également notre article{' '}
        <Link href="/blog/comment-etre-cite-par-chatgpt">
          comment être cité par ChatGPT
        </Link>{' '}
        pour les principes généraux de rédaction qui maximisent vos chances de citation.
      </p>

      <h2>La preuve sociale et les avis</h2>
      <p>
        Les IA accordent un poids considérable aux signaux de confiance extérieurs à votre
        propre site. Le raisonnement est simple : votre site parle de vous, mais les avis
        tiers parlent de vous de façon indépendante. Pour une IA, c&apos;est beaucoup plus
        fiable.
      </p>
      <p>
        Deux dimensions sont particulièrement importantes :
      </p>
      <ul>
        <li>
          <strong>Le volume et la fraîcheur des avis</strong> : une boutique avec 50 avis
          récents (moins de 6 mois) est perçue comme plus active et fiable qu&apos;une
          boutique avec 500 avis datant de 3 ans. Mettez en place un processus actif de
          sollicitation d&apos;avis après chaque achat. Les avis Google, Trustpilot et les
          avis vérifiés de votre plateforme e-commerce contribuent tous au signal global.
        </li>
        <li>
          <strong>La présence sur les marketplaces et les comparateurs</strong> : même si vous
          vendez principalement sur votre site, une présence sur Amazon, Fnac Marketplace ou
          Cdiscount multiplie les mentions de vos produits sur le web. Les comparateurs de
          prix (Idealo, Kelkoo, Google Shopping) ont le même effet. Chaque mention de votre
          produit avec son nom exact sur un site tiers renforce le signal GEO.
        </li>
      </ul>

      <h2>Les erreurs fréquentes en e-commerce</h2>
      <p>
        Les boutiques en ligne commettent souvent les mêmes erreurs qui les rendent invisibles
        aux IA, même quand leur offre produit est excellente.
      </p>
      <ul>
        <li>
          <strong>Les descriptions copiées du fournisseur</strong> : si votre description est
          identique à celle de cent autres revendeurs, aucune IA ne vous citera
          spécifiquement. Les IA détectent le contenu dupliqué et lui accordent peu de valeur.
          Réécrivez systématiquement les descriptions fabricants en y ajoutant votre propre
          expérience, des comparaisons et des cas d&apos;usage concrets.
        </li>
        <li>
          <strong>Le contenu mince</strong> : une fiche avec un titre, trois lignes de
          description et une photo n&apos;est pas citable. Les IA ont besoin de substance.
          Visez minimum 200 mots de description qualitative par fiche produit importante.
        </li>
        <li>
          <strong>L&apos;absence de données structurées</strong> : ne pas implémenter
          schema.org sur les fiches produit est l&apos;erreur technique la plus coûteuse en
          GEO e-commerce. C&apos;est souvent une configuration à faire une fois dans votre
          plateforme (Shopify, WooCommerce, PrestaShop) — vérifiez que votre thème ou votre
          extension la gère correctement, et testez avec le validateur schema.org.
        </li>
        <li>
          <strong>Les pages produit non indexables</strong> : si vos fiches sont générées
          entièrement en JavaScript côté client, ou si votre robots.txt bloque des sections
          importantes de votre catalogue, les IA ne peuvent pas les lire. Vérifiez que chaque
          URL produit est accessible en HTML serveur. Consultez notre article sur les{' '}
          <Link href="/blog/fichiers-qui-parlent-aux-ia">
            fichiers qui parlent aux IA
          </Link>{' '}
          pour les détails techniques.
        </li>
        <li>
          <strong>L&apos;absence de contenu éditorial</strong> : une boutique qui ne publie
          que des fiches produits sans aucun contenu de conseil sera toujours moins citée
          qu&apos;une boutique qui publie régulièrement des guides d&apos;achat. Les IA
          font confiance aux sources qui éduquent, pas seulement à celles qui vendent.
        </li>
      </ul>

      <h2>Plan d&apos;action e-commerce</h2>
      <p>
        Voici une liste d&apos;actions concrètes à mener, dans l&apos;ordre de priorité pour
        obtenir des résultats rapides :
      </p>
      <ul>
        <li>
          <strong>Auditez votre visibilité actuelle</strong> : posez à ChatGPT, Perplexity et
          Gemini les 5 questions que vos clients posent le plus souvent. Notez qui est cité.
          C&apos;est votre point de départ.
        </li>
        <li>
          <strong>Activez les données structurées Product + Offer + AggregateRating</strong>{' '}
          sur toutes vos fiches produits prioritaires. Vérifiez avec le Rich Results Test
          de Google.
        </li>
        <li>
          <strong>Identifiez vos 20 fiches produits les plus vendues</strong> et
          récrivez leurs descriptions : facts first, cas d&apos;usage précis, zéro jargon
          marketing vide.
        </li>
        <li>
          <strong>Publiez un guide d&apos;achat</strong> sur votre catégorie principale.
          Minimum 1 000 mots, structuré avec des critères de choix clairs et des
          recommandations par profil.
        </li>
        <li>
          <strong>Mettez en place une sollicitation d&apos;avis automatique</strong> après
          chaque commande livrée. Visez 10 nouveaux avis minimum par mois sur votre
          plateforme principale.
        </li>
        <li>
          <strong>Vérifiez l&apos;indexabilité de votre catalogue</strong> : chaque URL produit
          doit retourner un HTML complet côté serveur, avec le prix et le titre visibles
          sans JavaScript.
        </li>
        <li>
          <strong>Planifiez 1 article de fond par mois</strong> : un comparatif, une FAQ
          catégorie ou un guide d&apos;achat. Régularité et profondeur valent mieux que volume.
        </li>
        <li>
          <strong>Mesurez l&apos;évolution</strong> chaque mois en reposant les mêmes questions
          aux IA. Un outil comme GeoMind automatise ce suivi et vous alerte dès qu&apos;une
          nouvelle citation apparaît ou disparaît.
        </li>
      </ul>
      <p>
        Le GEO e-commerce n&apos;est pas une discipline à part : c&apos;est la rencontre entre
        la qualité éditoriale, la rigueur technique et la preuve sociale. Les boutiques qui
        investissent dans ces trois dimensions aujourd&apos;hui seront les premières à être
        recommandées demain, quand la majorité de vos clients commenceront leur parcours
        d&apos;achat en posant une question à une IA.
      </p>
    </ArticleLayout>
  )
}
