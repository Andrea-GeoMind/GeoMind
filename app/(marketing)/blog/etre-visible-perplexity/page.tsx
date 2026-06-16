import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('etre-visible-perplexity')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <p>
        Parmi les moteurs de réponse IA, Perplexity occupe une place à part : il affiche ses
        sources avec des numéros de référence visibles — [1], [2], [3] — directement dans la
        réponse. Autrement dit, quand votre site figure parmi ces sources, vos prospects voient
        votre nom, votre URL, et peuvent cliquer pour vous découvrir. C&apos;est la forme de
        visibilité GEO la plus concrète et la plus mesurable qui existe aujourd&apos;hui. Ce
        guide vous explique comment y accéder.
      </p>

      <h2>Comment Perplexity choisit ses sources</h2>
      <p>
        Contrairement à ChatGPT ou Gemini, Perplexity effectue une vraie recherche web en temps
        réel à chaque question posée. Il interroge plusieurs sources simultanément, compare leur
        contenu, puis sélectionne celles qui répondent le mieux à la question. Trois critères
        dominent ce choix :
      </p>
      <ul>
        <li>
          <strong>La fraîcheur :</strong> Perplexity privilégie les pages récemment mises à jour.
          Une page datant de 2019 non modifiée depuis a peu de chances d&apos;être sélectionnée
          face à un contenu actualisé en 2025.
        </li>
        <li>
          <strong>La clarté de la réponse :</strong> le moteur cherche des pages qui répondent
          directement à la question posée, en quelques phrases précises, sans noyer
          l&apos;information dans un flot de généralités.
        </li>
        <li>
          <strong>L&apos;autorité perçue :</strong> Perplexity recoupé plusieurs signaux pour
          évaluer si une source est fiable — présence sur d&apos;autres sites, ancienneté du
          domaine, cohérence du contenu avec ce que d&apos;autres sources affirment.
        </li>
      </ul>
      <p>
        La bonne nouvelle : ces critères sont maîtrisables. Vous n&apos;avez pas besoin
        d&apos;un budget publicitaire ni d&apos;un service SEO externalisé pour les satisfaire.
      </p>

      <h2>Ce qui vous rend « citable » par Perplexity</h2>

      <h3>Une réponse directe en tête de page</h3>
      <p>
        Perplexity lit le début de vos pages en priorité. Si votre page répond à une question
        précise — « quel est le délai moyen pour une installation de panneau solaire ? » — la
        réponse doit apparaître dans les premiers paragraphes, pas au bas d&apos;un article de
        2 000 mots. Une formulation du type « Le délai moyen est de 4 à 6 semaines » en
        ouverture est exactement ce que Perplexity cherche à citer.
      </p>

      <h3>Des données chiffrées et datées</h3>
      <p>
        Les chiffres sont le carburant des moteurs de réponse. Un contenu qui mentionne « en
        2025, 68 % des PME françaises déclarent... » est bien plus citable qu&apos;un texte
        qui dit « de nombreuses entreprises constatent... ». Ajoutez des statistiques, des
        fourchettes de prix, des pourcentages — et datez-les. Si ces chiffres viennent de
        sources reconnues, citez-les explicitement.
      </p>

      <h3>Un contenu récent et régulièrement mis à jour</h3>
      <p>
        La date de dernière modification d&apos;une page est un signal fort pour Perplexity.
        Repassez sur vos pages clés au moins une fois par trimestre : mettez à jour les
        chiffres, ajoutez une section « Mise à jour [mois année] », et republiez. Ce simple
        geste peut suffire à faire remonter une page dans les sources sélectionnées.
      </p>

      <h3>Une structure claire : titres et listes</h3>
      <p>
        Perplexity extrait les informations à la volée. Il lui est beaucoup plus facile de citer
        une liste à puces bien formée ou un paragraphe sous un titre explicite que de déchiffrer
        un texte en bloc sans organisation. Structurez chaque page avec des titres H2 et H3 qui
        décrivent précisément le contenu qui suit, et utilisez des listes dès que vous énumérez
        plus de deux éléments.
      </p>

      <h3>Des pages accessibles aux robots</h3>
      <p>
        Perplexity envoie ses propres robots (crawlers) pour lire vos pages. Si votre fichier
        robots.txt interdit l&apos;accès aux robots d&apos;exploration, ou si vos pages
        importantes sont protégées derrière un formulaire de connexion, Perplexity ne pourra
        pas les lire — et donc pas les citer. Vérifiez que vos pages publiques sont
        effectivement accessibles à tous les robots.
      </p>

      <h2>Les erreurs qui vous excluent</h2>
      <p>
        Certains problèmes courants suffisent à vous éliminer des sources de Perplexity, même
        si votre contenu est bon sur le fond :
      </p>
      <ul>
        <li>
          <strong>Le contenu vague :</strong> des formulations comme « nous vous accompagnons
          vers l&apos;excellence » ou « des solutions adaptées à vos besoins » ne contiennent
          aucune information extractible. Perplexity ne peut rien en faire.
        </li>
        <li>
          <strong>Le robots.txt trop restrictif :</strong> si votre hébergeur ou votre agence
          a bloqué certains user-agents par précaution, vérifiez que PerplexityBot
          n&apos;est pas dans la liste.
        </li>
        <li>
          <strong>Les pages lentes ou instables :</strong> un temps de chargement supérieur à
          3 secondes réduit la probabilité que le crawler de Perplexity aille au bout de la
          page. Optimisez vos images et évitez les scripts qui bloquent le rendu.
        </li>
        <li>
          <strong>L&apos;absence de sources externes :</strong> une page qui n&apos;est jamais
          citée ailleurs sur le web est difficile à valider pour Perplexity. Même une seule
          mention dans un annuaire professionnel ou un article de presse locale change la
          donne.
        </li>
      </ul>

      <h2>La présence hors de votre site compte</h2>
      <p>
        Perplexity ne se contente pas de lire votre site. Il recoupé l&apos;information avec
        d&apos;autres sources pour évaluer votre crédibilité. Votre présence en dehors de votre
        propre site peut donc vous faire apparaître dans les réponses, même si votre site
        n&apos;est pas directement cité.
      </p>
      <ul>
        <li>
          <strong>Annuaires professionnels :</strong> Pages Jaunes, Kompass, annuaires
          sectoriels — chaque entrée est une source que Perplexity peut croiser avec votre nom
          ou votre domaine.
        </li>
        <li>
          <strong>Avis en ligne :</strong> Google Business, Trustpilot, Avis Vérifiés —
          Perplexity lit ces plateformes et les cite régulièrement quand un utilisateur demande
          « quelle est la meilleure entreprise pour... ».
        </li>
        <li>
          <strong>Forums et communautés :</strong> une mention sur Reddit, un forum
          professionnel ou une communauté sectorielle peut suffire à vous faire apparaître dans
          une réponse Perplexity sur un sujet de niche.
        </li>
        <li>
          <strong>Presse locale et sectorielle :</strong> un article de journal régional ou
          une interview dans un magazine de votre secteur est l&apos;un des signaux
          d&apos;autorité les plus puissants aux yeux de Perplexity.
        </li>
      </ul>
      <p>
        La stratégie est simple : travaillez votre présence numérique globale, pas seulement
        votre site. Demandez à vos clients satisfaits de laisser un avis. Inscrivez-vous dans
        les annuaires gratuits de votre secteur. Répondez aux questions sur les forums où vos
        clients cherchent des conseils.
      </p>

      <h2>Comment mesurer votre présence dans Perplexity</h2>
      <p>
        La méthode la plus simple, et la plus immédiate, est aussi la plus directe : posez à
        Perplexity les questions que vos clients lui posent, puis regardez qui est cité.
      </p>
      <ul>
        <li>
          Listez les 5 à 10 questions que vos clients vous posent le plus souvent — par
          téléphone, par email, lors d&apos;un premier rendez-vous.
        </li>
        <li>
          Tapez chacune de ces questions dans Perplexity (perplexity.ai), sans mentionner
          votre nom ni votre domaine.
        </li>
        <li>
          Notez les sources [1][2][3] affichées. Figurez-vous parmi elles ? Si non, qui
          y figure à votre place, et quel type de contenu ont-ils publié ?
        </li>
        <li>
          Répétez cet exercice chaque mois pour observer votre progression après vos
          améliorations.
        </li>
      </ul>
      <p>
        Un outil comme GeoMind automatise ce suivi : il pose vos questions à Perplexity —
        et aux autres moteurs IA — sur une base régulière, vous indique quand et comment vous
        êtes cité, et calcule une tendance sur 30 jours. Vous passez ainsi de quelques heures
        de travail manuel par mois à un tableau de bord actualisé en permanence.
      </p>
      <p>
        Pour compléter cette approche, lisez aussi notre guide sur{' '}
        <Link href="/blog/comment-etre-cite-par-chatgpt">comment être cité par ChatGPT</Link>{' '}
        — les principes se recoupent, mais les signaux prioritaires diffèrent selon le moteur.
        Et si vous souhaitez aller plus loin sur la structure technique de vos pages,
        notre article sur les{' '}
        <Link href="/blog/fichiers-qui-parlent-aux-ia">fichiers qui parlent aux IA</Link>{' '}
        vous guidera pas à pas.
      </p>

      <h2>Plan d&apos;action pour apparaître dans Perplexity</h2>
      <ul>
        <li>
          <strong>Cette semaine :</strong> posez vos 5 questions clients à Perplexity et notez
          qui est cité. Identifiez le contenu de vos concurrents qui ressort.
        </li>
        <li>
          <strong>Semaine 2 :</strong> vérifiez votre robots.txt — assurez-vous que
          PerplexityBot n&apos;est pas bloqué. Contrôlez la vitesse de chargement de vos
          pages clés (Google PageSpeed Insights suffit).
        </li>
        <li>
          <strong>Semaine 3 :</strong> repassez sur vos 3 pages les plus importantes. Ajoutez
          une réponse directe en ouverture, des chiffres datés, et une structure en titres et
          listes. Mettez à jour la date de modification.
        </li>
        <li>
          <strong>Semaine 4 :</strong> vérifiez votre présence dans au moins 5 annuaires
          professionnels. Demandez à 3 clients satisfaits de laisser un avis Google.
        </li>
        <li>
          <strong>Chaque mois :</strong> répétez les questions dans Perplexity, comparez les
          sources avec le mois précédent, et identifiez la prochaine page à améliorer.
        </li>
        <li>
          <strong>En continu :</strong> publiez au rythme d&apos;au moins une page par mois
          qui répond à une vraie question client — fraîcheur et pertinence sont les deux
          leviers les plus durables.
        </li>
      </ul>
    </ArticleLayout>
  )
}
