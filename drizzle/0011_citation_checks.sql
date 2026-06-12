-- ============================================================
-- 0011 — citation_checks : série temporelle de la visibilité (PLAN item 11).
-- 1 ligne = « le prompt P, posé au moteur M, le jour J, en mode X, a cité
-- (ou non) le site ». Fondation du suivi, des alertes et des tendances.
-- Idempotent : ré-exécutable sans erreur.
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "public"."citation_check_mode" AS ENUM('spontaneous', 'forced');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.citation_checks (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "prompt_id" uuid NOT NULL REFERENCES "prompts"("id") ON DELETE CASCADE,
  "analysis_id" uuid REFERENCES "analyses"("id") ON DELETE SET NULL,
  "engine" "ia_engine" NOT NULL,
  "mode" "citation_check_mode" DEFAULT 'forced' NOT NULL,
  "cited" boolean NOT NULL,
  "position" integer,
  "checked_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS citation_checks_site_checked_idx
  ON public.citation_checks ("site_id", "checked_at");
CREATE INDEX IF NOT EXISTS citation_checks_prompt_engine_idx
  ON public.citation_checks ("prompt_id", "engine");

ALTER TABLE public.citation_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "citation_checks: own site only" ON public.citation_checks;
CREATE POLICY "citation_checks: own site only" ON public.citation_checks
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()));
