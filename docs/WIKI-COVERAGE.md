# Couverture du wiki local par SOREAL IDLE (registre)

Objectif : savoir précisément quelles données du miroir wiki (`C:\Users\n0rma\Documents\NGU-Wiki`) sont déjà dans le jeu, lesquelles ne le sont pas, et lesquelles sont contradictoires. Registre établi le 2026-09-24, à tenir à jour avec l'`ÉTAT COURANT` du WORKLOG.

## Ce que « 100 % » peut vouloir dire

- **Données structurées** (objets, ennemis, zones, sets, catalogues de perks/quirks/souhaits/Sellout, tables de valeurs, formules) : vérifiables par script, donc confirmables.
- **Prose mécanique** (règles, conditions, exceptions écrites en phrases) : non vérifiable automatiquement ; seule une relecture page par page l'établit. Elle a été faite deux fois par des agents (pas de preuve ligne à ligne).

Un audit par mots-clés ne prouve rien : c'est pourquoi ce registre sépare *présence*, *calcul vérifié* et *écart confirmé*.

## Outils (dans `design/`, hors CI car ils lisent le miroir wiki)

| Script | Rôle |
|---|---|
| `wiki-number-coverage.mjs` | Pour chaque page : extrait les nombres distinctifs (exposants, milliers, décimaux, suffixes K…Dc) et cherche s'ils existent comme littéraux dans `cloudflare/src` et `cloudflare/public`. Détecteur de trous, **pas une preuve** : un nombre calculé par une formule est « absent » alors qu'il est correct. |
| `wiki-number-context.mjs "Page"…` | Affiche chaque nombre absent avec son contexte pour le triage manuel. |
| `wiki-boss-table-check.mjs` | Compare la table « Boss Fights » (Attack/Defense/HP de 181 boss) au moteur. |

Sortie brute de la couverture : `node design/wiki-number-coverage.mjs`.

## Résultat de la présence numérique (littéraux)

