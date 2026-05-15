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

### Résultats

| Vérification | Résultat |
|---|---|
| `pnpm typecheck` | ✅ 0 erreur |
| `pnpm lint` | ✅ 0 warning |
| `pnpm build` | ✅ succès (après ajout NEXT_PUBLIC_SENTRY_DSN manquant dans .env.local) |
| `pnpm test` | ✅ 312/312 tests passés |

**Note build** : `NEXT_PUBLIC_SENTRY_DSN` était absent du `.env.local` local mais présent dans `.env.example`. Ajouté manuellement. La variable est définie dans Vercel — pas d'impact prod.

### Schéma DB

Toutes les tables du cahier des charges existent : `profiles`, `subscriptions`, `sites`, `firecrawl_pages`, `site_metadata`, `competitors`, `prompts`, `analyses`, `authority_results`, `authority_sources`, `technical_issues`, `content_issues`, `recommendations`, `publishers`. Cascades de suppression correctement configurées. ✅

### Règles Technique implémentées vs cahier (section 9)

| Règle cahier | Fichier | Statut |
|---|---|---|
| robots_txt_block_all | robots-txt-block-all.ts | ✅ |
| robots_txt_block_ai_bots | robots-txt-block-ai-bots.ts | ✅ |
| sitemap_missing | sitemap-missing.ts | ✅ |
| sitemap_malformed | sitemap-malformed.ts | ✅ |
| llms_txt_missing | llms-txt-missing.ts | ✅ |
| http_errors_ratio | http-errors-ratio.ts | ✅ |
| https_missing | https-missing.ts | ✅ |
| h1_missing_or_duplicate | h1-missing-or-duplicate.ts | ✅ |
| hierarchy_missing | hierarchy-missing.ts | ✅ |
| **js_required_for_content** | *absent* | ❌ Manquant (pénalité 12) |
| depth_too_deep | depth-too-deep.ts | ✅ |
| schema_org_organization | schema-org-organization.ts | ✅ |
| schema_org_faq | schema-org-faq.ts | ✅ |
| schema_org_article | schema-org-article.ts | ✅ |
| schema_org_product | schema-org-product.ts | ✅ |
| response_time_slow | response-time-slow.ts | ✅ |
| page_size_heavy | page-size-heavy.ts | ✅ |

**16/17 règles techniques implémentées.** `js_required_for_content` absent — nécessite comparaison JS/no-JS Firecrawl. Noté comme blocage humain (architecture Firecrawl v2).

### Règles Contenu implémentées vs cahier (section 10)

Les règles implémentées (10 fichiers) couvrent metadata, titres, FAQs, listes structurées, contenu mince — différentes de la spec qui décrit embeddings + LLM. Écart significatif mais intentionnel (simplification MVP). Implémentées : `thin-content`, `no-structured-lists`, `no-faq-content`, `no-dates-in-content`, `meta-description-missing/short/duplicate`, `title-missing-or-short`, `low-page-count`, `no-definition-patterns`. Noté comme blocage humain pour alignement avec spec V1.

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
