---
name: Déployer systématiquement
description: Toujours pousser après chaque modification — ne jamais laisser du code mergé non déployé
type: feedback
---

Après chaque modification mergée dans `main`, pousser immédiatement pour déclencher le déploiement.

**Why:** Le code qui dort en local ou sur une branche mergée mais non poussée n'est ni testé, ni utile, ni validé en conditions réelles. L'utilisateur a établi qu'un ticket n'est terminé qu'une fois déployé et vérifié en prod.

**How to apply:**
- Chaque commit sur `main` → `git push` immédiat
- Vérifier que le déploiement automatique s'est bien déclenché (CI/CD vert)
- Si plateforme sans auto-deploy : déclencher manuellement
- Si push bloqué (hook audit), corriger la cause, ne pas contourner avec `--no-verify`
