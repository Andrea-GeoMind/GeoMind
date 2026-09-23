import type { Metadata } from 'next'
import type { Route } from 'next'
import Link from 'next/link'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { ToolFiche } from '@/components/features/marketing/tool-fiche'
import { getArticle } from '@/lib/marketing/articles'
import {
  GEO_TOOLS,
  GEO_TOOLS_CHECKED_ON_LABEL,
  getGeoTool,
  type GeoToolSource,
} from '@/lib/marketing/geo-tools'
import { COMPARISONS } from '@/lib/marketing/comparisons'

const base = getArticle('meilleurs-outils-geo-2026')!

/**
 * Les faits (prix, moteurs, langue, cible, forces, limites, sources) viennent
 * de lib/marketing/geo-tools.ts, partagé avec les pages
 * /comparatif/geomind-vs-<slug>. Ici ne restent que les titres de fiches, les
 * phrases de synthèse propres à l'article, et la mise en forme.
 *
 * L'ItemList Schema.org est calculée depuis le registre plutôt que recopiée
 * dans lib/marketing/articles.ts : une description d'outil ne doit exister
 * qu'à un seul endroit.
 */
const meta = {
  ...base,
  itemList: GEO_TOOLS.map((t) => ({
    name: t.name,
    url: t.website,
    description: t.itemListDescription,
  })),
}

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

/** Date du relevé — une seule source, partagée avec les pages de comparaison. */
const RELEVE = GEO_TOOLS_CHECKED_ON_LABEL

/** Outils qui ont une page de comparaison dédiée, pour le lien « Comparer en détail ». */
const COMPARED_SLUGS = new Set(COMPARISONS.map((c) => c.toolSlug))

function tool(slug: string) {
  return getGeoTool(slug)!
}

/** Lien vers la page de comparaison, rendu sous la fiche des outils concernés. */
function CompareLink({ slug }: { slug: string }) {
  if (!COMPARED_SLUGS.has(slug)) return null
  const t = tool(slug)
  return (
    <p>
      <Link href={`/comparatif/geomind-vs-${slug}` as Route}>
        Comparer GeoMind et {t.name} en détail
      </Link>
    </p>
  )
}

/** Sources de tous les outils, plus les deux agences traitées en fin d'article. */
const AGENCY_SOURCES: (GeoToolSource & { tool: string })[] = [
  { tool: 'Tenten GEO', label: 'geo.tenten.co', href: 'https://geo.tenten.co/en' },
  { tool: 'seo.fr', label: 'seo.fr/agence-geo', href: 'https://www.seo.fr/agence-geo' },
]

