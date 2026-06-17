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
  index,
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

export const reputationStatusEnum = pgEnum('reputation_status', [
  'pending',
  'running',
  'success',
  'error',
])

export const sentimentEnum = pgEnum('sentiment', ['positive', 'neutral', 'negative', 'unknown'])

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
  // Alertes email (citations, baisses de visibilité, analyses terminées) — PLAN item 13
  emailNotifications: boolean('email_notifications').notNull().default(true),
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
  // Clé publique du Pixel GeoMind (PLAN item 29) — identifie le site côté
  // snippet. Générée à la demande, rotatable. Null tant que le pixel n'est pas activé.
  pixelKey: text('pixel_key').unique(),
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

// ─── citation_checks ──────────────────────────────────────────────────────────
// Série temporelle de la visibilité (PLAN item 11) : 1 ligne = « le prompt P,
// posé au moteur M, le jour J, en mode X, a cité (ou non) le site ».
// C'est la donnée brute dont les analyses ne sont qu'une agrégation — fondation
// du suivi dans le temps, des alertes, des tendances et du futur Pixel.

export const citationCheckModeEnum = pgEnum('citation_check_mode', [
  // Prompt envoyé tel quel — mesure la citation spontanée (la vraie visibilité)
  'spontaneous',
  // Prompt + suffixe « liste ≥10 acteurs avec URLs » — mesure la présence
  // dans un classement forcé (signal secondaire, plus stable mais artificiel)
  'forced',
])

export const citationChecks = pgTable(
  'citation_checks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    promptId: uuid('prompt_id')
      .notNull()
      .references(() => prompts.id, { onDelete: 'cascade' }),
    // Nullable : un check peut venir d'une surveillance planifiée, hors analyse
    analysisId: uuid('analysis_id').references(() => analyses.id, { onDelete: 'set null' }),
    engine: iaEngineEnum('engine').notNull(),
    mode: citationCheckModeEnum('mode').notNull().default('forced'),
    cited: boolean('cited').notNull(),
    // Position dans la liste de sources si cité (1 = première source), null sinon
    position: integer('position'),
    checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('citation_checks_site_checked_idx').on(t.siteId, t.checkedAt),
    index('citation_checks_prompt_engine_idx').on(t.promptId, t.engine),
  ]
)

// ─── reputation (onglet Réputation, PLAN item 31) ─────────────────────────────
// Ce que les IA DISENT de l'entreprise (pas seulement si elles la citent) :
// réponses brutes, sentiment, et affirmations factuelles extraites (adresse,
// horaires, téléphone, prix…). Le désaccord entre moteurs = signal d'hallucination.

export const reputationRuns = pgTable('reputation_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  status: reputationStatusEnum('status').notNull().default('pending'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reputationResults = pgTable('reputation_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id')
    .notNull()
    .references(() => reputationRuns.id, { onDelete: 'cascade' }),
  engine: iaEngineEnum('engine').notNull(),
  answer: text('answer').notNull(),
  sentiment: sentimentEnum('sentiment').notNull().default('unknown'),
  /** Affirmations factuelles extraites : [{ type, value }] */
  claims: jsonb('claims').notNull().$type<{ type: string; value: string }[]>().default([]),
  knowsBusiness: boolean('knows_business').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── audit_logs ───────────────────────────────────────────────────────────────
// Journal des mutations sensibles (PLAN item 38) : suppression de compte,
// changement de plan, remboursements importants. Traçabilité RGPD + litiges.
// Écrit côté serveur uniquement ; userId nullable (le compte peut être supprimé).

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Null si l'utilisateur a été supprimé (on garde la trace) */
    userId: uuid('user_id'),
    /** ex : 'account.deleted', 'plan.changed', 'credits.refunded' */
    action: text('action').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_logs_user_created_idx').on(t.userId, t.createdAt)]
)

// ─── pixel_events ─────────────────────────────────────────────────────────────
// Pixel GeoMind (PLAN item 29) — la preuve du ROI : visites venant des IA et
// actions réalisées sur le site du client. Alimenté par le snippet public via
// /api/pixel (insert serveur sans session, RLS deny-all côté clés client).

export const pixelEventTypeEnum = pgEnum('pixel_event_type', ['pageview', 'action'])

