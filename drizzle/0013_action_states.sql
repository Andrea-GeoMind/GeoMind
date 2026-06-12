-- ============================================================
-- 0013 — action_states : état durable du Plan d'action (PLAN item 16).
-- Idempotent : ré-exécutable sans erreur.
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "public"."action_status" AS ENUM('todo', 'done', 'verified');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.action_states (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "rule_key" text NOT NULL,
  "page_url" text DEFAULT '' NOT NULL,
  "source" text NOT NULL,
  "status" "action_status" DEFAULT 'todo' NOT NULL,
  "marked_done_at" timestamp with time zone,
  "verified_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "action_states_site_rule_page_unique" UNIQUE("site_id", "rule_key", "page_url")
);

ALTER TABLE public.action_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "action_states: own site only" ON public.action_states;
CREATE POLICY "action_states: own site only" ON public.action_states
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()));
