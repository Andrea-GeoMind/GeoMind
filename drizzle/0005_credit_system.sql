-- TKT-CREDITS — Système de crédits universel (cahier-des-charges §17)
-- credit_balances : solde par user (mensuel + acheté)
-- credit_transactions : journal immuable de tous les mouvements

CREATE TYPE "public"."credit_transaction_reason" AS ENUM('welcome_bonus', 'monthly_reset', 'pack_purchase', 'analysis', 'coach_message', 'recommendation', 'refund_failed_analysis', 'admin_adjustment');--> statement-breakpoint
CREATE TABLE "credit_balances" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"monthly_credits" integer DEFAULT 0 NOT NULL,
	"purchased_credits" integer DEFAULT 0 NOT NULL,
	"last_reset_at" timestamp with time zone DEFAULT now() NOT NULL,
	"low_credit_alerted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reason" "credit_transaction_reason" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_balances" ADD CONSTRAINT "credit_balances_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_transactions_user_created_idx" ON "credit_transactions" ("user_id", "created_at" DESC);--> statement-breakpoint

-- RLS (règle métier 11) : lecture par le propriétaire uniquement.
-- Toutes les écritures passent par Drizzle côté serveur (lib/credits.ts) — aucune
-- policy INSERT/UPDATE/DELETE pour les clients Supabase.
ALTER TABLE "credit_balances" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "credit_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "credit_balances_select_own" ON "credit_balances" FOR SELECT USING (auth.uid() = user_id);--> statement-breakpoint
CREATE POLICY "credit_transactions_select_own" ON "credit_transactions" FOR SELECT USING (auth.uid() = user_id);