export const pixelEvents = pgTable(
  'pixel_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    type: pixelEventTypeEnum('type').notNull(),
    /** Source IA normalisée : 'chatgpt' | 'perplexity' | 'gemini' | 'copilot' | 'claude' | 'other' */
    aiSource: text('ai_source').notNull(),
    /** Chemin de la page visitée (sans query) */
    path: text('path').notNull().default('/'),
    /** Pour type=action : 'tel' | 'mailto' | 'form' | 'booking' | 'outbound' */
    actionKind: text('action_kind'),
    /** Hash anonyme visiteur+jour (RGPD : pas d'IP en clair) — comptage de visiteurs uniques */
    visitorHash: text('visitor_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('pixel_events_site_created_idx').on(t.siteId, t.createdAt),
    index('pixel_events_site_source_idx').on(t.siteId, t.aiSource),
  ]
)

// ─── public_audits ────────────────────────────────────────────────────────────
// Audits express publics (PLAN item 20) : cache 24 h par domaine, rate limit
// par IP (hash), et futur jeu de données du Baromètre GEO France.
// Table purement serveur — RLS sans policy (deny-all côté clés client).

export const publicAudits = pgTable(
  'public_audits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    domain: text('domain').notNull(),
    score: integer('score').notNull(),
    checks: jsonb('checks').notNull().$type<unknown>(),
    ipHash: text('ip_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('public_audits_domain_created_idx').on(t.domain, t.createdAt),
    index('public_audits_ip_created_idx').on(t.ipHash, t.createdAt),
  ]
)

// ─── action_states ────────────────────────────────────────────────────────────
// État durable du Plan d'action (PLAN item 16). Les issues sont recréées à
// chaque analyse ; l'état « j'ai corrigé / vérifié » doit survivre, donc il est
// clé par (site, règle, page). pageUrl = '' pour les règles site-scope.
// Cycle : todo → done (déclaré corrigé) → verified (la règle a disparu de
// l'analyse suivante — vérification automatique).

export const actionStatusEnum = pgEnum('action_status', ['todo', 'done', 'verified'])

export const actionStates = pgTable(
  'action_states',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    ruleKey: text('rule_key').notNull(),
    /** '' pour les issues site-scope, sinon l'URL de la page concernée */
    pageUrl: text('page_url').notNull().default(''),
    source: text('source', { enum: ['technical', 'content'] }).notNull(),
    status: actionStatusEnum('status').notNull().default('todo'),
    markedDoneAt: timestamp('marked_done_at', { withTimezone: true }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('action_states_site_rule_page_unique').on(t.siteId, t.ruleKey, t.pageUrl)]
)

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

// ─── off_site_presence ────────────────────────────────────────────────────────
// Diagnostic de présence off-site (le cœur du GEO) : pour chaque plateforme clé
// du registre lib/analysis/offsite-platforms.ts, le client y est-il présent ?
// 1 record = 1 plateforme × 1 analyse. platformId référence le registre (codé).

export const offSitePresenceStatusEnum = pgEnum('off_site_presence_status', [
  'present',
  'absent',
  'unknown',
])

export const offSitePresence = pgTable('off_site_presence', {
  id: uuid('id').primaryKey().defaultRandom(),
  analysisId: uuid('analysis_id')
    .notNull()
    .references(() => analyses.id, { onDelete: 'cascade' }),
  siteId: uuid('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  /** id du registre OFF_SITE_PLATFORMS (ex : 'linkedin', 'wikidata') */
  platformId: text('platform_id').notNull(),
  status: offSitePresenceStatusEnum('status').notNull().default('unknown'),
  /** URL du profil/fiche détecté si présent */
  profileUrl: text('profile_url'),
  /** courte justification renvoyée par la détection */
  evidence: text('evidence'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

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
  offSitePresence: many(offSitePresence),
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
  offSitePresence: many(offSitePresence),
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

export const offSitePresenceRelations = relations(offSitePresence, ({ one }) => ({
  analysis: one(analyses, {
    fields: [offSitePresence.analysisId],
    references: [analyses.id],
  }),
  site: one(sites, {
    fields: [offSitePresence.siteId],
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

export const citationChecksRelations = relations(citationChecks, ({ one }) => ({
  site: one(sites, { fields: [citationChecks.siteId], references: [sites.id] }),
  prompt: one(prompts, { fields: [citationChecks.promptId], references: [prompts.id] }),
  analysis: one(analyses, {
    fields: [citationChecks.analysisId],
    references: [analyses.id],
  }),
}))

export const pixelEventsRelations = relations(pixelEvents, ({ one }) => ({
  site: one(sites, { fields: [pixelEvents.siteId], references: [sites.id] }),
}))

export const reputationRunsRelations = relations(reputationRuns, ({ one, many }) => ({
  site: one(sites, { fields: [reputationRuns.siteId], references: [sites.id] }),
  results: many(reputationResults),
}))

export const reputationResultsRelations = relations(reputationResults, ({ one }) => ({
  run: one(reputationRuns, { fields: [reputationResults.runId], references: [reputationRuns.id] }),
}))
