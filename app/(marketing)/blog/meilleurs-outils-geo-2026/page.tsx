import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('meilleurs-outils-geo-2026')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

/** Date du relevé de prix — répétée dans le texte, le tableau et les sources. */
const RELEVE = '22 septembre 2026'

interface ToolRow {
  name: string
  price: string
  engines: string
  language: string
  target: string
}

// Ordre alphabétique : un tableau trié par prix ou par « note » placerait
// GeoMind en tête, et c'est exactement ce qu'un lecteur ne croirait pas.
const ROWS: ToolRow[] = [
  {
    name: 'Ahrefs Brand Radar',
    price: '50 $/mois inclus dans un plan Ahrefs (dès 129 $) · 199 $/mois en autonome',
    engines: 'AI Overviews, AI Mode, ChatGPT, Perplexity, Gemini, Copilot (6)',
    language: 'Français disponible',
    target: 'Équipes SEO',
  },
  {
    name: 'GeoMind',
    price: 'Gratuit (1 site), puis 19 €/mois',
    engines: 'ChatGPT, Claude, Gemini, Perplexity (4)',
    language: 'Français',
    target: 'TPE et PME françaises',
  },
  {
    name: 'ia-rank.com',
    price: '9 € la 1re semaine, puis 99 €/mois',
    engines: 'ChatGPT, Gemini, Claude, Perplexity (4 annoncés)',
    language: 'Français',
    target: 'TPE, commerces locaux',
  },
  {
    name: 'Meteoria',
    price: '75 €/mois',
    engines:
      '3 au choix parmi 8 annoncés (ChatGPT, AI Overviews, AI Mode, Gemini, Perplexity, Grok, Copilot, Claude)',
    language: 'Français',
    target: 'PME, agences, grands comptes',
  },
  {
    name: 'Otterly.ai',
    price: '29 $/mois',
    engines: 'ChatGPT, AI Overviews, Perplexity, Copilot (4) · Gemini, Claude, AI Mode en option',
    language: 'Anglais',
    target: 'Indépendants, petites équipes',
  },
  {
    name: 'Peec AI',
    price: '85 €/mois',
    engines: '3 au choix parmi ChatGPT, AI Mode, AI Overviews, Copilot, Gemini, Naver',
    language: 'Anglais',
    target: 'Équipes SEO, agences',
  },
  {
    name: 'Profound',
    price: 'Pas de prix public (essai 7 jours)',
    engines: 'Essai : ChatGPT, Gemini, AI Overviews · contrat : jusqu’à 9',
    language: 'Anglais',
    target: 'Grands comptes',
  },
  {
    name: 'Qwairy',
    price: '79 € HT/mois (65 € en annuel)',
    engines:
      'ChatGPT, Perplexity, Gemini, Claude, Copilot, AI Overviews, AI Mode, Grok, Mistral, DeepSeek (10)',
    language: 'Anglais (éditeur français)',
    target: 'PME, agences, équipes SEO',
  },
  {
    name: 'Scrunch AI',
    price: '300 $/mois (250 $ en annuel)',
    engines: 'ChatGPT, Claude, Gemini, Perplexity, AI Mode, AI Overviews, Meta (7)',
    language: 'Anglais',
    target: 'Marques, agences',
  },
  {
    name: 'Semrush AI Visibility Toolkit',
    price: '94,94 €/mois par domaine, engagement annuel',
    engines: 'ChatGPT, Google AI, Gemini, Perplexity (4)',
    language: 'Français disponible',
    target: 'PME et agences équipées Semrush',
  },
  {
    name: 'Writesonic',
    price: '79 $/mois, engagement annuel',
    engines: 'ChatGPT, Gemini, AI Overviews (3) · 10 en contrat entreprise',
    language: 'Anglais',
    target: 'Équipes contenu',
  },
  {
    name: 'Yext Scout',
    price: 'Sur devis, facturé par établissement',
    engines: 'AI Overviews, ChatGPT, Gemini, Claude, Perplexity (5)',
    language: 'Anglais',
    target: 'Réseaux multi-établissements',
  },
]

interface Source {
  tool: string
  label: string
  href: string
}

