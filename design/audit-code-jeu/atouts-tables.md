# Audit des TABLES de données des atouts (Perks), build 1260

Date : 2026-11-16. Source jeu : scène `level0` (champs sérialisés de `ItopodPerkController`, 232 entrées, ids 0 à 231). Comparé à `IDLE_PERKS_CATALOG_V1` (`cloudflare/src/idle-perks-v1.js`, qui inclut les perks Cartes 161-216 de `idle-cards-v1.js`) et à `IDLE_PERK_DIFFICULTE_V1` (`idle-difficulty-gates-v1.js`). Complète `perks.md` (qui avait laissé ces nombres NON VÉRIFIÉS).

## 1. Emplacements dans `level0` (octets ; le compteur int32 précède chaque liste)

| Liste | Offset | Type | Taille |
|---|---|---|---|
| `maxLevel` (cap) | 1 987 884 | int64 | 232 |
| `cost` | 1 989 744 | int64 | 232 |
| noms | 1 991 604 | chaînes Unity (longueur + octets alignés sur 4) | 232 |
| (booléens, non utilisés ici) | 1 998 808 | octet | 232 |
| `effectPerLevel` | 1 999 044 | float32 | 232 |
| descriptions | 1 999 976 | chaînes Unity | 232 |
| `perkDifficultyReq` | 2 021 456 | int32 | 232 (0 Normal, 1 Evil, 2 Sadistic) |

Repérage : la liste `cost` a été retrouvée en cherchant les 30 premiers coûts du catalogue SOREAL (une seule occurrence), les autres par leur compteur 232 et leur contenu. Aucun `maxLevel` à 0 : tous les perks ont un plafond fini dans le jeu (la crainte « illimité » de `perks.md` §8 est levée). Données brutes extraites : `perks-jeu.json` dans le dossier temporaire de session.

## 2. Résultat de la comparaison champ par champ (231 perks présents dans SOREAL)

| Champ | Écarts |
|---|---|
| coût (`cost`) | **0** |
| plafond (`maxLevel` / `cap`) | **0** (y compris Rich Perks 1000, Fibonacci 94 = 1597, perks de Cartes) |
| difficulté exigée | **0** (table Evil/Sadistic identique sur les 232) |
| effet par niveau (`effectPerLevel`) | **0 écart réel** (voir §3) |
| nom | 26 écarts purement cosmétiques (§4) |
| description | textes paraphrasés (wiki) ; aucun nombre différent (§5) |
| présence | **1 perk manquant : id 56** |

## 3. Effet par niveau

