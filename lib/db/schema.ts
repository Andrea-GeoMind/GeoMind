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

export const planEnum = pgEnum('plan', ['free', 'solo', 'pro', 'business', 'admin'])

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

export const technicalIssueCategoryEnum = pgEnum('technical_issue_category', [
  'accessibility',
  'structure',
  'schema_org',
  'performance',
])

export const contentIssueCategoryEnum = pgEnum('content_issue_category', [
  'readability',
  'metadata',
  'structure',
  'coverage',
])

// Sévérités V2 (§18.3) : major 12 / moderate 6 / minor 3 / opportunity 0 points
export const issueSeverityEnum = pgEnum('issue_severity', [
  'major',
  'moderate',
  'minor',
  'opportunity',
])

export const creditTransactionReasonEnum = pgEnum('credit_transaction_reason', [
  'welcome_bonus',
  'monthly_reset',
  'pack_purchase',
  'analysis',
  'coach_message',
  'recommendation',
  'refund_failed_analysis',
  'admin_adjustment',
])

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

// ─── stripe_webhook_events ────────────────────────────────────────────────────
// Idempotence des webhooks Stripe : un event id (unique chez Stripe, identique
// lors d'un replay) n'est traité qu'une fois. Le claim est posé AVANT le
// traitement et libéré en cas d'échec, pour que le retry Stripe reprocesse.

export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
  /** Event id Stripe (evt_…) — clé primaire naturelle */
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── credit_balances ──────────────────────────────────────────────────────────
// Solde de crédits par user (cahier-des-charges §17). Deux compteurs :
// monthly_credits (alloués par le plan, reset à la date anniversaire de facturation)
// et purchased_credits (packs achetés, n'expirent jamais).
// Consommation : mensuels d'abord, achetés ensuite — atomique via lib/credits.ts.

