-- ============================================================
-- 0027 — Assistant de l'espace client de chantier (« Demander à GEO »).
--
-- Une ligne par échange (question du client, réponse du modèle), conservée
-- 30 jours. Écrite et lue par le serveur seulement (rôle postgres) :
-- RLS activée sans policy, aucun droit pour anon ni authenticated.
--
-- Appliquée par scripts/apply-sql-migration.ts. Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chantier_assistant_exchanges (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chantier_id" uuid NOT NULL REFERENCES public.chantiers("id") ON DELETE CASCADE,
  "establishment_id" uuid REFERENCES public.chantier_establishments("id") ON DELETE CASCADE,
  "field_key" text NOT NULL,
  "question" text NOT NULL,
  "question_key" text NOT NULL,
  "answer" text NOT NULL,
  "model" text NOT NULL,
  "tokens_in" integer DEFAULT 0 NOT NULL,
  "tokens_out" integer DEFAULT 0 NOT NULL,
  "cost_usd" numeric(12, 8) DEFAULT '0' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "chantier_assistant_slot_idx"
  ON public.chantier_assistant_exchanges ("chantier_id", "field_key", "created_at");
CREATE INDEX IF NOT EXISTS "chantier_assistant_created_idx"
  ON public.chantier_assistant_exchanges ("created_at");

ALTER TABLE public.chantier_assistant_exchanges ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.chantier_assistant_exchanges FROM anon, authenticated;
