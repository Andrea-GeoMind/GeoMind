// Schémas Zod pour les sorties LLM structurées.
// Fichier sans dépendances I/O — importable dans les tests unitaires.

import { z } from 'zod'

export const DiscoveryOutputSchema = z.object({
  description: z.string().min(10).max(1000),
  keywords: z.array(z.string().min(1)).min(1).max(30),
  competitors: z
    .array(
      z.object({
        url: z.string().min(1),
        name: z.string().min(1),
      })
    )
    .max(15)
    .default([]),
})

export type DiscoveryOutput = z.infer<typeof DiscoveryOutputSchema>

export const NeutralPromptsOutputSchema = z.object({
  prompts: z.array(z.string().min(10)).length(20),
})

export type NeutralPromptsOutput = z.infer<typeof NeutralPromptsOutputSchema>
