import Header from '@/components/features/marketing/header'
import Footer from '@/components/features/marketing/footer'

// JSON-LD Organization + WebSite + SoftwareApplication — fiche d'identité
// structurée de GeoMind pour les moteurs de recherche et les moteurs de
// réponses IA (règle GEO schema-org-organization que le produit audite
// chez ses clients : le cordonnier se chausse).
const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://geomind.fr/#organization',
      name: 'GEOMIND',
      url: 'https://geomind.fr',
      logo: 'https://geomind.fr/logo-mark.png',
      description:
        'GEOMIND audite la visibilité des sites web dans les moteurs de réponses IA (ChatGPT, Perplexity, Gemini, Claude) et fournit un plan d’action concret. Pensé pour les TPE et PME françaises.',
      email: 'contact@geomind.fr',
      areaServed: 'FR',
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
      name: 'GEOMIND',
      url: 'https://geomind.fr',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'Audit de visibilité IA (GEO) : mesure si votre site est cité par ChatGPT, Perplexity, Gemini et Claude, identifie les points faibles et génère des recommandations actionnables.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        description: '1 analyse complète offerte, sans carte bancaire',
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
