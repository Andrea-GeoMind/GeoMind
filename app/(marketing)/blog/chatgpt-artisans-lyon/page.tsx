import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('chatgpt-artisans-lyon')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

/**
 * Étude originale — relevé de septembre 2026.
 *
 * Toutes les entreprises observées sont anonymisées : aucun nom, aucune
 * adresse, aucun lien. Chacune est désignée par son métier et son nombre
 * d'avis, qui est la variable expliquant l'essentiel de ce qu'on observe.
 */
export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <div className="space-y-4">
        <p>
          <strong>
            Pour chaque métier testé, ChatGPT a consulté une liste de 11 à 14 entreprises locales et
            en a nommé 5 à 8. Il n&apos;a ouvert aucune page, dans aucun test : il travaille sur les
            extraits d&apos;annuaires.
          </strong>
        </p>
        <p>
          Ce qui départage n&apos;est presque jamais le site. C&apos;est le nombre d&apos;avis
          Google, la catégorie sous laquelle l&apos;entreprise est classée, et l&apos;existence
          d&apos;une fiche qui la décrit ailleurs que chez elle.
        </p>
        <p>
          Dix métiers, une question chacun, septembre 2026. Un seul moteur, un seul instant : ces
          chiffres décrivent ce test, pas une loi.
        </p>
      </div>

      <h2 id="comment-nous-avons-procede">Comment nous avons procédé</h2>
      <p>
        Dix métiers lyonnais, choisis pour couvrir des paniers et des logiques d&apos;achat
        différents : électricien rénovation, carreleur salle de bain, plombier chauffagiste,
        cuisiniste sur mesure, déménagement, menuisier fenêtres, architecte d&apos;intérieur,
        paysagiste, photographe de mariage, implantologue.
      </p>
      <p>
        Une question par métier, formulée comme un particulier la poserait — le métier, la ville, le
        besoin. Aucune ne contient de nom d&apos;entreprise : une question qui cite une marque ne
        mesure pas la visibilité, elle la fabrique.
      </p>
      <p>
        Chaque question a été posée en <strong>discussion temporaire</strong>, sans historique ni
        mémoire. Ce point n&apos;est pas un détail de confort : il change le résultat, et le sixième
        constat explique pourquoi.
      </p>
      <p>
        Toutes les entreprises citées dans cet article sont anonymisées. Aucun nom, aucune adresse,
        aucun lien. Nous décrivons chacune par son métier et son nombre d&apos;avis, parce que
        c&apos;est cette variable qui explique l&apos;essentiel de ce qu&apos;on observe.
      </p>
      <p>
        <strong>Un constat repose sur une mesure différente.</strong> Le cinquième, sur les
        implantologues, provient d&apos;une analyse complète menée avec notre propre outil : 10
        questions neutres posées à 4 moteurs, soit 40 réponses. Les cinq autres viennent du test
        ChatGPT décrit ci-dessus. Nous le signalons plutôt que de fondre les deux dans un même
        chiffre.
      </p>

      <h2 id="une-douzaine-de-fiches">
        1. Il lit une douzaine de fiches et n&apos;ouvre aucune page
      </h2>
      <p>
        Pour chaque métier, ChatGPT a consulté entre <strong>11 et 14 entreprises locales</strong>,
        et en a nommé <strong>5 à 8</strong> dans sa réponse. L&apos;écart entre les deux est la
        première sélection : environ une entreprise sur deux consultée ne ressort pas.
      </p>
      <p>
        Le fait le plus net de toute l&apos;étude :{' '}
        <strong>il n&apos;a ouvert aucune page, dans aucun des dix tests</strong>. Pas une seule
        visite sur un site d&apos;entreprise. Il a travaillé exclusivement sur les extraits que lui
        renvoie sa recherche — quelques lignes par entreprise, issues d&apos;annuaires et de fiches.
      </p>
      <p>
        Cela déplace le terrain de jeu. Un site refait à neuf, rapide et bien rédigé ne pèse rien
        dans cette étape s&apos;il n&apos;existe nulle part ailleurs sous une forme lisible en trois
        lignes.
      </p>

      <h2 id="avis-google">2. Le nombre d&apos;avis Google pèse plus que tout le reste</h2>
      <p>
        Chez les plombiers chauffagistes, les entreprises recommandées affichaient{' '}
        <strong>entre 132 et 226 avis</strong>. Aucune en dessous.
      </p>
      <p>
        Chez les électriciens, une entreprise à <strong>43 avis</strong> n&apos;apparaît pas ; les
        recommandées se situent <strong>entre 77 et 175</strong>.
      </p>
      <p>
        La corrélation est forte, mais elle n&apos;est pas absolue — et c&apos;est important de le
        dire. Chez les menuisiers, une entreprise à <strong>223 avis</strong> est absente de la
        liste, tandis que <strong>deux entreprises à 25 avis</strong> sont recommandées.
      </p>
      <p>
        Une hypothèse, que nous n&apos;avons pas vérifiée : la fiche Google de cette entreprise
        était peut-être rangée sous une autre catégorie que « menuisier », ce qui rejoindrait le
        constat suivant. Nous ne l&apos;avons pas contrôlée, et nous ne la présentons donc pas comme
        l&apos;explication — seulement comme la piste la plus cohérente avec le reste de nos
        observations.
      </p>
      <p>
        Ce qu&apos;on peut affirmer : en dessous d&apos;une cinquantaine d&apos;avis, sur les
        métiers testés, il faut autre chose pour exister. Au-dessus de cent, l&apos;entreprise entre
        dans le champ de vision, sans garantie d&apos;en ressortir.
      </p>

      <h2 id="categorie-google">3. Une mauvaise catégorie peut effacer une entreprise</h2>
      <p>
        C&apos;est le cas le plus frappant de l&apos;étude, parce qu&apos;il inverse complètement
        l&apos;ordre attendu.
      </p>
      <p>
        Sur la requête « architecte d&apos;intérieur », l&apos;entreprise la mieux notée de toute la
        liste consultée — <strong>71 avis</strong>, davantage que n&apos;importe quelle autre — est
        écartée. ChatGPT écrit chercher des professionnels « plutôt qu&apos;un simple décorateur ».
        L&apos;entreprise est classée <strong>« décoratrice »</strong> sur sa fiche Google.
      </p>
      <p>
        À sa place, un cabinet à <strong>13 avis</strong> est retenu. Cinq fois moins d&apos;avis,
        mais la bonne étiquette.
      </p>
      <p>
        La catégorie principale d&apos;une fiche Google n&apos;est pas un champ administratif.
        C&apos;est le mot par lequel un moteur décide si vous faites partie ou non de la question
        posée. Une catégorie approximative ne vous fait pas descendre dans le classement : elle vous
        retire de la liste.
      </p>

      <h2 id="annuaires">4. Il vous décrit à partir des annuaires, pas de votre site</h2>
      <p>
        Les sources citées dans les réponses reviennent toujours aux mêmes familles :{' '}
        <strong>Pages Jaunes, Houzz, Batup, Qualibat</strong>. Jamais le site de l&apos;entreprise.
      </p>
      <p>
        Deux illustrations, parlantes parce qu&apos;elles opposent deux entreprises du même métier.
      </p>
      <p>
        <strong>Cuisinistes.</strong> Une entreprise à 75 avis est citée en une ligne — son nom,
        rien de plus. Une concurrente à 45 avis obtient un paragraphe entier : style, matériaux,
        démarche. La différence tient à une page Houzz détaillée, que la première n&apos;a pas.
      </p>
      <p>
        <strong>Déménageurs.</strong> Une entreprise notée 5/5 est mentionnée avec sa seule note.
        Une concurrente notée 4,4 est décrite en premier et plus longuement, grâce à une fiche Pages
        Jaunes renseignée.
      </p>
      <p>
        Être cité et être décrit sont deux résultats différents. Le premier vous met dans la liste ;
        le second donne au lecteur une raison de vous appeler. Le second se joue sur des fiches que
        vous ne possédez pas.
      </p>

      <h2 id="plateformes">5. Sur les métiers médicaux, les plateformes prennent la place</h2>
      <p>
        Sur l&apos;implantologie — mesure complète, 10 questions, 4 moteurs, 40 réponses — le
        cabinet le plus cité n&apos;apparaît que dans <strong>9 réponses sur 40</strong>.
      </p>
      <p>
        Le reste de l&apos;espace est occupé par des plateformes :{' '}
        <strong>Doctolib et LinkedIn captent une part comparable</strong> à celle du cabinet le
        mieux placé.
      </p>
      <p>
        Sur ces métiers, la question n&apos;est pas seulement « suis-je cité ? » mais « ma fiche sur
        la plateforme est-elle complète ? », puisque c&apos;est elle qui sera lue et reprise.
      </p>

      <h2 id="piege-de-mesure">6. Le piège de mesure qui fait croire qu&apos;on est visible</h2>
      <p>
        Nous avons refait une partie des tests <strong>sans</strong> discussion temporaire, sur un
        compte ordinaire. Le comportement change : ChatGPT est allé{' '}
        <strong>chercher le nom de l&apos;entreprise testée</strong>, présent dans la conversation,
        et l&apos;a intégré à sa recherche.
      </p>
      <p>
        Conséquence directe, et elle concerne beaucoup de monde : un dirigeant qui teste sa propre
        visibilité depuis son compte habituel obtient une réponse contaminée par son historique. Il
        se voit cité et en conclut qu&apos;il est visible. Il mesurait sa propre requête, pas celle
        de ses clients.
      </p>
      <p>
        Si vous refaites ce test vous-même : discussion temporaire, aucun nom de marque dans la
        question, et posez-la plusieurs fois. Notre guide{' '}
        <Link href="/blog/savoir-si-chatgpt-parle-de-mon-entreprise">
          comment savoir si ChatGPT parle de votre entreprise
        </Link>{' '}
        détaille la procédure, et{' '}
        <Link href="/verifier-visibilite-chatgpt">
          notre test gratuit vérifie d&apos;abord que son robot peut lire votre site
        </Link>
        .
      </p>

      <h2 id="ce-que-ca-change">Ce que ça change pour vous</h2>
      <p>
        Quatre actions, dans l&apos;ordre où elles se travaillent. Aucune ne garantit d&apos;être
        cité — elles portent sur les signaux que les moteurs utilisent réellement, ce qui est la
        seule chose qu&apos;on puisse maîtriser.
      </p>
      <ul>
        <li>
          <strong>Vérifiez d&apos;abord votre catégorie Google principale.</strong> C&apos;est
          l&apos;action la moins coûteuse et la seule qui puisse vous retirer entièrement de la
          liste. Elle doit être exactement le métier sur lequel vous voulez être trouvé — «
          architecte d&apos;intérieur », pas « décoratrice ».
        </li>
        <li>
          <strong>Installez une démarche d&apos;avis continue</strong>, pas une campagne ponctuelle.
          Les seuils observés ici — une cinquantaine pour exister, au-delà de cent pour entrer dans
          le champ — sont propres à ces métiers et à cette ville, mais la direction est constante.
        </li>
        <li>
          <strong>Faites-vous décrire ailleurs que chez vous.</strong> Une fiche Pages Jaunes
          renseignée, une page Houzz pour les métiers de l&apos;aménagement, une fiche Doctolib
          complète pour la santé. C&apos;est ce qui fait passer de « cité » à « décrit ».
        </li>
        <li>
          <strong>Votre site vient après</strong>, mais il vient. Il ne décide pas de l&apos;étape
          observée ici ; il décide de ce qui se passe quand quelqu&apos;un vous a trouvé et cherche
          à vérifier.
        </li>
      </ul>
      <p>
        Pour les métiers locaux en particulier, notre guide{' '}
        <Link href="/blog/geo-commerce-local">être recommandé par les IA près de chez soi</Link>{' '}
        reprend ces leviers en détail.
      </p>

      <h2 id="limites">Ce que cette étude ne dit pas</h2>
      <ul>
        <li>
          <strong>Un seul moteur.</strong> Cinq constats sur six portent sur ChatGPT. Perplexity,
          Gemini et Claude sélectionnent autrement.
        </li>
        <li>
          <strong>Un seul instant.</strong> Septembre 2026. Les réponses varient d&apos;une fois sur
          l&apos;autre, même question, même jour.
        </li>
        <li>
          <strong>Une seule question par métier.</strong> Une formulation différente donne une liste
          différente.
        </li>
        <li>
          <strong>Une seule ville.</strong> Lyon. Rien ne dit que les seuils d&apos;avis tiennent
          ailleurs.
        </li>
        <li>
          <strong>Aucune causalité démontrée.</strong> Nous observons des corrélations sur dix cas.
          Le menuisier à 223 avis absent suffit à montrer qu&apos;aucune règle simple
          n&apos;explique tout.
        </li>
        <li>
          <strong>Nous éditons un outil de mesure de visibilité IA.</strong> Cette étude sert aussi
          notre discours. Les chiffres sont bruts, la méthode est décrite, les contre-exemples sont
          inclus : jugez sur pièces.
        </li>
      </ul>
    </ArticleLayout>
  )
}
