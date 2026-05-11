-- ============================================================
-- Row Level Security — public.profiles, subscriptions, sites
-- À exécuter UNE SEULE FOIS dans le SQL Editor de Supabase.
-- ============================================================

-- ── profiles ──────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne peut voir et modifier que son propre profil.
CREATE POLICY "profiles: own data only"
  ON public.profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── subscriptions ─────────────────────────────────────────────────────────────

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne peut voir que ses propres abonnements.
CREATE POLICY "subscriptions: own data only"
  ON public.subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── sites ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne peut voir et modifier que ses propres sites.
CREATE POLICY "sites: own data only"
  ON public.sites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