const SOURCES: Source[] = [
  { tool: 'Otterly.ai', label: 'otterly.ai/pricing', href: 'https://otterly.ai/pricing/' },
  {
    tool: 'Otterly.ai',
    label: 'help.otterly.ai — plans et moteurs inclus',
    href: 'https://help.otterly.ai/pricing-of-otterlyai',
  },
  { tool: 'Meteoria', label: 'meteoria.ai', href: 'https://meteoria.ai' },
  {
    tool: 'Meteoria',
    label: 'meteoria.ai — Meteoria vs Qwairy (moteurs et plans)',
    href: 'https://meteoria.ai/blog/meteoria-vs-qwairy',
  },
  { tool: 'Qwairy', label: 'qwairy.co/pricing', href: 'https://qwairy.co/pricing' },
  { tool: 'Peec AI', label: 'peec.ai/pricing', href: 'https://peec.ai/pricing' },
  {
    tool: 'Profound',
    label: 'tryprofound.com/pricing',
    href: 'https://www.tryprofound.com/pricing',
  },
  { tool: 'Scrunch AI', label: 'scrunch.com/pricing', href: 'https://scrunch.com/pricing/' },
  {
    tool: 'Ahrefs Brand Radar',
    label: 'ahrefs.com/brand-radar',
    href: 'https://ahrefs.com/brand-radar',
  },
  {
    tool: 'Ahrefs',
    label: 'help.ahrefs.com — changer la langue de l’interface',
    href: 'https://help.ahrefs.com/fr/articles/852478-comment-puis-je-changer-la-langue-de-l-interface-ahrefs',
  },
  {
    tool: 'Semrush AI Visibility Toolkit',
    label: 'semrush.com/pricing/ai',
    href: 'https://www.semrush.com/pricing/ai/',
  },
  { tool: 'Writesonic', label: 'writesonic.com/pricing', href: 'https://writesonic.com/pricing' },
  {
    tool: 'Yext Scout',
    label: 'yext.com/platform/scout',
    href: 'https://www.yext.com/platform/scout',
  },
  { tool: 'ia-rank.com', label: 'ia-rank.com/tarifs', href: 'https://ia-rank.com/tarifs' },
  { tool: 'Tenten GEO', label: 'geo.tenten.co', href: 'https://geo.tenten.co/en' },
  { tool: 'seo.fr', label: 'seo.fr/agence-geo', href: 'https://www.seo.fr/agence-geo' },
  { tool: 'GeoMind', label: 'geomind.fr/pricing', href: 'https://geomind.fr/pricing' },
]

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  )
}

