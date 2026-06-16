import { getArticle } from '@/lib/marketing/articles'
import { OG_CONTENT_TYPE, OG_SIZE, renderArticleOgImage } from '@/lib/marketing/article-og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

const meta = getArticle('geo-commerce-local')!
export const alt = meta.title

export default function Image() {
  return renderArticleOgImage(meta.title)
}
