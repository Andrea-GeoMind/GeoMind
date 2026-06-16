import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleLayout } from '@/components/features/marketing/article-layout'
import { getArticle } from '@/lib/marketing/articles'

const meta = getArticle('choisir-outil-visibilite-ia')!

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `/blog/${meta.slug}` },
}

export default function Page() {
  return (
    <ArticleLayout meta={meta}>
      <p>
        Les outils qui promettent de mesurer votre visibilité dans les intelligences artificielles
        se multiplient. ChatGPT, Perplexity, Gemini, Claude… autant de moteurs de réponses que vos
        clients interrogent déjà. La question n&apos;est plus « faut-il s&apos;y intéresser ? »
        mais « comment choisir le bon outil sans se tromper ? ». Ce guide d&apos;achat honnête vous
        donne les critères qui comptent vraiment — sans jargon, sans surenchère commerciale.
      </p>

      <h2>Pourquoi un outil plutôt que le faire à la main</h2>
      <p>
        Techniquement, rien ne vous oblige à acheter un logiciel. Vous pouvez ouvrir ChatGPT,
        Perplexity, Gemini et Claude dans quatre onglets, taper vos questions une par une, noter les
        réponses dans un tableur, puis recommencer le mois suivant. Cette approche manuelle
        fonctionne — mais elle a un coût caché.
      </p>
      <p>
        Pour un résultat fiable, il faut poser les mêmes questions de façon neutre (sans citer votre
        marque), sur les quatre IA, plusieurs fois pour lisser la variabilité des réponses, chaque
        mois. Ajoutez l&apos;audit technique de votre site (robots.txt, données structurées, vitesse)
        et l&apos;audit du contenu (FAQ, pages qui répondent vraiment à une question) : comptez entre
        quatre et six heures mensuelles pour un seul site. Pour une TPE ou une PME dont le cœur de
        métier n&apos;est pas le digital, c&apos;est un investissement difficile à tenir dans la durée.
        Un outil automatise exactement cette chaîne de travail, libère du temps et rend la tendance
        visible sans effort.
      </p>
      <p>
        Cela dit, si votre budget est nul et votre curiosité grande, commencez à la main avec
        les conseils de notre guide{' '}
        <Link href="/blog/suivre-citations-ia">comment suivre vos citations IA sans outil</Link>.
        Vous comprendrez mieux ce que vous automatisez ensuite.
      </p>

      <h2>Les 6 critères qui comptent vraiment</h2>

      <h3>1. Couvre-t-il plusieurs IA — ChatGPT, Perplexity, Gemini et Claude ?</h3>
      <p>
        Un outil qui ne teste qu&apos;un seul moteur de réponses vous donne une image partielle.
        Selon votre secteur, vos clients utilisent en priorité Perplexity (recherche d&apos;infos),
        ChatGPT (conseil) ou Gemini (intégré à Google). Votre visibilité peut être excellente chez
        l&apos;un et nulle chez l&apos;autre. Exigez une couverture multi-IA, idéalement avec un
        score par moteur pour identifier où concentrer vos efforts.
      </p>

      <h3>2. Mesure-t-il une tendance ou juste un score instantané ?</h3>
      <p>
        C&apos;est l&apos;un des pièges les plus courants. Les IA ne répondent jamais deux fois
        exactement pareil : elles varient selon le contexte, la date d&apos;entraînement, la
        formulation de la question. Un « score du jour » n&apos;a donc pas grande valeur. Ce qui
        compte, c&apos;est la <strong>tendance sur 30 à 90 jours</strong> : êtes-vous de plus en
        plus cité, ou de moins en moins ? Un bon outil stocke l&apos;historique et vous montre
        une courbe, pas un chiffre isolé.
      </p>

      <h3>3. Utilise-t-il des prompts neutres, sans citer votre marque ?</h3>
      <p>
        Si vous demandez à une IA « que penses-tu de l&apos;entreprise Dupont Plomberie ? », elle
        va vous parler de Dupont Plomberie — ce n&apos;est pas de la visibilité naturelle, c&apos;est
        une recherche de marque directe. Les vrais achats passent par des questions génériques :
        « quel plombier à Lyon pour une urgence le week-end ? » ou « comment choisir un plombier
        certifié RGE ? ». Un outil sérieux génère et utilise ces <strong>prompts neutres</strong>,
        qui reflètent ce que cherchent réellement vos futurs clients. Si l&apos;outil vous demande
        uniquement votre nom de marque et pas votre secteur ni vos services, méfiez-vous.
      </p>
      <p>
        Pour comprendre pourquoi ce point est central, lisez notre article sur{' '}
        <Link href="/blog/quest-ce-que-le-geo">ce qu&apos;est le GEO et comment il fonctionne</Link>.
      </p>

      <h3>4. Donne-t-il un plan d&apos;action concret, pas juste un constat ?</h3>
      <p>
        Savoir que vous n&apos;êtes pas cité, c&apos;est utile. Savoir <em>pourquoi</em> et
        <em>quoi faire</em>, c&apos;est indispensable. Les meilleurs outils identifient les problèmes
        prioritaires — « votre page de services ne contient aucune FAQ balisée », « votre fichier
        robots.txt bloque les robots d&apos;IA » — et les classent par impact estimé. Vous sortez
        de la session avec une liste d&apos;actions, pas avec un tableau de bord à interpréter seul.
      </p>

      <h3>5. Audite-t-il aussi la technique et le contenu de votre site ?</h3>
      <p>
        La visibilité IA ne dépend pas uniquement du nombre de fois où vous êtes cité. Elle dépend
        aussi de la qualité de ce que les robots trouvent en visitant votre site. Un outil complet
        vérifie : votre sitemap est-il accessible ? Avez-vous des données structurées (
        <strong>schema.org</strong>) adaptées à votre activité ? Vos pages répondent-elles à une
        vraie question dès le premier paragraphe ? Le contenu est-il facile à extraire et à citer ?
        Sans cet audit technique et éditorial, vous ne savez pas si vos efforts de contenu
        porteront leurs fruits.
      </p>

      <h3>6. Le prix est-il adapté à une TPE/PME ?</h3>
      <p>
        Beaucoup d&apos;outils GEO sont conçus pour des agences ou des grandes entreprises avec
        des budgets marketing de plusieurs milliers d&apos;euros par mois. Pour une TPE ou une PME
        française, le bon rapport qualité-prix se situe entre 0 et 150 €/mois pour un ou deux
        sites. Vérifiez aussi ce qui est inclus dans l&apos;offre d&apos;entrée : nombre d&apos;analyses
        par mois, nombre de sites, accès à l&apos;historique, support en français.
      </p>

      <h2>Les pièges à éviter</h2>
      <ul>
        <li>
          <strong>L&apos;outil qui promet un « score exact ».</strong> Comme expliqué plus haut,
          les IA varient. Un score précis au dixième est une illusion — ou une manipulation.
          Préférez un outil qui assume cette variabilité et vous montre une tendance fiable plutôt
          qu&apos;un chiffre rassurant mais trompeur.
        </li>
        <li>
          <strong>Les outils 100 % anglophones.</strong> Si l&apos;outil génère des prompts en
          anglais pour mesurer votre visibilité sur le marché français, les résultats ne reflètent
          pas ce que cherchent vos clients. Les IA fonctionnent dans la langue de la question :
          une recherche en anglais donne des sources anglophones. Exigez un outil qui maîtrise
          le français.
        </li>
        <li>
          <strong>Les tarifs entreprise sans plan accessible.</strong> Certains outils affichent
          « à partir de 500 €/mois » ou ne donnent pas de prix publics. Pour un premier test,
          ces offres sont hors de portée. Cherchez un outil avec une offre gratuite ou un essai
          sans engagement, pour vérifier que la promesse est tenue avant de sortir la carte bancaire.
        </li>
        <li>
          <strong>L&apos;outil qui ne couvre qu&apos;un ou deux moteurs IA.</strong> Certains se
          concentrent uniquement sur ChatGPT, qui représente effectivement la part la plus visible
          — mais Perplexity capte une part croissante des recherches d&apos;information, et Gemini
          s&apos;intègre directement dans les résultats Google. Une couverture partielle vous
          laisse des angles morts.
        </li>
        <li>
          <strong>L&apos;absence de support en français.</strong> Quand vous avez une question sur
          un résultat ou une recommandation, un support uniquement anglophone ralentit votre
          prise de décision. Pour une PME française, le support francophone est un critère de
          confort non négligeable.
        </li>
      </ul>

      <h2>Les questions à poser avant de vous engager</h2>
      <ul>
        <li>Quelles IA sont testées, et combien de fois par analyse ?</li>
        <li>Les prompts utilisés sont-ils neutres (sans ma marque) ? Puis-je les voir ?</li>
        <li>L&apos;outil stocke-t-il l&apos;historique pour me montrer une tendance ?</li>
        <li>L&apos;interface et le support sont-ils en français ?</li>
        <li>Y a-t-il un audit technique et de contenu, pas seulement un suivi de citations ?</li>
        <li>Le plan d&apos;action est-il personnalisé ou générique ?</li>
        <li>Combien de sites puis-je suivre dans mon abonnement ?</li>
        <li>Y a-t-il un essai gratuit ou une première analyse offerte pour tester avant d&apos;acheter ?</li>
        <li>Que se passe-t-il si je résilie — mes données sont-elles exportables ?</li>
      </ul>

      <h2>Et GeoMind dans tout ça ?</h2>
      <p>
        Nous avons conçu GeoMind pour répondre précisément aux besoins des TPE et PME françaises —
        et il est normal que vous nous évaluiez avec les mêmes critères qu&apos;un autre outil.
        Voici ce que GeoMind fait, honnêtement :
      </p>
      <ul>
        <li>
          <strong>Quatre IA couvertes :</strong> ChatGPT, Perplexity, Gemini et Claude sont
          interrogés à chaque analyse.
        </li>
        <li>
          <strong>Prompts neutres générés automatiquement</strong> à partir de votre secteur,
          vos services et votre zone géographique — jamais votre nom de marque dans la question.
        </li>
        <li>
          <strong>Tendance, pas juste un score instantané :</strong> l&apos;historique est conservé
          et affiché sous forme de courbe pour suivre votre progression mois après mois.
        </li>
        <li>
          <strong>Audit technique et contenu :</strong> GeoMind crawle votre site et vérifie les
          points qui influencent votre citabilité (données structurées, FAQ, vitesse, sitemap,
          robots.txt).
        </li>
        <li>
          <strong>Plan d&apos;action concret :</strong> chaque analyse se termine par une liste de
          recommandations classées par priorité, formulées en français et actionnables sans
          compétences techniques.
        </li>
        <li>
          <strong>Tarifs adaptés aux TPE/PME :</strong> offre gratuite pour découvrir, puis
          49 €/mois en Pro et 149 €/mois en Business — la première analyse complète est offerte
          sans carte bancaire.
        </li>
      </ul>
      <p>
        Ce que GeoMind ne fait pas (encore) : comparer votre score à celui de vos concurrents
        directs en temps réel, ni proposer un suivi de mots-clés SEO classique. Si ces
        fonctionnalités sont critiques pour vous, il est honnête de le dire.
      </p>

      <h2>En résumé</h2>
      <p>
        Un bon outil de visibilité IA coche six cases : couverture multi-IA, mesure de tendance,
        prompts neutres, plan d&apos;action concret, audit technique et contenu, prix accessible.
        Avant de souscrire, posez les questions de la liste ci-dessus et exigez un essai gratuit
        pour vérifier que la promesse correspond à la réalité.
      </p>
      <p>
        Le marché des outils GEO est encore jeune : les offres évoluent vite, les méthodes
        se standardisent, les prix vont probablement baisser. L&apos;essentiel est de commencer
        à mesurer dès maintenant — même imparfaitement — plutôt que d&apos;attendre l&apos;outil
        parfait pendant que vos concurrents occupent les réponses IA à votre place.
      </p>
    </ArticleLayout>
  )
}
