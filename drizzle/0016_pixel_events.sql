-- ============================================================
-- 0016 — Pixel GeoMind (PLAN item 29) : clé pixel sur le site + table
-- d'événements (visites IA et actions). Idempotent.
-- ============================================================

ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS "pixel_key" text;

DO $$ BEGIN
  ALTER TABLE public.sites ADD CONSTRAINT sites_pixel_key_unique UNIQUE (pixel_key);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."pixel_event_type" AS ENUM('pageview', 'action');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.pixel_events (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "type" "pixel_event_type" NOT NULL,
  "ai_source" text NOT NULL,
  "path" text DEFAULT '/' NOT NULL,
  "action_kind" text,
  "visitor_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS pixel_events_site_created_idx
  ON public.pixel_events ("site_id", "created_at");
CREATE INDEX IF NOT EXISTS pixel_events_site_source_idx
  ON public.pixel_events ("site_id", "ai_source");

-- Table serveur uniquement (insert via /api/pixel, lecture via app authentifiée).
-- RLS deny-all : aucune policy → inaccessible aux clés anon/authenticated.
ALTER TABLE public.pixel_events ENABLE ROW LEVEL SECURITY;
