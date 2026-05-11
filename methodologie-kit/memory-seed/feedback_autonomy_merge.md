---
name: Merger sans demander
description: Dès qu'un ticket est approuvé, merger + supprimer la branche sans confirmation supplémentaire
type: feedback
---

Dès que l'utilisateur a explicitement approuvé un ticket / un changement, procéder au merge + suppression de branche sans confirmation supplémentaire.

**Why:** L'approbation explicite vaut autorisation pour l'ensemble du rituel de clôture. Redemander "tu confirmes que je merge ?" après un "OK push" est superflu et ralentit.

**How to apply:**
- "ok pousse" / "go" / "merge" / "valide" → enchaîner directement : push → merge → delete branch → cocher PROGRESS.md
- Si la skill `/close-ticket` est disponible, l'invoquer directement
- Confirmer uniquement si une étape est destructive sur du shared state non couvert par l'approbation (ex. drop de table)
