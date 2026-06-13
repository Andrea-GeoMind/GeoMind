// Schémas Zod pour les sorties LLM structurées.
// Fichier sans dépendances I/O — importable dans les tests unitaires.

import { z } from 'zod'

export const DiscoveryOutputSchema = z.object({
  description: z.string().min(10).max(1000),
  keywords: z.array(z.string().min(1)).max(30).default([]),
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

// Validation runtime des réponses moteurs IA (PLAN item 17, règle CLAUDE.md §8) :
// une réponse malformée d'un connecteur ne doit jamais se propager en DB en
// silence — elle est rejetée et l'appel compté comme échoué.
export const IAResponseSchema = z.object({
  engine: z.enum(['chatgpt', 'claude', 'gemini', 'perplexity']),
  prompt: z.string(),
  answer: z.string(),
  sources: z.array(
    z.object({
      url: z.string().min(1),
      domain: z.string().min(1),
      title: z.string().nullable(),
    })
  ),
  partial_response: z.boolean(),
  tokens_input: z.number().int().min(0),
  tokens_output: z.number().int().min(0),
  cost_usd: z.number().min(0),
  raw: z.unknown().optional(),
})

// PLAN item 10 : 10 prompts pour la fiabilité statistique du score d'autorité.
// Tolérance ±2 : les LLMs ratent parfois le compte exact, 8 prompts valides
// valent mieux qu'un retry de plus.
export const NeutralPromptsOutputSchema = z.object({
  prompts: z.array(z.string().min(10)).min(8).max(12),
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

// Schéma d'extraction de réputation (PLAN item 31) — sentiment + affirmations
export const ReputationExtractSchema = z.object({
  knows_business: z.boolean(),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  claims: z
    .array(
      z.object({
        type: z.enum([
          'activite',
          'adresse',
          'ville',
          'horaires',
          'telephone',
          'prix',
          'service',
          'fondation',
          'autre',
        ]),
        value: z.string().min(1).max(300),
      })
    )
    .max(20)
    .default([]),
})

export type ReputationExtract = z.infer<typeof ReputationExtractSchema>
