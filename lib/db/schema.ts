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
  unique,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const planEnum = pgEnum('plan', ['free', 'pro', 'business'])

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete',
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
}))

export const firecrawlPagesRelations = relations(firecrawlPages, ({ one }) => ({
  site: one(sites, {
    fields: [firecrawlPages.siteId],
    references: [sites.id],
  }),
}))
