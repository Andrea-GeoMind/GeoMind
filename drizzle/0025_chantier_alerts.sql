-- ============================================================
-- 0025 — Alertes e-mail de l'espace chantier (S2.7).
--
-- activity_notified_through : borne haute de l'activité déjà signalée par
--   l'e-mail groupé (lib/inngest/functions/chantier-activity-digest.ts).
--   L'e-mail suivant ne reprend que ce qui est postérieur.
-- expiry_reminder_sent_at : alerte « lien expire dans 7 jours » envoyée
--   pour le lien en cours ; remise à null à chaque émission de lien.
--
-- Appliquée par scripts/apply-sql-migration.ts. Idempotent.
-- ============================================================

ALTER TABLE public.chantiers
  ADD COLUMN IF NOT EXISTS "activity_notified_through" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "expiry_reminder_sent_at" timestamp with time zone;
