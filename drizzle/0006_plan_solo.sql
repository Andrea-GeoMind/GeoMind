-- TKT-PLANS-V2 — Nouveau modèle de plans (cahier-des-charges §17.2)
-- Ajout du plan Solo (19 €/mois, 2 sites, 5 000 crédits)

ALTER TYPE "plan" ADD VALUE IF NOT EXISTS 'solo' BEFORE 'pro';