| Type de page | Pages | Nombres distinctifs | Présents | Taux |
|---|---:|---:|---:|---:|
| ennemi | 287 | 444 | 426 | 95,9 % |
| titan / zone (fiches) | 14 | 388 | 369 | 95,1 % |
| zone | 32 | 712 | 640 | 89,9 % |
| objet | 392 | 6 674 | 5 756 | 86,2 % |
| fonctionnalité / guide | 111 | 4 496 | 3 574 | 79,5 % |
| set | 61 | 1 813 | 1 345 | 74,2 % |
| build (listes d'objets) | 35 | 2 554 | 1 853 | 72,6 % |

Les « absents » des objets, sets et builds sont presque tous des valeurs **dérivées** (PV = 3 × Power, régénération = 3 % de la toughness, maximum = base × (1 + niveau/100), totaux de set, totaux de build) que le moteur calcule ; l'audit d'objets par script (2026-09-24) les compare aux modèles `Item data`.

## Triage des pages de fonctionnalités les plus éloignées

Statuts : **Calculé, conforme** (formule du wiki présente dans le code et retrouvée) · **Dérivé** (résultat d'une formule, non recalculé cellule par cellule) · **Écart** · **À vérifier**.

| Page | Absents | Statut | Détail |
|---|---:|---|---|
| Advanced Training | 213 | Calculé, conforme | Bonus P/T = Level^0,4 × 10 et Block = (L+50)/(L+100) présents ; le code cite une vérification cellule par cellule. Table « long terme » : dérivée. |
| Rebirths | 12 | Calculé, conforme | Table des facteurs de temps : toutes les bornes et constantes (`minutes / 1989672960` … `1 + jours/2`) identiques à `idleNguRebirthTimeFactor`. |
| Blood Magic | 12 | Calculé, conforme | α = floor(log10(Blood/1e9)+1), β = floor(log20(Blood/1e6)+1) présents ; la table des sorts en est la sortie. |
| The Lonely Flubber | 13 | Calculé, conforme | 0,82 % au boss 59 puis +0,41 % par boss : présent (`idle-adventure-v47.js`). |
| Boss Fights | 115 | **Écart (wiki)** | 181 boss comparés : 157 identiques, 24 écarts (boss 4 et boss 161 à 183). Boss 4 : valeur du vrai jeu (1,1 M / 600 k / 11 M) volontairement gardée contre le tableau (1,3 M). **Boss 161 à 183 (23 lignes)** : le tableau du wiki est inférieur au moteur d'un facteur 100 puis 1 000 (ex. boss 161 : 1,984E+156 contre 1,984E+158), mais la fiche individuelle du boss 161 (`bf_power=1.984E+158`), celle du boss 181 (`1.984E+178`) et le HP Regen publié du boss 190 (3,052E+183) sont cohérents avec le moteur : c'est le tableau qui est fautif. Boss 184 à 300 : pas de tableau, extrapolation ×10 par boss cohérente avec la régénération publiée. |
| ITOPOD | 157 | Partiellement conforme, **écart de modélisation** | EXP par palier `(t-1)(t-2)+2` et kills par récompense `40 - t` (20 au-delà du palier 20) : conformes. Colonne « One-Hit Power » : dérivée. **Le moteur utilise des valeurs moyennes** (PV 600, défense 10, dégâts sans le facteur aléatoire 0,8-1,2) alors que la page décrit PV 588-612, défense 9,8-10,2 et un facteur aléatoire : simplification, pas une erreur de formule. |
| Money Pit | 5 | **Écart connu** | Paliers 12 à 16 (1E50 à 1E70) non implémentés : récompense « 1 h de sang » ambiguë. |
| NGU | 64 | Dérivé | Colonnes « niveau au plafond » et « bonus total » : sorties des formules de la table ; le catalogue 16 NGU × 3 paliers est vérifié par script (0 écart). |
| Fibonacci Perk | 4 | Dérivé | Prix cumulés ; les incréments (44 500, 72 000, 188 500, 305 000) sont dans le code. |
| Arbitrary Points, Cooking, MacGuffin Fragments, Augmentations, Boost, Evil difficulty | 3 à 15 | Dérivé | Totaux et exemples chiffrés de formules déjà implémentées (racine du temps des MacGuffins, multiplicateurs du Cooking, puissance des boosts 431,78…). |
| Questing, Resource 3, Energy, Magic (souhaits) | 5 à 10 | Dérivé | Colonne « Total Wish output » des souhaits (ex. 165 Qi) ; le catalogue des souhaits est vérifié par script (0 écart, 231 souhaits). |
| Cards | 43 | **À vérifier** | Table de coûts par carte (ex. 1 489 817,36) et souhaits de mayo : formules `(C1 + C2·R·T^C3·C4^T) × M` présentes et vérifiées contre les tableaux d'après l'agent Cards, non recalculées ici. |
| Hacks | 20 | **À vérifier** | Table de paliers de niveaux (ex. 4,328×10^14 %) non recalculée ; le reste est le « Total Wish output » des souhaits. |
| 4G's Sellout Shop, Infinity Cube, A Number | 4 | Sans objet | Prix en argent réel (Kreds/USD), numéros de build, limites de types entiers. |
| THE END | 16 | **Non implémenté** | 16 pièces sans statistiques publiées, fin du jeu non implémentée. |
| Adventure Mode | 100 | **À vérifier** | Tableau des zones (Manual / Idle / Beast Mode / One Hit / AutoKill) : les colonnes Manual et Idle sont dans le moteur, le reste (AutoKill, écarts avec certaines pages de zone) est documenté dans le WORKLOG mais non recontrôlé ici. |
| Frequently Asked Questions, New Player Guide, Secrets and Spoilers | 3 à 6 | **À vérifier** | Contradictions connues avec les pages de fonctionnalités (FAQ périmée), traitées dans l'audit des guides. |

Pages jamais citées par mots-clés, mais examinées sous un autre nom : les 35 pages « Build … » (listes d'objets, totaux dérivés), The 2D Universe / Clock Dimension / High Security Base (zones auditées par identifiant), Awakening The Beast et Safe Zone (audit des systèmes jamais audités : non implémentées faute de chiffres cohérents).

## Reste à faire pour une confirmation complète

1. Recalculer cellule par cellule, avec les fonctions du moteur, les tables « Dérivé » : NGU (colonnes dérivées), Cards, Boost (puissance par nombre d'objets), Augmentations, Blood Magic, Hacks. Chaque comparaison peut devenir un test avec les valeurs du wiki copiées en fixtures (les tests de la CI ne peuvent pas lire le miroir).
2. Recontrôler le tableau des zones d'Adventure Mode (AutoKill, Beast Mode ON/OFF, One Hit).
3. Décider pour ITOPOD : ajouter le facteur aléatoire 0,8-1,2 et la plage de PV, ou conserver la moyenne documentée.
4. Corriger dans le wiki local (couche `external/`) l'erreur du tableau Boss 161-183 pour que les futurs audits ne la signalent plus.
5. Sources externes ou relevés dans NGU pour les manques irréductibles (voir l'`ÉTAT COURANT` du WORKLOG).
