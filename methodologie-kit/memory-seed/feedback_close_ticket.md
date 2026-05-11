---
name: Skill /close-ticket — rituel de fin de ticket
description: Invoquer la skill /close-ticket dès qu'un ticket est implémenté, sans attendre une demande explicite
type: feedback
---

La skill `/close-ticket` automatise le rituel de fin : vérification complétude → audit → merge → push (deploy auto) → doc PROGRESS.md → nettoyage branche.

**Vérification de complétude (Étape 0) — 8 catégories obligatoires :**
1. Questions posées sans réponse
2. Arbitrages non tranchés
3. Actions/process en cours
4. Tâches promises non faites
5. Effets de bord non vérifiés
6. Migrations BDD non appliquées en prod
7. Variables d'env non configurées sur tous les services
8. TODOs/FIXMEs laissés sans ticket de suivi

**Why:** L'utilisateur ne veut pas rappeler manuellement merge + push + doc + deploy à chaque fin de ticket. Le rituel doit être scripté, pas verbal.

**How to apply:** Invoquer `/close-ticket` automatiquement dès que l'implémentation d'un ticket est terminée et validée. Ne pas attendre que l'utilisateur le demande.
