# AUDIT LOG — MISSION NUIT V2

> Branche : `claude/night-audit-v1`
> Date : 2026-05-15
> Cible : https://geomind.fr (Vercel prod, Stripe Test mode)

---

## Phase 0 — Corrections critiques fondations

### 0.1 — Standardisation convention événements Inngest (slash → point)

**Problème identifié (voir AUDIT_FONDATIONS_RESULTS.md) :**
- `app/(app)/onboarding/actions.ts:37` émet `site/crawl.requested` (slash)
- `app/(app)/onboarding/actions.ts:41` émet `site/discovery.requested` (slash)
- `app/(app)/sites/[siteId]/discovery/launch-action.ts:26` émet `site/crawl.requested` (slash)
- `lib/inngest/functions/crawl-site.ts` écoute `site/crawl.requested` (slash)

**Convention officielle choisie : point** (`site.crawl.requested`, `site.discovery.requested`)

**Corrections appliquées :**
- [ ] `app/(app)/onboarding/actions.ts` — 2 noms d'événements corrigés
- [ ] `app/(app)/sites/[siteId]/discovery/launch-action.ts` — 1 nom d'événement corrigé
- [ ] `lib/inngest/functions/crawl-site.ts` — trigger corrigé

### 0.2 — Reconnexion run-full-analysis

**Problème :** `analysis-actions.ts` émet `site.analysis.requested` → déclenche `run-authority-analysis` (partiel). `run-full-analysis` écoute `analysis.full.requested` → jamais déclenché.

**Correction :** `analysis-actions.ts` émet maintenant `analysis.full.requested` → déclenche `run-full-analysis` (crawl + discovery + authority + technical + content + recommendations + publishers).

- [ ] `app/(app)/sites/[siteId]/analysis-actions.ts` — événement mis à jour

### 0.3 — CLAUDE.md aligné avec la stack réelle

- [ ] Section 2 : Better Auth → Supabase Auth
- [ ] Section 6 : suppression `app/api/auth/[...all]/route.ts`
- [ ] Section 5 : ajout règle convention événements Inngest
- [ ] Section 11 : lien Supabase Auth à la place de Better Auth

---

## Phase 1 — Diagnostic technique

*À remplir*

---

## Phase 2 — Tests E2E Playwright

*À remplir*

---

## Phase 3 — Vérification visuelle

*À remplir*

---

## Phase 4 — Pipeline d'analyse réel

*À remplir*

---

## Phase 5 — Performance et UX

*À remplir*

---

## Phase 6 — Robustesse erreurs

*À remplir*

---

## Phase 7 — Nettoyage final

*À remplir*

---

## BLOCAGES HUMAINS

*Aucun pour l'instant.*

---

## Corrections appliquées (commits)

| SHA | Message |
|---|---|
| *en cours* | *Phase 0 corrections* |
