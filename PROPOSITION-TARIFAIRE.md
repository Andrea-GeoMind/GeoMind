# Proposition de refonte tarifaire — à valider (PLAN item 34)

> **Statut : proposition, NON implémentée.** Les prix publics ne changent pas tant que tu n'as pas tranché. Ce document existe parce que la grille actuelle, héritée de la V1, monétise le mauvais axe (cf. AUDIT-STRATEGIE.md §A2).

## Le problème de la grille actuelle

| Plan | Prix | Sites | Crédits/mois |
|---|---|---|---|
| Gratuit | 0 € | 1 | bonus 1 000 (à vie) |
| Solo | 19 € | 2 | 5 000 |
| Pro | 59 € | 5 | 20 000 |
| Business | 149 € | 15 | 80 000 |

Les paliers se différencient surtout par **le nombre de sites**. Or votre persona cœur (patron de TPE) a **UN site**. Pour lui, passer de Solo à Pro (+40 €) n'achète rien de désirable : il n'utilise ni les sites en plus, ni les 15 000 crédits supplémentaires. Le seul vrai argument (recommandations complètes) est invisible avant l'achat.

**Depuis, l'app a énormément gagné en valeur** : Studio de correctifs, Concurrents, Réputation, Local, Agent-Ready, Pixel, Suivi, Plan d'action, surveillance + alertes. La grille doit refléter cette valeur et se différencier sur **la profondeur et l'automatisation**, pas sur le nombre de sites.

## Proposition : 4 plans axés usage, pas sites

| | **Découverte** | **Essentiel** | **Croissance** | **Agence** |
|---|---|---|---|---|
| Prix | 0 € | **29 €** | **79 €** | **199 €** |
| Cible | Curieux | TPE mono-site | PME qui veut agir | Freelances / agences |
| Sites | 1 | 1 | 5 | 15+ |
| Surveillance auto | mensuelle, score seul | hebdo + alertes | hebdo + alertes + concurrents | + tous clients |
| Studio de correctifs | aperçu | ✅ | ✅ | ✅ |
| Pixel (preuve ROI) | ❌ | ✅ | ✅ | ✅ |
| Réputation + Local + Agent-Ready | aperçu | ✅ | ✅ | ✅ |
| Concurrents suivis | ❌ | 1 | 5 | 5/client |
| Rapport | — | mensuel email | PDF + hebdo | PDF white-label |

**Logique** : chaque palier vend *plus de fréquence de surveillance, plus de concurrents, plus d'automatisation* — pas « plus de sites ». Le mono-site qui veut sérieusement progresser a une raison claire de prendre Essentiel (29 €) puis Croissance (79 €).

## Pourquoi ces prix

- **29 € d'entrée** (vs 19 € actuel) : vous restez 40 % sous BotRank (75 €) et Hikoo (69 €), avec un produit désormais plus riche. Inutile de brader — le freemium fait l'acquisition, le payant doit être rentable.
- **Écart 29 → 79** plus franchissable que l'actuel 19 → 59, et 79 € se justifie par le suivi concurrents + rapports.
- **Agence 199 €** assume le persona prescripteur (le canal d'acquisition n°1 selon l'étude de marché).

## Ce que ça implique techniquement (quand tu valides)

1. `lib/plans.ts` : renommer/ajuster les 4 plans, prix, et surtout les **feature flags** (la structure `PLAN_FEATURES` existe déjà — il suffit d'y ajouter `pixel`, `competitorsTracked`, `monitoringFrequency`).
2. Créer les nouveaux prix dans Stripe (les `STRIPE_*_PRICE_ID`).
3. **Grandfathering** : les clients actuels gardent leur plan/prix (clause à écrire). On ne migre jamais un client payant de force.
4. CGV + page pricing + landing : régénérées automatiquement depuis `lib/plans.ts` (déjà câblé).
5. Migration des libellés de plan en base (`free`→`decouverte`, etc.) OU garder les clés techniques et ne changer que les libellés affichés (recommandé : moins risqué).

## Décisions qui t'appartiennent

1. **Valides-tu le passage à 29/79/199 €** (ou tu préfères garder 19/59/149) ?
2. **Renommer les plans** (Découverte/Essentiel/Croissance/Agence) ou garder Gratuit/Solo/Pro/Business ?
3. **Quand** : maintenant, ou après avoir quelques clients payants pour ne pas perturber l'acquisition naissante ?

Dis-moi et j'implémente exactement ta décision, avec grandfathering des clients existants.
