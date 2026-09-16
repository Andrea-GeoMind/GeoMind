import { OG_CONTENT_TYPE, OG_SIZE, renderArticleOgImage } from '@/lib/marketing/article-og'
import { SECTEURS, getSecteur } from '@/lib/marketing/secteurs'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'GEOMIND — audit de visibilité dans les IA'

export function generateStaticParams() {
  return SECTEURS.map((s) => ({ secteur: s.slug }))
}

export default async function Image({ params }: { params: Promise<{ secteur: string }> }) {
  const { secteur } = await params
  const config = getSecteur(secteur)
  return renderArticleOgImage(
    config?.ogTitle ?? 'Êtes-vous cité par les IA ?',
    `${config?.label ?? 'GEOMIND'} · geomind.fr`
  )
}
