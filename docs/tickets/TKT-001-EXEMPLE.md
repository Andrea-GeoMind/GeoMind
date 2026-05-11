# TKT-001 — Endpoint `GET /api/v1/resources` enrichi

| Lot | Statut | Estimation | Dépendances |
|-----|--------|------------|-------------|
| LOT 1 | À faire | 0,5 j | — |

## Contexte

La vue Liste affiche par ressource : **Nom · Statut · Montant · Date · Owner**. Aujourd'hui l'endpoint retourne uniquement les données d'identité. Il faut agréger les montants côté API en une seule requête (pas de N+1) pour servir la liste.

## Critères d'acceptation

- [ ] La réponse de `GET /api/v1/resources` inclut, pour chaque ressource, les champs :
  - `total_amount` (number) — somme agrégée des transactions liées
  - `last_activity_at` (datetime) — dernière activité enregistrée
  - `status` (enum) — calculé via la règle métier
- [ ] Les agrégats sont calculés en **une seule requête SQL** (LEFT JOIN + GROUP BY), pas de boucle applicative
- [ ] Performance : 100 ressources avec 10 transactions chacune → réponse < 300 ms en prod
- [ ] La réponse reste compatible avec l'UI actuelle (les nouveaux champs sont additifs)

## Détail technique

- Fichier probable : `backend/app/api/v1/resources.py`
- Schéma à étendre : `ResourceRead` (ajouter les 3 nouveaux champs)
- Requête SQL avec sous-requêtes corrélées ou CTE :
  ```sql
  SELECT r.*,
    COALESCE(t.total, 0) AS total_amount,
    t.last_at AS last_activity_at
  FROM resources r
  LEFT JOIN (
    SELECT resource_id, SUM(amount) AS total, MAX(created_at) AS last_at
    FROM transactions
    WHERE deleted_at IS NULL
    GROUP BY resource_id
  ) t ON t.resource_id = r.id
  ```
- Vérifier que la colonne `transactions.deleted_at` existe — sinon créer un ticket préalable.

## Tests (TDD — Red d'abord)

Tests unitaires `tests/api/test_resources.py` :

- [ ] Ressource sans transaction → `total_amount = 0`, `last_activity_at = null`
- [ ] Ressource avec transactions soft-deleted → exclues du calcul
- [ ] Ressource avec 100+ transactions → ordre correct par `created_at`
- [ ] Performance : générer 100 ressources × 10 transactions, mesurer durée requête (< 300 ms)

## Tests prod

- [ ] `curl https://<URL_PROD>/api/v1/resources | jq '.[0]'` retourne les nouveaux champs
- [ ] Pas de régression : l'UI `resources/page.tsx` continue de fonctionner
- [ ] Vérifier 5 min de logs prod sans erreur 500 sur cet endpoint

## Notes d'implémentation

_(à remplir après implémentation si écart avec la spec ci-dessus)_
