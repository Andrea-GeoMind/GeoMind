# QA — Phase 4 de la refonte GeoMind

> **Date** : 12 juin 2026
> **Méthode** : vérification live de la production (routes, contenus, API d'audit express, anti-SSRF) + 3 passes QA parallèles — persona « Pierre, patron de restaurant non-technique » (tunnel authentifié complet), persona « Sarah, gérante sceptique » (tout le marketing), et revue adversariale du code des vagues 1-2.
> **Verdict global** : la production est saine (toutes les routes publiques 200, JSON-LD présents, audit express fonctionnel en live, SSRF bloqué, 52/52 E2E). Les passes ont trouvé **2 bloquants légaux, 5 majeurs, ~12 mineurs** — tous corrigés ci-dessous, sauf un qui vous appartient.

---

## ⚠️ RESTE À FAIRE PAR VOUS (je ne peux pas le faire à votre place)

| # | Sujet | Détail |
|---|-------|--------|
| 1 | **SIRET et adresse dans les mentions légales et la politique de confidentialité** | Les pages affichent « SIRET : [à compléter après inscription auto-entrepreneur] » et « France » comme adresse. C'est une obligation légale (LCEN) avant tout marketing actif. Fichiers : `app/(marketing)/legal/mentions/page.tsx`, `legal/privacy/page.tsx`. |
| 2 | **OAuth Google** | Config console Supabase + Google Cloud requise (item 25 du plan). |
| 3 | **Clé API fournisseur SERP** | Pour l'item 28 (Google AI Overviews), vague 3. |

---

## Corrigé — Bloquants & majeurs

| Problème | Trouvé par | Fix |
|----------|-----------|-----|
| **CGV muettes sur l'essai Pro 7 jours** (offre affichée au pricing mais absente des CGV — risque légal) | Sarah | Section « 2 bis. Essai gratuit » ajoutée aux CGV : conditions, CB requise, annulation sans frais |
| **Crédits « mensuels » orphelins des comptes free V1** (jamais resetés depuis le passage à « 1 analyse à vie ») | Revue adversariale | Migration 0015 (appliquée en prod, 0 compte restant) : valeur préservée en crédits achetés + garde runtime dans `ensureBalance` pour les retardataires |
| **Lien « voir les plans » du Coach sortait de l'app** (→ /pricing marketing au lieu du billing) | Pierre | → `/settings/billing` |
| **Essai 7 jours invisible depuis la landing** (CTA « Essayer Pro » sans mention, description différente du pricing) | Sarah | Landing alignée : « Essayer Pro — 7 jours offerts » + note, descriptions harmonisées |
| **Solde insuffisant sans issue claire** (un free à court de crédits voyait « Rechargez depuis la page Abonnement » sans lien) | Pierre | Message réécrit avec le manque chiffré + lien direct « Passer à un plan supérieur ou acheter un pack → » |
| **3 promesses de délai contradictoires** (30 s / 20-40 s / 30-60 s) | Pierre | Harmonisé sur « 20 à 40 secondes » partout |

## Corrigé — Mineurs

- Onglet navigateur « GEO — GEOMIND » → « Coach — GEOMIND » (cohérent avec l'onglet renommé).
- « 1 000 offerts (à vie) » ambigu dans le tableau pricing → « 1 000 offerts, sans renouvellement ».
- Dates des pages légales (mentions, privacy, cookies) passées de mai à juin 2026.
- « améliorer votre visibilité GEO » (jargon dans l'onboarding) → « dans les IA ».
- Widget audit express : validation d'URL côté client (message clair au lieu d'un aller-retour API pour « n'importe quoi »).
- Générateur llms.txt : crochets/parenthèses neutralisés dans les labels/URLs (markdown toujours valide).
- Message coach d'accueil : garde si le score global est null (« analyse en cours de finalisation » au lieu de « 0/100 »).
- Copy onboarding honnête : « vous pouvez fermer cet onglet, l'analyse continue en arrière-plan » (au lieu de « ne fermez pas »).
- `trends/page.tsx` : copie défensive avant `.reverse()`.
- Parser robots.txt de l'audit express : réécrit au standard des groupes robots.txt (lignes User-agent consécutives, directives clôturantes) + gestion des commentaires.
- `monitor-sites` : hypothèse « une subscription active par user » documentée.

## Vérifié sain (échantillon)

- Tous les liens header/footer/blog/outils pointent vers des routes existantes ; sitemap complet ; robots.txt et llms.txt corrects en prod.
- FAQ affichée = FAQ du JSON-LD (source unique) ; `#organization` référencé par les articles bien défini dans le layout marketing.
- Reconcile du Plan d'action uniquement après `mark-success` (pas de fausses vérifications sur analyse échouée) ; webhooks Stripe idempotents y compris pendant l'essai ; clés React du kanban uniques ; divisions par zéro gardées.
- API d'audit express en production : score correct, cache 24 h actif, SSRF bloqué, rate limit en place.

## État des vérifications au moment du rapport

`pnpm typecheck` ✅ · `pnpm lint` ✅ · **526 tests unitaires** ✅ · `pnpm build` ✅ · audit complet projet (API + 52 E2E prod + logs) ✅
