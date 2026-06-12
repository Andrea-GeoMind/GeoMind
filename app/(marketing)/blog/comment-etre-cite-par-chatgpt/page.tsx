import type { Metadata } from 'next'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('comment-etre-cite-par-chatgpt')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <p>
        <strong>Réponse courte :</strong> ChatGPT cite les entreprises dont il peut lire,
        comprendre et vérifier les informations. Pour être cité, il faut donc trois choses : un
        site lisible par les robots des IA, un contenu qui répond aux vraies questions de vos
        clients, et des traces de votre existence ailleurs que chez vous (annuaires, presse,
        avis). Voici les 5 actions, dans l&apos;ordre.
      </p>

      <h2>1. Vérifiez que les IA peuvent lire votre site</h2>
      <p>
        Avant d&apos;optimiser quoi que ce soit : les robots des IA (GPTBot pour OpenAI,
        ClaudeBot pour Anthropic, PerplexityBot…) doivent pouvoir visiter vos pages. Trois
        vérifications de 5 minutes :
      </p>
      <ul>
        <li>
          Votre fichier <strong>robots.txt</strong> (tapez votresite.fr/robots.txt) ne doit pas
          bloquer ces robots.
        </li>
        <li>
          Un <strong>sitemap</strong> (votresite.fr/sitemap.xml) doit lister vos pages.
        </li>
        <li>
          Votre site doit être en <strong>HTTPS</strong> et se charger en moins de 3 secondes.
        </li>
      </ul>

      <h2>2. Répondez aux questions que vos clients posent vraiment</h2>
      <p>
        Les IA ne citent pas les sites qui « parlent d&apos;eux » — elles citent les sites qui{' '}
        <strong>répondent</strong>. Demandez-vous : qu&apos;est-ce que mes clients tapent dans
        ChatGPT ? « Combien coûte une terrasse en bois ? », « Quel expert-comptable pour un
        auto-entrepreneur ? »… Chaque question mérite une page (ou une section) qui y répond
        directement, dès la première phrase, avec des chiffres concrets quand c&apos;est
        possible.
      </p>
      <h3>Le format qui marche</h3>
      <ul>
        <li>La réponse d&apos;abord, les détails ensuite (les IA lisent comme des gens pressés).</li>
        <li>Des titres clairs en forme de questions.</li>
        <li>Une FAQ en bas de page — les IA adorent reprendre les FAQ.</li>
        <li>Des chiffres, des fourchettes de prix, des délais : le concret se cite.</li>
      </ul>

      <h2>3. Étiquetez vos informations (Schema.org)</h2>
      <p>
        Les données structurées sont des étiquettes invisibles qui disent aux machines « ceci est
        mon adresse, ceci est une FAQ, ceci est un avis client ». Sans elles, l&apos;IA devine ;
        avec elles, elle sait. Les trois plus utiles pour une petite entreprise :{' '}
        <strong>LocalBusiness</strong> (qui vous êtes, où, quand), <strong>FAQPage</strong> (vos
        questions/réponses) et <strong>Organization</strong>. Votre webmaster peut les ajouter en
        une heure — ou GeoMind vous génère le code prêt à coller.
      </p>

      <h2>4. Existez ailleurs que chez vous</h2>
      <p>
        Quand une IA répond « les meilleurs plombiers de Lyon », elle s&apos;appuie sur des
        sources qu&apos;elle juge fiables : annuaires reconnus, presse locale, forums, fiches
        Google. Si vous n&apos;existez que sur votre propre site, vous n&apos;avez qu&apos;une
        seule voix. Inscrivez-vous sur les annuaires sérieux de votre secteur, soignez votre
        fiche Google Business, et répondez aux journalistes locaux quand l&apos;occasion se
        présente.
      </p>

      <h2>5. Mesurez, corrigez, recommencez</h2>
      <p>
        La visibilité IA n&apos;est pas un coup d&apos;un soir : c&apos;est une tendance.
        Posez les questions de vos clients aux IA une fois par mois (ou laissez un outil le
        faire automatiquement), notez si vous apparaissez, corrigez un point faible à la fois,
        et re-mesurez. Les premières citations arrivent en général après quelques semaines de
        corrections sérieuses — et chaque citation en amène d&apos;autres.
      </p>

      <h2>Les erreurs qui vous coûtent des citations</h2>
      <ul>
        <li>Un site uniquement en images ou en animations (les IA lisent du texte).</li>
        <li>Aucune page « À propos » ni mention de qui vous êtes (signal de confiance).</li>
        <li>Des pages sans titre clair ni structure (l&apos;IA ne comprend pas le sujet).</li>
        <li>Bloquer tous les robots par peur du scraping — c&apos;est se rendre invisible.</li>
      </ul>
    </ArticleLayout>
  )
}
