-- ============================================================
-- 0010 — Idempotence webhooks Stripe (PLAN item 6).
-- Un event id Stripe n'est traité qu'une seule fois : protège le reset des
-- crédits mensuels (invoice.payment_succeeded) et la synchro d'abonnement
-- contre les replays. Idempotent : ré-exécutable sans erreur.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  "id" text PRIMARY KEY,
  "type" text NOT NULL,
  "processed_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Table purement serveur : RLS sans policy = inaccessible aux clés anon/authenticated.
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
