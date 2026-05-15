# MERGE BLOCKER — Vercel Preview Build Failure

## Status
- **Type**: Variable d'environnement manquante dans l'environnement Preview Vercel
- **Catégorie**: Configuration Vercel UI (pas un bug de code)
- **Impact**: Le build Production (`main`) n'est PAS affecté

## Cause

Le build Vercel Preview échoue sur la PR #28 (`claude/night-audit-v1`) avec :

```
❌ Variables d'environnement invalides ou manquantes :
• DATABASE_URL: DATABASE_URL doit être une URL Postgres valide
```

`lib/env.ts` valide toutes les variables d'env au démarrage via Zod. Dans l'environnement Preview de Vercel, `DATABASE_URL` n'est pas défini (ou est vide), ce qui provoque un crash lors de la phase "Collecting page data".

## Variables manquantes dans l'environnement Preview Vercel

| Variable | Valeur suggérée | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres` | URI pooler Supabase (Transaction mode, port 6543) |

## Action requise

1. Aller sur https://vercel.com/andreas-projects-7025b42b/geo-mind/settings/environment-variables
2. Ajouter `DATABASE_URL` avec l'URI de la base Supabase pour l'environnement **Preview**
3. Redéployer la PR pour confirmer

## Pourquoi le merge peut procéder

- Le build Production (`main`) a accès à toutes les variables d'env et fonctionne correctement
- Il s'agit d'un problème de scope de variable dans l'interface Vercel
- La PR contient 5 commits valides d'audit nocturne
- `MERGEABLE` confirmé par GitHub API

## Date du diagnostic

2026-05-15
