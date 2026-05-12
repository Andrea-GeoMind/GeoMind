// Détection des prompts non-neutres (règle CLAUDE.md §6).
// Fichier sans dépendances I/O — importable dans les tests unitaires.

/**
 * Retourne true si le texte ne contient aucun token lié au domaine ou à la marque.
 */
export function isPromptNeutral(text: string, siteUrl: string, siteName: string): boolean {
  const tokens = extractDomainTokens(siteUrl, siteName)
  return !containsDomainToken(text, tokens)
}

export function extractDomainTokens(url: string, siteName: string): string[] {
  const tokens: string[] = []

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    tokens.push(hostname)
    tokens.push(hostname.split('.')[0])
  } catch {
    // URL invalide — ignorée
  }

  const nameCleaned = siteName.toLowerCase().replace(/[^a-z0-9]/g, '')
  tokens.push(nameCleaned)

  // Filtre les tokens trop courts pour éviter les faux positifs (ex: "ab", "io")
  return [...new Set(tokens.filter((t) => t.length > 2))]
}

export function containsDomainToken(text: string, tokens: string[]): boolean {
  const lower = text.toLowerCase()
  return tokens.some((token) => lower.includes(token.toLowerCase()))
}
