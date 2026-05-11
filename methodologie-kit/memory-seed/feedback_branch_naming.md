---
name: Nommage des branches Git
description: Nom significatif obligatoire (TKT-XXX-sujet ou feat/sujet), jamais d'identifiant aléatoire
type: feedback
---

Toute branche Git doit avoir un nom **significatif** : `TKT-XXX-sujet`, `feat/sujet`, `fix/sujet`. **Jamais** d'identifiant aléatoire généré (type `claude/blissful-shtern-637bfa`).

**Why:** Un nom de branche aléatoire est illisible dans `git log --oneline`, dans la liste des PRs et dans les notifications. L'utilisateur doit pouvoir comprendre ce que fait une branche au seul nom.

**How to apply:**
- Création de branche : `git checkout -b TKT-042-feature-x` (avec ID du ticket)
- Si pas de ticket : `git checkout -b feat/<sujet-court>` ou `fix/<sujet-court>`
- Si Claude Code propose une branche au nom aléatoire (worktree auto), la renommer avant le premier commit : `git branch -m TKT-042-feature-x`
