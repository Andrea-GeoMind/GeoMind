import { describe, it, expect } from 'vitest'
import { z } from 'zod'

/**
 * Tests unitaires pour lib/env.ts
 *
 * On ne peut pas importer lib/env directement dans les tests car il lirait
 * process.env de l'environnement de test (incomplet).
 * On extrait et réutilise le schéma pour tester la logique de validation.
 */

// Schéma minimal réutilisé pour les tests (sous-ensemble des règles clés)
const testSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.url(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  OPENROUTER_API_KEY: z.string().startsWith('sk-or-'),
  PERPLEXITY_API_KEY: z.string().startsWith('pplx-'),
  FIRECRAWL_API_KEY: z.string().startsWith('fc-'),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().startsWith('phc_'),
  EMAIL_FROM: z.email(),
})

const validEnv = {
  NODE_ENV: 'production' as const,
  DATABASE_URL: 'postgresql://user:pass@host:5432/db',
  STRIPE_SECRET_KEY: 'sk_live_abc123',
  STRIPE_WEBHOOK_SECRET: 'whsec_abc123',
  OPENROUTER_API_KEY: 'sk-or-abc123',
  PERPLEXITY_API_KEY: 'pplx-abc123',
  FIRECRAWL_API_KEY: 'fc-abc123',
  NEXT_PUBLIC_POSTHOG_KEY: 'phc_abc123',
  EMAIL_FROM: 'noreply@geomind.fr',
}

describe('env schema', () => {
  it('accepte un environnement valide complet', () => {
    const result = testSchema.safeParse(validEnv)
    expect(result.success).toBe(true)
  })

  it('rejette DATABASE_URL invalide (pas une URL)', () => {
    const result = testSchema.safeParse({ ...validEnv, DATABASE_URL: 'not-a-url' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('DATABASE_URL')
    }
  })

  it('rejette STRIPE_SECRET_KEY sans préfixe sk_', () => {
    const result = testSchema.safeParse({ ...validEnv, STRIPE_SECRET_KEY: 'bad_key' })
    expect(result.success).toBe(false)
  })

  it('rejette STRIPE_WEBHOOK_SECRET sans préfixe whsec_', () => {
    const result = testSchema.safeParse({ ...validEnv, STRIPE_WEBHOOK_SECRET: 'wrong_secret' })
    expect(result.success).toBe(false)
  })

  it('rejette OPENROUTER_API_KEY sans préfixe sk-or-', () => {
    const result = testSchema.safeParse({ ...validEnv, OPENROUTER_API_KEY: 'sk_wrong' })
    expect(result.success).toBe(false)
  })

  it('rejette EMAIL_FROM invalide', () => {
    const result = testSchema.safeParse({ ...validEnv, EMAIL_FROM: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('applique la valeur par défaut development pour NODE_ENV', () => {
    const { NODE_ENV: _NODE_ENV, ...withoutNodeEnv } = validEnv
    const result = testSchema.safeParse(withoutNodeEnv)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.NODE_ENV).toBe('development')
    }
  })

  it('rejette NODE_ENV avec une valeur non autorisée', () => {
    const result = testSchema.safeParse({ ...validEnv, NODE_ENV: 'staging' })
    expect(result.success).toBe(false)
  })
})
