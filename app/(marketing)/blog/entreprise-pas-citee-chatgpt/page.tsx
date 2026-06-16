import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('entreprise-pas-citee-chatgpt')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <p>
        Vous avez tapé votre activité dans ChatGPT, et votre nom n&apos;est nulle part. Un
        concurrent que vous connaissez bien s&apos;affiche en bonne place. La réaction est
        instinctive : quelque chose cloche. Bonne nouvelle — dans la grande majorité des cas, ce
        n&apos;est pas une fatalité. Il existe des raisons précises, identifiables, et surtout
        corrigeables. Voici les six causes les plus fréquentes, avec pour chacune le diagnostic
        et la marche à suivre.
      </p>

      <h2>1. ChatGPT ne connaît tout simplement pas encore votre entreprise</h2>
      <p>
        Les grands modèles de langage sont entraînés sur des données collectées jusqu&apos;à une
        date précise — on parle de « date de coupure ». Si votre entreprise a été créée
        récemment, ou si elle n&apos;a jamais généré suffisamment de signaux en ligne (articles,
        mentions, discussions), elle est tout simplement absente du corpus d&apos;entraînement.
        ChatGPT ne peut pas citer ce qu&apos;il n&apos;a jamais rencontré.
      </p>
      <p>
        <strong>Ce que vous pouvez faire :</strong> construire une présence progressive et
        cohérente. Cela passe par la création de contenu utile sur votre site, l&apos;inscription
        dans les annuaires de référence de votre secteur, et l&apos;obtention de mentions dans
        des articles de presse ou de blog. Chaque nouveau signal augmente vos chances
        d&apos;apparaître dans les prochaines versions des modèles ou dans les réponses avec
        recherche web activée. C&apos;est un travail de fond : comptez plusieurs mois, mais
        chaque action compte.
      </p>

      <h2>2. Votre site bloque les robots des IA</h2>
      <p>
        Votre site existe, votre contenu est bon, mais quelque chose empêche les IA de le lire.
        La cause la plus courante est un fichier <strong>robots.txt</strong> trop restrictif.
        OpenAI, par exemple, envoie un robot nommé <strong>GPTBot</strong> pour explorer le web
        et enrichir ses réponses en temps réel (mode recherche web). Si votre robots.txt
        contient une ligne <code>Disallow</code> générique, ce robot est bloqué avant même
        d&apos;avoir lu une ligne de votre contenu.
      </p>
      <p>
        <strong>Le diagnostic :</strong> ouvrez <code>https://votredomaine.fr/robots.txt</code>{' '}
        dans votre navigateur. Cherchez les entrées <code>User-agent: GPTBot</code>,{' '}
        <code>User-agent: PerplexityBot</code>, <code>User-agent: ClaudeBot</code>. Si elles sont
        accompagnées d&apos;un <code>Disallow: /</code>, vous avez trouvé le problème.
      </p>
      <p>
        <strong>La solution :</strong> supprimez ces interdictions ou remplacez-les par un{' '}
        <code>Allow: /</code> explicite. Si vous aviez des raisons de bloquer certains robots
        par le passé, vérifiez si ces raisons sont encore valables aujourd&apos;hui.
      </p>

      <h2>3. Votre contenu n&apos;est pas « citable »</h2>
      <p>
        Une IA ne reprend pas n&apos;importe quelle formulation. Elle cherche des réponses
        directes, des chiffres précis, des définitions claires, des comparaisons structurées.
        Le contenu marketing classique — « nous vous accompagnons avec des solutions sur mesure »
        — est parfaitement lisible, mais il n&apos;y a rien à en extraire. Il ne répond à aucune
        question précise, il ne contient aucun fait vérifiable.
      </p>
      <p>
        <strong>Ce que vous pouvez faire :</strong> reformulez vos pages et articles en partant
        d&apos;une question réelle que se posent vos clients. Posez-vous la question : « Quelle
        est la réponse en une phrase ? » Mettez cette réponse en premier, avant tout le reste.
        Ajoutez une section FAQ en bas de page avec des questions formulées comme un client les
        poserait. Donnez des fourchettes de prix, des délais, des exemples concrets. Plus votre
        contenu est factuel et direct, plus il est citable.
      </p>

      <h2>4. Vous n&apos;existez pas en dehors de votre site</h2>
      <p>
        Votre site web est votre vitrine, mais pour une IA il ne représente qu&apos;une source
        parmi d&apos;autres. Ce qui crée la confiance, c&apos;est le{' '}
        <strong>recoupement</strong> : votre nom apparaît sur votre site, dans Google My
        Business, sur des annuaires professionnels, dans des avis clients, dans un article de
        presse locale. Quand plusieurs sources indépendantes convergent vers les mêmes
        informations, l&apos;IA les juge fiables et les cite.
      </p>
      <p>
        <strong>Ce que vous pouvez faire :</strong> commencez par les bases. Revendiquez votre
        fiche Google Business Profile si ce n&apos;est pas encore fait. Inscrivez-vous sur les
        annuaires de votre secteur (Pages Jaunes, annuaires professionnels, plateformes
        d&apos;avis). Encouragez vos clients satisfaits à laisser un avis. Si vous avez des
        relations presse, une mention dans un article local peut avoir une valeur bien supérieure
        à ce qu&apos;elle apporte en SEO traditionnel.
      </p>

      <h2>5. Vos informations sont incohérentes</h2>
      <p>
        Votre entreprise s&apos;appelle « Menuiserie Dupont » sur votre site, « Dupont
        Menuiserie et Rénovation » sur Google My Business, et « Dupont M. » sur un vieil
        annuaire. Votre adresse a changé il y a deux ans mais l&apos;ancienne figure encore sur
        plusieurs plateformes. Ces incohérences sont invisibles pour un humain qui sait faire la
        part des choses, mais elles sèment le doute chez une IA qui agrège des données : elle
        préfère citer une source dont les informations sont stables et concordantes partout.
      </p>
      <p>
        <strong>Ce que vous pouvez faire :</strong> effectuez un audit rapide. Cherchez votre
        nom sur Google et notez toutes les variantes. Corrigez les fiches que vous contrôlez
        (Google, réseaux sociaux, annuaires où vous avez un accès). Pour les sources que vous
        ne contrôlez pas, contactez l&apos;éditeur ou signalez la correction. L&apos;objectif
        est une cohérence parfaite sur le nom, l&apos;adresse, le numéro de téléphone et
        l&apos;URL.
      </p>

      <h2>6. Vous testez mal</h2>
      <p>
        Avant de conclure que vous êtes absent des IA, il faut s&apos;assurer que vous testez
        correctement. Trois erreurs de test sont extrêmement fréquentes.
      </p>
      <h3>La recherche web n&apos;est pas activée</h3>
      <p>
        Par défaut, ChatGPT répond à partir de ses données d&apos;entraînement, qui ont une date
        de coupure. Si vous n&apos;avez pas activé l&apos;option de recherche web (l&apos;icône
        de globe dans l&apos;interface), il ne consulte pas le web en temps réel et ignore donc
        les informations récentes sur votre entreprise. Activez toujours la recherche web avant
        de tester votre visibilité.
      </p>
      <h3>Votre prompt cite déjà votre marque</h3>
      <p>
        Si vous posez la question « Parle-moi de l&apos;entreprise Dupont Menuiserie »,
        l&apos;IA va tenter de vous répondre sur ce sujet précis — mais ce n&apos;est pas ainsi
        que vos clients cherchent. Ils posent des questions neutres : « Qui fait la pose de
        fenêtres en aluminium à Lyon ? » ou « Meilleur artisan pour une rénovation de cuisine
        à Bordeaux ? ». Testez avec des prompts neutres qui reflètent de vraies intentions de
        recherche, sans mentionner votre nom.
      </p>
      <h3>La conversation a de la mémoire</h3>
      <p>
        ChatGPT peut mémoriser des éléments entre les sessions ou dans une longue conversation.
        Si vous avez déjà parlé de votre entreprise dans cette fenêtre, les réponses suivantes
        peuvent en être influencées. Ouvrez toujours une <strong>nouvelle conversation</strong>{' '}
        pour chaque test, depuis un onglet neutre, sans historique. Pour aller plus loin sur
        la méthode de test,{' '}
        <Link href="/blog/savoir-si-chatgpt-parle-de-mon-entreprise">
          consultez notre guide dédié
        </Link>
        .
      </p>

      <h2>Par où commencer concrètement</h2>
      <p>
        Vous avez identifié une ou plusieurs causes dans les sections précédentes. Voici un
        ordre de priorité pour passer à l&apos;action sans vous disperser :
      </p>
      <ul>
        <li>
          <strong>Immédiatement (30 minutes) :</strong> vérifiez votre robots.txt et supprimez
          les blocages sur GPTBot, PerplexityBot et ClaudeBot si vous en trouvez.
        </li>
        <li>
          <strong>Cette semaine :</strong> auditez la cohérence de vos informations (nom,
          adresse, téléphone) sur vos 5 à 10 principales présences en ligne et corrigez les
          écarts.
        </li>
        <li>
          <strong>Ce mois :</strong> revendiquez ou mettez à jour votre fiche Google Business
          Profile et inscrivez-vous sur les annuaires clés de votre secteur.
        </li>
        <li>
          <strong>Sur 3 mois :</strong> publiez du contenu qui répond directement aux questions
          de vos clients — une page ou un article par question, avec la réponse dès la première
          ligne.{' '}
          <Link href="/blog/comment-etre-cite-par-chatgpt">
            Notre guide pour être cité par ChatGPT
          </Link>{' '}
          détaille la méthode étape par étape.
        </li>
        <li>
          <strong>En continu :</strong> mesurez régulièrement avec des prompts neutres et
          recherche web activée. Notez vos progrès. La visibilité GEO progresse par paliers :
          un jour vous n&apos;êtes pas cité, le lendemain vous apparaissez sur une question de
          niche, puis sur de plus en plus de requêtes.
        </li>
      </ul>
      <p>
        Ne cherchez pas à tout corriger d&apos;un coup. Les entreprises qui progressent le plus
        vite en visibilité IA sont celles qui travaillent méthodiquement, cause par cause, en
        mesurant l&apos;effet de chaque action. C&apos;est exactement ce que GeoMind vous aide
        à faire : identifier vos points faibles, prioriser, et suivre l&apos;évolution de votre
        visibilité dans ChatGPT, Perplexity, Gemini et Claude sur la durée.
      </p>
    </ArticleLayout>
  )
}
