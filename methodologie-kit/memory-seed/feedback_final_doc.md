---
name: Doc finale = audit du code, pas des tickets
description: La documentation finale du projet se produit par lecture exhaustive du code applicatif ; tickets/PROGRESS.md comme index seulement
type: feedback
---

Quand l'utilisateur demande une documentation complète du projet, **ne pas se baser uniquement sur les tickets**. Les tickets décrivent ce qui a été demandé, pas ce qui est en production.

**Why:** Du code peut exister en prod sans ticket associé (refactor discret, hotfix urgent, optimisation non ticketée). Inversement, des tickets peuvent décrire un scope qui a été réduit ou changé à l'implémentation. Seul le code est source de vérité.

**How to apply:**
1. Lire le code applicatif (`backend/`, `frontend/src/`) — source de vérité
2. Utiliser les tickets comme **index/contexte**, pas comme source
3. Croiser avec `PROGRESS.md` (journal des décisions et "déjà implémenté")
4. Croiser avec `git log` (hotfixes et refactors non ticketés)
5. Flagger explicitement les zones où code et tickets divergent

Concrètement : si le code contient un service `xyz_service.py` sans ticket dédié, il doit quand même apparaître dans la doc finale. Le ticket n'est pas une condition d'existence du code.
