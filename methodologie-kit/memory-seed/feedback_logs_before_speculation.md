---
name: Logs avant fixes spéculatifs en prod
description: Quand prod est down, lire les logs serveur AVANT de pousser des fixes — ne jamais débugger à l'aveugle
type: feedback
---

Quand la prod renvoie une erreur persistante (502, 500, crash), **lire les logs serveur EN PREMIER** avant de proposer ou pousser un fix.

**Why:** Un fix spéculatif qui ne se base pas sur les logs est un pari, pas une correction. Dans un incident antérieur, 4 fixes spéculatifs successifs ont été poussés avant de regarder les logs — tous ont échoué, et le vrai problème (mismatch de configuration) aurait été visible en 30 secondes dans les logs. ~30 minutes perdues.

**How to apply:**
- Erreur prod persistante → premier message : "peux-tu me partager les logs ? / je consulte les logs"
- Si pas d'accès aux logs : expliquer ce dont on a besoin (token, screenshot, configuration) plutôt que tenter des fixes
- Les fixes spéculatifs sont OK pour des bugs reproductibles en local, **pas** pour un crash prod opaque
- Règle simple : si je ne peux pas expliquer **pourquoi** ça plante avec les éléments en main, je ne pousse pas — je demande plus d'info
