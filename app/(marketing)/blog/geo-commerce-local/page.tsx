import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('geo-commerce-local')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <p>
        Un client cherche « un bon plombier à Lyon » ou « où dîner à Bordeaux ce soir ». Il ne
        tape plus cette question dans Google — il la pose à ChatGPT, à Perplexity ou à Gemini.
        L&apos;IA lui répond en citant deux ou trois noms. Les autres n&apos;existent pas.
      </p>
      <p>
        Ce scénario se répète des millions de fois chaque jour en France, pour les restaurants, les
        artisans, les cabinets médicaux, les coiffeurs, les agences immobilières. Être dans cette
        liste courte, c&apos;est décrocher des clients. En être absent, c&apos;est laisser le
        champ libre à vos concurrents. Ce guide vous explique exactement comment franchir ce seuil.
      </p>

      <h2>Comment les IA répondent aux recherches locales</h2>
      <p>
        Contrairement à Google qui classe des liens, une IA générative <em>synthétise</em> une
        réponse à partir de plusieurs sources qu&apos;elle a ingérées lors de son entraînement ou
        qu&apos;elle consulte en temps réel (Perplexity, ChatGPT avec navigation). Pour une
        requête locale, ces sources sont systématiquement les mêmes :
      </p>
      <ul>
        <li>
          <strong>Google Business Profile</strong> — la fiche la plus lue et la plus riche en
          données structurées.
        </li>
        <li>
          <strong>Les avis en ligne</strong> — Google Avis, TripAdvisor, Trustpilot, Pages Jaunes,
          Doctolib.
        </li>
        <li>
          <strong>Les annuaires et plateformes sectorielles</strong> — Pages Jaunes, Yelp, Leboncoin
          Pros, plateformes de réservation.
        </li>
        <li>
          <strong>La presse locale et les blogs régionaux</strong> — un article dans
          <em> Le Progrès</em> ou <em>Sud Ouest</em> vaut beaucoup.
        </li>
        <li>
          <strong>Votre propre site</strong> — à condition qu&apos;il contienne les bons signaux.
        </li>
      </ul>
      <p>
        L&apos;IA croise ces sources et ne cite que les acteurs dont la présence est cohérente sur
        plusieurs d&apos;entre elles. Un beau site seul ne suffit pas ; une fiche Google seule non
        plus. C&apos;est la <strong>convergence des signaux</strong> qui déclenche la citation.
      </p>

      <h2>Le socle : votre fiche Google Business Profile</h2>
      <p>
        La fiche Google Business Profile (GBP) est le signal local le plus puissant que les IA
        lisent. Avant toute autre action, vérifiez ces points :
      </p>
      <ul>
        <li>
          <strong>Catégorie principale précise :</strong> « Plombier », pas « Artisan du bâtiment ».
          Ajoutez des catégories secondaires si votre activité le justifie (« Chauffagiste »,
          « Installateur de chauffe-eau »).
        </li>
        <li>
          <strong>Nom, adresse et téléphone identiques partout :</strong> la moindre variation
          (« rue » vs « r. », indicatif manquant) fait diverger les signaux et réduit la confiance
          des IA.
        </li>
        <li>
          <strong>Horaires toujours à jour :</strong> horaires exceptionnels pour les fériés,
          fermetures temporaires signalées. Une IA qui annonce que vous êtes ouvert un jour où vous
          êtes fermé perd la confiance du client — et la vôtre aussi.
        </li>
        <li>
          <strong>Photos récentes et nombreuses :</strong> intérieur, extérieur, équipe, réalisations.
          Les IA ne « voient » pas les photos, mais leur présence est un signal de fiche active.
        </li>
        <li>
          <strong>Description complète :</strong> 750 caractères disponibles, utilisez-les. Citez
          vos villes et quartiers d&apos;intervention, vos spécialités, votre ancienneté.
        </li>
        <li>
          <strong>Publications régulières :</strong> une publication par mois minimum montre à
          Google — et aux IA qui indexent ces données — que votre établissement est vivant.
        </li>
      </ul>
      <p>
        Une fiche GBP complète, cohérente et régulièrement mise à jour est le fondement
        incontournable de votre GEO local. Tout le reste s&apos;y appuie.
      </p>

      <h2>Les avis clients, carburant des IA</h2>
      <p>
        Quand une IA choisit entre deux plombiers lyonnais, elle regarde le volume d&apos;avis, la
        note moyenne et la <strong>fraîcheur</strong> de ces avis. Un établissement avec 200 avis
        dont le dernier date de 18 mois sera moins bien positionné qu&apos;un concurrent avec 40
        avis dont 10 dans les 30 derniers jours.
      </p>
      <p>Trois leviers simples pour améliorer ce signal :</p>
      <ul>
        <li>
          <strong>Demandez systématiquement</strong> un avis à chaque client satisfait — par SMS,
          par email, ou en lui montrant un QR code sur votre comptoir. Le meilleur moment : juste
          après la prestation, quand la satisfaction est à son pic.
        </li>
        <li>
          <strong>Répondez à tous les avis,</strong> positifs comme négatifs. Les IA lisent vos
          réponses autant que les avis eux-mêmes. Une réponse professionnelle à un avis négatif est
          un signal de sérieux ; l&apos;absence de réponse est un signal d&apos;abandon.
        </li>
        <li>
          <strong>Diversifiez les plateformes</strong> selon votre secteur : TripAdvisor pour la
          restauration, Doctolib pour les professions de santé, Pages Jaunes pour les artisans,
          Trustpilot pour les services en ligne. Une présence sur plusieurs plateformes multiplie les
          sources que l&apos;IA peut recouper.
        </li>
      </ul>
      <p>
        Attention : n&apos;achetez jamais de faux avis. Les IA sont de plus en plus capables de
        détecter les patterns anormaux, et une sanction Google efface des mois de travail.
      </p>

      <h2>Les annuaires et plateformes qui comptent</h2>
      <p>
        En dehors de Google, plusieurs plateformes sont systématiquement indexées par les IA pour
        les recherches locales françaises. Assurez-vous d&apos;y être présent, avec des informations
        <strong> identiques</strong> à votre fiche GBP :
      </p>
      <ul>
        <li>
          <strong>Pages Jaunes</strong> — référence nationale, très lue par les IA pour les
          commerces et artisans.
        </li>
        <li>
          <strong>Yelp</strong> — plus fort en restauration et beauté dans les grandes villes.
        </li>
        <li>
          <strong>Plateformes sectorielles :</strong> Doctolib (santé), MaPrimeRénov (artisans RGE),
          Houzz (décoration), Treatwell (beauté), LaFourchette/TheFork (restaurants), Leboncoin
          Pros.
        </li>
        <li>
          <strong>Chambre de commerce et annuaires locaux :</strong> CCI, syndicats
          professionnels, annuaires municipaux — souvent peu concurrentiels et très bien indexés
          localement.
        </li>
        <li>
          <strong>Presse régionale :</strong> un article dans un journal local (inauguration,
          témoignage client, reportage métier) crée un backlink de grande qualité que les IA
          valorisent énormément. C&apos;est souvent plus efficace qu&apos;une dizaine de mentions
          sur des annuaires génériques.
        </li>
      </ul>
      <p>
        Vérifiez la cohérence de vos informations sur ces plateformes une fois par trimestre. Un
        ancien numéro de téléphone ou une ancienne adresse qui traîne sur Pages Jaunes crée une
        discordance qui affaiblit votre crédibilité auprès des IA.
      </p>

      <h2>Votre site : les pages qui déclenchent une citation</h2>
      <p>
        Un site vitrine générique ne suffit pas à déclencher une citation locale. Les IA cherchent
        des signaux précis que votre site doit émettre clairement.
      </p>
      <h3>Une page par zone géservie</h3>
      <p>
        Si vous intervenez à Lyon, Villeurbanne et Caluire, créez une page dédiée à chaque ville.
        Titre clair (« Plombier à Villeurbanne »), contenu spécifique (quartiers desservis, délai
        d&apos;intervention, exemple de chantier local), adresse et téléphone visibles. Ce
        n&apos;est pas du contenu dupliqué si chaque page apporte une information réellement
        spécifique à la zone.
      </p>
      <h3>Une FAQ locale</h3>
      <p>
        « Quel est votre délai d&apos;intervention pour une urgence à Lyon 3 ? », « Intervenez-vous
        le week-end à Caluire ? », « Quels sont vos tarifs pour un débouchage à
        Villeurbanne ? » — répondez à ces questions directement sur votre site. C&apos;est
        exactement ce type de formulation que les clients tapent dans les IA, et une réponse claire
        sur votre site est citée telle quelle.
      </p>
      <h3>Les données structurées LocalBusiness</h3>
      <p>
        Ajoutez un bloc <code>JSON-LD</code> de type <code>LocalBusiness</code> (ou sa sous-classe
        adaptée : <code>Plumber</code>, <code>Restaurant</code>, <code>MedicalBusiness</code>) dans
        le <code>&lt;head&gt;</code> de votre site. Ce balisage Schema.org communique directement aux
        robots les informations clés : nom, adresse, horaires, zone géographique desservie, numéro
        de téléphone. Les IA lisent ces métadonnées en priorité.
      </p>
      <p>
        Votre adresse complète et vos horaires doivent également figurer en texte brut dans le pied
        de page de chaque page — pas seulement dans une image ou un widget de carte que les robots
        ne lisent pas.
      </p>
      <p>
        Pour aller plus loin sur ces signaux techniques,{' '}
        <Link href="/blog/fichiers-qui-parlent-aux-ia">
          consultez notre article sur les fichiers et balises que les IA lisent en priorité
        </Link>
        .
      </p>

      <h2>Exemple concret</h2>
      <p>
        Prenons <strong>Marco, électricien à Nantes</strong>. Avant d&apos;optimiser sa présence
        GEO, voici son état :
      </p>
      <ul>
        <li>Fiche GBP créée il y a 3 ans, catégorie « Entreprise de services », 11 avis.</li>
        <li>Site vitrine d&apos;une page, sans mention de quartiers desservis.</li>
        <li>Absent de Pages Jaunes et des annuaires locaux.</li>
        <li>Aucune réponse aux avis.</li>
      </ul>
      <p>
        Résultat : quand un client demande à ChatGPT « un électricien disponible rapidement à
        Nantes », Marco n&apos;apparaît pas. Trois concurrents avec des fiches plus complètes sont
        cités.
      </p>
      <p>En deux mois, Marco effectue les changements suivants :</p>
      <ul>
        <li>
          Il met à jour sa fiche GBP : catégorie « Électricien », ajout de 15 photos, description
          complète avec les quartiers Erdre, Doulon, Bellevue, mise à jour des horaires.
        </li>
        <li>
          Il envoie un SMS à ses 40 derniers clients en leur demandant un avis Google. Il obtient
          22 nouveaux avis en 3 semaines, répond à chacun.
        </li>
        <li>
          Il crée 4 pages sur son site : « Électricien à Nantes », « Électricien à
          Saint-Herblain », « Dépannage électrique Nantes », et une FAQ avec 8 questions
          concrètes.
        </li>
        <li>
          Il s&apos;inscrit sur Pages Jaunes et dans l&apos;annuaire de sa chambre des métiers avec
          des informations identiques à sa fiche GBP.
        </li>
        <li>
          Il ajoute un bloc <code>LocalBusiness</code> JSON-LD sur son site.
        </li>
      </ul>
      <p>
        Six semaines plus tard, ChatGPT cite Marco dans 3 des 5 questions tests posées sur les
        électriciens nantais. Il reçoit ses deux premiers appels directs attribués à une
        recommandation IA.
      </p>

      <h2>Plan d&apos;action local</h2>
      <p>
        Voici les actions à mener, classées par priorité et effort estimé :
      </p>
      <ul>
        <li>
          <strong>J+1 :</strong> Revendiquez et complétez votre fiche Google Business Profile —
          catégorie précise, adresse exacte, horaires, description avec villes d&apos;intervention,
          10 photos minimum.
        </li>
        <li>
          <strong>J+3 :</strong> Vérifiez la cohérence de vos informations sur Pages Jaunes,
          TripAdvisor ou votre plateforme sectorielle. Corrigez toute divergence.
        </li>
        <li>
          <strong>J+7 :</strong> Mettez en place une routine de collecte d&apos;avis — SMS, email ou
          QR code. Objectif : 5 nouveaux avis Google par mois minimum.
        </li>
        <li>
          <strong>Semaine 2 :</strong> Répondez à tous vos avis existants (commencez par les plus
          récents). Prévoyez une réponse type pour les avis positifs et une procédure pour les
          négatifs.
        </li>
        <li>
          <strong>Semaine 3 :</strong> Créez ou améliorez les pages locales de votre site — une page
          par ville ou quartier desservi, avec FAQ concrète et adresse en texte.
        </li>
        <li>
          <strong>Semaine 4 :</strong> Ajoutez le balisage <code>LocalBusiness</code> JSON-LD sur
          votre site. Vérifiez le rendu avec le testeur de données structurées de Google.
        </li>
        <li>
          <strong>Mois 2 :</strong> Visez une mention dans la presse locale — une inauguration, un
          partenariat, un témoignage client. Contactez le correspondant local de votre journal
          régional.
        </li>
        <li>
          <strong>En continu :</strong> Mesurez votre progression en posant chaque mois aux IA les
          5 questions locales les plus probables dans votre secteur. Notez dans combien de réponses
          vous êtes cité.
        </li>
      </ul>
      <p>
        Pour aller plus loin et comprendre comment les IA décident de vous citer — ou pas —,{' '}
        <Link href="/blog/comment-etre-cite-par-chatgpt">
          lisez notre guide complet sur les facteurs de citation dans ChatGPT
        </Link>
        .
      </p>
      <p>
        Le GEO local n&apos;est pas réservé aux grandes entreprises avec des équipes marketing. Un
        artisan ou un restaurateur qui consacre deux heures par mois à ces signaux peut devenir la
        référence que les IA citent dans sa ville — avant même ses concurrents qui dépensent dix
        fois plus en publicité.
      </p>
    </ArticleLayout>
  )
}
