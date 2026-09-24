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
| Blood Magic | 12 | **Confirmé, verrouillé** | Test `idle-wiki-table-blood-magic` : 8 rituels (sang, or, temps), tableaux de ratios, sorts Blood MacGuffin α/β (formules, minimums, recharges) et sang nécessaire pour +1 à +11 niveaux. Coquille du wiki : ratio « Gold Per Blood » du rituel 8 (66 666 666,67 au lieu de 6 666 666,67). |
| The Lonely Flubber | 13 | Calculé, conforme | 0,82 % au boss 59 puis +0,41 % par boss : présent (`idle-adventure-v47.js`). |
| Boss Fights | 115 | **Confirmé, verrouillé** (+ écarts du wiki) | Test `idle-wiki-table-boss-fights` : 157 boss du tableau identiques au moteur. Écarts : boss 4 = valeur du vrai jeu (1,1 M / 600 k / 11 M) gardée contre le tableau (1,3 M) ; **boss 161 à 183** : le tableau du wiki est inférieur d'un facteur 100 puis 1 000 (boss 161 : 1,984E+156), mais les fiches individuelles des boss 161, 170, 181, 182 (`bf_power`) et le HP Regen du boss 190 concordent avec le moteur : le tableau est fautif (consigné dans `external/wiki-table-typos.json`). Boss 184 à 300 : pas de tableau, extrapolation ×10 par boss cohérente avec la régénération publiée. |
| ITOPOD | 157 | Partiellement conforme, **écart de modélisation** | EXP par palier `(t-1)(t-2)+2` et kills par récompense `40 - t` (20 au-delà du palier 20) : conformes. Colonne « One-Hit Power » : dérivée. **Le moteur utilise des valeurs moyennes** (PV 600, défense 10, dégâts sans le facteur aléatoire 0,8-1,2) alors que la page décrit PV 588-612, défense 9,8-10,2 et un facteur aléatoire : simplification, pas une erreur de formule. |
| Money Pit | 5 | **Écart connu** | Paliers 12 à 16 (1E50 à 1E70) non implémentés : récompense « 1 h de sang » ambiguë. |
| NGU | 64 | **Confirmé, verrouillé** | Test `idle-wiki-table-ngu` : 48 lignes (3 paliers × 16 NGU) : montant par niveau, soft cap, coût de base et valeur au niveau 1e9 identiques (NGU Number à l'arrondi du wiki près). |
| Fibonacci Perk | 4 | Dérivé | Prix cumulés ; les incréments (44 500, 72 000, 188 500, 305 000) sont dans le code. |
| Arbitrary Points, Cooking, MacGuffin Fragments, Evil difficulty | 3 à 15 | Dérivé | Totaux et exemples chiffrés de formules déjà implémentées (racine du temps des MacGuffins, multiplicateurs du Cooking). |
| Augmentations | 10 | **Confirmé, verrouillé** | Test `idle-wiki-table-augmentations` : 7 paires Augment + Upgrade × 8 valeurs (multiplicateur, or, temps, boss de déblocage) identiques ; coûts en `n` (or/énergie de l'augment) et `n²` (or de l'upgrade) présents dans le moteur. |
| Boost | 15 | **Confirmé, verrouillé** | Test `idle-wiki-table-boost-power` : les 13 valeurs de « Boost power » (431,78 à 8 155 518,35) retrouvées exactement par la composition perks × quirks × sets × complétions et la chaîne des paliers recyclés, avec les vrais catalogues de perks et quirks. |
| Gold Diggers | (non signalé) | **Confirmé, verrouillé** | Test `idle-wiki-table-diggers` : 12 diggers (déblocage, drain, niveau plafond, croissance ×1,5 / ×1,75) et bonus global 67,848 % avec tous les diggers au plafond ; formules d'effet par digger identiques dans `diggerBonuses`. |
| Questing, Resource 3, Energy, Magic (souhaits) | 5 à 10 | Dérivé | Colonne « Total Wish output » des souhaits (ex. 165 Qi) ; le catalogue des souhaits est vérifié par script (0 écart, 231 souhaits). |
| Cards | 43 | **Confirmé, verrouillé** | Test `idle-wiki-table-cards` : constantes C1..C4 des 14 types et table « tier suivant » (ratios + TOTAL(pen)) reproduites par la formule pour tous les types ; le wiki annonce une rareté de 1,0 mais calcule avec 1,2 (10 types) ou 1,14 à 1,17 (TM, GOLD, ADV, DAYCARE). |
| Hacks | 20 | **Confirmé, verrouillé** | Test `idle-wiki-table-hacks` : 15 hacks (effet, bonus de palier, niveaux par palier, diviseur, niveau plafond dur) et bonus maximal recalculé avec la formule de la page (niveaux par palier réduits par perks/quirks/souhaits). |
| 4G's Sellout Shop, Infinity Cube, A Number | 4 | Sans objet | Prix en argent réel (Kreds/USD), numéros de build, limites de types entiers. |
| THE END | 16 | **Non implémenté** | 16 pièces sans statistiques publiées, fin du jeu non implémentée. |
| Adventure Mode | 100 | **Confirmé, verrouillé** (zones) | Test `idle-wiki-table-adventure-zones` : 32 zones (boss de déblocage, Manual P/T, Idle P/T Beast Mode OFF, One Hit P) identiques à 2 % près. Coquille du wiki : Halloweenies, Manual T 3,83E+31 au lieu de 3,83E+29 (la fiche de la zone donne 4E+29). Non contrôlés : Beast Mode ON, AutoKill des titans et loot par zone (audité par script pour les 404 lignes de drop). |
| Frequently Asked Questions, New Player Guide, Secrets and Spoilers | 3 à 6 | **À vérifier** | Contradictions connues avec les pages de fonctionnalités (FAQ périmée), traitées dans l'audit des guides. |

Pages jamais citées par mots-clés, mais examinées sous un autre nom : les 35 pages « Build … » (listes d'objets, totaux dérivés), The 2D Universe / Clock Dimension / High Security Base (zones auditées par identifiant), Awakening The Beast et Safe Zone (audit des systèmes jamais audités : non implémentées faute de chiffres cohérents).

## Reste à faire pour une confirmation complète

Fait le 2026-09-24 : recalcul cellule par cellule avec les fonctions du moteur des tables Boost, Augmentations, Blood Magic, NGU (48 lignes), Hacks (15), Cards (14 types), Gold Diggers (12), Boss Fights (157 lignes) et des zones d'Adventure Mode (32), chacune verrouillée par un test `idle-wiki-table-*` (valeurs du wiki copiées en fixtures ; les tests de la CI ne peuvent pas lire le miroir). Coquilles du wiki consignées dans `NGU-Wiki/external/wiki-table-typos.json`.

1. Tables non recalculées cellule par cellule : Wandoos, Time Machine, Yggdrasil (fruits : coûts et graines vérifiés par l'agent Yggdrasil), Resource 3 / Energy / Magic (plafonds et formules de barres), Daily Spin (table de récompenses, vérifiée par l'agent), Titans (12 titans vérifiés par l'agent), sets (totaux Power/Toughness vérifiés par script), tables « Total Wish output » (231 souhaits vérifiés par script).
2. Décider pour ITOPOD : ajouter le facteur aléatoire 0,8-1,2 et la plage de PV (588-612), ou conserver la moyenne documentée.
3. Manques irréductibles faute de source (voir l'`ÉTAT COURANT` du WORKLOG) : paliers 12 à 16 du Money Pit, THE END, Tippi/Traitor (respawn, EXP, butin), mécaniques des types de mobs, capacités des titans, Custom Input Buttons, fruits de Mayo, cartes Foil/End.
