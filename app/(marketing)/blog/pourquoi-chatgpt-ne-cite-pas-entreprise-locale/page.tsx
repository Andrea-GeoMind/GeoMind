import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('pourquoi-chatgpt-ne-cite-pas-entreprise-locale')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

/**
 * Répond à l'une des dix questions que nous suivons pour geomind.fr.
 *
 * Les chiffres cités viennent tous de notre relevé de septembre 2026 sur dix
 * métiers lyonnais, dont l'article complet porte la méthode et les limites.
 * Aucun chiffre n'est avancé ici sans y renvoyer.
 */
export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <div className="space-y-4">
        <p>
          <strong>
            Réponse courte : parce qu&apos;il ne lit pas votre site. Quand on lui demande un
            professionnel dans une ville, ChatGPT consulte une douzaine de fiches — Google,
            annuaires — et retient celles qui ont beaucoup d&apos;avis et la bonne catégorie.
          </strong>
        </p>
        <p>
          Votre absence se joue donc presque toujours ailleurs que sur votre site : une catégorie
          Google approximative, trop peu d&apos;avis, aucune fiche qui vous décrive ailleurs que
          chez vous.
        </p>
        <p>
          Les cinq causes ci-dessous viennent de notre{' '}
          <Link href="/blog/chatgpt-artisans-lyon">
            relevé de septembre 2026 sur dix métiers lyonnais
          </Link>
          . Elles décrivent ce test, pas une loi.
        </p>
      </div>

      <h2 id="ce-qu-il-regarde">Ce que ChatGPT regarde vraiment en local</h2>
      <p>
        Le fait le plus net de notre relevé : pour chacun des dix métiers testés,{' '}
        <strong>ChatGPT n&apos;a ouvert aucune page d&apos;entreprise</strong>. Pas une seule
        visite. Il a consulté entre 11 et 14 fiches locales, en a nommé 5 à 8, et il a travaillé
        exclusivement sur les quelques lignes que sa recherche lui renvoie — des extraits
        d&apos;annuaires et de fiches Google.
      </p>
      <p>
        Cela déplace complètement le terrain. Un site refait à neuf, rapide et bien écrit ne pèse
        rien dans cette étape s&apos;il n&apos;existe nulle part ailleurs sous une forme lisible en
        trois lignes. C&apos;est la raison pour laquelle un concurrent au site médiocre peut vous
        passer devant.
      </p>

      <h2 id="categorie">1. Votre catégorie Google ne dit pas votre métier</h2>
      <p>
        C&apos;est la cause la plus brutale, parce qu&apos;elle ne vous fait pas descendre : elle
        vous efface. Sur la requête « architecte d&apos;intérieur », l&apos;entreprise la mieux
        notée de toute la liste consultée — <strong>71 avis</strong>, davantage que n&apos;importe
        quelle autre — a été écartée. ChatGPT a écrit chercher des professionnels « plutôt
        qu&apos;un simple décorateur » : la fiche Google de cette entreprise la classe{' '}
        <strong>« décoratrice »</strong>. À sa place, un cabinet à <strong>13 avis</strong> a été
        retenu. Cinq fois moins d&apos;avis, mais la bonne étiquette.
      </p>
      <p>
        <strong>Ce qu&apos;il faut faire :</strong> ouvrez votre fiche Google Business Profile et
        regardez la catégorie <em>principale</em>. Elle doit être exactement le métier sur lequel
        vous voulez être trouvé. C&apos;est une correction de deux minutes, gratuite, et la seule
        de cette liste qui puisse vous remettre dans la liste d&apos;un coup.
      </p>

      <h2 id="avis">2. Vous avez trop peu d&apos;avis pour entrer dans le champ</h2>
      <p>
        Chez les plombiers chauffagistes lyonnais, les entreprises recommandées affichaient{' '}
        <strong>entre 132 et 226 avis</strong>, aucune en dessous. Chez les électriciens, une
        entreprise à <strong>43 avis</strong> n&apos;apparaît pas, quand les recommandées se
        situent entre <strong>77 et 175</strong>.
      </p>
      <p>
        La corrélation est forte, elle n&apos;est pas absolue, et il faut le dire : chez les
        menuisiers, une entreprise à <strong>223 avis</strong> était absente, tandis que{' '}
        <strong>deux entreprises à 25 avis</strong> étaient recommandées. Le nombre d&apos;avis
        pèse lourd sans décider seul.
      </p>
      <p>
        <strong>Ce qu&apos;il faut faire :</strong> une demande d&apos;avis continue, pas une
        campagne. Un message court après chaque prestation terminée, toute l&apos;année. Les seuils
        observés ici sont propres à ces métiers et à cette ville, mais la direction est constante :
        sous une cinquantaine d&apos;avis, il faut autre chose pour exister.
      </p>

      <h2 id="annuaires">3. Aucune fiche ne vous décrit ailleurs que chez vous</h2>
      <p>
        Les sources citées dans les réponses revenaient toujours aux mêmes familles — Pages Jaunes,
        Houzz, Batup, Qualibat — et <strong>jamais le site de l&apos;entreprise</strong>. Deux
        exemples, parlants parce qu&apos;ils opposent deux concurrents du même métier.
      </p>
      <p>
        Un cuisiniste à 75 avis est cité en une ligne : son nom, rien de plus. Une concurrente à 45
        avis obtient un paragraphe entier — style, matériaux, démarche — grâce à une page Houzz
        détaillée que la première n&apos;a pas. Côté déménageurs, une entreprise notée 5/5 est
        mentionnée avec sa seule note ; une concurrente notée 4,4 est décrite en premier et plus
        longuement, grâce à une fiche Pages Jaunes renseignée.
      </p>
      <p>
        Être cité et être décrit sont deux résultats différents. Le premier vous met dans la liste,
        le second donne au lecteur une raison de vous appeler — et le second se joue sur des fiches
        que vous ne possédez pas.
      </p>
      <p>
        <strong>Ce qu&apos;il faut faire :</strong> deux ou trois fiches, entièrement renseignées,
        pas dix à moitié. Pages Jaunes pour tout le monde, puis la plateforme de référence de votre
        secteur — Houzz pour l&apos;aménagement, Doctolib pour la santé, les plateformes de
        réservation pour la restauration et le bien-être.
      </p>

      <h2 id="pages-prestation">4. Votre site n&apos;a pas de page par prestation</h2>
      <p>
        Votre site ne décide pas de l&apos;étape décrite plus haut, mais il décide de ce qui se
        passe ensuite : quand quelqu&apos;un vous a trouvé et cherche à vérifier, et quand un
        moteur en mode recherche va au-delà des annuaires.
      </p>
      <p>
        Une page « Nos services » qui énumère huit prestations en deux lignes chacune ne répond à
        aucune question. Une page par prestation, qui donne dès sa première phrase le prix, le
        délai et ce qui est inclus, en répond à une — et c&apos;est ce format que les moteurs
        reprennent.
      </p>
      <p>
        <strong>Ce qu&apos;il faut faire :</strong> listez les cinq questions que vos clients vous
        posent au téléphone. Une page chacune, la réponse en premier, les détails ensuite, une FAQ
        en bas. Notre guide{' '}
        <Link href="/blog/geo-commerce-local">
          être recommandé par les IA près de chez soi
        </Link>{' '}
        détaille ce travail page par page.
      </p>

      <h2 id="mauvais-test">5. Vous avez peut-être mal testé</h2>
      <p>
        Avant de conclure que vous êtes absent, vérifiez comment vous avez posé la question. Nous
        avons refait une partie des tests <strong>sans</strong> discussion temporaire, depuis un
        compte ordinaire : le comportement change. ChatGPT va chercher le nom de l&apos;entreprise
        présent dans la conversation et l&apos;intègre à sa recherche.
      </p>
      <p>
        Le piège fonctionne dans les deux sens. Un dirigeant qui teste sa visibilité depuis son
        compte habituel se voit cité et se croit visible : il mesurait sa propre requête, pas celle
        de ses clients.
      </p>
      <p>
        <strong>Ce qu&apos;il faut faire :</strong> discussion temporaire, aucun nom de marque dans
        la question, une formulation de client — le métier, la ville, le besoin — et plusieurs
        essais, parce que les réponses varient. La procédure complète est dans{' '}
        <Link href="/blog/savoir-si-chatgpt-parle-de-mon-entreprise">
          comment savoir si ChatGPT parle de votre entreprise
        </Link>
        .
      </p>

      <h2 id="par-ou-commencer">Par où commencer, dans l&apos;ordre</h2>
      <p>
        Aucune de ces actions ne garantit d&apos;être cité. Elles portent sur les signaux que les
        moteurs utilisent réellement, ce qui est la seule chose qu&apos;on puisse maîtriser.
      </p>
      <ol>
        <li>
          <strong>La catégorie Google, aujourd&apos;hui.</strong> Gratuite, immédiate, et la seule
          qui puisse vous retirer entièrement de la liste.
        </li>
        <li>
          <strong>La demande d&apos;avis, cette semaine.</strong> Un message après chaque
          prestation, installé une fois pour toutes.
        </li>
        <li>
          <strong>Deux fiches d&apos;annuaire renseignées, ce mois-ci.</strong> C&apos;est ce qui
          fait passer de « cité » à « décrit ».
        </li>
        <li>
          <strong>Une page par prestation, ensuite.</strong> Le chantier le plus long, et celui qui
          sert aussi vos clients humains.
        </li>
      </ol>
      <p>
        Avant tout cela, une vérification vaut la peine :{' '}
        <Link href="/verifier-visibilite-chatgpt">
          notre test gratuit vérifie que le robot de ChatGPT peut lire votre site
        </Link>
        . S&apos;il en est bloqué, le reste ne servira à rien.
      </p>

      <h2 id="limites">Ce que cette réponse ne garantit pas</h2>
      <ul>
        <li>
          <strong>Un seul moteur.</strong> Ces constats portent sur ChatGPT. Perplexity, Gemini et
          Claude sélectionnent autrement.
        </li>
        <li>
          <strong>Un seul instant, une seule ville.</strong> Septembre 2026, Lyon. Rien ne dit que
          les seuils d&apos;avis tiennent ailleurs, ni le mois prochain.
        </li>
        <li>
          <strong>Aucune causalité démontrée.</strong> Des corrélations sur dix cas. Le menuisier à
          223 avis absent suffit à montrer qu&apos;aucune règle simple n&apos;explique tout.
        </li>
        <li>
          <strong>Nous éditons un outil de mesure de visibilité IA.</strong> Cet article sert aussi
          notre discours. La méthode et les contre-exemples sont dans{' '}
          <Link href="/blog/chatgpt-artisans-lyon">l&apos;étude complète</Link> : jugez sur pièces.
        </li>
      </ul>
    </ArticleLayout>
  )
}
