import type { TechnicalPageRuleFn } from '../types'

const MIN_IMAGES = 3
const MAX_MISSING_ALT_RATIO = 0.2

/**
 * Scope page : plus de 20 % des images de la page n'ont pas de texte alternatif
 * (minimum 3 images pour éviter le bruit).
 */
export const checkImagesWithoutAlt: TechnicalPageRuleFn = async (page) => {
  const markdown = page.markdown ?? ''
  const images = [...markdown.matchAll(/!\[([^\]]*)\]\(/g)]
  if (images.length < MIN_IMAGES) return null
  const withoutAlt = images.filter((m) => m[1].trim() === '')
  const ratio = withoutAlt.length / images.length
  if (ratio <= MAX_MISSING_ALT_RATIO) return null
  return {
    ruleKey: 'images_without_alt',
    category: 'accessibility',
    title: 'Images sans texte alternatif',
    description: `${withoutAlt.length} image(s) sur ${images.length} n'ont pas de texte alternatif sur cette page. Les IA ne « voient » pas vos images : le texte alt est leur seule façon de comprendre ce qu'elles montrent — sans lui, cette partie de votre contenu leur est invisible.`,
    sampleUrls: [page.url],
    severity: 'minor',
    effort: 2,
    impact: 2,
  }
}
