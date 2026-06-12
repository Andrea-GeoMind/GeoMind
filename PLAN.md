# PLAN DE REFONTE GEOMIND — Phase 2 (à valider)

> Consolidation de [AUDIT.md](AUDIT.md) + [AUDIT-STRATEGIE.md](AUDIT-STRATEGIE.md).
> **Statut** : soumis à validation. Rien n'est implémenté tant que ce plan n'est pas approuvé (en bloc ou item par item).
> En Phase 3 : un item = une implémentation = un commit = un résumé avant de passer au suivant.

## Arbitrages tranchés (délégués par Andrea, modifiables)

| # | Question | Décision |
|---|----------|----------|
| 1 | Plan gratuit | **1 audit complet à vie** + surveillance mensuelle dégradée (score mis à jour, détails floutés). Code et copy alignés là-dessus |
| 2 | Grille tarifaire | Incohérences corrigées **maintenant** sur la grille V2 actuelle ; refonte complète (Découverte/Essentiel/Croissance/Agence) **après** la vague Récurrence |
| 3 | Fiabilité du score | **Oui** : 10-15 prompts, double mesure spontanée+forcée, moyenne glissante. Coût autorité ×3 assumé |
| 4 | Moteur prioritaire | **Google AI Overviews** avant Mistral |
| 5 | Pixel GeoMind | **Inscrit comme cap produit** (vague 3) ; le modèle de données série-temporelle (vague 1) le prépare |
| 6 | Done-for-you / Agence / Baromètre | Vague 4 (après product-market fit des vagues 1-3) |
| 7 | PWA Serwist | Conservée mais gelée (décision finale sur données PostHog) ; page `/design` retirée du public |
| 8 | ⚠️ **Preuve sociale ("2 400+ sites", "4,8/5 Trustpilot")** | **SEULE QUESTION OUVERTE** : si ces chiffres ne sont pas réels → retrait immédiat (item 2). **Réponse d'Andrea requise** |

---

## VAGUE 0 — ASSAINIR (P0 : vendable, sûr, cohérent)

- [x] **1. Cohérence pricing partout** — landing alignée sur les 4 plans V2 (19/59/149 €, crédits traduits en "≈ X analyses"), CGV mises à jour, HT affiché. `app/(marketing)/page.tsx`, `legal/cgv/page.tsx` — **S**
- [x] **2. Preuve sociale véridique** — si chiffres non réels : retrait des "2 400+ sites / 4,8 Trustpilot" (risque légal). Sinon, sourcer. — **S**
- [x] **3. Plan gratuit = 1 audit à vie** — adapter `lib/plans.ts`/crédits free (plus de reset mensuel à 500), copy landing/pricing alignée, surveillance dégradée préparée pour vague 1. — **M**
- [x] **4. RLS sur les 13 tables manquantes** — migration SQL policies `auth.uid()`. — **M**
- [x] **5. Isolation anti-injection des contenus crawlés** — balises `<donnees_site>` dans les prompts discovery/recommendations. — **S**
- [x] **6. Idempotence webhooks Stripe** — sur tous les événements subscription (table `processed_webhooks`). — **M**
- [x] **7. SEO/GEO de geomind.fr** — `app/robots.ts`, `app/sitemap.ts`, JSON-LD FAQPage + Organization, Open Graph + Twitter Card + metadataBase, metas sur /pricing, retrait de `/design` du public. — **M**
- [x] **8. Erreurs visibles dans l'onboarding** — timeout 45 s crawl / 5 min analyse, fin des `catch` silencieux, bannière erreur + bouton réessayer. — **M**
- [x] **9. Honnêteté méthodologique** — disclaimer mesure ("tests via API, tendance > score du jour") + transparence échantillonnage ("X pages analysées sur Y détectées"). — **S**

## VAGUE 1 — FIABILITÉ & RÉCURRENCE (le churn-killer)

- [x] **10. Refonte de la mesure d'autorité** — 10-15 prompts neutres, double mesure (réponse spontanée pondérée fort + classement forcé en signal secondaire), répétition des appels, score affiché en moyenne/fourchette. — **L**
- [x] **11. Modèle de données série temporelle** — table `citation_checks` (prompt × moteur × date × résultat) ; les analyses deviennent des agrégations. Fondation du suivi, des alertes, du Pixel. — **M**
- [x] **12. Surveillance automatique récurrente** — réanalyse planifiée (Inngest cron) selon le plan : mensuelle (free, score seul) / hebdo (payants). — **M**
- [x] **13. Alertes email** — "vous venez d'être cité", "score en baisse", "analyse terminée" (Resend, préférences par user). — **M**
- [x] **14. Onglet Suivi** — courbes des 4 scores + citations par moteur dans le temps, timeline annotée des actions. — **M**
- [x] **15. Rapport mensuel automatique par email** — synthèse simple : score, tendance, 3 actions du mois. — **M**
- [x] **16. Onglet Plan d'action** — kanban À faire/Fait/Vérifié, tri par ROI, bouton "J'ai corrigé" → revérification auto de la règle (re-crawl ciblé) → "✅ +3 pts", progression gamifiée, état connu du coach. — **L**
- [x] **17. Durcissement technique** — validation Zod des réponses moteurs, réservation des crédits avant déclenchement Inngest, messages d'erreur d'analyse contextualisés. — **M**
- [x] **18. Vulgarisation UI** — tooltips sur tous les titres d'issues (canonical, Schema.org…), légende du tableau citations, coût en crédits affiché sur chaque action, bandeau Discovery simplifié, onglet "GEO" renommé "Coach". — **M**
- [x] **19. Responsive mobile** — sidebar repliable (hamburger), passe complète iPhone SE/iPad. — **M**

