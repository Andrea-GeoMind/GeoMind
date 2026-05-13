export interface ContentRecommendation {
  how: string
  impact: string
  effort: 'low' | 'medium' | 'high'
}

export const CONTENT_RECOMMENDATIONS: Record<string, ContentRecommendation> = {
  thin_content: {
    how: "Enrichissez vos pages avec au minimum 300 à 500 mots de contenu substantiel. Développez les sujets en profondeur : expliquez les concepts, donnez des exemples concrets, répondez aux questions fréquentes. Évitez les pages qui ne font que lister des liens ou répéter le même message en boucle.",
    impact: "Les IAs favorisent les sources denses en information. Un contenu étoffé augmente considérablement les chances d'être cité dans des réponses détaillées.",
    effort: 'medium',
  },
  no_faq_content: {
    how: "Ajoutez une section FAQ sur vos pages clés. Identifiez les questions réelles de vos clients (SAV, recherches Google, chats…) et répondez-y directement en langage naturel. Une FAQ de 5 à 10 questions bien rédigées suffit pour commencer.",
    impact: "Les sections FAQ sont parmi les contenus les plus cités par les IAs. Elles correspondent exactement au format question/réponse utilisé par ChatGPT, Perplexity et Gemini.",
    effort: 'low',
  },
  no_structured_lists: {
    how: "Convertissez vos paragraphes en listes à puces ou numérotées lorsque vous listez des étapes, des avantages ou des caractéristiques. Chaque élément doit être concis (1-2 lignes) et commencer par un verbe ou un nom clé.",
    impact: "Les listes structurées sont extraites facilement par les IAs pour répondre à des questions du type « quels sont les avantages de… ». Elles augmentent la probabilité d'être cité mot pour mot.",
    effort: 'low',
  },
  no_definition_patterns: {
    how: "Intégrez des définitions claires dans votre contenu. Utilisez des formulations explicites comme « X est… », « On appelle X le fait de… », ou créez un glossaire dédié. Les encadrés « Définition » ou « À retenir » sont particulièrement efficaces.",
    impact: "Les IAs extraient fréquemment les définitions pour répondre aux requêtes informationnelles. Un contenu qui définit clairement ses concepts est cité comme source de référence.",
    effort: 'low',
  },
  meta_description_missing: {
    how: "Ajoutez une balise `<meta name=\"description\">` sur chaque page, idéalement entre 150 et 160 caractères. Décrivez le contenu de la page en une ou deux phrases qui donnent envie de cliquer. La plupart des CMS (WordPress, Webflow, Next.js…) proposent un champ dédié.",
    impact: "La meta description est lue par les crawlers IA pour comprendre le sujet d'une page. Son absence réduit la compréhension sémantique de vos contenus.",
    effort: 'low',
  },
  meta_description_too_short: {
    how: "Réécrivez les meta descriptions trop courtes (moins de 50 caractères) pour atteindre 130 à 160 caractères. Incluez votre mot-clé principal, votre proposition de valeur et un appel à l'action implicite.",
    impact: "Une meta description trop courte sous-exploite ce signal sémantique. Les IAs se fient à la densité et à la précision de la description pour évaluer la pertinence de la page.",
    effort: 'low',
  },
  duplicate_meta_descriptions: {
    how: "Identifiez les pages avec des meta descriptions identiques (export depuis Screaming Frog ou Google Search Console). Rédigez une meta description unique pour chaque page en reflétant son contenu spécifique. Évitez les templates génériques copiés-collés.",
    impact: "Les meta descriptions dupliquées signalent un manque de différenciation sémantique à vos pages. Les IAs peuvent avoir du mal à distinguer vos contenus les uns des autres.",
    effort: 'medium',
  },
  title_missing_or_short: {
    how: "Vérifiez que chaque page possède une balise `<title>` unique d'au moins 20 caractères. Le titre doit décrire précisément le contenu de la page et inclure votre mot-clé principal. Évitez les titres génériques comme « Accueil » ou « Page 1 ».",
    impact: "Le titre est le signal le plus fort pour les IAs afin d'identifier le sujet d'une page. Un titre manquant ou trop court dégrade fortement la qualité de l'indexation.",
    effort: 'low',
  },
  no_dates_in_content: {
    how: "Ajoutez des dates de publication et de mise à jour sur vos articles et pages de contenu. Utilisez les balises schema.org `datePublished` et `dateModified` en plus de l'affichage visible. Mentionnez explicitement les dates dans le corps du texte lorsque c'est pertinent (ex : « Mise à jour en 2024 »).",
    impact: "Les IAs valorisent les contenus datés car cela leur permet d'évaluer la fraîcheur de l'information. Un contenu non daté est perçu comme potentiellement obsolète.",
    effort: 'low',
  },
  low_page_count: {
    how: "Enrichissez votre site avec plus de contenu indexable : articles de blog, pages de cas clients, guides pratiques, FAQ. Visez au minimum 10 à 20 pages thématiques couvrant les différentes facettes de votre activité.",
    impact: "Un site avec peu de pages a une faible empreinte sémantique. Les IAs ont besoin d'un volume de contenu suffisant pour considérer votre domaine comme une source d'autorité.",
    effort: 'high',
  },
}
