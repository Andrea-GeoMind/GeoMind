-- ============================================================
-- 0017 — Analyse de réputation (PLAN item 31) : ce que les IA disent de
-- l'entreprise + désaccords (hallucinations). Idempotent.
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "public"."reputation_status" AS ENUM('pending', 'running', 'success', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."sentiment" AS ENUM('positive', 'neutral', 'negative', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.reputation_runs (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "status" "reputation_status" DEFAULT 'pending' NOT NULL,
  "error_message" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reputation_results (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "run_id" uuid NOT NULL REFERENCES "reputation_runs"("id") ON DELETE CASCADE,
  "engine" "ia_engine" NOT NULL,
  "answer" text NOT NULL,
  "sentiment" "sentiment" DEFAULT 'unknown' NOT NULL,
  "claims" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "knows_business" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS reputation_runs_site_created_idx
  ON public.reputation_runs ("site_id", "created_at");
CREATE INDEX IF NOT EXISTS reputation_results_run_idx
  ON public.reputation_results ("run_id");

-- RLS owner-scoped (cohérent avec les autres tables métier)
ALTER TABLE public.reputation_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reputation_runs: own data only" ON public.reputation_runs;
CREATE POLICY "reputation_runs: own data only" ON public.reputation_runs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.reputation_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reputation_results: own run only" ON public.reputation_results;
CREATE POLICY "reputation_results: own run only" ON public.reputation_results
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.reputation_runs r WHERE r.id = run_id AND r.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.reputation_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));