Pour chaque perk, un nombre de `bonus` de SOREAL doit égaler `effectPerLevel[i]` du jeu : 197 sur 231 concordent. Les 34 restants se résolvent tous (le jeu code ces effets en dur, la table n'est pas leur source) :

| id | EPL jeu | SOREAL | Verdict |
|---|---|---|---|
| 0-4, 15-17, 19, 20 | 0 | bonus ponctuels / drapeaux | OK, effet codé en dur (`doEffect` ou consommateur) |
| 26 | 1 | `cubeBoostRatePct 0.01` | OK (cube 2 % au lieu de 1 %) |
| 30 | 0,0001 | `bonus {}`, chance 0,0001 codée dans idle-yggdrasil-extra-v1.js | OK (valeur égale à l'EPL, vérifié) |
| 34 | 1 | `titanExpBonusKills 3` | OK (texte du jeu : 3 kills par niveau) |
| 65-73, 88, 111, 112 | 1 | `bonus {}` | OK (slots, fragments, lus par id ailleurs) |
| 87 | 1 | `questMinorBaseAlways 2` | OK (texte : +2) |
| 90 | 0,005 | `questDropsPct 0.5` | OK : le jeu fait `1 + niv x 0,005` (IL 452), SOREAL exprime en pourcent (0,5 %/niveau) |
| 94 | 1 | `bonus {}` (cap 1597) | OK (Fibonacci) |
| 105 | 1 | `questIdleDividerReduction 2` | OK (texte : réduit de 2) |
| 109, 110 | 1 | `wishMinTimeSeconds 24` | OK : le jeu fait `niv x 24` en dur (`minWish1`, IL 459) |
| 125 | 0,01 | `statPct 2, dropChancePct 0.5` | OK (texte du jeu : +200 % / +50 %, valeurs en dur) |
| 144 | 1 | `statPct 9, adventureStatsPct 0.15, augmentSpeedPct 0.2, nguSpeedEnergyPct/MagicPct 0.2` | OK (texte du jeu : +1000 %, 15 %, 20 %, 20 %) |
| 231 | 1 | `bonus {}` | OK (ERROR, aucun effet) |

Vérifié aussi dans l'IL : `sadBoss1/2` (157, 158) = `niv x 0,0005`, borné à 0,005 chacun, EPL 0,0005, plafond 10 : identique à SOREAL.

## 4. Écarts de noms (cosmétiques, aucune incidence de jeu)

| id | Jeu | SOREAL |
|---|---|---|
| 19, 20 | `"Fruit of Knowledge sucks, 1/5"` (le jeu met de VRAIS guillemets dans le nom) | sans guillemets |
| 23 | `Golden Showers ` (espace final) | sans espace |
| 36-40 | `Adv. Training Level Bank I-V` | `Advanced Training Level Bank I-V` |
| 105, 106 | `Gooder Idle Questing!` / `Another Gooder Idle Questing!` | sans `!` |
| 113, 114, 115 | `... Hack Milestone Reducer I` | `... Milestone Reduces I` (coquille) |
| 145, 146 | `Bonus Quest Handin Progress I/II` | `Progess` (coquille) |
| 147, 148 | `Improved Major/Minor Quest QP Rewards ` (espace final) | sans espace |
| 164, 177, 190 | `A / D Card Tier Up I-III` | `A/D Card Tier Up ...` |
| 165, 178, 191 | `Magic NGU Speed Card Tier Up I-III` | `Magic NGU Card Tier Up ...` |
| 169, 182, 195 | `Energy NGU Speed Card Tier Up I-III` | `Energy NGU Card Tier Up ...` |

## 5. Descriptions

106 textes SOREAL sont des paraphrases courtes du wiki (ex. id 6 : « +1% bonus multiplier to your Energy Power per level » contre « Each level grants +1% bonus multiplier to your Energy Power! » dans le jeu). Tous les nombres cités concordent avec ceux du jeu (pourcentages, secondes, 3 kills, 4 h de base des souhaits, base 1,20 du boss Sadistic, etc.). Rien à corriger côté mécanique ; si l'on veut un texte mot pour mot du jeu, les 232 descriptions sont dans `perks-jeu.json`. Le texte du jeu pour 94 (Fibonacci) ne dit PAS la liste 1, 2, 5, 8... ni « secret bonuses » : SOREAL ajoute une phrase de sa composition (spoil potentiel, à revoir au regard de la règle n°2 ; hors périmètre de cet audit).

## 6. Écart réel : perk 56 manquant

| id | Champ | Jeu | SOREAL |
|---|---|---|---|
| 56 | existence | `MacGuffin Daycare!`, coût **5000**, plafond **1**, difficulté **Evil (1)**, EPL 0, description « With this perk, the Daycare Kitty can use her powers of happiness to improve your ancient cosmic artifacts! c: » | absent du catalogue (commentaire d'en-tête : « exclu, dépend du Daycare ») |

Effet dans le jeu (IL `InventoryController::swapDaycare`, id 3643) : sans ce perk (niveau < 1), le jeu REFUSE de placer un MacGuffin dans la garderie (« You need to buy the 'MacGuffin Daycare' Perk before the Daycare Kitty can take care of your MacGuffins! »). C'est donc un simple verrou d'accès, pas un multiplicateur. Le commentaire de `idle-macguffins-v1.js:648` dit que la vitesse du Daycare d'un fragment n'est pas publiée ; l'ajout du perk lui-même n'exige pas cette vitesse.

### Correctif exact

1. Ajouter dans `IDLE_PERKS_CATALOG_V1`, entre les ids 55 et 57 :
   `{ id: 56, name: "MacGuffin Daycare!", effect: "With this perk, the Daycare Kitty can use her powers of happiness to improve your ancient cosmic artifacts! c:", cost: 5000, cap: 1, bonus: {} },`
   La difficulté 56 -> Evil est déjà dans `IDLE_PERK_DIFFICULTE_V1` (la table liste « 56 »).
2. Seulement si SOREAL gère la mise de MacGuffins à la garderie : y exiger `niveau perk 56 >= 1` (et difficulté suffisante). Sinon, le perk est achetable mais sans conséquence, ce qui correspond à l'état actuel de la fonction côté joueur. Attention anti-spoil : le perk ne doit apparaître que selon les règles habituelles (liste filtrée au découvert) ; vérifier aussi que le test des perks (nombre de perks / ids contigus) accepte l'ajout, et mettre à jour les commentaires de `idle-perks-v1.js` (lignes 57 et 181) et `idle-macguffins-v1.js:648`.

## 7. Corrections de noms proposées (optionnel, cosmétique)

Aligner les noms du §4 sur le jeu (surtout les coquilles `Reduces` -> `Reducer` aux ids 113-115 et `Progess` -> `Progress` aux ids 145-146). Attention : un nom affiché change les voix / le dictionnaire anglais (voir mémoire « Dictionnaire anglais en cache et voix »).

## 8. Ce qui n'a pas pu être extrait / limites

- Rien d'inextractible dans les cinq tables demandées : toutes lues et comparées (231 perks + le 56 manquant).
- Les EPL ne disent pas COMMENT chaque consommateur les combine : cela reste couvert par `perks.md` (formules). Les effets codés en dur (0-4, 125, 144, 30, 34, 87, 105, 109-110) sont validés par les textes du jeu et, pour 30/90/109/110/157/158, par l'IL.
- Le champ booléen à 1 998 808 (232 octets) n'est pas identifié ; il n'intervient pas dans les comparaisons.
