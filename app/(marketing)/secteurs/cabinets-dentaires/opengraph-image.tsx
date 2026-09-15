import { OG_CONTENT_TYPE, OG_SIZE, renderArticleOgImage } from '@/lib/marketing/article-og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export const alt = 'Votre cabinet est-il cité quand un patient interroge une IA ?'

export default function Image() {
  return renderArticleOgImage(
    'Votre cabinet est-il cité quand un patient interroge une IA ?',
    'Cabinets dentaires & médicaux · geomind.fr'
  )
}
