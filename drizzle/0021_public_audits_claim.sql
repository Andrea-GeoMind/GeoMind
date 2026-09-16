-- ============================================================
-- 0021 — public_audits : rattachement d'un audit express à un compte.
--
-- Tunnel de conversion de l'audit express : le visiteur laisse son email pour
-- recevoir le rapport, reçoit un lien magique, et le compte créé récupère
-- l'audit + le site déjà renseigné.
--
-- claim_token : jeton PAR VISITEUR, jamais partagé entre deux audits du même
-- domaine. Avant cette migration, un cache hit renvoyait la ligne d'un autre
-- visiteur ; y attacher un email aurait laissé le second réclamer l'audit et
-- l'email du premier. Une ligne est désormais insérée à chaque requête.
--
-- from_cache : résultats servis depuis le cache 24 h (aucun fetch refait).
-- Exclu du comptage de rate limit, qui doit mesurer le travail réel et non
-- le nombre de lignes créées.
--
-- claimed_by_user_id : ON DELETE CASCADE — supprimer un compte efface l'audit
-- et l'email rattachés (règle métier 7, RGPD).
--
-- Table purement serveur : RLS reste activée sans policy.
-- Idempotent : ré-exécutable sans erreur.
-- ============================================================

ALTER TABLE public.public_audits
  ADD COLUMN IF NOT EXISTS "claim_token" uuid DEFAULT gen_random_uuid() NOT NULL,
  ADD COLUMN IF NOT EXISTS "from_cache" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "email" text,
  ADD COLUMN IF NOT EXISTS "claimed_by_user_id" uuid,
  ADD COLUMN IF NOT EXISTS "claimed_at" timestamp with time zone;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'public_audits_claim_token_unique'
  ) THEN
    ALTER TABLE public.public_audits
      ADD CONSTRAINT "public_audits_claim_token_unique" UNIQUE ("claim_token");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'public_audits_claimed_by_user_id_profiles_id_fk'
  ) THEN
    ALTER TABLE public.public_audits
      ADD CONSTRAINT "public_audits_claimed_by_user_id_profiles_id_fk"
      FOREIGN KEY ("claimed_by_user_id") REFERENCES public.profiles("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS public_audits_claimed_by_idx
  ON public.public_audits ("claimed_by_user_id");

ALTER TABLE public.public_audits ENABLE ROW LEVEL SECURITY;
