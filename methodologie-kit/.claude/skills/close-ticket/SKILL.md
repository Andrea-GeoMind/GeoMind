---
name: close-ticket
description: Use when a ticket is complete and ready to ship — covers tests, merge, deploy, PROGRESS.md update, and branch cleanup in one pass.
---

# Close Ticket

Rituel de fin de ticket : vérification complétude → tests → merge → push → doc → nettoyage.

**Annoncer au début :** "J'utilise la skill close-ticket pour clore ce ticket."

---

## Étape 0 — Vérification de complétude (OBLIGATOIRE avant tout)

Relire la conversation de la session en cours et vérifier qu'il ne reste rien en suspens :

| Catégorie | Exemples à vérifier |
|-----------|---------------------|
| **Questions posées** | Ai-je posé une question à l'utilisateur sans avoir reçu de réponse ? |
| **Arbitrages ouverts** | Un choix technique, fonctionnel ou de design est-il resté non tranché ? |
| **Actions en cours** | Un process lancé (migration, audit, test, script) est-il encore en attente de résultat ? |
| **Tâches promises** | Ai-je mentionné faire quelque chose sans l'avoir fait ? |
| **Effets de bord** | Un changement a-t-il des impacts sur d'autres écrans / endpoints non encore vérifiés ? |
| **Migrations BDD** | Une migration de schéma a-t-elle été appliquée sur l'environnement de prod/staging ? |
| **Variables d'env** | Un nouveau secret/config a-t-il été déclaré sur tous les services (frontend, backend) ? |
| **TODOs dans le code** | Des commentaires `TODO`/`FIXME` ont-ils été laissés sans ticket de suivi créé ? |

**Si au moins un point est en suspens :** signaler clairement avant de continuer.

```
⚠️  Point en suspens avant clôture :
    [décrire ce qui n'est pas terminé]

    → Traiter d'abord, puis relancer /close-ticket.
```

**Ne pas procéder à la clôture tant qu'un point reste ouvert.**

**Si tout est traité :** continuer à l'étape 1.

---

## Étape 1 — Identifier le contexte

```bash
git branch --show-current
git log --oneline -5
```

Relever :
- `BRANCH` : branche courante (ex : `feat/TKT-042-feature-x`)
- `TICKET_ID` : identifiant du ticket (ex : TKT-042, SEC-4, PERF-2) — extraire du nom de branche ou des commits récents
- `DESCRIPTION` : résumé 1 ligne du travail effectué (depuis les commits)

---

## Étape 2 — Audit complet

```bash
bash scripts/full-audit.sh
```

**Si l'audit échoue → STOP.** Corriger le code applicatif. Ne jamais modifier les tests pour les faire passer.

Le script crée `.audit_passed` quand tout est vert — le hook `check_git_push.py` autorisera le push.

---

## Étape 3 — Créer la PR

```bash
git push -u origin <BRANCH>
gh pr create --title "<TICKET_ID>: <description courte>" --body "$(cat <<'EOF'
## Résumé
- <bullet 1>
- <bullet 2>

## Tests
- [ ] Audit complet vert
- [ ] Endpoints critiques vérifiés en prod

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Afficher l'URL de la PR créée.

**Puis merger immédiatement** (sauf si l'utilisateur demande explicitement d'attendre une revue) :

```bash
gh pr merge --merge --delete-branch
```

Le flag `--delete-branch` supprime la branche distante automatiquement.

---

## Étape 4 — Synchroniser main local

```bash
git checkout main
git pull origin main
git branch -d <BRANCH>
```

---

## Étape 5 — Vérification post-déploiement

Attendre ~2 min que le déploiement automatique soit effectif, puis vérifier :

```bash
bash scripts/audit-prod.sh  # ou autre vérification adaptée à la stack
```

**Si l'audit prod échoue → hotfix immédiat, jamais "on verra demain".**

---

## Étape 6 — Documentation PROGRESS.md

Lire `PROGRESS.md` à la racine du projet. Trouver la section du sprint en cours (la dernière section active, sans `complet.` à la fin).

**Si le ticket est déjà listé avec `[ ]` :** cocher → `[x]`.

**Si le ticket n'est pas listé :** ajouter dans la section appropriée :

```markdown
- [x] **<TICKET_ID>** — <description courte de ce qui a été implémenté>
```

Ajouter aussi une ligne au **Journal d'exécution** :

```markdown
| <TICKET_ID> | ✅ | YYYY-MM-DD | <résumé technique + nb tests ajoutés> |
```

Respecter exactement le format des lignes existantes (gras pour l'ID, tiret long —, minuscules pour la description).

Committer séparément :

```bash
git add PROGRESS.md
git commit -m "docs: PROGRESS.md — <TICKET_ID> archivé"
git push origin main
```

---

## Étape 7 — Mise à jour du fichier ticket (si écart avec la spec)

Si l'implémentation s'écarte du ticket original (scope étendu, choix technique différent), ajouter une section **Notes d'implémentation** datée dans `docs/tickets/<TICKET_ID>-*.md` :

```markdown
## Notes d'implémentation (YYYY-MM-DD)

<décrire l'écart et la justification>
```

---

## Étape 8 — Nettoyage worktree (si applicable)

Si la session s'exécute dans un worktree Claude :

```bash
git worktree list
# Si worktree lié à la branche mergée :
git worktree remove <worktree-path> --force 2>/dev/null || true
```

---

## Étape 9 — Rapport final

```
✓ Ticket <TICKET_ID> clôturé

  Branch    : <BRANCH> → main (merged)
  Deploy    : en cours (~2 min)
  Audit prod: ✅
  Doc       : PROGRESS.md mis à jour et pushé
  Branche   : supprimée local + remote
```

---

## Règles absolues

- **Jamais** de push sans audit complet vert
- **Toujours** documenter dans PROGRESS.md avant de clore
- **Toujours** committer PROGRESS.md séparément (commit `docs:`)
- **Jamais** laisser une branche mergée en vie (local + remote)
- **Ne jamais modifier les tests** pour les faire passer — corriger le code

## Cas particulier — merge direct (sans PR)

Si l'utilisateur demande explicitement un merge direct (ticket trivial, fix typo) :

```bash
git checkout main
git pull origin main
git merge --no-ff <BRANCH> -m "chore(<TICKET_ID>): <description>"
git push origin main
git branch -d <BRANCH>
git push origin --delete <BRANCH> 2>/dev/null || true
```

Puis continuer à l'étape 5 (vérification post-déploiement).
