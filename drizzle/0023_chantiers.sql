-- ============================================================
-- 0023 — Espace client de chantier (S2).
--
-- Remplace le mail de collecte : un espace en ligne par chantier, ouvert par
-- un lien secret (/chantier/[token]), sans compte côté client.
--
-- Toutes les écritures passent par le serveur (Drizzle, rôle postgres) après
-- vérification du lien. RLS activée partout (règle CLAUDE.md n°11) :
--   - chantiers et tables rattachées : lecture par le propriétaire seulement,
--     aucune écriture via les clés client ;
--   - chantier_access_logs, rate_limits : aucune policy (deny-all).
--
-- Bucket Storage `chantier-files` : privé, aucune policy sur storage.objects,
-- 20 Mo par fichier et types acceptés au niveau du bucket. On n'y accède que
-- par des adresses signées délivrées par lib/chantiers/storage-admin.ts.
--
-- Appliquée par scripts/apply-chantiers-migration.ts.
-- Idempotent : ré-exécutable sans erreur.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chantier_status') THEN
    CREATE TYPE public.chantier_status AS ENUM ('draft', 'open', 'submitted', 'closed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'establishment_kind') THEN
    CREATE TYPE public.establishment_kind AS ENUM ('venue', 'rental');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chantier_actor') THEN
    CREATE TYPE public.chantier_actor AS ENUM ('client', 'geomind');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chantier_file_category') THEN
    CREATE TYPE public.chantier_file_category AS ENUM ('photo', 'logo', 'document', 'personal_data');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chantier_file_status') THEN
    CREATE TYPE public.chantier_file_status AS ENUM ('pending', 'ready', 'deleted');
  END IF;
END $$;

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.chantiers (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid NOT NULL REFERENCES public.profiles("id") ON DELETE CASCADE,
  "client_name" text NOT NULL,
  "contact_email" text,
  "status" public.chantier_status DEFAULT 'draft' NOT NULL,
  "options" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "token_hash" text,
  "token_expires_at" timestamp with time zone,
  "token_revoked_at" timestamp with time zone,
  "submitted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chantiers_token_hash_unique" UNIQUE ("token_hash")
);

CREATE TABLE IF NOT EXISTS public.chantier_establishments (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chantier_id" uuid NOT NULL REFERENCES public.chantiers("id") ON DELETE CASCADE,
  "kind" public.establishment_kind NOT NULL,
  "name" text NOT NULL,
  "website" text,
  "position" integer DEFAULT 0 NOT NULL,
  "options" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chantier_answers (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chantier_id" uuid NOT NULL REFERENCES public.chantiers("id") ON DELETE CASCADE,
  "establishment_id" uuid REFERENCES public.chantier_establishments("id") ON DELETE CASCADE,
  "field_key" text NOT NULL,
  "value" jsonb NOT NULL,
  "updated_by" public.chantier_actor NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chantier_answers_field_unique"
    UNIQUE NULLS NOT DISTINCT ("chantier_id", "establishment_id", "field_key")
);

CREATE TABLE IF NOT EXISTS public.chantier_answer_revisions (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chantier_id" uuid NOT NULL REFERENCES public.chantiers("id") ON DELETE CASCADE,
  "establishment_id" uuid REFERENCES public.chantier_establishments("id") ON DELETE CASCADE,
  "field_key" text NOT NULL,
  "old_value" jsonb,
  "new_value" jsonb,
  "actor" public.chantier_actor NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chantier_files (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chantier_id" uuid NOT NULL REFERENCES public.chantiers("id") ON DELETE CASCADE,
  "establishment_id" uuid REFERENCES public.chantier_establishments("id") ON DELETE SET NULL,
  "field_key" text NOT NULL,
  "category" public.chantier_file_category NOT NULL,
  "storage_path" text NOT NULL,
  "original_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "status" public.chantier_file_status DEFAULT 'pending' NOT NULL,
  "expires_at" timestamp with time zone,
  "deleted_reason" text,
  "deleted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chantier_files_storage_path_unique" UNIQUE ("storage_path")
);

CREATE TABLE IF NOT EXISTS public.chantier_access_logs (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chantier_id" uuid REFERENCES public.chantiers("id") ON DELETE CASCADE,
  "event" text NOT NULL,
  "ip_truncated" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rate_limits (
  "key" text NOT NULL,
  "window_start" timestamp with time zone NOT NULL,
  "count" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "rate_limits_key_window_start_pk" PRIMARY KEY ("key", "window_start")
);

-- ── Index ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS chantiers_owner_idx ON public.chantiers ("owner_id");
CREATE INDEX IF NOT EXISTS chantier_establishments_chantier_idx
  ON public.chantier_establishments ("chantier_id");
CREATE INDEX IF NOT EXISTS chantier_revisions_chantier_created_idx
  ON public.chantier_answer_revisions ("chantier_id", "created_at");
CREATE INDEX IF NOT EXISTS chantier_files_chantier_idx ON public.chantier_files ("chantier_id");
CREATE INDEX IF NOT EXISTS chantier_files_expires_idx ON public.chantier_files ("expires_at");
CREATE INDEX IF NOT EXISTS chantier_access_chantier_created_idx
  ON public.chantier_access_logs ("chantier_id", "created_at");
CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON public.rate_limits ("window_start");

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.chantiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chantiers: owner read" ON public.chantiers;
CREATE POLICY "chantiers: owner read" ON public.chantiers
  FOR SELECT
  USING (auth.uid() = owner_id);

ALTER TABLE public.chantier_establishments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chantier_establishments: owner read" ON public.chantier_establishments;
CREATE POLICY "chantier_establishments: owner read" ON public.chantier_establishments
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chantiers c WHERE c.id = chantier_id AND c.owner_id = auth.uid()));

ALTER TABLE public.chantier_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chantier_answers: owner read" ON public.chantier_answers;
CREATE POLICY "chantier_answers: owner read" ON public.chantier_answers
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chantiers c WHERE c.id = chantier_id AND c.owner_id = auth.uid()));

ALTER TABLE public.chantier_answer_revisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chantier_answer_revisions: owner read" ON public.chantier_answer_revisions;
CREATE POLICY "chantier_answer_revisions: owner read" ON public.chantier_answer_revisions
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chantiers c WHERE c.id = chantier_id AND c.owner_id = auth.uid()));

ALTER TABLE public.chantier_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chantier_files: owner read" ON public.chantier_files;
CREATE POLICY "chantier_files: owner read" ON public.chantier_files
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chantiers c WHERE c.id = chantier_id AND c.owner_id = auth.uid()));

ALTER TABLE public.chantier_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ── Bucket Storage privé ──────────────────────────────────────────────────────
-- Doit rester aligné sur lib/chantiers/files.ts (MAX_FILE_BYTES, types acceptés).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chantier-files',
  'chantier-files',
  false,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf', 'text/csv']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
