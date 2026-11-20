# Audit v2 (lecture seule) : combat de boss, Rebirth, difficultés, gains EXP/Or/AP, Inventaire

Date : 2026-11-20. Jeu : `Assembly-CSharp.dll` build 1260 lu avec `d.mjs` (ids IL entre parenthèses). Moteur : `cloudflare/src/*.js` à `ed715675`.
Aucun code du jeu recopié, seulement des faits chiffrés. Ne refait pas ce que `boss-at-rebirth.md` et `economie.md` ont déjà corrigé ; vérifie que les corrections tiennent.

## 1. Corrections précédentes : elles tiennent (relues dans l'IL ET dans le code)

| Point | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Fin des boss à 301 (E3) | `fight` (1542), `beginFight` (1548), `nukeBosses` (1543) s'arrêtent si bossID > 300 ; `advanceBoss` (1546) pose 69/69/420/420/420 | `bossFinDesBossAtteinteSorealIdle_`, `idle-runtime-boss.js:766`, appelé par le Nuke (`idle-runtime-combat.js:746`) | CONFORME |
| Nuke : stop si `bossID >= highestBoss ET bossID < 124` (E2) | idem ; `highestBoss` n'est mis à jour qu'en Normal (1546, offsets IL_00b2 à IL_00d7) | `nukeArretBossInedit_`, `idle-runtime-combat.js:512` | CONFORME |
| Nuke : Attaque/5 > Défense boss ET Défense/5 > Attaque boss | 1543, comparaisons strictes | `idle-runtime-combat.js:~780` | CONFORME |
| EXP : bonus « première fois » remplaçant, `floor` (E7) | `rewardExp` (1547) : indice 3 = 10, indices 4 à 19 = 3 tant que `currentHighestBoss < 20`, indices 4/5 = 0 sinon, 1 EXP pour 6 à 22 | `idle-runtime-combat.js:802-833`, `nguBossFtbeBonusXpV1`, table `xp` (0,0,0,1,0,0,1,...) | CONFORME |
| `addExp` (2221) : x NGU x objet 119 (1,1) ou (1+équipement[24]) x perk 94>=987 (1,05) x Diggers x Hacks x Souhaits x Cuisine, puis `Floor` | | `xpMultiplier`, `idle-ngu-bonus.js:990` | CONFORME (structure) |
| `awardAP` (2678) : (secondes - 3600)/500 entier, y compris début de défi (E10) | | `idle-ngu-actions.js:640-641` | CONFORME |
| `addAP` (2225) : x succès x (objet 129 maxé ? 1,2 : 1 + bonus[25]) x (perk 94>=89 ? 1,02), `floor` | | `apWithBonusV1`, `idleHeartsApMultiplierV1` | CONFORME |
| Seuils Evil / Sadistic `>= 300` (E6) | | `idle-ngu-actions.js:1000,1004` | CONFORME |
| Objet 487 après le 301e boss en Sadistic | `advanceBoss` | `idle-ngu-etat.js:1366` (`peaks.extreme >= 301`) | CONFORME |
| Mur du boss 20 | absent du jeu | retiré (`bossBloqueRenaissance = false`, commit `111a3b01`) | CONFORME |
| Niveaux AT du perk 18 avant déblocage (E8), barre d'énergie conservée (E12), vitesse du speedrun `<= 1800` | | `idle-ngu-bonus.js:495-505`, `idle-ngu-actions.js:753`, `:653` | CONFORME |
| Regen du boss x50/s (E4) | `fight` ajoute `bossRegen` à chaque appel (50/s) | `regenBossSecondeSorealIdle_`, `REGEN_BOSS_APPELS_PAR_SECONDE_V1 = 50` | CONFORME |
| Regen du joueur | `updateHP` (2135) appelé toutes les 0,02 s : + 0,001 + 0,001 x Défense par appel = Défense/20 + 0,05 par seconde | `regenPvSecJoueur = defense/20` (`idle-runtime-progression.js:936`) | CONFORME (0,05 PV/s de plus dans le jeu, négligeable) |
| Dégâts reçus/infligés par appel (x0,02, plancher 0) | `fight` | `degatsRecusSecondeSorealIdle_` | CONFORME |
| NUMBER, `timeMulti`, `minRebirthTime`, banque 75 %, `resetEnergy`, `resetTraining` | `calculateNextMultis` (2722), etc. | `calculateIdleNguNextNumber`, etc. | CONFORME (inchangé depuis `boss-at-rebirth.md`) |
| `effectiveBossID` (2237) : bossID + 301 (>= Evil) + 301 (>= Sadistic) | | `idle-ngu-etat.js:1263` | CONFORME |
| `machineBossMulti` (2131) : max(highestBoss - 27, 1) | | `idle-ngu-pistes.js:892,1185` (plafond 274 = valeur atteinte au boss 301) | CONFORME |

## 2. Inventaire : points vérifiés

