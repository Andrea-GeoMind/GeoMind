import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('quest-ce-que-le-geo')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <p>
        <strong>
          Le GEO (Generative Engine Optimization) est l&apos;ensemble des pratiques qui permettent
          à votre site d&apos;être cité dans les réponses générées par les intelligences
          artificielles — ChatGPT, Perplexity, Gemini, Claude — lorsqu&apos;un internaute pose une
          question dans ces outils.
        </strong>{' '}
        Concrètement : quand un client potentiel demande « quel est le meilleur plombier à Lyon »
        ou « quelle agence comptable choisir à Bordeaux », une IA lui répond directement. Le GEO
        détermine si votre nom apparaît dans cette réponse, ou si c&apos;est celui d&apos;un
        concurrent.
      </p>

      <h2>Pourquoi le GEO apparaît maintenant</h2>
      <p>
        Pendant vingt ans, la question était simple : « Comment être bien placé sur Google ? »
        Aujourd&apos;hui, une part croissante des internautes — et notamment des dirigeants et
        acheteurs professionnels — ne tapent plus de mots-clés dans un moteur de recherche. Ils
        posent une question à ChatGPT ou à Perplexity, et ils obtiennent une réponse rédigée, avec
        des sources.
      </p>
      <p>
        En France, ChatGPT dépasse désormais les 10 millions d&apos;utilisateurs actifs mensuels.
        Perplexity, qui se positionne explicitement comme un « moteur de réponses », connaît une
        croissance à trois chiffres chaque année. Google lui-même a intégré l&apos;IA dans ses
        résultats avec les « AI Overviews ». Ce basculement n&apos;est pas une mode : c&apos;est un
        changement structurel dans la façon dont les gens cherchent de l&apos;information.
      </p>
      <p>
        Pour une TPE ou une PME, cela signifie une chose simple : si vous n&apos;êtes pas cité par
        les IA, vous n&apos;existez pas pour une partie de vos clients potentiels — même si votre
        site est bien référencé sur Google.
      </p>

      <h2>GEO vs SEO : la différence en une phrase</h2>
      <p>
        Le SEO vous place dans une liste de liens ; le GEO vous fait nommer dans une réponse. Ce
        ne sont pas des disciplines opposées — le GEO s&apos;appuie sur les fondations du SEO —
        mais elles mesurent des choses différentes et nécessitent des actions complémentaires.
        Pour comprendre en détail les points communs et les divergences,{' '}
        <Link href="/blog/geo-vs-seo">lisez notre comparatif complet GEO vs SEO</Link>.
      </p>

      <h2>Les 3 piliers du GEO</h2>
      <p>
        Le GEO repose sur trois dimensions que l&apos;on peut mesurer et améliorer
        indépendamment. Les négliger l&apos;une après l&apos;autre est la meilleure façon de ne
        jamais apparaître dans les réponses des IA.
      </p>

      <h3>Autorité</h3>
      <p>
        Les IA citent en priorité les sources qu&apos;elles jugent fiables. Cette confiance se
        construit en dehors de votre site : mentions dans la presse locale ou sectorielle, fiches
        sur les annuaires de référence (Pages Jaunes, Google Business Profile, annuaires
        professionnels), avis clients nombreux et récents, présence sur Wikipédia si votre
        structure s&apos;y prête. Plus votre nom est mentionné dans des sources que les IA
        considèrent comme sérieuses, plus elles vous citeront à leur tour.
      </p>
      <p>
        L&apos;autorité GEO est donc largement une question de présence <em>en dehors</em> de
        votre propre site. C&apos;est une différence majeure avec le SEO classique, où votre site
        est le centre de gravité.
      </p>

      <h3>Technique</h3>
      <p>
        Pour vous citer, une IA doit d&apos;abord pouvoir lire et comprendre votre site. Cela
        passe par des prérequis techniques : votre fichier robots.txt ne doit pas bloquer les
        robots des IA (certains ont leur propre agent d&apos;exploration), votre sitemap doit être
        à jour, vos pages doivent se charger rapidement, et vos données structurées (balises
        schema.org) doivent décrire clairement votre activité, votre localisation, vos horaires et
        vos services.
      </p>
      <p>
        Une page lente, sans structure sémantique, avec un contenu dupliqué ou des erreurs
        techniques, sera tout simplement ignorée — non pas parce que l&apos;IA la pénalise
        activement, mais parce qu&apos;elle préférera toujours une source plus facile à exploiter.
      </p>

      <h3>Contenu</h3>
      <p>
        C&apos;est le pilier le plus actionnable à court terme. Les IA cherchent du contenu
        « citable » : des définitions claires placées en début de page, des réponses directes à
        des questions précises, des listes structurées, des fourchettes de prix, des FAQ balisées.
        Le contenu vague — « nous proposons des solutions adaptées à vos besoins » — n&apos;est
        jamais repris, parce qu&apos;il ne dit rien de précis que l&apos;IA pourrait extraire et
        restituer.
      </p>
      <p>
        Concrètement : chaque page de votre site devrait répondre à une question précise que vos
        clients posent réellement. La réponse doit apparaître dès les premières lignes, sans
        détour.
      </p>

      <h2>Comment une IA décide qui citer</h2>
      <p>
        Les modèles d&apos;IA ne fonctionnent pas exactement comme un moteur de recherche. Ils ont
        été entraînés sur de vastes corpus de textes, et ils ont une « mémoire » implicite des
        sources qu&apos;ils ont ingérées. Mais pour les réponses factuelles sur des sujets récents
        ou locaux, ils s&apos;appuient aussi sur une recherche web en temps réel (c&apos;est le
        cas de Perplexity, de ChatGPT avec la navigation activée, et de Gemini).
      </p>
      <p>
        Dans tous les cas, le processus de sélection repose sur plusieurs critères combinés :
      </p>
      <ul>
        <li>
          <strong>La cohérence de l&apos;information</strong> : si votre nom, adresse et numéro de
          téléphone sont identiques sur votre site, Google Business Profile, les annuaires et la
          presse, l&apos;IA vous fait davantage confiance.
        </li>
        <li>
          <strong>La spécificité géographique</strong> : les IA sont souvent très bonnes pour les
          requêtes locales. Une boulangerie de Strasbourg bien référencée localement a de bonnes
          chances d&apos;être citée pour « meilleure boulangerie à Strasbourg ».
        </li>
        <li>
          <strong>La fraîcheur du contenu</strong> : un article de blog datant de 2019 sur un sujet
          qui a évolué sera moins souvent cité qu&apos;une page mise à jour récemment.
        </li>
        <li>
          <strong>La densité de signal</strong> : une page qui répond clairement à une question,
          avec des données chiffrées, des exemples concrets et une FAQ, est beaucoup plus citable
          qu&apos;une page de présentation générique.
        </li>
      </ul>
      <p>
        Pour aller plus loin sur ce sujet,{' '}
        <Link href="/blog/comment-etre-cite-par-chatgpt">
          notre guide pratique explique exactement comment être cité par ChatGPT
        </Link>{' '}
        avec des actions concrètes à mettre en place.
      </p>

      <h2>Par où commencer</h2>
      <p>
        Le GEO peut sembler intimidant, mais les premières actions sont simples et produisent des
        résultats rapides, surtout sur les requêtes locales et de niche.
      </p>
      <ul>
        <li>
          <strong>Mesurez votre point de départ.</strong> Posez aux 4 grandes IA (ChatGPT,
          Perplexity, Gemini, Claude) les 5 à 10 questions que vos clients potentiels posent
          vraiment. Notez qui est cité. C&apos;est votre point de départ.
        </li>
        <li>
          <strong>Vérifiez votre robots.txt.</strong> Assurez-vous de ne pas bloquer les agents
          d&apos;exploration des IA. Certains ont des identifiants spécifiques (GPTBot pour
          OpenAI, PerplexityBot, etc.).
        </li>
        <li>
          <strong>Complétez vos données structurées.</strong> Ajoutez ou mettez à jour les balises
          schema.org : LocalBusiness, FAQ, Service. Ce balisage aide les IA à comprendre ce que
          vous faites et où vous le faites.
        </li>
        <li>
          <strong>Unifiez vos informations de contact.</strong> Nom exact, adresse, numéro de
          téléphone, site web : ces quatre informations doivent être identiques partout — votre
          site, Google Business Profile, les annuaires, les réseaux sociaux.
        </li>
        <li>
          <strong>Récrivez vos pages clés.</strong> Commencez par la page d&apos;accueil et la
          page de présentation de vos services. Chaque page doit répondre à une question précise
          dès le premier paragraphe. Ajoutez une FAQ à la fin.
        </li>
        <li>
          <strong>Obtenez des mentions externes.</strong> Contactez un annuaire sectoriel, un média
          local, une association professionnelle. Une mention dans un article de presse ou un
          annuaire reconnu vaut beaucoup pour votre autorité GEO.
        </li>
        <li>
          <strong>Mesurez à nouveau dans 30 jours.</strong> Le GEO ne se pilote pas au jour le
          jour mais sur la tendance. Comparez vos résultats avec votre point de départ et
          identifiez les requêtes où vous progressez.
        </li>
      </ul>

      <h2>En résumé</h2>
      <p>
        <strong>
          Le GEO (Generative Engine Optimization) est la discipline qui consiste à optimiser la
          présence d&apos;un site web dans les réponses des intelligences artificielles génératives
          — ChatGPT, Perplexity, Gemini, Claude — afin d&apos;être cité quand un client potentiel
          pose une question à ces outils.
        </strong>{' '}
        Il repose sur trois piliers complémentaires : l&apos;autorité (être mentionné dans des
        sources fiables en dehors de votre site), la technique (permettre aux IA de lire et de
        comprendre votre site sans obstacle), et le contenu (publier des réponses directes et
        factuelles à des questions précises).
      </p>
      <p>
        Pour une TPE ou une PME française, le GEO n&apos;est pas une option réservée aux grandes
        entreprises. C&apos;est une opportunité : les requêtes locales et de niche sont encore peu
        disputées dans les IA, et les premières actions produisent des résultats visibles en
        quelques semaines. La question n&apos;est pas de savoir si vous devez vous y mettre, mais
        à quelle vitesse.
      </p>
    </ArticleLayout>
  )
}
