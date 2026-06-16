import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('erreurs-geo-frequentes')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <p>
        ChatGPT, Perplexity, Gemini et Claude répondent chaque jour à des millions de questions
        sur des produits, des services, des prestataires locaux. Si votre site n&apos;est pas cité,
        ce n&apos;est pas un hasard : c&apos;est souvent la conséquence d&apos;une ou plusieurs
        erreurs bien précises, que vous pouvez corriger. Voici les 7 plus fréquentes chez les TPE
        et PME françaises — et ce qu&apos;il faut faire pour les éliminer.
      </p>

      <h2>1. Votre robots.txt bloque les robots des IA</h2>
      <p>
        Les moteurs d&apos;IA utilisent leurs propres robots pour indexer le web :{' '}
        <strong>GPTBot</strong> (OpenAI), <strong>PerplexityBot</strong>,{' '}
        <strong>ClaudeBot</strong> (Anthropic) et <strong>Google-Extended</strong> (Gemini). Si
        votre fichier <code>robots.txt</code> les bloque — volontairement ou par un réglage par
        défaut de votre CMS —, aucune IA ne peut lire votre contenu, et vous n&apos;existez pas
        pour elle.
      </p>
      <p>
        <strong>Comment vérifier :</strong> ouvrez{' '}
        <em>votresite.fr/robots.txt</em> dans votre navigateur et cherchez les lignes{' '}
        <code>User-agent: GPTBot</code>, <code>User-agent: PerplexityBot</code>,{' '}
        <code>User-agent: ClaudeBot</code> et <code>User-agent: Google-Extended</code>. Si elles
        sont suivies de <code>Disallow: /</code>, vous êtes invisible.
      </p>
      <p>
        <strong>Comment corriger :</strong> supprimez ces lignes ou remplacez-les par{' '}
        <code>Allow: /</code>. Si vous utilisez WordPress, vérifiez vos extensions de sécurité
        (Wordfence, iThemes) qui ajoutent parfois ces blocages automatiquement.
      </p>

      <h2>2. Votre contenu est vague et non « citable »</h2>
      <p>
        « Nous proposons des solutions sur mesure adaptées à vos besoins. » Cette phrase est
        présente sur des dizaines de milliers de sites français. Une IA ne peut pas la citer,
        parce qu&apos;elle ne contient aucune information concrète : pas de métier précis, pas de
        zone géographique, pas de chiffre, pas de réponse à une vraie question.
      </p>
      <p>
        Les IA privilégient ce qui est <strong>facile à extraire et à reformuler</strong> : une
        définition claire, une fourchette de prix, une liste d&apos;étapes, une FAQ structurée.
        Si votre page d&apos;accueil ne contient que du marketing générique, elle ne sera jamais
        citée, même si elle est techniquement parfaite.
      </p>
      <p>
        <strong>Comment corriger :</strong> mettez la réponse en tête de chaque page. Par
        exemple : « Cabinet comptable à Lyon spécialisé dans les artisans et commerçants. Bilan,
        déclarations fiscales et paie à partir de 90 €/mois. » Une FAQ en bas de page avec de
        vraies questions clients multiplie encore vos chances d&apos;être cité. Pour en savoir
        plus sur la structure idéale,{' '}
        <Link href="/blog/comment-etre-cite-par-chatgpt">
          consultez notre guide pour être cité par ChatGPT
        </Link>
        .
      </p>

      <h2>3. Vos informations sont incohérentes d&apos;une source à l&apos;autre</h2>
      <p>
        Votre nom d&apos;entreprise s&apos;écrit « SARL Dupont » sur votre site, « Dupont SARL »
        sur Google Business Profile, et « Dupont et Fils » sur un annuaire local. Votre numéro de
        téléphone a changé il y a deux ans, mais l&apos;ancien est encore présent sur cinq
        plateformes. Ces incohérences semblent anodines — elles sont en réalité rédhibitoires pour
        les IA.
      </p>
      <p>
        Un moteur de réponses IA recoupe plusieurs sources avant de vous citer. Si les données ne
        concordent pas, il préfère ne pas vous mentionner plutôt que de risquer une erreur devant
        l&apos;utilisateur. Le doute lui profite — pas à vous.
      </p>
      <p>
        <strong>Comment corriger :</strong> auditez toutes vos présences en ligne (Google Business
        Profile, Pages Jaunes, Yelp, annuaires sectoriels, Tripadvisor si applicable). Harmonisez
        le nom légal exact, l&apos;adresse complète et le numéro de téléphone. Ce travail, une
        fois fait proprement, a un effet durable.
      </p>

      <h2>4. Vous n&apos;avez aucune présence en dehors de votre site</h2>
      <p>
        Votre site est parfait, mais vous n&apos;êtes mentionné nulle part ailleurs sur le web.
        Pas d&apos;avis Google, pas de fiche sur les annuaires de votre secteur, pas de mention
        dans la presse locale, pas de présence sur des forums ou communautés en ligne. Pour une IA,
        un site isolé est un site peu fiable.
      </p>
      <p>
        L&apos;autorité GEO se construit <em>en dehors</em> de votre propre site. Les IA
        calibrent leur confiance en comparant ce que vous dites de vous-même et ce que les autres
        disent de vous. Un prestataire cité dans un article de La Tribune, recommandé sur un forum
        professionnel et noté 4,8/5 sur Google sera toujours préféré à un site techniquement
        parfait mais sans échos extérieurs.
      </p>
      <p>
        <strong>Comment corriger :</strong> commencez par les bases — fiche Google Business
        Profile complète et vérifiée, inscription sur les annuaires leaders de votre secteur,
        sollicitation active d&apos;avis clients authentiques. Ensuite, visez une ou deux mentions
        dans la presse régionale ou professionnelle chaque trimestre. Ce travail s&apos;accumule
        et ses effets sont durables. Pour comprendre le rôle de l&apos;autorité,{' '}
        <Link href="/blog/quest-ce-que-le-geo">
          lisez notre introduction au GEO
        </Link>
        .
      </p>

      <h2>5. Vous n&apos;avez pas de données structurées</h2>
      <p>
        Les données structurées (schema.org) sont des balises techniques invisibles pour vos
        visiteurs, mais que les IA lisent en priorité. Elles permettent de dire explicitement à
        un moteur : « cette page décrit une entreprise locale, voici son adresse, ses horaires et
        son domaine d&apos;activité » — ou : « cette section est une FAQ, voici les questions et
        les réponses ». Sans elles, l&apos;IA doit deviner. Avec elles, elle sait.
      </p>
      <p>
        Les trois types les plus utiles pour une TPE ou PME sont :
      </p>
      <ul>
        <li>
          <strong>LocalBusiness</strong> — nom, adresse, téléphone, horaires, secteur d&apos;activité.
        </li>
        <li>
          <strong>FAQPage</strong> — questions et réponses fréquentes de vos clients.
        </li>
        <li>
          <strong>Product</strong> ou <strong>Service</strong> — description, prix, disponibilité.
        </li>
      </ul>
      <p>
        <strong>Comment corriger :</strong> si vous utilisez WordPress, les extensions Yoast SEO
        ou Rank Math génèrent automatiquement un schéma LocalBusiness à partir des informations de
        votre profil. Sinon, Google propose un générateur gratuit de données structurées. Validez
        ensuite avec le Rich Results Test de Google pour vérifier qu&apos;il n&apos;y a pas
        d&apos;erreur.
      </p>

      <h2>6. Votre contenu n&apos;est jamais mis à jour</h2>
      <p>
        Une page rédigée en 2019 et jamais retouchée envoie un signal négatif aux IA : ce site
        est peut-être abandonné, les informations sont peut-être périmées. Les moteurs de réponses
        préfèrent citer des sources récentes, parce que leurs utilisateurs veulent des informations
        actuelles.
      </p>
      <p>
        La fraîcheur est un critère de citation sous-estimé. Une page qui mentionne des prix
        actualisés, des exemples datés de l&apos;année en cours ou un paragraphe ajouté ce
        trimestre sera jugée plus fiable qu&apos;une page figée depuis des années, même si le
        contenu de fond est identique.
      </p>
      <p>
        <strong>Comment corriger :</strong> planifiez une revue trimestrielle de vos pages clés.
        Mettez à jour les prix, les exemples, les chiffres. Ajoutez un bloc « Mis à jour en
        [mois année] » visible sur la page. Rédigez au moins un article de blog par mois sur une
        question réelle posée par vos clients récents. La régularité prime sur le volume.
      </p>

      <h2>7. Vous ne mesurez rien</h2>
      <p>
        C&apos;est l&apos;erreur la plus silencieuse. Vous ne savez pas si vous êtes cité dans
        ChatGPT ou Perplexity, vous ne savez pas qui est cité à votre place, vous ne savez pas
        si vos actions des trois derniers mois ont eu un effet. Sans mesure, vous travaillez dans
        le noir.
      </p>
      <p>
        La bonne métrique GEO n&apos;est pas « mon score aujourd&apos;hui » — les IA ne
        répondent jamais deux fois exactement de la même façon. C&apos;est votre{' '}
        <strong>tendance sur 30 jours</strong> : votre taux de citation progresse-t-il ? Vos
        concurrents sont-ils moins souvent mentionnés ? Méfiez-vous des outils qui affichent un
        chiffre unique comme une vérité absolue.
      </p>
      <p>
        <strong>Comment corriger :</strong> posez chaque mois aux quatre grandes IA (ChatGPT,
        Perplexity, Gemini, Claude) les cinq questions que vos clients vous posent le plus
        souvent. Notez qui est cité. C&apos;est la version manuelle, gratuite, qui prend une
        heure par mois. Un outil comme GeoMind automatise cette mesure sur 30 jours et détecte
        les tendances sans intervention de votre part.
      </p>

      <h2>Par où commencer</h2>
      <ul>
        <li>
          <strong>Aujourd&apos;hui :</strong> vérifiez votre <em>robots.txt</em> et autorisez
          GPTBot, PerplexityBot, ClaudeBot et Google-Extended.
        </li>
        <li>
          <strong>Cette semaine :</strong> harmonisez votre nom, adresse et téléphone sur toutes
          vos présences en ligne.
        </li>
        <li>
          <strong>Ce mois-ci :</strong> ajoutez un schéma LocalBusiness et une FAQ structurée sur
          votre page d&apos;accueil.
        </li>
        <li>
          <strong>Ce trimestre :</strong> réécrivez vos pages de service avec des réponses
          concrètes en tête plutôt que du marketing générique.
        </li>
        <li>
          <strong>En continu :</strong> mesurez votre taux de citation chaque mois et suivez la
          tendance, pas le chiffre du jour.
        </li>
      </ul>
      <p>
        Ces 7 erreurs ne sont pas des fatalités. Chacune a une correction précise, souvent
        réalisable sans développeur ni budget conséquent. L&apos;enjeu, c&apos;est de ne pas les
        laisser s&apos;accumuler pendant que vos concurrents, eux, apparaissent dans les réponses
        IA que vos clients lisent chaque jour.
      </p>
    </ArticleLayout>
  )
}
