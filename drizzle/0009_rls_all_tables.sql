-- ============================================================
-- 0009 — Row Level Security sur TOUTES les tables métier (PLAN item 4).
-- Complète drizzle/seed/rls_policies.sql (profiles, subscriptions, sites),
-- 0005 (credit_balances, credit_transactions) et 0008 (coach_memory).
--
-- Idempotent : ré-exécutable sans erreur.
-- Drizzle (rôle postgres, propriétaire des tables) et le client service_role
-- ne sont pas affectés ; seuls les accès via clé anon/authenticated le sont.
-- Règle CLAUDE.md n°11 : aucune table métier accessible sans policy.
-- ============================================================

-- ── Tables rattachées à un site (site_id → sites.user_id) ─────────────────────

ALTER TABLE public.firecrawl_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "firecrawl_pages: own site only" ON public.firecrawl_pages;
CREATE POLICY "firecrawl_pages: own site only" ON public.firecrawl_pages
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()));

ALTER TABLE public.site_metadata ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "site_metadata: own site only" ON public.site_metadata;
CREATE POLICY "site_metadata: own site only" ON public.site_metadata
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()));

ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "competitors: own site only" ON public.competitors;
CREATE POLICY "competitors: own site only" ON public.competitors
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()));

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prompts: own site only" ON public.prompts;
CREATE POLICY "prompts: own site only" ON public.prompts
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()));

ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "publishers: own site only" ON public.publishers;
CREATE POLICY "publishers: own site only" ON public.publishers
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid()));

-- ── Tables avec user_id direct ─────────────────────────────────────────────────

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analyses: own data only" ON public.analyses;
CREATE POLICY "analyses: own data only" ON public.analyses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coach_messages: own data only" ON public.coach_messages;
CREATE POLICY "coach_messages: own data only" ON public.coach_messages
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Tables rattachées à une analyse (analysis_id → analyses.user_id) ──────────

ALTER TABLE public.authority_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authority_results: own analysis only" ON public.authority_results;
CREATE POLICY "authority_results: own analysis only" ON public.authority_results
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid()));

ALTER TABLE public.technical_issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "technical_issues: own analysis only" ON public.technical_issues;
CREATE POLICY "technical_issues: own analysis only" ON public.technical_issues
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid()));

ALTER TABLE public.content_issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "content_issues: own analysis only" ON public.content_issues;
CREATE POLICY "content_issues: own analysis only" ON public.content_issues
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid()));

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recommendations: own analysis only" ON public.recommendations;
CREATE POLICY "recommendations: own analysis only" ON public.recommendations
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analysis_id AND a.user_id = auth.uid()));

-- ── Table petite-fille (authority_result_id → authority_results → analyses) ───

ALTER TABLE public.authority_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authority_sources: own analysis only" ON public.authority_sources;
CREATE POLICY "authority_sources: own analysis only" ON public.authority_sources
  FOR ALL
  USING (EXISTS (
    SELECT 1
    FROM public.authority_results ar
    JOIN public.analyses a ON a.id = ar.analysis_id
    WHERE ar.id = authority_result_id AND a.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.authority_results ar
    JOIN public.analyses a ON a.id = ar.analysis_id
    WHERE ar.id = authority_result_id AND a.user_id = auth.uid()
  ));
