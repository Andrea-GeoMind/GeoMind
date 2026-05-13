// Script one-shot : applique le schéma complet GeoMind sur Supabase.
// Usage : npx tsx scripts/apply-tkt013-migration.ts

import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL manquant dans .env.local')

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1 })

async function main() {
  console.log('🚀 Application du schéma GeoMind…')

  // ── Enums ──────────────────────────────────────────────────────────────────

  await sql`
    DO $$ BEGIN
      CREATE TYPE "public"."plan" AS ENUM('free', 'pro', 'business');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `
  await sql`
    DO $$ BEGIN
      CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing', 'incomplete');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `
  await sql`
    DO $$ BEGIN
      CREATE TYPE "public"."analysis_status" AS ENUM('pending', 'running', 'success', 'error');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `
  await sql`
    DO $$ BEGIN
      CREATE TYPE "public"."ia_engine" AS ENUM('chatgpt', 'claude', 'gemini', 'perplexity');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `
  console.log('✓ enums')

  // ── Tables de base ─────────────────────────────────────────────────────────

  await sql`
    CREATE TABLE IF NOT EXISTS "profiles" (
      "id" uuid PRIMARY KEY NOT NULL,
      "email" text NOT NULL,
      "full_name" text,
      "avatar_url" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `
  console.log('✓ profiles')

  await sql`
    CREATE TABLE IF NOT EXISTS "subscriptions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
      "stripe_customer_id" text,
      "stripe_subscription_id" text,
      "plan" "plan" DEFAULT 'free' NOT NULL,
      "status" "subscription_status" DEFAULT 'active' NOT NULL,
      "current_period_end" timestamp with time zone,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `
  console.log('✓ subscriptions')

  await sql`
    CREATE TABLE IF NOT EXISTS "sites" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
      "name" text NOT NULL,
      "url" text NOT NULL,
      "language" varchar(2) DEFAULT 'fr' NOT NULL,
      "country" varchar(2) DEFAULT 'FR' NOT NULL,
      "is_verified" boolean DEFAULT false NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `
  console.log('✓ sites')

  await sql`
    CREATE TABLE IF NOT EXISTS "firecrawl_pages" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
      "url" text NOT NULL,
      "markdown" text,
      "metadata" jsonb,
      "status_code" integer,
      "crawled_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "firecrawl_pages_site_url_unique" UNIQUE("site_id", "url")
    )
  `
  console.log('✓ firecrawl_pages')

  await sql`
    CREATE TABLE IF NOT EXISTS "site_metadata" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "site_id" uuid NOT NULL UNIQUE REFERENCES "sites"("id") ON DELETE CASCADE,
      "description" text,
      "keywords" text[] DEFAULT '{}'::text[] NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `
  console.log('✓ site_metadata')

  await sql`
    CREATE TABLE IF NOT EXISTS "competitors" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
      "url" text NOT NULL,
      "name" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "competitors_site_url_unique" UNIQUE("site_id", "url")
    )
  `
  console.log('✓ competitors')

  await sql`
    CREATE TABLE IF NOT EXISTS "prompts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
      "text" text NOT NULL,
      "is_neutral" boolean DEFAULT true NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `
  console.log('✓ prompts')

  // ── Tables TKT-013 ─────────────────────────────────────────────────────────

  await sql`
    CREATE TABLE IF NOT EXISTS "analyses" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
      "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
      "status" "analysis_status" DEFAULT 'pending' NOT NULL,
      "error_message" text,
      "global_score" integer,
      "authority_score" integer,
      "technical_score" integer,
      "content_score" integer,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `
  console.log('✓ analyses')

  await sql`
    CREATE TABLE IF NOT EXISTS "authority_results" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "analysis_id" uuid NOT NULL REFERENCES "analyses"("id") ON DELETE CASCADE,
      "prompt_id" uuid NOT NULL REFERENCES "prompts"("id") ON DELETE CASCADE,
      "engine" "ia_engine" NOT NULL,
      "answer" text NOT NULL,
      "prompt_is_neutral" boolean DEFAULT true NOT NULL,
      "partial_response" boolean DEFAULT false NOT NULL,
      "tokens_input" integer DEFAULT 0 NOT NULL,
      "tokens_output" integer DEFAULT 0 NOT NULL,
      "cost_usd" numeric(12, 8) DEFAULT '0' NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `
  console.log('✓ authority_results')

  await sql`
    CREATE TABLE IF NOT EXISTS "authority_sources" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "authority_result_id" uuid NOT NULL REFERENCES "authority_results"("id") ON DELETE CASCADE,
      "url" text NOT NULL,
      "title" text,
      "domain" text NOT NULL,
      "is_client_domain" boolean DEFAULT false NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `
  console.log('✓ authority_sources')

  await sql.end()
  console.log('\n✅ Schéma GeoMind appliqué avec succès sur Supabase.')
}

main().catch((err) => {
  console.error('❌ Erreur migration :', err)
  process.exit(1)
})
