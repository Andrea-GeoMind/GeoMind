-- 0020 — Liste d'attente des plans payants (lancement freemium, Stripe désactivé).
-- Appliqué via : npx tsx scripts/apply-waitlist-migration.ts
-- Insertion server-side uniquement (Drizzle, rôle postgres). RLS activée sans
-- policy : la clé publique Supabase ne peut ni lire ni écrire cette table.

CREATE TABLE IF NOT EXISTS "waitlist_signups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "plan" text NOT NULL,
  "source" text NOT NULL,
  "user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "waitlist_email_plan_unique" UNIQUE ("email", "plan")
);

ALTER TABLE "waitlist_signups" ENABLE ROW LEVEL SECURITY;
