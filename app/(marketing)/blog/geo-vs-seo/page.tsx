import type { Metadata } from 'next'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('geo-vs-seo')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <p>
        <strong>Réponse courte :</strong> le SEO vous rend visible dans les résultats de Google ;
        le GEO (Generative Engine Optimization) vous rend citable dans les réponses de ChatGPT,
        Perplexity, Gemini et Claude. Ce ne sont pas des concurrents : un bon GEO s&apos;appuie
        sur les fondations du SEO, et vos clients utilisent déjà les deux. Il ne faut rien
        abandonner — il faut ajouter une couche.
      </p>

      <h2>Ce qui ne change pas</h2>
      <p>
        Les fondamentaux du SEO restent la base du GEO. Un site rapide, en HTTPS, bien structuré
        (titres clairs, sitemap, pages accessibles), avec du contenu original qui répond à de
        vraies questions : tout cela sert les deux. Si votre site est invisible pour Google, il
        l&apos;est aussi pour les IA — leurs robots lisent le web de façon très similaire.
      </p>

      <h2>Ce qui change vraiment</h2>
      <h3>1. Le résultat n&apos;est plus une liste de liens, c&apos;est une réponse</h3>
      <p>
        Sur Google, être 4<sup>e</sup> rapporte encore des clics. Dans ChatGPT, l&apos;IA donne
        une réponse rédigée qui cite 3 à 10 noms — et tous les autres n&apos;existent pas. Le
        GEO est un jeu plus binaire : cité ou invisible.
      </p>
      <h3>2. Les IA privilégient le « citable »</h3>
      <p>
        Une IA reprend volontiers ce qui est facile à extraire : une FAQ balisée, un tableau
        comparatif, une fourchette de prix, une définition claire. Le contenu vague (« nous
        offrons des solutions sur mesure ») n&apos;est jamais cité, car il n&apos;y a rien à en
        citer.
      </p>
      <h3>3. Les sources de confiance pèsent différemment</h3>
      <p>
        Pour vous classer, Google compte les liens. Pour vous citer, une IA recoupe : votre
        site, mais aussi les annuaires, la presse, les forums, les avis. Votre présence{' '}
        <em>en dehors</em> de votre site compte au moins autant que votre site.
      </p>
      <h3>4. La mesure est différente</h3>
      <p>
        En SEO, votre position se vérifie : vous êtes 3<sup>e</sup>, point. Les IA, elles, ne
        répondent jamais deux fois exactement pareil. La bonne métrique GEO n&apos;est pas « mon
        score aujourd&apos;hui » mais « ma tendance sur 30 jours » — méfiez-vous des outils qui
        vous promettent un chiffre exact.
      </p>

      <h2>Par quoi commencer, concrètement</h2>
      <ul>
        <li>
          <strong>Semaine 1 :</strong> mesurez. Posez aux IA les 5 questions que vos clients
          posent. Êtes-vous cité ? Qui l&apos;est à votre place ?
        </li>
        <li>
          <strong>Semaine 2-3 :</strong> corrigez la technique : robots.txt accueillant pour les
          robots IA, sitemap, données structurées (LocalBusiness, FAQ).
        </li>
        <li>
          <strong>Semaine 4 et suivantes :</strong> publiez du contenu qui répond — une vraie
          question de client par page, réponse en premier, FAQ en bas.
        </li>
        <li>
          <strong>En continu :</strong> surveillez la tendance et célébrez la première citation
          — elle arrive plus vite qu&apos;on ne le croit sur les requêtes locales et de niche.
        </li>
      </ul>

      <h2>Faut-il un outil ?</h2>
      <p>
        Vous pouvez tout faire à la main : poser les questions aux 4 IA chaque mois, noter les
        réponses dans un tableur, auditer votre site règle par règle. Comptez quelques heures
        mensuelles. Un outil comme GeoMind automatise exactement cela — la mesure, la tendance,
        le plan d&apos;action et la vérification — pour le prix d&apos;un déjeuner. À vous de
        voir où votre temps vaut le plus.
      </p>
    </ArticleLayout>
  )
}
