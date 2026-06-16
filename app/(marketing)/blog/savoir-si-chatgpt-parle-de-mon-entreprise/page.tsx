import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('savoir-si-chatgpt-parle-de-mon-entreprise')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <p>
        La grande majorité des dirigeants de TPE et PME que nous rencontrons ne savent pas si
        ChatGPT parle d&apos;eux. Certains supposent que oui parce qu&apos;ils ont un bon site web.
        D&apos;autres supposent que non parce qu&apos;ils n&apos;ont pas encore « fait du contenu ».
        La réalité, c&apos;est que sans vérification concrète, vous naviguez à l&apos;aveugle — et
        pendant ce temps, vos concurrents sont peut-être cités à votre place. Voici comment le
        savoir en quelques minutes, et ce qu&apos;il faut faire ensuite.
      </p>

      <h2>Méthode manuelle, en 15 minutes</h2>
      <p>
        Pas besoin d&apos;outil pour un premier test. Voici une procédure simple que vous pouvez
        appliquer dès aujourd&apos;hui, avec la version gratuite de ChatGPT.
      </p>

      <h3>1. Listez les 5 questions que vos clients posent vraiment</h3>
      <p>
        Ne partez pas de ce que vous aimeriez que l&apos;on dise de vous. Partez de ce que vos
        clients cherchent réellement. Pensez aux questions que vous entendez au téléphone, aux
        objections récurrentes avant l&apos;achat, aux recherches Google que vous avez déjà
        identifiées. Des exemples : « quel avocat spécialisé en droit du travail à Lyon », « comment
        choisir un expert-comptable pour une startup », « meilleur plombier pour installation
        chaudière à Bordeaux ». Ce sont ces formulations — pas votre nom de marque — que les
        prospects tapent dans les IA.
      </p>

      <h3>2. Posez-les à ChatGPT en activant la recherche web</h3>
      <p>
        Ouvrez ChatGPT dans une fenêtre de navigation privée et activez l&apos;option « Recherche »
        (l&apos;icône en forme de globe dans la barre de saisie). Cette option est disponible avec
        ChatGPT 4o, même en version gratuite. La navigation privée est indispensable : elle évite
        que l&apos;historique de vos conversations précédentes influence les réponses. Posez chacune
        de vos 5 questions une par une, en ouvrant une nouvelle conversation à chaque fois.
      </p>

      <h3>3. Regardez si votre site ou votre marque apparaît</h3>
      <p>
        Dans la réponse de ChatGPT, observez deux choses : le texte de la réponse (votre nom
        est-il cité ?) et les sources affichées en bas (votre site apparaît-il dans la liste ?).
        Une citation sans source est moins solide qu&apos;une citation avec lien — mais les deux
        comptent. Notez pour chaque question : cité, non cité, ou mentionné de façon marginale.
      </p>

      <h3>4. Notez qui apparaît à votre place</h3>
      <p>
        C&apos;est souvent la partie la plus utile de l&apos;exercice. Qui ChatGPT cite-t-il
        lorsque vous n&apos;apparaissez pas ? Des concurrents directs ? Des annuaires sectoriels ?
        Des médias spécialisés ? Cette liste vous donne un aperçu des sources que l&apos;IA
        considère comme fiables dans votre domaine — et donc des endroits où vous devriez vous
        rendre visible.
      </p>

      <h2>Les pièges du test manuel</h2>
      <p>
        Cette méthode donne une première image utile, mais elle a des limites importantes à connaître
        avant d&apos;en tirer des conclusions définitives.
      </p>
      <p>
        <strong>Les IA ne répondent jamais deux fois exactement pareil.</strong> ChatGPT intègre une
        part de variabilité dans ses réponses. La même question posée deux fois le même jour peut
        donner deux listes de sources différentes. Un seul test ne prouve donc rien : il donne une
        indication, pas une certitude.
      </p>
      <p>
        <strong>La formulation change tout.</strong> « Meilleur expert-comptable Paris » et
        « expert-comptable recommandé à Paris » peuvent produire des réponses très différentes.
        Testez plusieurs formulations de chaque question, en variant le niveau de précision et les
        synonymes utilisés.
      </p>
      <p>
        <strong>Ouvrez une fenêtre neuve à chaque question.</strong> ChatGPT se souvient du contexte
        à l&apos;intérieur d&apos;une même conversation. Si vous posez toutes vos questions à la
        suite, les premières réponses influencent les suivantes. Chaque test doit se faire dans une
        conversation vierge, idéalement en navigation privée.
      </p>
      <p>
        <strong>Évitez de citer votre propre marque dans le prompt.</strong> « Est-ce que ChatGPT
        parle de l&apos;agence Dupont ? » est un mauvais test : vous orientez l&apos;IA vers votre
        nom. Pour mesurer votre visibilité réelle, posez des questions neutres — celles que poserait
        un client qui ne connaît pas encore votre nom. C&apos;est la même logique qui s&apos;applique
        aux <Link href="/blog/geo-vs-seo">audits GEO sérieux</Link> : on mesure ce que l&apos;IA
        dit spontanément, sans la guider.
      </p>

      <h2>Que faire si ce sont vos concurrents qui apparaissent</h2>
      <p>
        Ne paniquez pas, mais ne minimisez pas non plus. Si vos concurrents sont cités et pas vous,
        c&apos;est le signal que les IA jugent leurs contenus et leur présence en ligne plus
        « citables » que les vôtres. Cela peut venir de plusieurs endroits :
      </p>
      <ul>
        <li>
          <strong>Un contenu plus précis et plus structuré.</strong> Vos concurrents répondent
          peut-être à des questions précises sur leurs pages (tarifs, FAQ, comparatifs) là où votre
          site reste généraliste. Les IA privilégient ce qui est facile à extraire et à reformuler.
        </li>
        <li>
          <strong>Une présence éditoriale plus large.</strong> Ils sont peut-être mentionnés dans
          des articles de presse, des annuaires sectoriels, des forums ou des comparateurs. La
          présence hors de votre propre site compte énormément pour les IA.
        </li>
        <li>
          <strong>Des données structurées en place.</strong> Les balises Schema.org (LocalBusiness,
          FAQ, Review) aident les robots IA à comprendre et à extraire l&apos;information. Un site
          techniquement bien configuré a un avantage direct sur un site qui ne l&apos;est pas.
        </li>
      </ul>
      <p>
        La bonne réaction : analyser précisément ce que font ces concurrents, et identifier les
        actions les plus rapides à mettre en œuvre de votre côté. Souvent, un ou deux ajustements
        de contenu suffisent pour apparaître sur les requêtes de niche ou locales.
      </p>

      <h2>Pourquoi un suivi régulier change tout</h2>
      <p>
        Un test ponctuel vous dit où vous en êtes aujourd&apos;hui. Mais la visibilité dans les IA
        évolue : les moteurs IA mettent à jour leurs index, vos concurrents publient du nouveau
        contenu, et vos propres améliorations commencent à porter leurs fruits avec un décalage de
        quelques semaines. Un instantané ne raconte pas cette histoire.
      </p>
      <p>
        Ce qui compte vraiment, c&apos;est la tendance sur 30 jours. Êtes-vous cité plus souvent
        qu&apos;il y a un mois ? Sur combien de questions parmi vos 5 prioritaires ? Sur quels
        moteurs IA ? ChatGPT, Perplexity et Gemini ont des comportements différents et des sources
        différentes — une bonne visibilité sur l&apos;un ne garantit pas la même chose sur
        l&apos;autre. C&apos;est pourquoi les professionnels du <Link href="/blog/geo-vs-seo">GEO
        (Generative Engine Optimization)</Link> parlent de taux de citation moyen sur une période,
        pas d&apos;un score à la date J.
      </p>
      <p>
        Autre raison de suivre régulièrement : les améliorations que vous apportez à votre site
        (nouveaux contenus, données structurées, présence dans des annuaires) ont un effet différé.
        Sans mesure dans le temps, vous ne saurez jamais ce qui a vraiment fonctionné.
      </p>

      <h2>Faire ça à la main ou avec un outil</h2>
      <p>
        Soyons honnêtes : la méthode manuelle décrite plus haut est faisable. Elle vous coûtera
        environ une heure la première fois, puis 30 à 45 minutes par mois si vous voulez suivre
        l&apos;évolution. C&apos;est raisonnable pour une première exploration ou pour tester
        ponctuellement une requête précise.
      </p>
      <p>
        Mais le suivi régulier sur plusieurs IA, plusieurs dizaines de questions et plusieurs mois
        devient rapidement fastidieux. Il faut ouvrir des fenêtres privées, noter les résultats,
        comparer d&apos;une session à l&apos;autre, identifier les tendances. Sans structure, les
        données s&apos;accumulent dans un tableur difficile à interpréter.
      </p>
      <p>
        C&apos;est exactement ce que fait un outil comme GeoMind : il automatise les tests sur
        ChatGPT, Perplexity, Gemini et Claude, calcule votre taux de citation semaine après semaine,
        identifie les points faibles techniques et de contenu, et génère un plan d&apos;action
        priorisé. Vous voyez d&apos;un coup d&apos;œil si vous progressez, sur quelles requêtes et
        face à quels concurrents. Pour un dirigeant dont le temps est limité, c&apos;est souvent
        plus rentable que de consacrer des heures à des tests manuels. Mais si vous souhaitez
        commencer par vous-même, la méthode ci-dessus est un bon point de départ.
      </p>

      <h2>Par où commencer</h2>
      <ul>
        <li>
          <strong>Aujourd&apos;hui :</strong> ouvrez une fenêtre de navigation privée, activez la
          recherche web dans ChatGPT, et posez les 5 questions que vos clients posent le plus
          souvent. Notez les résultats dans un document simple.
        </li>
        <li>
          <strong>Cette semaine :</strong> identifiez qui apparaît à votre place et analysez
          pourquoi — contenu plus précis, présence dans des annuaires, données structurées ?
        </li>
        <li>
          <strong>Ce mois-ci :</strong> lisez notre guide sur{' '}
          <Link href="/blog/comment-etre-cite-par-chatgpt">comment être cité par ChatGPT</Link>{' '}
          pour passer à l&apos;action sur les leviers les plus efficaces.
        </li>
        <li>
          <strong>En continu :</strong> mettez en place un suivi mensuel — manuel ou avec un outil
          — pour mesurer l&apos;impact de vos efforts dans le temps.
        </li>
        <li>
          <strong>Si vous voulez aller plus vite :</strong> lancez un audit GeoMind pour obtenir
          un état des lieux complet en quelques minutes, avec le plan d&apos;action associé.
        </li>
      </ul>
    </ArticleLayout>
  )
}
