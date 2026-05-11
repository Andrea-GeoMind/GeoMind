---
name: full-audit
description: Lance l'audit complet du projet (API + E2E + logs prod) avant tout git push. Crée .audit_passed si vert, sinon bloque le push via le hook check_git_push.py.
---

# Full Audit

Lance `scripts/full-audit.sh` et analyse le résultat.

## Étape 1 — Exécution

```bash
bash scripts/full-audit.sh
```

Le script enchaîne :
1. Audit API — curl tous les endpoints critiques
2. Tests E2E navigateur — parcours utilisateurs complets
3. Audit logs prod — erreurs capturées par le middleware backend

## Étape 2 — Analyse des échecs

Pour chaque échec détecté :

1. **Identifie la cause racine** — lis le code source concerné, pas les tests
2. **Propose un fix concret** — fichiers exacts, lignes exactes
3. **Demande confirmation** avant d'appliquer le fix

## Étape 3 — Rapport final

À la fin, afficher un résumé avec ✅/❌ par dimension :
- Audit API (endpoints)
- Tests E2E (UI)
- Audit Logs Prod (erreurs serveur)

## Règles absolues

- **Ne modifie JAMAIS les tests pour qu'ils passent** — corrige toujours le code applicatif
- **Ne supprime jamais `.audit_passed` manuellement** — le script et le hook s'en chargent
- **Ne contourne jamais le hook pre-push** (`--no-verify` interdit)
