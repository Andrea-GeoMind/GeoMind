import { getArticle } from '@/lib/marketing/articles'
import { OG_CONTENT_TYPE, OG_SIZE, renderArticleOgImage } from '@/lib/marketing/article-og'

export const runtime = 'edge'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

const meta = getArticle('savoir-si-chatgpt-parle-de-mon-entreprise')!
export const alt = meta.title

export default function Image() {
  return renderArticleOgImage(meta.title)
}
