import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('suivre-citations-ia')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <p>
        En SEO, vous connaissez votre position sur Google. Vous pouvez la vérifier en trente
        secondes, la comparer d&apos;une semaine sur l&apos;autre, et décider si votre dernière
        action a porté ses fruits. En GEO, la plupart des entreprises naviguent à l&apos;aveugle :
        elles publient du contenu, espèrent être citées par ChatGPT ou Perplexity, et ne savent
        jamais vraiment si quelque chose s&apos;améliore. Ce manque de mesure est la première cause
        d&apos;échec des stratégies GEO. On n&apos;optimise bien que ce que l&apos;on mesure — et
        suivre ses citations dans les IA, c&apos;est précisément la boussole qui manque.
      </p>

      <h2>Pourquoi un score instantané ne veut rien dire</h2>
      <p>
        La première tentation est de poser une question à ChatGPT, de vérifier si votre
        entreprise apparaît, et d&apos;en conclure que « vous y êtes » ou « vous n&apos;y êtes
        pas ». Cette approche est trompeuse.
      </p>
      <p>
        Les modèles de langage sont par nature non déterministes : posez la même question deux
        fois de suite dans deux fenêtres différentes, et vous obtiendrez souvent deux réponses
        distinctes. Les sources citées changent, l&apos;ordre varie, certains noms apparaissent
        ou disparaissent. Cela ne reflète pas une évolution de votre visibilité — c&apos;est
        simplement la nature des IA génératives.
      </p>
      <p>
        Ce qui compte, ce n&apos;est pas une photo à un instant T. C&apos;est une <strong>tendance
        sur 30 à 90 jours</strong>. Si, en janvier, vous étiez cité dans 2 réponses sur 10 et
        qu&apos;en mars vous l&apos;êtes dans 6 réponses sur 10 sur les mêmes questions, quelque
        chose a fonctionné. À l&apos;inverse, une baisse régulière est le signal qu&apos;un
        concurrent a renforcé son autorité ou que votre contenu a perdu en pertinence. C&apos;est
        cette courbe qui a de la valeur, pas le chiffre du jour.
      </p>

      <h2>Quoi suivre exactement</h2>
      <p>
        Un suivi GEO rigoureux ne se limite pas à « est-ce qu&apos;on me cite ? ». Voici les
        cinq dimensions à mesurer.
      </p>

      <h3>Le taux de citation sur vos questions clés</h3>
      <p>
        Pour chaque question que vos clients posent réellement aux IA, combien de fois votre
        entreprise apparaît-elle dans la réponse ? Exprimé en pourcentage sur un ensemble de
        passages (par exemple 10 passages de la même question), ce taux est votre indicateur
        principal. Il se compare dans le temps et entre moteurs.
      </p>

      <h3>La position dans la réponse</h3>
      <p>
        Être cité existe, mais être cité en premier dans une réponse ou mentionné au passage en
        dixième position n&apos;a pas le même impact. Les utilisateurs lisent les réponses IA
        comme un texte continu : ce qui vient en tête reste en tête. Suivez donc non seulement
        si vous êtes cité, mais à quel rang.
      </p>

      <h3>Qui est cité à votre place</h3>
      <p>
        Lorsque vous n&apos;apparaissez pas, quelqu&apos;un d&apos;autre occupe la place. Notez
        systématiquement les noms cités à la place du vôtre : ce sont vos concurrents GEO
        directs. Analyser ce qu&apos;ils font différemment — la structure de leur contenu, leur
        présence sur des sites tiers, la clarté de leur positionnement — vous donnera les pistes
        concrètes à travailler.
      </p>

      <h3>L&apos;évolution dans le temps</h3>
      <p>
        Consignez vos mesures à date fixe, idéalement toutes les deux semaines ou une fois par
        mois sur les mêmes questions. C&apos;est la comparaison dans le temps — avant et après
        une action (publication d&apos;un article, obtention d&apos;une mention presse, refonte
        d&apos;une page) — qui vous permettra d&apos;établir des relations de cause à effet.
        Sans historique, chaque mesure reste un chiffre isolé.
      </p>

      <h3>La répartition par moteur IA</h3>
      <p>
        ChatGPT, Perplexity, Gemini et Claude n&apos;ont pas les mêmes sources d&apos;entraînement
        ni les mêmes mécanismes de recherche. Votre taux de citation peut être excellent sur
        Perplexity (qui indexe le web en temps réel) et quasi nul sur ChatGPT (dont les
        connaissances sont partiellement gelées). Suivre chaque moteur séparément vous permet
        d&apos;identifier où concentrer vos efforts.
      </p>

      <h2>Comment mettre en place un suivi fiable</h2>
      <p>
        La méthode manuelle est accessible à toute entreprise. Elle demande de la rigueur, pas
        de compétences techniques.
      </p>
      <p>
        <strong>Première étape : définissez 5 à 10 questions clients réelles et neutres.</strong>{' '}
        Cherchez dans vos e-mails, vos appels commerciaux, vos formulaires de contact. Quelles
        sont les questions que vos prospects posent avant d&apos;acheter ? Formulez-les comme un
        client les poserait à une IA — sans jamais y inclure votre nom de marque. Par exemple :
        « Quel logiciel de comptabilité choisir pour une PME française ? » plutôt que « Est-ce
        que [Votre Marque] est un bon logiciel de comptabilité ? ». Les questions non neutres
        biaisent les résultats et ne reflètent pas la réalité de votre visibilité.
      </p>
      <p>
        <strong>Deuxième étape : posez ces questions régulièrement, dans des conditions
        standardisées.</strong> Ouvrez une fenêtre de navigation privée pour chaque passage,
        afin d&apos;éliminer les biais liés à votre historique de conversation. Posez chaque
        question dans ChatGPT, Perplexity, Gemini et Claude. Notez les résultats dans un
        tableur : date, moteur IA, question, votre entreprise citée (oui/non), position
        approximative, noms des entreprises citées à votre place.
      </p>
      <p>
        <strong>Troisième étape : comparez sur 30 jours.</strong> Une mesure isolée ne sert à
        rien. Après quatre à huit semaines, vous verrez des tendances : certaines questions
        s&apos;améliorent, d&apos;autres stagnent. C&apos;est à ce moment que le suivi devient
        exploitable.
      </p>

      <h2>À la main ou avec un outil</h2>
      <p>
        La méthode manuelle décrite ci-dessus est <em>faisable</em>. Elle est aussi chronophage
        et sujette aux erreurs humaines : une fenêtre oubliée en mode normal, une question
        légèrement reformulée d&apos;un mois sur l&apos;autre, une cellule mal remplie dans le
        tableur — et vos données perdent leur fiabilité.
      </p>
      <p>
        Pour 5 questions, 4 moteurs IA, et 10 passages par question, vous parlez de 200 tests
        par mois. En pratique, la plupart des entreprises abandonnent après quelques semaines,
        faute de temps.
      </p>
      <p>
        Un outil spécialisé comme{' '}
        <Link href="/blog/choisir-outil-visibilite-ia">un outil dédié à la visibilité IA</Link>{' '}
        automatise exactement ce travail : il pose vos questions aux différents moteurs à
        intervalles réguliers, dans des conditions standardisées, et calcule automatiquement
        votre taux de citation, votre position moyenne et votre tendance sur 30 jours. Il vous
        alerte quand votre visibilité baisse et vous montre précisément qui vous supplante. Ce
        que vous feriez en plusieurs heures par mois se fait en quelques minutes de lecture.
      </p>
      <p>
        Si vous débutez et souhaitez d&apos;abord comprendre la mécanique, commencez à la main.
        Dès que le suivi devient sérieux — plus de 3 questions, plus d&apos;un site à surveiller
        — un outil devient rapidement rentable en temps.
      </p>

      <h2>Transformer le suivi en actions</h2>
      <p>
        Mesurer sans agir, c&apos;est regarder le thermomètre sans ouvrir la fenêtre. Chaque
        signal issu de votre suivi doit se traduire en action concrète.
      </p>
      <p>
        <strong>Vous n&apos;êtes pas cité du tout sur une question clé ?</strong> Vérifiez
        d&apos;abord la technique : votre site est-il bien crawlable par les robots IA ? Vos
        données structurées (schema.org) décrivent-elles clairement votre activité ? Si la
        technique est bonne, le problème vient du contenu : avez-vous une page ou un article qui
        répond précisément à cette question, avec une réponse directe dès le premier paragraphe ?
      </p>
      <p>
        <strong>Vous étiez cité et vous ne l&apos;êtes plus ?</strong> C&apos;est souvent le
        signe qu&apos;un concurrent a publié quelque chose de plus complet ou obtenu une mention
        sur un site à forte autorité (presse, Wikipédia, annuaires de référence). La piste à
        creuser est l&apos;autorité : êtes-vous mentionné en dehors de votre propre site ?
      </p>
      <p>
        <strong>Vous êtes cité, mais en bas de réponse ?</strong> La structure de votre contenu
        est peut-être en cause. Les IA citent en priorité les sources qui donnent une réponse
        directe, structurée, factuelle. Un contenu trop vague, trop long à aller au fait, ou
        sans données concrètes sera cité après ceux qui vont droit au but.
      </p>
      <p>
        Chaque baisse ou absence est une hypothèse de travail, pas une fatalité. Le suivi vous
        donne l&apos;information ; c&apos;est l&apos;analyse de la cause qui déclenche
        l&apos;action juste. Pour approfondir la démarche, lisez aussi notre article sur{' '}
        <Link href="/blog/savoir-si-chatgpt-parle-de-mon-entreprise">
          comment savoir si ChatGPT parle de votre entreprise
        </Link>
        .
      </p>

      <h2>Par où commencer</h2>
      <ul>
        <li>
          <strong>Listez 5 questions</strong> que vos clients posent avant d&apos;acheter votre
          produit ou service — formulées sans votre nom de marque.
        </li>
        <li>
          <strong>Posez-les ce soir</strong> dans ChatGPT et Perplexity, en navigation privée.
          Notez si votre entreprise apparaît et qui est cité à votre place.
        </li>
        <li>
          <strong>Créez un tableur simple</strong> : date, moteur, question, cité (oui/non),
          position, concurrents cités.
        </li>
        <li>
          <strong>Répétez dans 30 jours</strong> dans les mêmes conditions. La tendance commencera
          à apparaître.
        </li>
        <li>
          <strong>Identifiez la première action</strong> à partir de vos résultats : technique,
          contenu ou autorité — puis agissez sur un seul levier à la fois pour mesurer son effet.
        </li>
        <li>
          <strong>Si le volume devient trop lourd</strong>, évaluez un outil qui automatise la
          collecte et calcule les tendances à votre place.
        </li>
      </ul>
      <p>
        La visibilité dans les IA n&apos;est pas le fruit du hasard : c&apos;est le résultat
        d&apos;un travail régulier, mesuré et ajusté. Le suivi des citations est le point de
        départ de tout le reste. Sans lui, vous investissez dans du contenu ou de l&apos;autorité
        sans jamais savoir si cela porte ses fruits. Avec lui, chaque action devient vérifiable
        — et votre stratégie GEO, progressivement, prend forme.
      </p>
    </ArticleLayout>
  )
}
