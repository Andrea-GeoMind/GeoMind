-- ============================================================
-- 0015 — QA : migre les crédits mensuels orphelins des comptes free (V1)
-- vers les crédits achetés. Depuis PLAN item 3, le plan Gratuit n'a plus
-- d'allocation mensuelle ; les soldes mensuels hérités de V1 ne seraient
-- plus jamais resetés. On préserve la valeur (pas de confiscation) en la
-- déplaçant vers purchased_credits (sans expiration), et on journalise.
-- Idempotent : la 2e exécution ne trouve plus de lignes à migrer.
-- ============================================================

WITH free_users AS (
  SELECT cb.user_id, cb.monthly_credits
  FROM public.credit_balances cb
  LEFT JOIN public.subscriptions s ON s.user_id = cb.user_id
  WHERE COALESCE(s.plan::text, 'free') = 'free'
    AND cb.monthly_credits > 0
),
moved AS (
  UPDATE public.credit_balances cb
  SET purchased_credits = cb.purchased_credits + fu.monthly_credits,
      monthly_credits = 0,
      updated_at = now()
  FROM free_users fu
  WHERE cb.user_id = fu.user_id
  RETURNING cb.user_id, fu.monthly_credits AS amount
)
INSERT INTO public.credit_transactions (user_id, amount, reason, metadata)
SELECT user_id, 0, 'admin_adjustment',
       jsonb_build_object('type', 'v1_free_monthly_to_purchased', 'moved', amount)
FROM moved;