const SOURCES: (GeoToolSource & { tool: string })[] = [
  ...GEO_TOOLS.flatMap((t) => t.sources.map((source) => ({ tool: t.name, ...source }))),
  ...AGENCY_SOURCES,
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
        <strong>Pour une TPE ou un artisan français</strong>, le plan gratuit de GeoMind (en
        français ; nos plans payants sont encore en liste d’attente) ou Otterly.ai (29 €/mois, en
        anglais). <strong>Pour une PME française qui veut un relevé quotidien</strong>, Meteoria (75
        €/mois, en français) ou Qwairy (79 € HT/mois, dix moteurs).{' '}
        <strong>Pour une équipe SEO déjà équipée</strong>, le module de Semrush (94,94 €/mois) ou
        d’Ahrefs (199 $/mois en autonome).{' '}
        <strong>Pour une marque qui suit des centaines de questions</strong>, Peec AI dès 85 €/mois,
        Scrunch AI à 300 $/mois, ou Profound sur devis. Le détail, les limites de chacun — les
        nôtres comprises — et les sources sont ci-dessous.
      </p>

      <h2 id="comment-nous-avons-compare">Comment nous avons comparé</h2>
      <p>
        Une précision avant tout : <strong>nous éditons GeoMind</strong>, l’un des quatorze outils
        de ce comparatif. Nous l’avons traité avec la même grille que les autres, ses limites sont
        écrites au même endroit que celles des concurrents, et le tableau est classé par ordre
        alphabétique — pas par un score qui nous mettrait en tête.
      </p>
      <p>
        Les prix ont été relevés le {RELEVE} sur les pages de tarifs des éditeurs, listées en{' '}
        <a href="#sources">bas de page</a>. Quand un éditeur n’affiche plus de prix (Profound,
        Yext), nous le disons plutôt que de recopier un chiffre de blog. Les prix sont donnés dans
        la devise affichée par l’éditeur, sans conversion : un dollar et un euro ne sont pas la même
        chose, et les taux bougent. Certains éditeurs localisent leur grille — celle d’Otterly.ai
        s’affiche en euros depuis la France, c’est donc ce montant que nous retenons. Côté GeoMind,
        seul le plan gratuit est vendu aujourd’hui : nos plans payants sont annoncés mais en liste
        d’attente, et le tableau le dit. Les moteurs indiqués sont ceux de l’offre d’entrée, car
        c’est celle que vous testerez en premier — beaucoup d’outils n’ouvrent leur couverture
        complète qu’en contrat entreprise.
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
            {GEO_TOOLS.map((t) => (
              <tr key={t.slug} className="align-top">
                <th scope="row" className="px-4 py-3 font-semibold text-foreground">
                  {t.name}
                </th>
                <td className="px-4 py-3 text-foreground/85">{t.priceSummary}</td>
                <td className="px-4 py-3 text-foreground/85">{t.engineSummary}</td>
                <td className="px-4 py-3 text-foreground/85">{t.language}</td>
                <td className="px-4 py-3 text-foreground/85">{t.target}</td>
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

      <h2 id="otterly">Otterly.ai à 29 €/mois : est-ce suffisant ?</h2>
      <ToolFiche tool={tool('otterly')} />
      <CompareLink slug="otterly" />

      <h2 id="chatseo">ChatSEO à 29 €/mois : un outil GEO ou un outil SEO ?</h2>
      <p>
        Un cas à part dans ce comparatif : ChatSEO est un assistant SEO en français, connecté à
        votre Search Console, dont le GEO est l’un des douze agents. Il ne mesure pas vos citations
        moteur par moteur — il vous conseille. Nous l’incluons parce qu’on nous le cite souvent
        comme alternative, et parce que la confusion entre les deux métiers coûte cher.
      </p>
      <ToolFiche tool={tool('chatseo')} />

      <h2 id="meteoria">Meteoria : que vaut le suivi quotidien à 75 €/mois ?</h2>
      <ToolFiche tool={tool('meteoria')} />
      <CompareLink slug="meteoria" />

      <h2 id="writesonic">Writesonic mesure-t-il ou rédige-t-il ?</h2>
      <ToolFiche tool={tool('writesonic')} />
      <CompareLink slug="writesonic" />

      <h2 id="qwairy">Qwairy couvre-t-il vraiment dix moteurs à 79 € ?</h2>
      <ToolFiche tool={tool('qwairy')} />
      <CompareLink slug="qwairy" />

      <h2 id="peec-ai">Peec AI vaut-il ses 85 €/mois ?</h2>
      <ToolFiche tool={tool('peec')} />
      <CompareLink slug="peec" />

      <h2 id="semrush">Le Semrush AI Visibility Toolkit suffit-il à une PME ?</h2>
      <ToolFiche tool={tool('semrush')} />
      <CompareLink slug="semrush" />

      <h2 id="ia-rank">ia-rank.com à 99 €/mois : que contient l’offre ?</h2>
      <ToolFiche tool={tool('ia-rank')} />
      <CompareLink slug="ia-rank" />

      <h2 id="geotoolbox">GEO Toolbox à 99 $/mois : huit moteurs, mais lesquels ?</h2>
      <ToolFiche tool={tool('geotoolbox')} />

      <h2 id="ahrefs">Ahrefs Brand Radar : que paie-t-on vraiment ?</h2>
      <ToolFiche tool={tool('ahrefs')} />
      <CompareLink slug="ahrefs" />

      <h2 id="scrunch">Scrunch AI est-il réservé aux grosses marques ?</h2>
      <ToolFiche tool={tool('scrunch')} />
      <CompareLink slug="scrunch" />

      <h2 id="profound">Combien coûte réellement Profound ?</h2>
      <ToolFiche tool={tool('profound')} />
      <CompareLink slug="profound" />

      <h2 id="yext">Yext Scout peut-il s’acheter seul ?</h2>
      <ToolFiche tool={tool('yext')} />
      <CompareLink slug="yext" />

      <h2 id="geomind">GeoMind : pour qui, et pour qui pas ?</h2>
      <p>
        Avant de lire nos tarifs, vous pouvez déjà{' '}
        <Link href="/verifier-visibilite-chatgpt">
          vérifier gratuitement si ChatGPT peut lire votre site
        </Link>
        .
      </p>
      <ToolFiche tool={tool('geomind')} />
      <p>
        Si vous cochez « une TPE ou une PME française, un ou deux sites, personne pour lire une
        interface SEO en anglais », le plan gratuit de GeoMind est fait pour vous — et c’est
        aujourd’hui la seule offre que nous vendons. Si vous suivez des centaines de questions, avez
        besoin d’AI Overviews, d’un relevé quotidien, d’une API, ou simplement d’un abonnement
        payant disponible tout de suite, prenez Qwairy, Meteoria ou Peec.
      </p>

      <h2 id="quel-outil-pour-quel-profil">Quel outil pour quel profil</h2>
      <ul>
        <li>
          <strong>Artisan, profession libérale, commerce local (1 site, budget minimal).</strong> le
          plan gratuit de GeoMind si vous voulez du français et des recommandations ; Otterly.ai
          Lite si vous êtes à l’aise en anglais et préférez un relevé quotidien. Évitez tout
          engagement annuel avant d’avoir vu deux mois de tendance.
        </li>
        <li>
          <strong>PME française avec un responsable marketing.</strong> Meteoria (75 €, en français)
          ou Qwairy (79 € HT, dix moteurs) pour un suivi quotidien ; le plan gratuit de GeoMind pour
          l’audit du site et le plan d’action ; le module Semrush si vous êtes déjà client Semrush.
          Ce sont deux besoins différents : suivi de position contre audit du site — beaucoup de PME
          finissent par en prendre un de chaque.
        </li>
        <li>
          <strong>Agence SEO ou web.</strong> Meteoria (sièges et marques illimités, en français) ou
          Peec AI (grille agences en crédits) pour le suivi multi-clients ; Qwairy pour ses espaces
          de travail par client et son API ; GeoMind seulement si vos clients sont des TPE
          françaises à qui il faut livrer un plan d’action lisible — en gardant en tête que nos
          offres multi-sites ne sont pas encore ouvertes ; Scrunch si vos clients exigent Claude et
          Perplexity dès le premier plan.
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
