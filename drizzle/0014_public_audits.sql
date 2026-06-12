-- ============================================================
-- 0014 — public_audits : audit express public sans inscription (PLAN item 20).
-- Cache par domaine (24 h) + rate limit par IP + futur jeu de données du
-- Baromètre GEO France. Table purement serveur : RLS sans policy.
-- Idempotent : ré-exécutable sans erreur.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.public_audits (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "domain" text NOT NULL,
  "score" integer NOT NULL,
  "checks" jsonb NOT NULL,
  "ip_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS public_audits_domain_created_idx
  ON public.public_audits ("domain", "created_at");
CREATE INDEX IF NOT EXISTS public_audits_ip_created_idx
  ON public.public_audits ("ip_hash", "created_at");

ALTER TABLE public.public_audits ENABLE ROW LEVEL SECURITY;
