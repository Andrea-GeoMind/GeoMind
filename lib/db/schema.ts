import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  jsonb,
  integer,
  numeric,
  unique,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const planEnum = pgEnum('plan', ['free', 'pro', 'business'])

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete',
])

export const analysisStatusEnum = pgEnum('analysis_status', [
  'pending',
  'running',
  'success',
  'error',
])

export const iaEngineEnum = pgEnum('ia_engine', ['chatgpt', 'claude', 'gemini', 'perplexity'])

// ─── profiles ─────────────────────────────────────────────────────────────────
// Mirror de auth.users — créé automatiquement par trigger SQL.

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // = auth.users.id, set by SQL trigger
  email: text('email').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── subscriptions ────────────────────────────────────────────────────────────
// Source de vérité pour le plan — mise à jour par Stripe webhooks.

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  plan: planEnum('plan').notNull().default('free'),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── sites ────────────────────────────────────────────────────────────────────

export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  language: varchar('language', { length: 2 }).notNull().default('fr'),
  country: varchar('country', { length: 2 }).notNull().default('FR'),
  isVerified: boolean('is_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── firecrawl_pages ──────────────────────────────────────────────────────────
// Pages crawlées par Firecrawl pour un site donné.
// Upsert sur (site_id, url) — re-crawler écrase l'existant.

export const firecrawlPages = pgTable(
  'firecrawl_pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    markdown: text('markdown'),
    metadata: jsonb('metadata'),
    statusCode: integer('status_code'),
    crawledAt: timestamp('crawled_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('firecrawl_pages_site_url_unique').on(t.siteId, t.url)]
)

// ─── site_metadata ────────────────────────────────────────────────────────────
// Résultat de la phase découverte : description, mots-clés extraits du crawl.
// 1:1 avec sites — upsert à chaque nouvelle découverte.

export const siteMetadata = pgTable('site_metadata', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id')
    .notNull()
    .unique()
    .references(() => sites.id, { onDelete: 'cascade' }),
  description: text('description'),
  keywords: text('keywords').array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── competitors ──────────────────────────────────────────────────────────────
// Concurrents détectés lors de la découverte. Remplacés entièrement à chaque analyse.

export const competitors = pgTable(
  'competitors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    name: text('name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('competitors_site_url_unique').on(t.siteId, t.url)]
)

// ─── prompts ──────────────────────────────────────────────────────────────────
// Prompts neutres générés lors de la découverte, utilisés pour interroger les IAs.
// is_neutral=false si le prompt contient le domaine ou la marque (règle §6 CLAUDE.md).

export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  isNeutral: boolean('is_neutral').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── analyses ─────────────────────────────────────────────────────────────────
// Un audit GEO complet d'un site. Créé au lancement, mis à jour à chaque étape.
// Quota : limité par plan (lib/plans.ts PLAN_LIMITS.analyses / mois).

export const analyses = pgTable('analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  status: analysisStatusEnum('status').notNull().default('pending'),
  errorMessage: text('error_message'),
  globalScore: integer('global_score'),
  authorityScore: integer('authority_score'),
  technicalScore: integer('technical_score'),
  contentScore: integer('content_score'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── authority_results ────────────────────────────────────────────────────────
// Une réponse d'un moteur IA pour un prompt donné, dans le cadre d'une analyse.
// 1 record = 1 prompt × 1 IA.

export const authorityResults = pgTable('authority_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  analysisId: uuid('analysis_id')
    .notNull()
    .references(() => analyses.id, { onDelete: 'cascade' }),
  promptId: uuid('prompt_id')
    .notNull()
    .references(() => prompts.id, { onDelete: 'cascade' }),
  engine: iaEngineEnum('engine').notNull(),
  answer: text('answer').notNull(),
  promptIsNeutral: boolean('prompt_is_neutral').notNull().default(true),
  partialResponse: boolean('partial_response').notNull().default(false),
  tokensInput: integer('tokens_input').notNull().default(0),
  tokensOutput: integer('tokens_output').notNull().default(0),
  costUsd: numeric('cost_usd', { precision: 12, scale: 8 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── authority_sources ────────────────────────────────────────────────────────
// Citations extraites d'une réponse IA. Permet de détecter si le domaine client est cité.

export const authoritySources = pgTable('authority_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorityResultId: uuid('authority_result_id')
    .notNull()
    .references(() => authorityResults.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  title: text('title'),
  domain: text('domain').notNull(),
  isClientDomain: boolean('is_client_domain').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [profiles.id],
    references: [subscriptions.userId],
  }),
  sites: many(sites),
}))

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  profile: one(profiles, {
    fields: [subscriptions.userId],
    references: [profiles.id],
  }),
}))

export const sitesRelations = relations(sites, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [sites.userId],
    references: [profiles.id],
  }),
  firecrawlPages: many(firecrawlPages),
  metadata: one(siteMetadata, {
    fields: [sites.id],
    references: [siteMetadata.siteId],
  }),
  competitors: many(competitors),
  prompts: many(prompts),
  analyses: many(analyses),
}))

export const firecrawlPagesRelations = relations(firecrawlPages, ({ one }) => ({
  site: one(sites, {
    fields: [firecrawlPages.siteId],
    references: [sites.id],
  }),
}))

export const siteMetadataRelations = relations(siteMetadata, ({ one }) => ({
  site: one(sites, {
    fields: [siteMetadata.siteId],
    references: [sites.id],
  }),
}))

export const competitorsRelations = relations(competitors, ({ one }) => ({
  site: one(sites, {
    fields: [competitors.siteId],
    references: [sites.id],
  }),
}))

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  site: one(sites, {
    fields: [prompts.siteId],
    references: [sites.id],
  }),
  authorityResults: many(authorityResults),
}))

export const analysesRelations = relations(analyses, ({ one, many }) => ({
  site: one(sites, {
    fields: [analyses.siteId],
    references: [sites.id],
  }),
  profile: one(profiles, {
    fields: [analyses.userId],
    references: [profiles.id],
  }),
  authorityResults: many(authorityResults),
}))

export const authorityResultsRelations = relations(authorityResults, ({ one, many }) => ({
  analysis: one(analyses, {
    fields: [authorityResults.analysisId],
    references: [analyses.id],
  }),
  prompt: one(prompts, {
    fields: [authorityResults.promptId],
    references: [prompts.id],
  }),
  sources: many(authoritySources),
}))

export const authoritySourcesRelations = relations(authoritySources, ({ one }) => ({
  authorityResult: one(authorityResults, {
    fields: [authoritySources.authorityResultId],
    references: [authorityResults.id],
  }),
}))
