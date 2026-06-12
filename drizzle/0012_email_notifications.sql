-- ============================================================
-- 0012 — Préférence d'alertes email sur le profil (PLAN item 13).
-- Idempotent : ré-exécutable sans erreur.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS "email_notifications" boolean DEFAULT true NOT NULL;
