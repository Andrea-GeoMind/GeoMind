import { z } from 'zod'

export const firecrawlDocumentMetadataSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
    language: z.string().optional(),
    statusCode: z.number().optional(),
  })
  .passthrough()

export const firecrawlDocumentSchema = z.object({
  markdown: z.string().optional(),
  /**
   * HTML brut, demandé au crawl pour en extraire le JSON-LD — jamais persisté.
   * Impérativement `rawHtml` et non `html` : le format `html` de Firecrawl est
   * nettoyé et retire les `<script>`, donc tout le JSON-LD avec.
   */
  rawHtml: z.string().optional(),
  metadata: firecrawlDocumentMetadataSchema.optional(),
})

export type FirecrawlDocument = z.infer<typeof firecrawlDocumentSchema>
