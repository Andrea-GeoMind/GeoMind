export interface TechnicalRecommendation {
  how: string
  impact: string
  effort: 'low' | 'medium' | 'high'
}

export const TECHNICAL_RECOMMENDATIONS: Record<string, TechnicalRecommendation> = {
  https_missing: {
    how: "Activez un certificat SSL/TLS sur votre hébergeur (Let's Encrypt est gratuit). Redirigez tout le trafic HTTP vers HTTPS via votre fichier `.htaccess` ou la configuration Nginx. Mettez ensuite à jour vos liens internes.",
    impact: 'Les IAs favorisent les sources HTTPS dans leurs citations. Corriger ce point peut améliorer significativement votre score global.',
    effort: 'medium',
  },
  h1_missing_or_duplicate: {
    how: "Chaque page doit contenir exactement un élément `<h1>` décrivant clairement son sujet principal. Vérifiez avec un crawler (Screaming Frog, Sitebulb) quelles pages sont concernées et ajoutez ou dédupliquez les H1.",
    impact: 'Un H1 unique et descriptif aide les IAs à comprendre le sujet de la page et à la citer avec précision.',
    effort: 'low',
  },
  http_errors_ratio: {
    how: "Identifiez les URLs retournant des erreurs 4xx/5xx via Google Search Console ou un crawler. Redirigez les pages supprimées (301), corrigez les liens internes cassés et résolvez les erreurs serveur.",
    impact: "Un taux d'erreurs élevé dégrade la confiance des IAs envers votre domaine.",
    effort: 'medium',
  },
  robots_txt_block_all: {
    how: "Modifiez votre `robots.txt` pour autoriser l'indexation. Remplacez `Disallow: /` par des règles ciblées sur les dossiers que vous voulez vraiment bloquer (admin, api privée…).",
    impact: "Un robots.txt bloquant tout empêche les crawlers IA d'accéder à votre contenu.",
    effort: 'low',
  },
  robots_txt_block_ai_bots: {
    how: "Retirez de votre `robots.txt` les règles qui bloquent les bots IA (GPTBot, ClaudeBot, Google-Extended, PerplexityBot). Si vous voulez limiter certains bots, ciblez-les précisément plutôt que de bloquer en masse.",
    impact: 'Bloquer les crawlers IA empêche directement votre site d\'être indexé dans leurs bases de connaissances.',
    effort: 'low',
  },
  sitemap_missing: {
    how: "Générez un sitemap XML avec votre CMS (WordPress, Next.js…) ou un outil comme `next-sitemap`. Placez-le à `/sitemap.xml` et déclarez-le dans `robots.txt` avec la directive `Sitemap:`.",
    impact: 'Un sitemap aide les IAs à découvrir et indexer toutes vos pages importantes.',
    effort: 'low',
  },
  sitemap_malformed: {
    how: "Validez votre sitemap sur https://www.xml-sitemaps.com/validate-xml-sitemap.html. Corrigez les erreurs de syntaxe XML, les URLs invalides et les entrées manquantes. Assurez-vous que toutes les URLs sont en HTTPS.",
    impact: 'Un sitemap malformé est ignoré par les crawlers, réduisant la découvrabilité de vos pages.',
    effort: 'low',
  },
  llms_txt_missing: {
    how: "Créez un fichier `/llms.txt` à la racine de votre site. Ce fichier au format Markdown décrit votre site, vos pages clés et votre expertise pour les agents IA. Voir la spec sur https://llmstxt.org.",
    impact: "Le fichier `llms.txt` est un signal fort d'optimisation GEO. Il aide les IAs à comprendre et retenir votre domaine d'activité.",
    effort: 'low',
  },
  hierarchy_missing: {
    how: "Structurez le contenu de vos pages avec une hiérarchie H1 > H2 > H3 cohérente. Évitez de sauter des niveaux (H1 puis H3 sans H2). Utilisez les balises heading pour décrire les sections, pas pour le style.",
    impact: 'Une hiérarchie claire permet aux IAs de segmenter et citer les sections pertinentes de votre contenu.',
    effort: 'medium',
  },
  depth_too_deep: {
    how: "Aplatissez votre arborescence de navigation pour que les pages importantes soient accessibles en 3 clics maximum depuis l'accueil. Créez des liens internes entre pages de même niveau.",
    impact: "Les pages trop profondes dans l'arborescence sont moins bien indexées par les crawlers IA.",
    effort: 'high',
  },
  schema_org_organization: {
    how: "Ajoutez un bloc JSON-LD `Organization` (ou `LocalBusiness`) dans le `<head>` de votre page d'accueil. Renseignez au minimum `name`, `url`, `logo` et `description`. Les CMS proposent souvent des plugins dédiés.",
    impact: "Ce schema aide les IAs à identifier votre organisation et à l'associer à votre domaine dans leurs réponses.",
    effort: 'low',
  },
  schema_org_faq: {
    how: "Identifiez les questions fréquentes de vos clients et créez une section FAQ sur vos pages clés. Balisez-la avec le schema JSON-LD `FAQPage` contenant les paires `Question`/`Answer`.",
    impact: "Les FAQ schema.org sont fréquemment citées par les IAs lorsqu'elles répondent à des questions directes.",
    effort: 'medium',
  },
  schema_org_article: {
    how: "Pour chaque article ou billet de blog, ajoutez un JSON-LD `Article` avec `headline`, `author`, `datePublished` et `image`. Next.js ou votre CMS peut générer ces données dynamiquement.",
    impact: 'Les articles balisés sont mieux reconnus et plus souvent cités comme sources dans les réponses IA.',
    effort: 'medium',
  },
  schema_org_product: {
    how: "Pour chaque produit, ajoutez un JSON-LD `Product` avec `name`, `description`, `offers` (prix, disponibilité) et `image`. Inclure des `aggregateRating` augmente encore la visibilité.",
    impact: 'Les fiches produit balisées sont récupérées par les IAs dans les requêtes commerciales.',
    effort: 'medium',
  },
  response_time_slow: {
    how: "Activez un CDN (Cloudflare, Vercel Edge), optimisez vos images (WebP, lazy loading), activez la mise en cache HTTP et réduisez le JavaScript bloquant. Mesurez avec PageSpeed Insights.",
    impact: 'Un temps de réponse élevé peut entraîner des timeouts lors du crawl IA, réduisant la couverture de votre site.',
    effort: 'high',
  },
  page_size_heavy: {
    how: "Compressez vos images (Squoosh, ImageOptim), activez Gzip/Brotli côté serveur, supprimez le JS/CSS inutilisé et externalisez les ressources lourdes vers un CDN.",
    impact: "Des pages lourdes sont partiellement chargées par les crawlers IA, ce qui peut tronquer votre contenu dans les réponses.",
    effort: 'medium',
  },
}
