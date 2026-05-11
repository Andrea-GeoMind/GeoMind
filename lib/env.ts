/**
 * lib/env.ts
 *
 * Validation Zod de toutes les variables d'environnement.
 * Import ce module au boot (app/layout.tsx) pour que l'app crash explicitement
 * si une variable obligatoire est absente ou invalide — plutôt qu'une erreur
 * cryptique plus tard dans le code.
 *
 * Usage : import { env } from '@/lib/env'
 */

import { z } from 'zod'

// ─── Schéma ───────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // ── Node ────────────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ── Database (Supabase Postgres — connection pooler URI) ────────────────────
  DATABASE_URL: z.url({ message: 'DATABASE_URL doit être une URL Postgres valide' }),

  // ── Supabase ─────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.url({ message: 'NEXT_PUBLIC_SUPABASE_URL invalide' }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, { message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY manquant' }),
  /** Réservé Inngest + scripts admin uniquement — jamais côté client */
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, { message: 'SUPABASE_SERVICE_ROLE_KEY manquant' }),

  // ── Email (Resend) ───────────────────────────────────────────────────────────
  RESEND_API_KEY: z.string().min(1, { message: 'RESEND_API_KEY manquant' }),
  EMAIL_FROM: z.email({ message: 'EMAIL_FROM doit être une adresse email valide' }),

  // ── Stripe ───────────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith('sk_', { message: 'STRIPE_SECRET_KEY doit commencer par sk_' }),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith('whsec_', { message: 'STRIPE_WEBHOOK_SECRET doit commencer par whsec_' }),
  STRIPE_PRO_PRICE_ID: z
    .string()
    .startsWith('price_', { message: 'STRIPE_PRO_PRICE_ID doit commencer par price_' }),
  STRIPE_BUSINESS_PRICE_ID: z
    .string()
    .startsWith('price_', { message: 'STRIPE_BUSINESS_PRICE_ID doit commencer par price_' }),

  // ── LLM ─────────────────────────────────────────────────────────────────────
  OPENROUTER_API_KEY: z
    .string()
    .startsWith('sk-or-', { message: 'OPENROUTER_API_KEY doit commencer par sk-or-' }),
  PERPLEXITY_API_KEY: z
    .string()
    .startsWith('pplx-', { message: 'PERPLEXITY_API_KEY doit commencer par pplx-' }),

  // ── Crawl ────────────────────────────────────────────────────────────────────
  FIRECRAWL_API_KEY: z
    .string()
    .startsWith('fc-', { message: 'FIRECRAWL_API_KEY doit commencer par fc-' }),

  // ── Background jobs (Inngest) ─────────────────────────────────────────────
  INNGEST_EVENT_KEY: z.string().min(1, { message: 'INNGEST_EVENT_KEY manquant' }),
  INNGEST_SIGNING_KEY: z.string().min(1, { message: 'INNGEST_SIGNING_KEY manquant' }),

  // ── Observabilité ────────────────────────────────────────────────────────────
  SENTRY_DSN: z.url({ message: 'SENTRY_DSN doit être une URL valide' }),
  NEXT_PUBLIC_POSTHOG_KEY: z
    .string()
    .startsWith('phc_', { message: 'NEXT_PUBLIC_POSTHOG_KEY doit commencer par phc_' }),
  NEXT_PUBLIC_POSTHOG_HOST: z.url({ message: 'NEXT_PUBLIC_POSTHOG_HOST doit être une URL valide' }),
})

// ─── Parse & crash si invalide ────────────────────────────────────────────────

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const errors = parsed.error.issues
    .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')

  throw new Error(
    `\n\n❌ Variables d'environnement invalides ou manquantes :\n\n${errors}\n\n` +
      `Vérifiez votre fichier .env.local (copiez .env.example et remplissez les valeurs).\n`
  )
}

// ─── Export typé ─────────────────────────────────────────────────────────────

export const env = parsed.data

export type Env = typeof env
