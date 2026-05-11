---
name: Mémoriser les URLs immédiatement
description: Dès qu'une URL de service apparaît, la stocker en mémoire — ne jamais dire "je n'ai pas l'URL"
type: feedback
---

Dès qu'une URL de service est mentionnée (URL prod, dashboard cloud, repo, BDD, monitoring), la stocker immédiatement comme mémoire de type `reference`.

**Why:** Demander "quelle est l'URL de prod ?" alors que l'utilisateur l'a déjà donnée 3 fois dans la session est frustrant et fait perdre du temps. La mémoire persistante existe pour ça.

**How to apply:**
- URL aperçue dans un message, un screenshot, une commande → créer/mettre à jour un fichier `reference_<service>.md` en mémoire
- Si l'URL change (ex. nouveau déploiement) : mettre à jour, ne pas créer un doublon
- Ne jamais répondre "je n'ai pas cette URL en mémoire" si elle a déjà été mentionnée dans la session courante — la consigner d'abord
