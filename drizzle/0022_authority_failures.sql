-- 0022 — Appels IA en échec, avec leur motif.
--
-- Le 15/09/2026, deux questions sur dix n'ont obtenu aucune réponse des quatre
-- moteurs et l'analyse s'est tout de même déclarée réussie. Impossible, après
-- coup, de dire pourquoi : les échecs partaient en console et dans Sentry, et
-- rien n'en restait en base. On les persiste désormais, pour que l'interface
-- puisse annoncer ce qui manque et qu'on puisse diagnostiquer la prochaine fois.
--
-- Lecture et écriture server-side uniquement (Drizzle, rôle postgres), comme
-- authority_results. RLS activée sans policy : la clé publique Supabase ne peut
-- ni lire ni écrire cette table.

CREATE TABLE IF NOT EXISTS "authority_failures" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "analysis_id" uuid NOT NULL REFERENCES "analyses"("id") ON DELETE CASCADE,
  "prompt_id" uuid NOT NULL REFERENCES "prompts"("id") ON DELETE CASCADE,
  "engine" "ia_engine" NOT NULL,
  "mode" text NOT NULL DEFAULT 'forced',
  "reason" text NOT NULL,
  "attempts" integer NOT NULL DEFAULT 1,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "authority_failures_analysis_idx"
  ON "authority_failures" ("analysis_id");

ALTER TABLE "authority_failures" ENABLE ROW LEVEL SECURITY;
