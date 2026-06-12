import type { Metadata } from 'next'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('fichiers-qui-parlent-aux-ia')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <p>
        <strong>Réponse courte :</strong> trois éléments invisibles pour vos visiteurs font une
        vraie différence pour les IA : le fichier <strong>llms.txt</strong> (votre carte de
        visite pour les IA), les <strong>données structurées Schema.org</strong> (vos infos en
        format machine) et une <strong>FAQ balisée</strong> (vos réponses prêtes à citer).
        Aucun des trois ne demande de refondre votre site.
      </p>

      <h2>llms.txt — votre carte de visite pour les IA</h2>
      <p>
        Le llms.txt est un simple fichier texte placé à la racine de votre site
        (votresite.fr/llms.txt). Il se présente aux IA : qui vous êtes en une phrase, vos pages
        importantes, comment vous contacter. C&apos;est un standard récent — toutes les IA ne le
        lisent pas encore — mais il coûte 15 minutes et envoie un signal clair : « ce site
        s&apos;adresse aussi à vous ».
      </p>
      <h3>À mettre dedans</h3>
      <ul>
        <li>Une description d&apos;une ou deux phrases de votre activité (la plus importante).</li>
        <li>La liste de vos 5-10 pages clés avec un mot d&apos;explication.</li>
        <li>Vos coordonnées et votre zone d&apos;intervention.</li>
      </ul>

      <h2>Schema.org — vos infos en langage machine</h2>
      <p>
        Les données structurées sont des étiquettes JSON-LD glissées dans le code de vos pages.
        Invisibles à l&apos;écran, elles transforment « on devine que c&apos;est un restaurant »
        en « ceci EST un restaurant, ouvert du mardi au samedi, noté 4,7/5 ». Pour une petite
        entreprise, trois schémas suffisent :
      </p>
      <ul>
        <li>
          <strong>LocalBusiness</strong> : nom, adresse, horaires, téléphone, zone desservie.
          Le plus rentable pour une activité locale.
        </li>
        <li>
          <strong>Organization</strong> : votre fiche d&apos;identité (logo, description,
          contact) — celle que les IA reprennent quand elles parlent de vous.
        </li>
        <li>
          <strong>FAQPage</strong> : chaque question/réponse de votre FAQ, étiquetée comme
          telle.
        </li>
      </ul>
      <p>
        La mise en place est l&apos;affaire d&apos;une heure pour un webmaster (ou d&apos;un
        copier-coller si un outil vous génère le code). Vérifiez ensuite avec le test
        d&apos;enrichissement de Google que tout est valide.
      </p>

      <h2>La FAQ balisée — vos réponses prêtes à citer</h2>
      <p>
        Quand une IA construit sa réponse, le format question/réponse est ce qu&apos;elle reprend
        le plus volontiers : la question correspond à celle de l&apos;utilisateur, la réponse est
        déjà rédigée. Une bonne FAQ de site :
      </p>
      <ul>
        <li>reprend les <em>vraies</em> questions de vos clients (celles du téléphone) ;</li>
        <li>répond en 2-4 phrases, avec du concret (prix, délais, conditions) ;</li>
        <li>est balisée FAQPage en Schema.org — sinon elle reste du texte comme un autre.</li>
      </ul>

      <h2>Et le robots.txt dans tout ça ?</h2>
      <p>
        Le robots.txt ne « parle » pas aux IA, mais il leur ouvre (ou ferme) la porte. Vérifiez
        qu&apos;il n&apos;interdit pas GPTBot, ClaudeBot ou PerplexityBot — certains modèles de
        sites les bloquent par défaut « pour se protéger ». Se protéger des IA, en 2026,
        c&apos;est surtout se rendre invisible au moment où vos clients y posent leurs
        questions.
      </p>

      <h2>Checklist finale</h2>
      <ul>
        <li>votresite.fr/llms.txt existe et vous décrit en une phrase.</li>
        <li>votresite.fr/robots.txt n&apos;interdit pas les robots des IA.</li>
        <li>Vos pages clés portent un JSON-LD LocalBusiness ou Organization valide.</li>
        <li>Votre FAQ est balisée FAQPage.</li>
        <li>Bonus : un sitemap à jour et des dates de publication visibles sur vos contenus.</li>
      </ul>
    </ArticleLayout>
  )
}
