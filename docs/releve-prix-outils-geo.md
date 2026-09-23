# Relevé des prix des outils GEO

**Dernier relevé : 23 septembre 2026.**

Les données des 14 outils comparés vivent dans un seul fichier :
[`lib/marketing/geo-tools.ts`](../lib/marketing/geo-tools.ts). Elles alimentent
l'article `/blog/meilleurs-outils-geo-2026` **et** les pages
`/comparatif/geomind-vs-<slug>`. Un prix qui change se corrige à un seul
endroit, et les deux surfaces suivent.

Ce fichier est la marche à suivre pour refaire le relevé. À la main, au
navigateur, depuis la France — pas d'automatisation : les éditeurs changent la
structure de leurs grilles, pas seulement les nombres, et un script qui
extrait un chiffre ne voit pas qu'un plan a disparu.

## Pourquoi depuis la France, au navigateur

Trois pièges découverts en septembre 2026, tous invisibles depuis un `curl` ou
une requête serveur :

1. **Les prix sont localisés.** Otterly.ai, Semrush, Ahrefs (ses plans) et
   GEO Toolbox affichent des euros à un visiteur français et des dollars à un
   visiteur américain — mêmes nombres, devise différente. Un relevé fait
   depuis une IP américaine écrit « 29 $ » là où le client français paiera
   « 29 € ». C'est la valeur vue depuis la France qui fait foi.
2. **Une même marque peut servir deux devises.** Chez Ahrefs, la page des
   plans est en euros et la page Brand Radar en dollars.
3. **Une page peut exister en deux versions.** `geotoolbox.ai/pricing` est en
   dollars, `geotoolbox.ai/fr/pricing` en euros. Toujours ouvrir la version
   française quand elle existe.

Et un faux positif à connaître : la page de tarifs de Profound affiche
« $180M » — c'est le montant de leur levée en série D, pas un tarif.

## À vérifier pour chaque outil

Dans l'ordre des champs de `GeoTool` :

- `priceSummary` / `priceDetail` — plans, montants, mensuel **et** annuel,
  engagement, essai gratuit, plan gratuit permanent ou non
- `engineSummary` / `engineDetail` — moteurs inclus au plan d'entrée, moteurs
  en option et leur prix, moteurs réservés aux contrats entreprise
- `language` / `languageDetail` — langue de l'**interface**, pas seulement du
  site vitrine
- `target` / `audienceDetail` — cible affichée par l'éditeur
- `strengths` / `weaknesses` — à revoir si la grille a changé de structure
- `features` — seulement pour les outils qui ont une page de comparaison
- `sources` — l'URL exacte consultée

Règle éditoriale : on n'écrit que ce que la page de l'éditeur affiche. Si un
chiffre ne s'y trouve plus, on le retire — on ne le recopie pas depuis un blog
comparatif. Les prix relayés par des tiers sont périmés plus souvent qu'à leur
tour (voir le « 828 $/mois » d'Ahrefs qui circule encore).

## Les 14 URL

| Outil                         | URL à ouvrir                        | Devise au 23/09/2026            |
| ----------------------------- | ----------------------------------- | ------------------------------- |
| Ahrefs Brand Radar            | https://ahrefs.com/brand-radar      | **$**                           |
| Ahrefs (prix des plans)       | https://ahrefs.com/pricing          | **€**                           |
| ChatSEO                       | https://chatseo.app/fr/tarifs       | €                               |
| GeoMind                       | https://geomind.fr/pricing          | €                               |
| GEO Toolbox                   | https://geotoolbox.ai/fr/pricing    | € (la page `/pricing` est en $) |
| ia-rank.com                   | https://ia-rank.com/tarifs          | €                               |
| Meteoria                      | https://meteoria.ai/#tarifs         | €                               |
| Otterly.ai                    | https://otterly.ai/pricing/         | €                               |
| Peec AI                       | https://peec.ai/pricing             | €                               |
| Profound                      | https://www.tryprofound.com/pricing | pas de prix public              |
| Qwairy                        | https://qwairy.co/pricing           | €                               |
| Scrunch AI                    | https://scrunch.com/pricing/        | $                               |
| Semrush AI Visibility Toolkit | https://www.semrush.com/pricing/ai/ | €                               |
| Writesonic                    | https://writesonic.com/pricing      | $                               |
| Yext Scout                    | https://www.yext.com/platform/scout | pas de prix public              |

Deux agences sont citées en fin d'article sans figurer dans le registre, parce
qu'elles vendent un accompagnement et non un outil :
[seo.fr](https://www.seo.fr/agence-geo) et [Tenten GEO](https://geo.tenten.co/en).

## Après le relevé

1. Corriger `lib/marketing/geo-tools.ts`.
2. Mettre à jour `GEO_TOOLS_CHECKED_ON` et `GEO_TOOLS_CHECKED_ON_LABEL` dans ce
   même fichier — la date s'affiche sur l'article et sur les 4 pages de
   comparaison.
3. Relire les titres de fiches dans
   `app/(marketing)/blog/meilleurs-outils-geo-2026/page.tsx` et les libellés du
   sommaire dans `lib/marketing/articles.ts` : ils contiennent des prix en dur
   (« Otterly.ai à 29 €/mois : est-ce suffisant ? ») que le registre ne peut
   pas corriger tout seul.
4. Mettre à jour la date en tête de ce fichier.
5. `pnpm typecheck && pnpm lint && pnpm test`, puis pousser.
6. Vérifier le déploiement sur une chaîne **unique à la modification**, jamais
   sur un montant seul. Un `grep "99 €/mois"` a déjà annoncé un déploiement
   abouti alors que la page servait encore l'ancienne version : la chaîne
   existait ailleurs, dans la ligne d'ia-rank (« puis 99 €/mois »). Chercher
   plutôt un titre de fiche entier — `GEO Toolbox à 99 €/mois` — ou lire
   directement la cellule du tableau. Même piège avec `grep "99 $"`, qui
   compte aussi les `199 $` et `399 $`.

## Historique

| Date       | Ce qui a changé                                                                                                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 22/09/2026 | Premier relevé, 10 outils, depuis une IP américaine (d'où les devises erronées).                                                                                                                                                                     |
| 22/09/2026 | Ajout de Qwairy et Meteoria.                                                                                                                                                                                                                         |
| 23/09/2026 | Relevé refait au navigateur depuis la France. Otterly, Semrush, Ahrefs et GEO Toolbox repassés en euros. Ahrefs : Claude n'est plus réservé aux contrats entreprise, et sa grille a changé de forme en une journée. Ajout de GEO Toolbox et ChatSEO. |
