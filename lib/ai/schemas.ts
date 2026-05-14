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

// Schéma de sortie LLM pour une fiche recommandation par issue (TKT-023)
export const RecommendationOutputSchema = z.object({
  content: z.string().min(20),
})

export type RecommendationOutput = z.infer<typeof RecommendationOutputSchema>

// Schéma de sortie LLM pour la génération des publishers (TKT-025)
const PublisherItemSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  category: z.enum(['media', 'community', 'public_base']),
  pitch_angle: z.string().min(10),
})

export const PublishersOutputSchema = z.object({
  publishers: z.array(PublisherItemSchema).length(15),
})

export type PublishersOutput = z.infer<typeof PublishersOutputSchema>
export type PublisherItem = z.infer<typeof PublisherItemSchema>
