-- ============================================================
-- 0024 — subscriptions en lecture seule pour les utilisateurs.
--
-- Faille trouvée le 06/10/2026 : la policy « subscriptions: own data only »
-- était FOR ALL. Avec la clé publique et sa propre session, n'importe quel
-- compte (l'inscription est ouverte) pouvait faire, via l'API REST Supabase :
--   UPDATE subscriptions SET plan = 'admin' WHERE user_id = <lui-même>
-- ou insérer une ligne admin s'il n'en avait pas. Le plan admin donne des
-- crédits illimités, et ouvre l'espace chantier côté GeoMind.
-- Démontré par scripts/audit/check-admin-escalation.ts (transaction annulée).
--
-- Aucun code n'écrit subscriptions via le SDK Supabase : toutes les écritures
-- passent par Drizzle (rôle postgres) dans lib/db/queries/subscriptions.ts,
-- appelé par le seul webhook Stripe signé. Les utilisateurs n'ont donc besoin
-- que de lire leur ligne.
--
-- Trois verrous, indépendants :
--   1. policy SELECT seule (plus aucune écriture via RLS) ;
--   2. privilèges d'écriture retirés à anon et authenticated ;
--   3. trigger : seul le rôle postgres (ou supabase_admin) peut donner le plan
--      admin — ni authenticated, ni anon, ni service_role.
--
-- Appliquée par scripts/apply-subscriptions-lockdown.ts.
-- Idempotent : ré-exécutable sans erreur.
-- ============================================================

DROP POLICY IF EXISTS "subscriptions: own data only" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions: own read" ON public.subscriptions;
CREATE POLICY "subscriptions: own read" ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.subscriptions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_admin_plan()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.plan = 'admin'
     AND (TG_OP = 'INSERT' OR OLD.plan IS DISTINCT FROM 'admin')
     AND current_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'Le plan admin ne peut être attribué que par un administrateur de la base (rôle %).', current_user
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_guard_admin_plan ON public.subscriptions;
CREATE TRIGGER subscriptions_guard_admin_plan
  BEFORE INSERT OR UPDATE OF plan ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_admin_plan();