export const creditBalances = pgTable('credit_balances', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  monthlyCredits: integer('monthly_credits').notNull().default(0),
  purchasedCredits: integer('purchased_credits').notNull().default(0),
  lastResetAt: timestamp('last_reset_at', { withTimezone: true }).notNull().defaultNow(),
  // Alerte "20 % restants" envoyée une seule fois par cycle — remis à null au reset
  lowCreditAlertedAt: timestamp('low_credit_alerted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── credit_transactions ──────────────────────────────────────────────────────
// Journal immuable de tous les mouvements de crédits (amount signé : négatif =
// consommation, positif = crédit). metadata : siteId, analysisId, packId, sessionId…

export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  reason: creditTransactionReasonEnum('reason').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
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
  // GEO (coach IA) s'ouvre automatiquement une seule fois, après la 1re analyse (§16.5.D)
  coachIntroSeen: boolean('coach_intro_seen').notNull().default(false),
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
  // Version de la méthodologie d'audit (§18.3) — V1 = 1, V2 = 2.
  // Les comparaisons N vs N-1 affichent un badge quand les versions diffèrent.
  rulesVersion: integer('rules_version').notNull().default(2),
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

// ─── technical_issues ─────────────────────────────────────────────────────────
// Issues GEO détectées par l'analyse technique. 1 record = 1 règle violée.

export const technicalIssues = pgTable('technical_issues', {
  id: uuid('id').primaryKey().defaultRandom(),
  analysisId: uuid('analysis_id')
    .notNull()
    .references(() => analyses.id, { onDelete: 'cascade' }),
  ruleKey: text('rule_key').notNull(),
  category: technicalIssueCategoryEnum('category').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  sampleUrls: jsonb('sample_urls').notNull().$type<string[]>().default([]),
  penalty: integer('penalty').notNull(),
  // V2 (§18) : sévérité, effort/impact (quick wins), page_url (null = issue site)
  severity: issueSeverityEnum('severity').notNull().default('minor'),
  effort: integer('effort').notNull().default(2),
  impact: integer('impact').notNull().default(2),
  pageUrl: text('page_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── content_issues ───────────────────────────────────────────────────────────
// Issues GEO détectées par l'analyse contenu. 1 record = 1 règle violée.

export const contentIssues = pgTable('content_issues', {
  id: uuid('id').primaryKey().defaultRandom(),
  analysisId: uuid('analysis_id')
    .notNull()
    .references(() => analyses.id, { onDelete: 'cascade' }),
  ruleKey: text('rule_key').notNull(),
  category: contentIssueCategoryEnum('category').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  sampleUrls: jsonb('sample_urls').notNull().$type<string[]>().default([]),
  penalty: integer('penalty').notNull(),
  // V2 (§18) : sévérité, effort/impact (quick wins), page_url (null = issue site)
  severity: issueSeverityEnum('severity').notNull().default('minor'),
  effort: integer('effort').notNull().default(2),
  impact: integer('impact').notNull().default(2),
  pageUrl: text('page_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── recommendations ──────────────────────────────────────────────────────────
// Fiches recommandation générées par LLM pour chaque issue.
// Polymorphe : issue_type discrimine entre technical_issues et content_issues.
// variant 'simplified' = Haiku ; 'complete' = Sonnet (TKT-024).

export const recommendationIssueTypeEnum = pgEnum('recommendation_issue_type', [
  'technical',
  'content',
])

export const recommendations = pgTable(
  'recommendations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    analysisId: uuid('analysis_id')
      .notNull()
      .references(() => analyses.id, { onDelete: 'cascade' }),
    issueType: recommendationIssueTypeEnum('issue_type').notNull(),
    issueId: uuid('issue_id').notNull(),
    variant: text('variant').notNull().default('simplified'),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    issueVariantUnique: unique().on(table.issueId, table.variant),
  }),
)

// ─── publishers ───────────────────────────────────────────────────────────────
// Publishers générés par LLM pour un site/analyse. 15 par analyse (5 médias, 5 communautés, 5 bases publiques).

export const publisherCategoryEnum = pgEnum('publisher_category', [
  'media',
  'community',
  'public_base',
])

export const coachRoleEnum = pgEnum('coach_role', ['user', 'assistant'])

export const publishers = pgTable('publishers', {
  id: uuid('id').primaryKey().defaultRandom(),
  analysisId: uuid('analysis_id')
    .notNull()
    .references(() => analyses.id, { onDelete: 'cascade' }),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  category: publisherCategoryEnum('category').notNull(),
  pitchAngle: text('pitch_angle').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── coach_messages ───────────────────────────────────────────────────────────
// Historique de conversation du Coach IA par site + analyse.
// userId dupliqué ici pour comptage quota mensuel sans JOIN.

export const coachMessages = pgTable('coach_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  analysisId: uuid('analysis_id').references(() => analyses.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  role: coachRoleEnum('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── coach_memory ─────────────────────────────────────────────────────────────
// Mémoire persistante de GEO par (user, site) — résumé roulant compressé par
// Haiku tous les 10 messages utilisateur (§16.8). Gate plan : PLAN_FEATURES.coachMemory.

export const coachMemory = pgTable(
  'coach_memory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    memorySummary: text('memory_summary').notNull(),
    messageCount: integer('message_count').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('coach_memory_user_site_unique').on(t.userId, t.siteId)]
)

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
  publishers: many(publishers),
  coachMessages: many(coachMessages),
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
  technicalIssues: many(technicalIssues),
  contentIssues: many(contentIssues),
  recommendations: many(recommendations),
  publishers: many(publishers),
}))

export const publishersRelations = relations(publishers, ({ one }) => ({
  analysis: one(analyses, {
    fields: [publishers.analysisId],
    references: [analyses.id],
  }),
  site: one(sites, {
    fields: [publishers.siteId],
    references: [sites.id],
  }),
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

export const technicalIssuesRelations = relations(technicalIssues, ({ one }) => ({
  analysis: one(analyses, {
    fields: [technicalIssues.analysisId],
    references: [analyses.id],
  }),
}))

export const contentIssuesRelations = relations(contentIssues, ({ one }) => ({
  analysis: one(analyses, {
    fields: [contentIssues.analysisId],
    references: [analyses.id],
  }),
}))

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  analysis: one(analyses, {
    fields: [recommendations.analysisId],
    references: [analyses.id],
  }),
}))

export const creditBalancesRelations = relations(creditBalances, ({ one }) => ({
  profile: one(profiles, {
    fields: [creditBalances.userId],
    references: [profiles.id],
  }),
}))

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  profile: one(profiles, {
    fields: [creditTransactions.userId],
    references: [profiles.id],
  }),
}))

export const coachMessagesRelations = relations(coachMessages, ({ one }) => ({
  site: one(sites, { fields: [coachMessages.siteId], references: [sites.id] }),
  analysis: one(analyses, {
    fields: [coachMessages.analysisId],
    references: [analyses.id],
  }),
  profile: one(profiles, { fields: [coachMessages.userId], references: [profiles.id] }),
}))
