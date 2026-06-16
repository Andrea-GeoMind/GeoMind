import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('apparaitre-google-ai-overviews')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <p>
        Depuis quelques mois, Google a changé la façon dont il présente ses résultats. Avant même
        la première liste de liens, un encadré rédigé par une intelligence artificielle répond
        directement à votre question. C&apos;est ce que Google appelle les <strong>AI Overviews</strong>{' '}
        — ou « Aperçus IA » en français. Pour une entreprise, y figurer représente une visibilité
        inégalée ; en être absent, c&apos;est être repoussé encore plus bas qu&apos;avant, sous un
        bloc que l&apos;internaute a déjà lu. Cet article vous explique comment maximiser vos
        chances d&apos;y apparaître.
      </p>

      <h2>Qu&apos;est-ce qu&apos;un AI Overview</h2>
      <p>
        Un AI Overview est une réponse synthétique générée par Google, affichée en haut de la page
        de résultats, au-dessus des liens naturels classiques. Google compose cette réponse à
        partir de plusieurs pages web qu&apos;il juge fiables et pertinentes, en les citant
        explicitement. L&apos;internaute obtient ainsi une réponse immédiate, sans avoir à cliquer
        sur plusieurs sites.
      </p>
      <p>
        Pour une TPE ou une PME, c&apos;est un double enjeu. D&apos;un côté, si votre site est
        cité, votre nom apparaît en première position absolue, avant tout concurrent. De
        l&apos;autre, si vous êtes absent, vos liens habituels descendent encore plus bas dans la
        page — sous un bloc que la majorité des internautes ne dépassera pas.
      </p>
      <p>
        Les AI Overviews ne s&apos;affichent pas sur toutes les requêtes. Ils sont particulièrement
        fréquents sur les questions pratiques (« comment faire… », « quel est le prix… »,
        « quelle différence entre… ») et les sujets informationnels. Les requêtes transactionnelles
        pures (« acheter un canapé rouge ») les déclenchent moins souvent.
      </p>

      <h2>D&apos;où Google tire ses sources</h2>
      <p>
        Google ne construit pas ses AI Overviews à partir de rien. Il s&apos;appuie sur le même
        corpus qu&apos;il indexe depuis des années : les pages web qu&apos;il a crawlées,
        analysées et jugées pertinentes pour les résultats classiques. Autrement dit,{' '}
        <strong>le SEO reste le socle indispensable.</strong> Une page absente de l&apos;index de
        Google ne pourra jamais alimenter un AI Overview.
      </p>
      <p>
        Cela signifie que les efforts que vous avez déjà consentis pour votre référencement
        naturel — un site rapide, sécurisé, correctement structuré, avec du contenu original —
        sont loin d&apos;être perdus. Ils constituent le prérequis de toute stratégie AI Overviews.
        Ce qui change, c&apos;est la couche supplémentaire que Google applique ensuite pour
        sélectionner quelles pages il va citer dans sa réponse rédigée.
      </p>

      <h2>Ce qui augmente vos chances d&apos;être cité</h2>

      <h3>Répondre directement à la question en tête de page</h3>
      <p>
        Google cherche des passages précis à extraire, pas des introductions vagues. Si votre page
        répond à la question « Combien coûte un ravalement de façade ? », la réponse doit
        apparaître dans les premières lignes — un chiffre, une fourchette, une explication courte
        — et non après trois paragraphes d&apos;introduction sur l&apos;histoire de votre
        entreprise. Cette structure, parfois appelée « réponse directe en tête », est le signal
        le plus fort pour Google.
      </p>

      <h3>Un contenu structuré avec titres, listes et tableaux</h3>
      <p>
        Les AI Overviews sont composés à partir de blocs facilement extractibles. Un titre H2 ou
        H3 clair, une liste à puces, un tableau comparatif : ce sont des formats que Google peut
        reprendre presque mot pour mot. À l&apos;inverse, de longs paragraphes continus, sans
        sous-titres ni mise en forme, rendent l&apos;extraction difficile et diminuent votre
        présence dans les réponses IA.
      </p>

      <h3>Des données chiffrées et à jour</h3>
      <p>
        Les IA — et Google en particulier — accordent une forte préférence aux contenus qui
        apportent des informations précises et récentes. Une page qui mentionne une étude de 2024,
        des tarifs mis à jour cette année, ou des statistiques sourcées sera jugée plus fiable
        qu&apos;une page générique sans chiffres ni dates. Vérifiez régulièrement que vos contenus
        stratégiques affichent une date de mise à jour visible et reflètent l&apos;état actuel de
        votre offre.
      </p>

      <h3>Les données structurées schema.org</h3>
      <p>
        Les balises schema.org sont des informations ajoutées dans le code de votre site pour
        indiquer à Google de quoi parle une page. Un schéma <strong>FAQPage</strong> signale une
        liste de questions-réponses, <strong>LocalBusiness</strong> décrit votre établissement,{' '}
        <strong>Article</strong> identifie un contenu éditorial. Ces signaux ne garantissent pas
        d&apos;apparaître dans un AI Overview, mais ils facilitent le travail de Google pour
        comprendre et extraire votre contenu.
      </p>

      <h3>L&apos;E-E-A-T : expérience, expertise, autorité, fiabilité</h3>
      <p>
        Google évalue la crédibilité de vos pages selon quatre critères regroupés sous
        l&apos;acronyme E-E-A-T. L&apos;<strong>Expérience</strong> : l&apos;auteur a-t-il
        personnellement vécu ce dont il parle ? L&apos;<strong>Expertise</strong> : maîtrise-t-il
        son domaine ? L&apos;<strong>Autorité</strong> : d&apos;autres sites reconnus
        font-ils référence à votre contenu ? La <strong>Fiabilité</strong> : votre site est-il
        transparent sur son identité et ses sources ? Pour une PME, cela se traduit concrètement
        par la signature des articles (nom de l&apos;auteur et son titre), des mentions légales
        complètes, et des liens vers des sources externes sérieuses.
      </p>

      <h2>Le paradoxe du « zéro clic » et comment en tirer parti</h2>
      <p>
        L&apos;objection la plus fréquente est celle-ci : « Si Google répond directement, personne
        ne va cliquer sur mon site. » C&apos;est partiellement vrai, et il ne faut pas le nier.
        Les requêtes purement informationnelles génèrent moins de trafic depuis l&apos;apparition
        des AI Overviews.
      </p>
      <p>
        Mais être cité dans un AI Overview offre quelque chose que les clics ne donnent pas :
        de la <strong>notoriété de marque</strong>. Votre nom apparaît en association directe avec
        la bonne réponse, avant tous vos concurrents. L&apos;internaute se souvient de qui a
        répondu, même sans cliquer. Et lorsqu&apos;il cherche ensuite à acheter ou à prendre
        contact, il tape votre nom directement. Les entreprises qui font le suivi de leurs
        recherches de marque observent souvent une hausse de ce trafic « direct » après avoir
        commencé à figurer dans les réponses IA.
      </p>
      <p>
        La bonne stratégie consiste donc à distinguer les contenus : certaines pages ont vocation
        à être citées (articles pratiques, FAQ, comparatifs) et génèreront de la notoriété ; d
        &apos;autres ont vocation à convertir (pages de services, tarifs, contact) et doivent
        rester optimisées pour le clic classique.
      </p>

      <h2>AI Overviews et ChatGPT / Perplexity : des logiques complémentaires</h2>
      <p>
        Google n&apos;est pas le seul moteur à afficher des réponses générées par IA. ChatGPT,
        Perplexity et Gemini font exactement la même chose, avec des sources légèrement différentes.
        La bonne nouvelle est que les efforts pour apparaître dans les AI Overviews de Google
        s&apos;appliquent largement aux autres : contenu structuré, données à jour, E-E-A-T, données
        structurées. Le socle est commun.
      </p>
      <p>
        La différence principale tient à la fraîcheur des données : Google crawle le web en
        quasi-temps réel, tandis que les grands modèles de langage comme ChatGPT ont une date de
        coupure de connaissance. Pour Perplexity, qui effectue des recherches en temps réel,
        la logique est très proche de celle de Google. Pour aller plus loin sur ce sujet,
        consultez notre article{' '}
        <Link href="/blog/geo-vs-seo">GEO et SEO : quelles différences ?</Link> et notre
        introduction au{' '}
        <Link href="/blog/quest-ce-que-le-geo">GEO (Generative Engine Optimization)</Link>.
      </p>

      <h2>Plan d&apos;action</h2>
      <ul>
        <li>
          <strong>Identifiez vos 10 questions prioritaires.</strong> Listez les questions que vos
          clients posent le plus souvent, en langage naturel. Ce sont vos cibles pour les AI
          Overviews.
        </li>
        <li>
          <strong>Vérifiez votre présence actuelle.</strong> Tapez ces questions sur Google et
          observez : y a-t-il un AI Overview ? Votre site y figure-t-il ? Qui y figure à votre
          place ?
        </li>
        <li>
          <strong>Restructurez une page par semaine.</strong> Choisissez la page la plus proche
          d&apos;une question prioritaire. Ajoutez la réponse directe en premier paragraphe,
          découpez en sous-titres clairs, ajoutez une FAQ en bas.
        </li>
        <li>
          <strong>Mettez à jour vos dates et chiffres.</strong> Parcourez vos pages stratégiques
          et actualisez tarifs, statistiques et exemples. Ajoutez une date de mise à jour visible.
        </li>
        <li>
          <strong>Ajoutez les balises schema.org essentielles.</strong> Au minimum : FAQPage sur
          vos pages questions-réponses, LocalBusiness si vous avez un établissement physique.
        </li>
        <li>
          <strong>Renforcez votre E-E-A-T.</strong> Signez vos articles, complétez vos mentions
          légales, obtenez des liens depuis des sites reconnus de votre secteur (presse locale,
          annuaires professionnels, partenaires).
        </li>
        <li>
          <strong>Mesurez tous les mois.</strong> Relancez les mêmes questions sur Google et notez
          vos apparitions. La tendance sur 60 à 90 jours est plus fiable qu&apos;un résultat isolé.
        </li>
      </ul>
    </ArticleLayout>
  )
}