## VAGUE 2 — ACQUISITION & CONVERSION

- [x] **20. Audit express public sans inscription** — URL sur la landing → mini-score en 60 s (cache par domaine, limite IP) → email pour le rapport complet. L'arme d'acquisition n°1. — **L**
- [x] **21. Landing enrichie** — 3 cas d'usage persona (artisan/PME/freelance), comparatif "GEO vs SEO/Ahrefs" en FAQ, équivalence crédits→analyses sur les cards, "pour qui" sur chaque plan. — **M**
- [x] **22. Contenu & E-E-A-T** — page À propos, llms.txt, blog avec 3-5 guides GEO ("être cité par ChatGPT en 5 étapes", "GEO vs SEO"…), dates de publication. — **L**
- [x] **23. Générateur llms.txt public gratuit** — page outil SEO-bait avec CTA vers l'audit. — **S**
- [x] **24. Export PDF** — standard (Pro) + white-label (Business) — déjà vendu dans le pricing, donc dette commerciale. — **L**
- [x] **25. Friction d'achat réduite** — essai Pro 7 jours, packs crédits livrés ou retirés ("Bientôt disponible" interdit), OAuth Google au signup. — **M**

## VAGUE 3 — DIFFÉRENCIATION (personne n'a ça à ce prix)

- [ ] **26. Studio de correctifs** — génération un-clic : llms.txt, robots.txt, JSON-LD (Organization/LocalBusiness/FAQ/Article), metas réécrites, FAQ générée du contenu, page À propos pré-rédigée ; instructions par CMS détecté ; mode "envoyer à mon webmaster". — **L**
- [ ] **27. Onglet Concurrents** — audit allégé des concurrents détectés, share of voice par prompt, "pourquoi lui est cité" → recommandations en miroir. — **L**
- [ ] **28. Google AI Overviews** — 5e moteur suivi (le plus vu par les clients FR). — **M**
- [ ] **29. Pixel GeoMind v1 ("La Preuve")** — snippet + plugin WP : trafic referrers IA, actions (tel/formulaire), crawlers IA → "ce mois-ci les IA vous ont amené N visiteurs et X demandes". — **L**
- [ ] **30. Corrélations propriétaires** — mesurer règle par règle la corrélation corrections ↔ citations sur la base clients ; afficher comme preuve ("les sites avec FAQ sont cités 2,3× plus — données GeoMind"). — **M** (une fois la base suffisante)

## VAGUE 4 — EXPANSION (post-PMF, à re-prioriser ensemble)

- [ ] **31. Onglet Réputation** — fact-check de ce que les IA disent (hallucinations sur horaires/adresse/prix), sentiment des mentions. — **L**
- [ ] **32. Onglet Local** — prompts géolocalisés auto, checklist présence locale (Google Business, annuaires). — **M**
- [ ] **33. Score Agent-Ready** — un agent IA peut-il vous trouver, comprendre vos horaires, vous contacter, réserver ? Score + correctifs. — **L**
- [ ] **34. Refonte grille tarifaire** — Découverte 0 / Essentiel 29 / Croissance 79 / Agence 199, axée fréquence+concurrents+automatisation (cf. AUDIT-STRATEGIE A6). — **M**
- [ ] **35. Plan Agence & partenaires** — multi-clients, white-label complet, programme prescripteurs webmasters. — **L**
- [ ] **36. Baromètre GEO France** — page publique de données agrégées par secteur (PR + moat). — **L**
- [ ] **37. Mistral Le Chat** — 6e moteur, argument 100 % français. — **M**
- [ ] **38. Divers dette** — refund prorata des analyses, split `schema.ts`, table `audit_logs`, circuit breaker OpenRouter. — **M**

---

**Effort total estimé** : Vague 0 ≈ 1 semaine · Vague 1 ≈ 3-4 semaines · Vague 2 ≈ 2-3 semaines · Vague 3 ≈ 4-6 semaines · Vague 4 = continu.
**North-star metric** : sites surveillés actifs par semaine.
