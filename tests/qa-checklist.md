# Checklist QA — GEOMIND

> Effectuée manuellement sur chaque Vercel Preview ou en local (`pnpm dev`).
> Cocher chaque ligne après vérification. Une ligne non cochée = bloquant avant deploy.

## Auth

- [ ] Inscription email → email de vérification reçu → lien redirige vers `/onboarding`
- [ ] Connexion email/password valide → redirigé vers `/dashboard`
- [ ] Connexion email/password incorrect → message d'erreur affiché, pas de redirect
- [ ] "Mot de passe oublié" → email reçu → lien redirige vers `/reset-password?mode=update`
- [ ] Réinitialisation mot de passe → connexion avec nouveau mot de passe fonctionne
- [ ] Déconnexion → redirigé vers `/login`, session détruite (accès `/dashboard` redirige vers login)
- [ ] Accès direct à `/dashboard` sans session → redirigé vers `/login`

## Onboarding

- [ ] Wizard onboarding s'affiche après la vérification email (première connexion)
- [ ] Champ URL invalide → message d'erreur inline
- [ ] Champ URL valide → site créé → redirigé vers le dashboard
- [ ] Wizard onboarding complet sur mobile 375px (pas de débordement, boutons cliquables)

## Dashboard

- [ ] Liste des sites affichée correctement (0 sites → empty state visible)
- [ ] Bouton "Ajouter un site" → modal/formulaire s'ouvre
- [ ] Ajout d'un deuxième site → apparaît dans la liste
- [ ] Suppression d'un site → disparaît de la liste, confirmation demandée

## Découverte (Discovery)

- [ ] Bouton "Lancer la découverte" visible sur la page Discovery
- [ ] Clic → statut passe à `running` (spinner ou indicateur visible)
- [ ] Après complétion → description, mots-clés et concurrents affichés
- [ ] Prompts neutres générés et listés
- [ ] Édition d'un prompt → sauvegardé correctement

## Analyse complète

- [ ] Bouton "Lancer l'analyse" visible (actif si découverte complétée)
- [ ] Clic → statut passe à `running`
- [ ] Après complétion → Note GEO globale affichée sur la vue d'ensemble
- [ ] Onglet Autorité → tableau des citations affiché
- [ ] Onglet Technique → liste des issues affichée (ou "Aucun problème" si clean)
- [ ] Onglet Contenu → liste des issues affichée
- [ ] Onglet Publishers → liste des publishers suggérés
- [ ] Clic sur une issue → fiche recommandation s'ouvre

## Quotas & Plans

- [ ] Plan gratuit : limite de sites respectée (erreur affichée si dépassement)
- [ ] Plan gratuit : limite d'analyses respectée (erreur affichée si dépassement)
- [ ] Page `/settings/billing` → plans tarifaires affichés correctement
- [ ] Clic "Passer au Pro" → redirection Stripe Checkout
- [ ] Après paiement test (carte Stripe test `4242 4242 4242 4242`) → plan mis à jour dans l'UI
- [ ] Portail client Stripe accessible depuis `/settings/billing`

## Paramètres

- [ ] `/settings/account` → modification email fonctionne
- [ ] `/settings/account` → modification mot de passe fonctionne
- [ ] `/settings/usage` → compteurs d'utilisation corrects

## Observabilité

- [ ] Sentry : déclencher une erreur manuelle (`Sentry.captureException(new Error('test'))`) → apparaît dans le dashboard Sentry avec userId
- [ ] PostHog : signup → event `signup` visible dans PostHog Live Events
- [ ] PostHog : création site → event `site_created` visible
- [ ] PostHog : lancement analyse → event `analysis_started` visible
- [ ] PostHog : consent "Tout accepter" → events capturés ; consent "Essentiel uniquement" → events bloqués

## Légal & Cookies

- [ ] Bannière cookies apparaît à la première visite
- [ ] "Tout accepter" → bannière disparaît, consent stocké en localStorage
- [ ] "Essentiel uniquement" → bannière disparaît, PostHog opt_out
- [ ] Pages `/legal/cgv`, `/legal/privacy`, `/legal/mentions`, `/legal/cookies` accessibles et non-vides
- [ ] Liens légaux visibles dans le footer (landing) ou menu

## PWA

- [ ] Manifest `/manifest.json` accessible et valide
- [ ] Sur mobile (Chrome Android) → invite d'installation affichée
- [ ] Sur macOS (Safari) → meta apple-web-app-capable présent
- [ ] Service worker enregistré en production (pas en dev)

## Performance & Accessibilité

- [ ] Lighthouse mobile > 85 sur la landing page
- [ ] Aucune erreur console JavaScript en production
- [ ] Aucun appel réseau en erreur (4xx/5xx) visible dans les DevTools Network
- [ ] Images avec alt text, boutons avec labels accessibles

## Responsive

- [ ] Dashboard lisible sur 375px
- [ ] Tableau Autorité scrollable horizontalement sur 375px
- [ ] Wizard onboarding complet sur 375px
- [ ] Navigation/sidebar repliable sur mobile

## Sécurité

- [ ] Accès à `/sites/{siteId}` avec un siteId appartenant à un autre user → 404 ou redirect
- [ ] Tentative de lancer une analyse pour un site non-propriétaire → erreur retournée
- [ ] Variables d'env sensibles absentes du bundle client (vérifier dans DevTools Sources)
