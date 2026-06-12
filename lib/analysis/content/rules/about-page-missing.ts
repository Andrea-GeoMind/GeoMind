import type { RuleInput, ContentIssue } from '../types'

// Marqueurs d'une page "à propos" dans une URL ou un title (après normalisation)
const ABOUT_PATTERN = /(a-propos|qui-sommes-nous|about|notre-equipe|notre-histoire)/

/** Normalise : minuscules, accents supprimés, espaces et underscores → tirets. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s_]+/g, '-')
}

/**
 * Règle SITE — page "à propos" manquante.
 * Une page qui présente l'entreprise et l'équipe est un signal E-E-A-T fort :
 * les IA vérifient qui parle avant de citer une source.
 */
export async function checkAboutPageMissing({ pages }: RuleInput): Promise<ContentIssue | null> {
  if (pages.length === 0) return null

  const hasAboutPage = pages.some((p) => {
    if (ABOUT_PATTERN.test(normalize(p.url))) return true
    const title = p.metadata?.title
    return title ? ABOUT_PATTERN.test(normalize(title)) : false
  })
  if (hasAboutPage) return null

  return {
    ruleKey: 'about_page_missing',
    category: 'coverage',
    title: 'Page "À propos" manquante',
    description: `Aucune page "À propos" ou "Qui sommes-nous" n'a été détectée. C'est un signal E-E-A-T fort : les IA vérifient qui est derrière un site avant de le citer comme source fiable. Présentez votre entreprise, votre équipe et votre expertise.`,
    sampleUrls: [],
    severity: 'moderate',
    effort: 2,
    impact: 2,
  }
}
