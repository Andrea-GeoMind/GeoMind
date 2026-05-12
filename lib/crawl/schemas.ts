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
  metadata: firecrawlDocumentMetadataSchema.optional(),
})

export type FirecrawlDocument = z.infer<typeof firecrawlDocumentSchema>
