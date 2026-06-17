-- ============================================================
-- 0019 — Présence off-site (cœur du GEO) : diagnostic, par analyse, de la
-- présence du client sur les plateformes clés (LinkedIn, Wikidata, Crunchbase…).
-- 1 ligne = 1 plateforme × 1 analyse. Idempotent.
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "public"."off_site_presence_status" AS ENUM('present', 'absent', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.off_site_presence (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "analysis_id" uuid NOT NULL REFERENCES "analyses"("id") ON DELETE CASCADE,
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "platform_id" text NOT NULL,
  "status" "off_site_presence_status" DEFAULT 'unknown' NOT NULL,
  "profile_url" text,
  "evidence" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS off_site_presence_analysis_idx
  ON public.off_site_presence ("analysis_id");

-- RLS « own site only » (règle CLAUDE.md n°11), calquée sur publishers.
ALTER TABLE public.off_site_presence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "off_site_presence: own site only" ON public.off_site_presence;
CREATE POLICY "off_site_presence: own site only" ON public.off_site_presence
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()));
