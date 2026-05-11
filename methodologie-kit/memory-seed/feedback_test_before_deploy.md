---
name: Tester en prod avant de valider
description: Vérifier tous les endpoints sur l'URL prod après chaque push, pas juste en local
type: feedback
---

Un 200 sur l'API en local **NE GARANTIT PAS** que l'UI fonctionne en prod.

**Why:** Différences d'environnement (variables d'env, healthchecks, ports, BDD managée, CORS, build production…) font qu'un code qui marche en local peut échouer en prod. L'utilisateur exige une vérification post-déploiement systématique.

**How to apply:**
- Après chaque push qui déclenche un déploiement : exécuter l'audit prod (`bash scripts/audit-prod.sh`)
- Tester aussi les parcours UI en prod (E2E sur URL prod, pas seulement local)
- Analyser les logs prod 5 min après déploiement (`bash scripts/audit-logs.sh`)
- Si erreur détectée : hotfix immédiat, jamais "on verra demain"
- Ne déclarer un ticket fermé que quand prod est vert