| Point | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Niveau du cube (`infinityCubeTier` 3623) | somme < 100 : 0 ; sinon min(10, trunc(log10(somme) - 1)) | `IDLE_ADVENTURE_CUBE_TIERS_V1` seuils 100...1e11 | CONFORME |
| Bonus du cube : loot 0,5 + 0,2 (t-1) ; or 0,5 au tier 2 puis (t-1)^1,3 / 2 ; hack 0,10/0,15/0,20 aux tiers 8/9/10+ ; souhaits 0,10/0,20 aux tiers 9/10+ (3624-3627) | | `idle-adventure-combat.js:1085-1097` (or 123,11 / 208,56 / ... recalculés, identiques) | CONFORME |
| Plafond doux du cube (`cubePowerSoftcap` 3599/3601) | si cube > (aventure + bonus) : base + (cube - base)^0,5 | `idleAdventureCubeSoftcapV1` | CONFORME |
| Emplacements : sac (`curSpaces` 3575), accessoires (3576), MacGuffins (3577), garderie (3578), loadouts (3584) | sac = 8 par complétion No Equipment + 3 par Evil + 10/9 au maximum + sources arbitraires + perk + quête + souhait ; accessoires = 2 + 14 sources | sac : `idle-ngu-etat.js:1265-1268` + `idle-ngu-catalogues.js:371` ; accessoires : `idle-ngu-etat.js:1268` (6 achats Sellout + 2 achats EXP + perk + quirk + défis + souhait 109) | CONFORME pour le sac et les accessoires. MacGuffins, garderie et loadouts : déjà lus par `sets-bonus.md` / `macguffins-sang-coeurs.md`, non relus ici |
| Minuteur d'auto-fusion / auto-boost (3585/3586) | 3600 s x (1 - 0,1 x complétions No Equipment), x0,5 avec l'achat « improved » | `idle-ngu-catalogues.js:374` (plancher 0,5) x `idle-ngu-actions.js:1147` (x0,5) | CONFORME |
| `Equipment::mergeItem`, `boostEquip`, plafond de niveau | | `aventure.md` | CONFORME (déjà audité) |

## 3. Écarts VÉRIFIÉS (IL et code SOREAL lus)

**R1. Evil / Sadistic : le diviseur 1e30 s'applique au BOSS dans SOREAL, au JOUEUR dans le jeu (sens inversé, 1e60 d'écart).**
- Jeu : `Character::totalAttack` (2134-ordre IL de 2133) et `totalDefense` (2134) divisent l'attaque et la défense du joueur par `difficultyModifier` (2139 : 1 en Normal, `hardModifier` en Evil, `sadisticModifier` en Sadistic ; 1e30 pour les deux d'après `boss-at-rebirth.md`), puis appliquent le plancher 100 sur le résultat final. `updateCharacter` (2132) fait pareil pour `attack` / `defense` / `maxHP`. Les statistiques du boss ne sont JAMAIS divisées : `advanceBoss` (1546) et `Rebirth::resetBoss` (2716) lisent `Boss::get_bossAttack/Defense/Regen/CurHP/MaxHP` tels quels (recherche IL de tous les lecteurs de `hardModifier` / `difficultyModifier` : seulement `Character::totalAttack/totalDefense/updateCharacter/difficultyModifier/totalWandoos*Speed/.ctor` et `StatsDisplay`).
- SOREAL : `nguBossStatsV1(i, difficulty)` DIVISE le boss par 1e30 (`idle-ngu-boss-reference-v1.js:410`, `:436-466`), appelé par `attaqueBossSorealIdle_`, `defenseBossSorealIdle_`, `pvMaxBossSorealIdle_`, `equilibrerBossPrincipalSorealIdleV413_` avec `meta.difficulty` (`idle-runtime-etat.js:1405-1421`, `idle-runtime-progression.js:811`). Les statistiques du joueur ne sont divisées nulle part (aucune occurrence de 1e30 dans `idle-runtime-*.js` ni dans le client de combat). Résultat mesuré : boss 1 en Evil = attaque 5e-26, défense 4e-26, PV 5e-25 (au lieu de 50 000 / 40 000 / 500 000), alors qu'à stat égale le jeu exige `joueur / 1e30 > boss`, soit `joueur > boss x 1e30`. SOREAL exige `joueur > boss / 1e30` : Evil et Sadistic sont PLUS FACILES que Normal au lieu de 1e30 plus durs (écart relatif 1e60).
- Les tests `idle-boss-stats-evil-sadistic-divider` et `idle-boss-combat-engine-difficulty-wiring` figent le sens faux (ils vérifient `/ 1e30` sur le boss). `boss-at-rebirth.md` §1.1 l'a classé « CONFORME (équivalent) » : c'est inexact, la division du joueur équivaut à une MULTIPLICATION du boss.
- Conséquences liées dans SOREAL : `attaqueBossSorealIdle_` fait `max(1, round(...))` (attaque minimale 1 en Evil) ; l'écrêtage `[1e-300, 1e300]` (`idle-big-number-v1.js` en tête) empêcherait de représenter `boss x 1e30` au-delà de 1e270 : le correctif propre est de diviser les stats du JOUEUR (comme `Character::totalAttack`, avant les multiplicateurs Augmentations/Wandoos/Yggdrasil/Barbes..., plancher 100 final), pas de multiplier le boss.
- À décider avec Norman : ce changement rend Evil/Sadistic réellement difficiles ; régénérer `idle-parties-reference-v1` et le moteur local.