export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <p>
        <strong>Pour une TPE ou un artisan français</strong>, GeoMind (gratuit, puis 19 €/mois, en
        français) ou Otterly.ai (29 $/mois, en anglais).{' '}
        <strong>Pour une PME française qui veut un relevé quotidien</strong>, Meteoria (75 €/mois,
        en français) ou Qwairy (79 € HT/mois, dix moteurs).{' '}
        <strong>Pour une équipe SEO déjà équipée</strong>, le module de Semrush (94,94 €/mois) ou
        d’Ahrefs (199 $/mois en autonome).{' '}
        <strong>Pour une marque qui suit des centaines de questions</strong>, Peec AI dès 85 €/mois,
        Scrunch AI à 300 $/mois, ou Profound sur devis. Le détail, les limites de chacun — les
        nôtres comprises — et les sources sont ci-dessous.
      </p>

      <h2 id="comment-nous-avons-compare">Comment nous avons comparé</h2>
      <p>
        Une précision avant tout : <strong>nous éditons GeoMind</strong>, l’un des douze outils de
        ce comparatif. Nous l’avons traité avec la même grille que les autres, ses limites sont
        écrites au même endroit que celles des concurrents, et le tableau est classé par ordre
        alphabétique — pas par un score qui nous mettrait en tête.
      </p>
      <p>
        Les prix ont été relevés le {RELEVE} sur les pages de tarifs des éditeurs, listées en{' '}
        <a href="#sources">bas de page</a>. Quand un éditeur n’affiche plus de prix (Profound,
        Yext), nous le disons plutôt que de recopier un chiffre de blog. Les prix sont donnés dans
        la devise affichée par l’éditeur, sans conversion : un dollar et un euro ne sont pas la même
        chose, et les taux bougent. Les moteurs indiqués sont ceux de l’offre d’entrée, car c’est
        celle que vous testerez en premier — beaucoup d’outils n’ouvrent leur couverture complète
        qu’en contrat entreprise.
      </p>
      <p>
        Six critères par outil : prix réel d’entrée, moteurs couverts, langue de l’interface, cible,
        point fort, point faible. Ce sont ceux de notre guide{' '}
        <Link href="/blog/choisir-outil-visibilite-ia">
          comment choisir un outil de visibilité IA
        </Link>
        , qui explique pourquoi ils comptent. Ici, on les applique.
      </p>

      <h2 id="le-tableau-comparatif">Le tableau comparatif</h2>
      <div className="not-prose overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">
            Comparatif des outils GEO — prix d’entrée, moteurs couverts, langue et cible, relevé du{' '}
            {RELEVE}
          </caption>
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Outil
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Prix d’entrée public
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Moteurs IA (offre d’entrée)
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Langue
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Cible
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ROWS.map((row) => (
              <tr key={row.name} className="align-top">
                <th scope="row" className="px-4 py-3 font-semibold text-foreground">
                  {row.name}
                </th>
                <td className="px-4 py-3 text-foreground/85">{row.price}</td>
                <td className="px-4 py-3 text-foreground/85">{row.engines}</td>
                <td className="px-4 py-3 text-foreground/85">{row.language}</td>
                <td className="px-4 py-3 text-foreground/85">{row.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground">
        Relevé du {RELEVE}. « AI Overviews » et « AI Mode » désignent les deux formats de réponse IA
        de Google (voir le <Link href="/glossaire#ai-overviews">glossaire</Link>). Les agences qui
        vendent un accompagnement plutôt qu’un outil sont traitées{' '}
        <a href="#deleguer">en fin d’article</a>.
      </p>
      <p>
        Les sections qui suivent vont du tarif d’entrée le plus bas au plus haut, puis les offres
        sans prix public. GeoMind vient en dernier : c’est notre outil, et vous lirez sa fiche avec
        le reste en tête.
      </p>

      <h2 id="otterly">Otterly.ai à 29 $/mois : est-ce suffisant ?</h2>
      <p>
        <strong>Prix.</strong> Lite à 29 $/mois (25 $ en annuel), Standard à 189 $, Premium à 489 $,
        Enterprise sur devis. Essai gratuit sans carte bancaire.
      </p>
      <p>
        <strong>Moteurs.</strong> ChatGPT, Google AI Overviews, Perplexity et Microsoft Copilot dans
        tous les plans. Gemini, Google AI Mode et Claude sont des options payantes : de 9 à 149
        $/mois pour Gemini ou AI Mode, et de 29 à 439 $/mois pour Claude selon le plan.
      </p>
      <p>
        <strong>Langue et cible.</strong> Interface en anglais. Pensé pour un indépendant ou une
        petite équipe marketing qui veut un suivi quotidien sans budget d’agence.
      </p>
      <p>
        <strong>Point fort.</strong> C’est le tarif d’entrée le plus bas du marché pour un{' '}
        <em>suivi quotidien</em> : 15 questions relevées chaque jour sur quatre moteurs, avec
        historique, pour moins de 30 $. Le plan Lite inclut aussi 1 000 audits d’URL par mois.
      </p>
      <p>
        <strong>Point faible.</strong> 15 questions, c’est peu — assez pour une activité locale, pas
        pour une marque multi-gammes. Et la couverture complète coûte vite cher : ajouter Claude au
        plan Lite revient à doubler la facture. Les questions générées sont en anglais par défaut ;
        vous pouvez saisir les vôtres en français, mais il faut le faire.
      </p>

      <h2 id="meteoria">Meteoria : que vaut le suivi quotidien à 75 €/mois ?</h2>
      <p>
        <strong>Prix.</strong> Starter à 75 €/mois pour 25 questions relevées chaque jour, Pro à 175
        € (100 questions), Advanced à 420 € (300 questions), Enterprise à partir de 700 €. Deux mois
        offerts en annuel. Essai gratuit d’une semaine, sans carte bancaire. Sièges, projets,
        marques et pays illimités sur tous les plans.
      </p>
      <p>
        <strong>Moteurs.</strong> Huit annoncés — ChatGPT, Google AI Overviews, AI Mode, Gemini,
        Perplexity, Grok, Copilot et Claude — mais <em>trois au choix par plan</em>. Au moment du
        relevé, Claude figure dans la liste des huit sur une page du site et « à venir » sur une
        autre : vérifiez avant de le choisir.
      </p>
      <p>
        <strong>Langue et cible.</strong> Plateforme et support en français, éditeur français,
        hébergement en Europe. Cible affichée : des PME aux grands comptes, avec des références
        comme Cdiscount, La Poste ou Matmut, et les agences SEO.
      </p>
      <p>
        <strong>Point fort.</strong> La rigueur de la mesure : chaque question est relevée
        quotidiennement avec 15 à 30 passes pour lisser la variabilité des réponses, là où la
        plupart des outils font un seul passage. Le tout en français, avec les sources citées et la
        corrélation au trafic via Google Analytics, Matomo ou Looker Studio.
      </p>
      <p>
        <strong>Point faible.</strong> Trois moteurs sur huit au plan d’entrée, c’est un arbitrage
        de plus qu’avec Qwairy au même prix. Et 25 questions à 75 €, c’est le ratio le plus serré
        des outils français : suffisant pour un site, pas pour un portefeuille de marques.
      </p>

      <h2 id="writesonic">Writesonic mesure-t-il ou rédige-t-il ?</h2>
      <p>
        <strong>Prix.</strong> Starter à 79 $/mois, Basic à 199 $, Growth à 399 $ — tous facturés à
        l’année (948 $, 2 388 $ et 4 788 $). Enterprise sur devis. Essai gratuit sans carte.
      </p>
      <p>
        <strong>Moteurs.</strong> ChatGPT, Gemini et Google AI Overviews sur les trois plans
        publics. Perplexity, Claude, Grok, DeepSeek, Copilot, Meta AI et AI Mode — dix moteurs au
        total — ne sont ouverts qu’en contrat entreprise.
      </p>
      <p>
        <strong>Langue et cible.</strong> Interface en anglais. Cible : les équipes contenu qui
        produisent déjà des articles et veulent mesurer leur effet dans les IA.
      </p>
      <p>
        <strong>Point fort.</strong> Rédaction et mesure dans le même outil : 15 articles par mois
        et 10 audits de site sont inclus dès le premier plan, avec 50 questions suivies
        quotidiennement. Pour une équipe qui achète déjà un rédacteur IA, le suivi vient en plus.
      </p>
      <p>
        <strong>Point faible.</strong> Trois moteurs seulement hors contrat entreprise : ni
        Perplexity ni Claude, alors que ce sont deux moteurs que vos clients B2B utilisent. Et
        l’engagement annuel est obligatoire : 79 $/mois signifie 948 $ d’un coup.
      </p>

      <h2 id="qwairy">Qwairy couvre-t-il vraiment dix moteurs à 79 € ?</h2>
      <p>
        <strong>Prix.</strong> Starter à 79 € HT/mois (65 € en annuel, facturé 790 €) pour 100
        questions et un espace de travail, Growth à 199 € (165 € en annuel) pour 300 questions et
        cinq espaces, Business à 449 € (374 €) pour 800 questions et vingt espaces, Enterprise sur
        devis. Un plan gratuit de 120 crédits permet d’essayer sans carte bancaire.
      </p>
      <p>
        <strong>Moteurs.</strong> Dix, dès le premier plan : ChatGPT, Perplexity, Gemini, Claude,
        Copilot, Google AI Overviews, AI Mode, Grok, Mistral et DeepSeek. C’est la couverture la
        plus large du comparatif à prix public, et la seule à inclure Mistral.
      </p>
      <p>
        <strong>Langue et cible.</strong> Éditeur français (« Made in France », données hébergées en
        Europe), mais site et interface en anglais au moment du relevé. Cible : les PME, les agences
        et les équipes SEO ou contenu, avec une grille agences séparée.
      </p>
      <p>
        <strong>Point fort.</strong> Le rapport couverture-prix, et l’intégration à votre outillage
        : connexion Google Search Console et Bing Webmaster Tools, accès MCP dès le premier plan
        (vous interrogez vos données depuis Claude ou un autre assistant), API REST à partir de
        Growth. Le suivi se règle en quotidien, hebdomadaire ou mensuel.
      </p>
      <p>
        <strong>Point faible.</strong> L’interface en anglais pour un produit qui se présente comme
        français, et une facturation en crédits qu’il faut comprendre avant d’acheter : 1 300
        crédits par mois au premier plan, et un relevé quotidien sur dix moteurs les consomme vite.
        Le connecteur Looker Studio et l’analyse des robots IA sont réservés au plan Business à 449
        €.
      </p>

      <h2 id="peec-ai">Peec AI vaut-il ses 85 €/mois ?</h2>
      <p>
        <strong>Prix.</strong> Starter à 85 €/mois, Pro à 205 €, Advanced à 425 € (70, 180 et 360 €
        en annuel). Enterprise sur devis, facturé à l’année. Essai gratuit de 7 jours.
      </p>
      <p>
        <strong>Moteurs.</strong> Trois modèles au choix parmi ChatGPT, Google AI Mode, Google AI
        Overviews, Microsoft Copilot, Gemini et Naver AI. Ni Claude ni Perplexity dans les offres en
        libre-service ; le contrat entreprise ouvre jusqu’à 13 modèles.
      </p>
      <p>
        <strong>Langue et cible.</strong> Interface en anglais, éditeur berlinois. Cible : les
        équipes SEO et les agences, avec une grille dédiée aux agences facturée en crédits.
      </p>
      <p>
        <strong>Point fort.</strong> La profondeur d’analyse pour le prix : 50 questions relevées
        chaque jour, utilisateurs illimités, analyse des sources citées, audit de crawlabilité des
        robots IA, suivi du trafic référent venu des assistants. C’est l’outil qui a fait baisser
        les prix du marché.
      </p>
      <p>
        <strong>Point faible.</strong> Le choix limité à trois modèles sur le plan d’entrée oblige à
        arbitrer, et deux moteurs importants manquent en libre-service. Pour une TPE sans équipe
        marketing, l’interface — dense, en anglais, pensée pour des SEO — demande un apprentissage.
      </p>

      <h2 id="semrush">Le Semrush AI Visibility Toolkit suffit-il à une PME ?</h2>
      <p>
        <strong>Prix.</strong> 94,94 €/mois par domaine, facturé à l’année. Essai de 7 jours. Le
        module est aussi vendu dans les bundles Semrush One (Starter à 199 $/mois). Des options de
        10 à 90 $/mois s’ajoutent selon les besoins.
      </p>
      <p>
        <strong>Moteurs.</strong> ChatGPT, Google AI (AI Overviews et AI Mode), Gemini et
        Perplexity. Pas de Claude.
      </p>
      <p>
        <strong>Langue et cible.</strong> Interface disponible en français. Cible : les PME et
        agences qui utilisent déjà Semrush pour le SEO et veulent un onglet de plus, pas un outil de
        plus.
      </p>
      <p>
        <strong>Point fort.</strong> L’intégration avec l’écosystème Semrush et une interface
        traduite. Vous retrouvez vos mots-clés, vos concurrents et vos rapports au même endroit, et
        le module audite la lisibilité du site par les IA.
      </p>
      <p>
        <strong>Point faible.</strong> 25 questions suivies et un seul domaine pour ce prix, c’est
        la dotation la plus mince du comparatif, et l’engagement annuel est obligatoire. Un deuxième
        site double la facture.
      </p>

      <h2 id="ia-rank">ia-rank.com à 99 €/mois : que contient l’offre ?</h2>
      <p>
        <strong>Prix.</strong> 9 € la première semaine, puis 99 €/mois sans engagement («
        Flexibilité ») ou 82,50 €/mois facturés 990 € à l’année (« Visibility Pro »).
      </p>
      <p>
        <strong>Moteurs.</strong> ChatGPT, Gemini, Claude et Perplexity sont annoncés.
      </p>
      <p>
        <strong>Langue et cible.</strong> Site en français. Cible affichée : les TPE et les
        commerces locaux — serruriers, plombiers, avocats, restaurants, médecins.
      </p>
      <p>
        <strong>Point fort.</strong> Un tarif clair, en euros, sans engagement, avec une semaine
        d’essai à 9 €. L’offre comprend un audit initial, un rapport mensuel et un support par
        e-mail — c’est à mi-chemin entre l’outil et la prestation.
      </p>
      <p>
        <strong>Point faible.</strong> Au moment du relevé, le site ne montre ni capture de
        l’interface, ni méthodologie de mesure, ni exemple de rapport. Vous ne savez pas, avant de
        payer, combien de questions sont posées ni comment la visibilité est calculée. La promesse
        d’un taux de conversion « 9 fois meilleur que Google » n’est pas sourcée. À tester sur la
        semaine d’essai avant tout engagement.
      </p>

      <h2 id="ahrefs">Ahrefs Brand Radar : que paie-t-on vraiment ?</h2>
      <p>
        <strong>Prix.</strong> Deux produits sous le même nom. Les « Custom Prompts » — vos propres
        questions suivies — sont inclus dans tout plan Ahrefs payant (Lite à 129 $/mois) et vendus à
        partir de 50 $/mois. L’« AI Visibility Index » — 83 questions par jour, 2 500 relevés par
        mois — coûte 199 $/mois et s’achète sans abonnement Ahrefs, avec un dépassement facturé 0,02
        $ le relevé.
      </p>
      <p>
        <strong>Moteurs.</strong> Google AI Overviews, AI Mode, ChatGPT, Perplexity, Gemini et
        Copilot. Claude est réservé aux contrats entreprise.
      </p>
      <p>
        <strong>Langue et cible.</strong> Interface disponible en français (Ahrefs est traduit en
        douze langues). Cible : les équipes SEO, en priorité celles déjà abonnées.
      </p>
      <p>
        <strong>Point fort.</strong> L’adossement à l’index Ahrefs : vous croisez la visibilité IA
        avec le trafic, les backlinks et la demande de recherche, et le module suit aussi YouTube,
        TikTok et Reddit. Si vous payez déjà Ahrefs, le suivi de vos questions est déjà là.
      </p>
      <p>
        <strong>Point faible.</strong> La lisibilité du prix. On lit encore partout un « 828 $/mois
        tout compris » qui correspond à une grille antérieure ; la grille actuelle est plus simple,
        mais il faut comprendre la différence entre les deux produits pour savoir ce qu’on achète.
        Et Claude manque, comme chez la plupart des acteurs SEO historiques.
      </p>

      <h2 id="scrunch">Scrunch AI est-il réservé aux grosses marques ?</h2>
      <p>
        <strong>Prix.</strong> Starter à 300 $/mois au mois ou 250 $/mois en annuel, Growth à 500
        $/mois (417 $ en annuel), Enterprise sur devis. Sièges supplémentaires à 25 $. Essai de 7
        jours sans carte.
      </p>
      <p>
        <strong>Moteurs.</strong> ChatGPT, Claude, Gemini, Perplexity, Google AI Mode, AI Overviews
        et Meta — sept, dès le premier plan.
      </p>
      <p>
        <strong>Langue et cible.</strong> Interface en anglais. Cible : les marques et les agences,
        avec des « personas » pour segmenter les questions par profil d’acheteur.
      </p>
      <p>
        <strong>Point fort.</strong> La couverture la plus large des offres à prix public, Claude et
        Perplexity compris, avec 350 questions personnalisées et 1 000 questions sectorielles au
        plan d’entrée. Aucun autre outil du tableau ne donne autant de moteurs sans négocier.
      </p>
      <p>
        <strong>Point faible.</strong> Le ticket d’entrée : 300 $/mois est dix fois le prix
        d’Otterly, pour une TPE qui n’a besoin que d’une vingtaine de questions. Et l’outil est
        conçu pour le marché nord-américain — vos questions en français, c’est vous qui les écrivez.
      </p>

      <h2 id="profound">Combien coûte réellement Profound ?</h2>
      <p>
        <strong>Prix.</strong> Il n’y en a plus de public. Au relevé du {RELEVE}, la page de tarifs
        ne propose qu’un essai gratuit de 7 jours, limité à 50 questions par jour, et un contrat
        entreprise sur démonstration. Les tarifs de 99 $ et 399 $/mois qui circulent dans les
        comparatifs correspondent à d’anciens plans en libre-service ; les contrats entreprise sont
        estimés par des sources tierces entre 2 000 et 5 000 $/mois, chiffres que nous ne pouvons
        pas vérifier.
      </p>
      <p>
        <strong>Moteurs.</strong> L’essai couvre ChatGPT, Gemini et Google AI Overviews. Le contrat
        ajoute Perplexity, AI Mode, Copilot, DeepSeek, Claude et Exa — jusqu’à neuf.
      </p>
      <p>
        <strong>Langue et cible.</strong> Interface en anglais. Cible assumée : les grands comptes
        qui « opérationnalisent » la visibilité IA avec des agents et une équipe dédiée.
      </p>
      <p>
        <strong>Point fort.</strong> La couverture et la profondeur : suivi des robots IA sur vos
        logs, analyse des conversations, agents, API, SSO, spécialiste dédié. C’est la référence
        citée par les autres éditeurs quand ils se comparent.
      </p>
      <p>
        <strong>Point faible.</strong> L’accès. Sans prix public, sans plan PME, avec une
        négociation commerciale obligatoire, ce n’est pas un outil qu’une TPE française peut essayer
        un mardi soir. Et l’essai n’ouvre que trois moteurs.
      </p>

      <h2 id="yext">Yext Scout peut-il s’acheter seul ?</h2>
      <p>
        <strong>Prix.</strong> Sur devis, facturé par établissement, dans le cadre de la plateforme
        Yext. Aucun prix public.
      </p>
      <p>
        <strong>Moteurs.</strong> Google AI Overviews, ChatGPT, Gemini, Claude et Perplexity, plus
        la recherche Google classique et Google Maps.
      </p>
      <p>
        <strong>Langue et cible.</strong> Interface en anglais (plateforme multilingue). Cible
        explicite : les réseaux multi-établissements — banques, concessions, cliniques, franchises.
      </p>
      <p>
        <strong>Point fort.</strong> C’est le seul outil du comparatif qui mesure la visibilité IA{' '}
        <em>par point de vente</em> et la relie aux données locales (fiches, avis, horaires) que
        Yext gère déjà pour ses clients. Pour un réseau de 200 agences, aucun autre ne fait ça.
      </p>
      <p>
        <strong>Point faible.</strong> Il ne s’achète pas seul. Sans la plateforme Yext, pas de
        Scout — et la plateforme Yext s’adresse à des réseaux, pas à un site unique.
      </p>

      <h2 id="geomind">GeoMind : pour qui, et pour qui pas ?</h2>
      <p>
        <strong>Prix.</strong> Plan Gratuit sans limite de durée : 1 site et 1 000 crédits de
        bienvenue, non renouvelés — une analyse complète coûte 400 crédits, donc deux analyses et
        quelques questions au coach. Solo à 19 €/mois (15 € en annuel) : 2 sites, 5 000 crédits par
        mois, soit environ 12 analyses. Pro à 59 €/mois (47 €) : 5 sites, 20 000 crédits, environ 50
        analyses, export PDF. Business à 149 €/mois (119 €) : 15 sites, 80 000 crédits, export en
        marque blanche. Sans engagement ; le détail est sur la{' '}
        <Link href="/pricing">page des tarifs</Link>.
      </p>
      <p>
        <strong>Moteurs.</strong> ChatGPT, Claude, Gemini et Perplexity, sur tous les plans, plan
        gratuit compris. Pas Google AI Overviews, pas AI Mode, pas Copilot.
      </p>
      <p>
        <strong>Langue et cible.</strong> Interface, questions générées et recommandations en
        français. Cible : les TPE et PME françaises sans équipe marketing.
      </p>
      <p>
        <strong>Point fort.</strong> C’est le moins cher des outils français — gratuit, puis 19 €
        contre 75 € chez Meteoria et 79 € chez Qwairy — et il couvre Claude dès le plan gratuit. Les
        questions sont générées dans la langue de vos clients, et chaque problème détecté vient avec
        une fiche qui explique quoi faire. Le plan gratuit va jusqu’au bout d’une analyse complète,
        sans carte bancaire.
      </p>
      <p>
        <strong>Point faible.</strong> Plusieurs, et il faut les lire avant de choisir.
      </p>
      <ul>
        <li>
          <strong>10 questions par analyse</strong>, là où Peec, Otterly ou Scrunch en suivent 50 à
          400. Assez pour une activité locale ou un métier ; insuffisant pour une marque à plusieurs
          gammes.
        </li>
        <li>
          <strong>Suivi hebdomadaire sur les plans payants, pas quotidien</strong> : un relevé
          automatique chaque lundi sur un échantillon de 3 questions, et un relevé mensuel sur le
          plan gratuit. Les analyses complètes se lancent à la demande. Meteoria et Qwairy, eux,
          relèvent chaque jour.
        </li>
        <li>
          <strong>Pas de Google AI Overviews ni d’AI Mode</strong> — les réponses IA qui s’affichent
          directement dans Google. Semrush, Ahrefs, Otterly, Peec, Qwairy et Meteoria les couvrent.
        </li>
        <li>
          <strong>
            Pas d’API, pas de connecteur Looker Studio, pas de suivi des robots IA dans vos logs
          </strong>{' '}
          ni du trafic référent venu des assistants.
        </li>
        <li>
          <strong>France et français uniquement.</strong> Pas de multi-pays, pas de multi-langue.
        </li>
        <li>
          <strong>Un produit jeune</strong>, sans le recul de plusieurs années de données ni
          l’écosystème d’un Semrush.
        </li>
      </ul>
      <p>
        Si vous cochez « une TPE ou une PME française, un ou quelques sites, un budget inférieur à
        60 €/mois et personne pour lire une interface SEO en anglais », GeoMind est fait pour vous.
        Si vous suivez des centaines de questions, avez besoin d’AI Overviews, d’un relevé quotidien
        ou d’une API, prenez Qwairy, Meteoria ou Peec.
      </p>

      <h2 id="quel-outil-pour-quel-profil">Quel outil pour quel profil</h2>
      <ul>
        <li>
          <strong>Artisan, profession libérale, commerce local (1 site, budget minimal).</strong>{' '}
          GeoMind en plan gratuit puis Solo si vous voulez du français et des recommandations ;
          Otterly.ai Lite si vous êtes à l’aise en anglais et préférez un relevé quotidien. Évitez
          tout engagement annuel avant d’avoir vu deux mois de tendance.
        </li>
        <li>
          <strong>PME française avec un responsable marketing.</strong> Meteoria (75 €, en français)
          ou Qwairy (79 € HT, dix moteurs) pour un suivi quotidien ; GeoMind Pro pour l’audit du
          site et le plan d’action ; le module Semrush si vous êtes déjà client Semrush. Ce sont
          deux besoins différents : suivi de position contre audit du site — beaucoup de PME
          finissent par en prendre un de chaque.
        </li>
        <li>
          <strong>Agence SEO ou web.</strong> Meteoria (sièges et marques illimités, en français) ou
          Peec AI (grille agences en crédits) pour le suivi multi-clients ; Qwairy pour ses espaces
          de travail par client et son API ; GeoMind Business pour des rapports PDF en marque
          blanche destinés à des clients TPE ; Scrunch si vos clients exigent Claude et Perplexity
          dès le premier plan.
        </li>
        <li>
          <strong>Équipe SEO déjà équipée.</strong> Le module de votre outil actuel : Ahrefs Brand
          Radar ou Semrush AI Visibility Toolkit. Vous n’ajoutez pas un outil, vous ajoutez un
          onglet.
        </li>
        <li>
          <strong>E-commerce multi-gammes.</strong> Peec AI Pro ou Advanced pour le suivi par
          produit (catalogue Shopify, visibilité par référence), ou Scrunch pour la couverture
          moteurs. Complétez par notre guide{' '}
          <Link href="/blog/geo-ecommerce">GEO et e-commerce</Link>.
        </li>
        <li>
          <strong>Grand compte ou réseau multi-établissements.</strong> Profound si vous avez une
          équipe pour l’exploiter, Yext Scout si vous êtes déjà chez Yext et que la mesure par point
          de vente compte plus que la profondeur d’analyse.
        </li>
      </ul>

      <h2 id="comment-choisir">Comment choisir sans se tromper</h2>
      <p>
        Quatre étapes, dans cet ordre. Elles évitent les deux erreurs les plus fréquentes : payer
        pour des moteurs que vos clients n’utilisent pas, et mesurer votre visibilité dans une
        langue qui n’est pas la leur.
      </p>
      <h3 id="etape-moteurs">1. Listez les moteurs qui comptent pour vos clients</h3>
      <p>
        Une clientèle B2B interroge ChatGPT, Perplexity et de plus en plus Claude ; une clientèle
        grand public passe par Google, donc par les AI Overviews et Gemini. Écrivez vos deux ou
        trois moteurs prioritaires, puis rayez du tableau tout outil qui ne les couvre pas à son
        tarif d’entrée. Le <Link href="/glossaire#moteur-de-reponse">glossaire</Link> détaille ce
        que chaque moteur fait des sources.
      </p>
      <h3 id="etape-prompts">2. Comptez les questions que vous voulez suivre</h3>
      <p>
        Une dizaine suffit à un plombier ou à un cabinet d’expertise comptable : « quel expert
        comptable pour une SASU à Lyon », « combien coûte un bilan », etc. Une marque à plusieurs
        gammes, plusieurs villes ou plusieurs cibles en a besoin de centaines. C’est ce nombre, plus
        que la marque de l’outil, qui fixe votre budget.
      </p>
      <h3 id="etape-langue">3. Vérifiez la langue des questions générées</h3>
      <p>
        Demandez à voir les questions que l’outil génère pour votre activité. Si elles sont en
        anglais alors que vos clients cherchent en français, l’outil mesure une visibilité qui n’est
        pas la vôtre — une IA interrogée en anglais cite des sources anglophones. Une interface
        traduite ne garantit pas des questions traduites.
      </p>
      <h3 id="etape-essai">4. Testez avant de vous engager à l’année</h3>
      <p>
        Tous les outils à prix public offrent un essai ou un plan gratuit. Prenez-le, lancez la même
        question sur deux outils, comparez les sources citées. Et lisez la petite ligne : « 79
        $/mois » chez Writesonic ou « 94,94 €/mois » chez Semrush veulent dire douze mois payés
        d’avance.
      </p>

      <h2 id="deleguer">Et si vous préférez déléguer ?</h2>
      <p>
        Deux acteurs reviennent dans les recherches sur les « outils GEO » alors qu’ils vendent un
        accompagnement, pas un logiciel. Ils ont leur place ici, à condition de savoir ce qu’on
        achète.
      </p>
      <p>
        <strong>seo.fr</strong> — agence SEO française historique, offre GEO sur devis. Elle mesure
        avec un outil interne, l’« AI Visibility Checker », qui n’est pas vendu seul, et Google
        Analytics 4. Moteurs annoncés : ChatGPT, Perplexity, Claude, Gemini. Cible : les ETI et
        grands comptes qui veulent une équipe plutôt qu’un tableau de bord. Point fort : l’exécution
        en français par des gens qui font du référencement depuis vingt ans. Point faible : aucun
        prix public, aucun outil en libre-service — vous dépendez de la prestation pour lire vos
        propres chiffres.
      </p>
      <p>
        <strong>Tenten GEO</strong> (geo.tenten.co) — agence basée à Taipei, offre sur devis. Elle
        annonce huit moteurs (ChatGPT, Perplexity, AI Overviews, Gemini, Claude, Copilot, Grok,
        DeepSeek), un rapport de citations hebdomadaire et un cycle de réécriture des pages. Site en
        anglais, cible : les éditeurs SaaS B2B et les industriels à cycle de vente long. Point fort
        : une promesse chiffrée en pipeline commercial, pas en score. Point faible : c’est de
        l’accompagnement, en anglais, pour des organisations d’une taille qui n’est pas celle d’une
        PME française.
      </p>
      <p>
        Dans les deux cas, demandez quel outil de mesure sera utilisé et si vous y aurez accès après
        la fin de la mission. Un accompagnement sans accès à la mesure vous laisse aveugle le jour
        où le contrat s’arrête.
      </p>

      <h2 id="sources">Sources</h2>
      <p>
        Pages consultées le {RELEVE}. Les prix changent ; si vous constatez un écart, la page de
        l’éditeur fait foi.
      </p>
      <ul>
        {SOURCES.map((s) => (
          <li key={s.href}>
            {s.tool} — <Ext href={s.href}>{s.label}</Ext>
          </li>
        ))}
      </ul>
    </ArticleLayout>
  )
}
