import Header from '@/components/features/marketing/header'
import Footer from '@/components/features/marketing/footer'

// JSON-LD Organization + WebSite + SoftwareApplication — fiche d'identité
// structurée de GeoMind pour les moteurs de recherche et les moteurs de
// réponses IA (règle GEO schema-org-organization que le produit audite
// chez ses clients : le cordonnier se chausse).
//
// GEO : `knowsAbout` et `slogan` aident les IA à relier l'entité « GeoMind »
// à son domaine d'expertise (signal d'autorité thématique). `sameAs` doit
// pointer vers les profils externes officiels dès qu'ils existent (LinkedIn,
// X, Crunchbase, Product Hunt…) — c'est LE signal d'entité n°1 pour les IA.
const SAME_AS: string[] = [
  'https://x.com/GeoMind_fr',
  'https://www.producthunt.com/@geomind_fr',
  // À ajouter dès qu'ils sont en ligne / validés :
  // 'https://www.crunchbase.com/organization/geomind' (en modération)
  // 'https://www.linkedin.com/company/geomind-fr'
  // 'https://www.wikidata.org/wiki/<QID>'
]

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://geomind.fr/#organization',
      name: 'GEOMIND',
      alternateName: 'GeoMind',
      url: 'https://geomind.fr',
      logo: 'https://geomind.fr/logo-mark.png',
      image: 'https://geomind.fr/logo-mark.png',
      description:
        'GEOMIND audite la visibilité des sites web dans les moteurs de réponses IA (ChatGPT, Perplexity, Gemini, Claude) et fournit un plan d’action concret. Pensé pour les TPE et PME françaises.',
      slogan: 'Sache où tu es cité dans les IA. Comprends pourquoi pas. Améliore ta visibilité.',
      foundingDate: '2026',
      email: 'contact@geomind.fr',
      areaServed: { '@type': 'Country', name: 'France' },
      knowsLanguage: 'fr',
      knowsAbout: [
        'Generative Engine Optimization',
        'GEO',
        'Optimisation pour les moteurs de réponses IA',
        'Visibilité dans ChatGPT',
        'Visibilité dans Perplexity',
        'Référencement IA',
        'SEO',
        'llms.txt',
        'Données structurées Schema.org',
      ],
      ...(SAME_AS.length > 0 ? { sameAs: SAME_AS } : {}),
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'contact@geomind.fr',
        contactType: 'customer support',
        availableLanguage: 'French',
        areaServed: 'FR',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://geomind.fr/#website',
      url: 'https://geomind.fr',
      name: 'GEOMIND',
      publisher: { '@id': 'https://geomind.fr/#organization' },
      inLanguage: 'fr-FR',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://geomind.fr/#software',
      name: 'GEOMIND',
      url: 'https://geomind.fr',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'SEO & GEO',
      operatingSystem: 'Web',
      inLanguage: 'fr-FR',
      publisher: { '@id': 'https://geomind.fr/#organization' },
      description:
        'Audit de visibilité IA (GEO) : mesure si votre site est cité par ChatGPT, Perplexity, Gemini et Claude, identifie les points faibles et génère des recommandations actionnables.',
      featureList: [
        'Mesure des citations dans ChatGPT, Perplexity, Gemini et Claude',
        'Note de visibilité IA et suivi de la tendance dans le temps',
        'Audit technique GEO (robots.txt, sitemap, données structurées)',
        'Audit de contenu GEO (FAQ, définitions, fraîcheur, citabilité)',
        'Analyse de l’autorité et des concurrents cités à votre place',
        'Recommandations prêtes à appliquer',
      ],
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'EUR',
        lowPrice: '0',
        highPrice: '149',
        offerCount: 4,
        offers: [
          {
            '@type': 'Offer',
            name: 'Gratuit',
            price: '0',
            priceCurrency: 'EUR',
            description: '1 analyse complète offerte, sans carte bancaire',
          },
          { '@type': 'Offer', name: 'Solo', price: '19', priceCurrency: 'EUR' },
          { '@type': 'Offer', name: 'Pro', price: '59', priceCurrency: 'EUR' },
          { '@type': 'Offer', name: 'Business', price: '149', priceCurrency: 'EUR' },
        ],
      },
    },
  ],
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
      />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
