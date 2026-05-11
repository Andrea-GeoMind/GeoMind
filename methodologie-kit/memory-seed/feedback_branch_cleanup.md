---
name: Nettoyage des branches mergées
description: Supprimer local + distant dès le merge dans main, aucun reliquat toléré
type: feedback
---

Dès qu'une branche est mergée dans `main`, supprimer la branche en local **ET** sur le remote. Aucun reliquat toléré.

**Why:** Les branches fantômes polluent `git branch -a`, masquent la vue d'ensemble du travail en cours et créent de la confusion lorsque l'on cherche à savoir ce qui est encore actif.

**How to apply:**
- Après merge : `git branch -d <branche> && git push origin --delete <branche>`
- Ou `gh pr merge --delete-branch` qui fait les deux en un appel
- Si worktree associé : `git worktree remove <path> --force`
- Vérifier régulièrement avec `git branch -a` qu'aucune branche mergée ne traîne
