-- ============================================================
-- 0018 — Journal des mutations sensibles (PLAN item 38). Idempotent.
-- Écrit côté serveur uniquement. user_id nullable (compte supprimé = trace
-- conservée). RLS deny-all : table interne, jamais lue par les clés client.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "action" text NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS audit_logs_user_created_idx
  ON public.audit_logs ("user_id", "created_at");

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
