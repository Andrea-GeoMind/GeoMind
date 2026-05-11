---
name: TDD obligatoire
description: Approche Test-Driven Development pour tout nouveau code — test échouant en premier, toujours
type: feedback
---

Toujours écrire le test en premier, le voir échouer, puis écrire le code minimal pour le faire passer.

**Why:** L'utilisateur a explicitement adopté TDD comme norme de travail. Le cycle Red-Green-Refactor est la règle, pas une option.

**How to apply:**
- Avant tout nouveau feature ou bugfix : écrire le test, vérifier qu'il échoue pour la bonne raison, implémenter, vérifier qu'il passe.
- Jamais de code de production sans test préalable échouant.
- Pour les bugs : reproduire d'abord en test avant de corriger.
- Si un test passe immédiatement sans code → le test teste quelque chose qui existe déjà, le revoir.
- Pas d'exception "c'est trop simple" ou "je testerai après".
- Ne jamais modifier un test pour le faire passer — corriger le code applicatif.