**R2. Or d'Aventure : le bonus du cube s'ajoute à celui des objets dans le jeu, il se multiplie dans SOREAL.**
- Jeu : `Character::totalGoldbonus` (2209) = bonus ITOPOD x MacGuffin[11] x quête de la Bête x `(1 + bonus objet[7] + bonus objet[40] + cubeGoldBonus)` x NGU x carte[11] (x2 avec le 1er Evil du défi Time Machine). Les deux bonus d'objet sont les deux types « Gold Drops » (`effectName`, 3675) ; ils s'additionnent avec le bonus du cube DANS UNE SEULE parenthèse. `LootDrop::goldDrop` (487) = base x Range(4,5) x `totalGoldbonus`.
- SOREAL : le bonus d'objets est `(1 + goldDropsPct/100)` dans `adventureGoldMultiplier` (`idle-ngu-bonus.js:1011`) ; le cube est un facteur séparé `1 + goldDropsPct/100` (`idle-adventure-butin.js:884`, `idle-adventure-combat.js:297` pour les titans) ; les deux sont multipliés. Exemple : objets +1 200 % et cube tier 10 (+869,93 %) : jeu x(1+12+8,6993) = 21,7 ; SOREAL x13 x 9,6993 = 126 (5,8 fois trop d'Or). Le cas « un seul des deux » est identique.
- Correctif : sortir `goldDropsPct` d'objets de `adventureGoldMultiplier` et appliquer `1 + (goldDropsPct objets + goldDropsPct cube)/100` en un seul facteur au tirage d'Or (butin de zone, titans).
- NB : `aventure.md` l.48 avait laissé ce point « NON VÉRIFIÉ ».

## 4. Écarts mineurs / incohérences internes SOREAL (vérifiés dans le code SOREAL seulement ou négligeables)

- **PV max du joueur** : jeu `10 + 10 x attaque` (2132, IL_02fd à IL_0317) ; SOREAL `max(1000, round(10 x attaque))` (`idle-runtime-boss.js:1514-1519`). +10 PV de moins ; le plancher 1000 n'existe pas dans le jeu (attaque >= 100 donne déjà >= 1010). Impact quasi nul.
- **PV du boss après une victoire** : `idle-runtime-progression.js:1428` appelle `pvMaxBossSorealIdle_(bossCombatIndex)` SANS la difficulté, alors que la synchro suivante la passe (`:809`) : en Evil/Sadistic `BOSS_PV_MAX` enregistré (PV normaux) diffère de la définition (PV divisés), d'où une remise des PV du boss à 100 % à la synchro suivante. Disparaît si R1 est corrigé en divisant le joueur (le boss ne dépend plus de la difficulté), sinon passer `difficulty` aux lignes 1428 et `idle-runtime-actions.js:940` (déjà fait) / `idle-runtime-acces.js:900`, `idle-runtime-aventure.js:1244`.
- **Boss 4 (indice 3), jamais en « première fois »** : le jeu donne 1 EXP (formule générale) ; SOREAL `xp` = 1 : conforme (vérifié).
- **Flottants** : le jeu calcule `addExp` / `addAP` en float32 (`conv.r4`) ; SOREAL en double + `1e-9`. Écart relatif < 1e-6, jamais visible.

## 5. NON VÉRIFIÉ dans ce passage

- PP (ITOPOD, `addPP` n'existe pas comme méthode de `Character` : les PP viennent du moteur ITOPOD, non lu ici).
- Parry, block, `PlayerController::takeDamage` et autres capacités du joueur : combat d'Aventure, couvert par `aventure.md` et `ia-ennemis-titans.md`.
- Capacités de boss dans `IDLE_BOSS` (fureur, paralysie, bouclier, sceau) : toujours à contrôler dans la feuille (voir `boss-at-rebirth.md` §5).
- MacGuffins / garderie / loadouts (`macguffinSpaces` 3577, `daycareSpaces` 3578, `loadoutSpaces` 3584) : non comparés ligne à ligne ici.
- `hardModifier` / `sadisticModifier` = 1e30 : valeur de scène non rattachée formellement (deux doubles 1e30 trouvés à un seul endroit de `level0`).

## 6. Écarts réels (liste courte)

1. R1 : Evil/Sadistic : diviseur 1e30 sur le boss (SOREAL) au lieu du joueur (jeu) ; sens inversé, 1e60 d'écart ; tests actuels figent le mauvais sens (`idle-ngu-boss-reference-v1.js:410,436-466`).
2. R2 : Or d'Aventure : bonus objets et bonus cube multipliés dans SOREAL, additifs dans le jeu (`idle-ngu-bonus.js:1011`, `idle-adventure-butin.js:884`, `idle-adventure-combat.js:297`).
3. Mineur : PV max joueur 10 x attaque (SOREAL, plancher 1000) contre 10 + 10 x attaque (jeu) ; `pvMaxBossSorealIdle_` sans difficulté après victoire (`idle-runtime-progression.js:1428`).
