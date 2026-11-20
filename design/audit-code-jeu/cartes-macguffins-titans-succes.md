# Audit complémentaire (build 1260) : Titans, MacGuffins, Quirks, Daycare, Succès, Sets, Cœurs

Date : 2026-11-20. Lecture seule (seul ce fichier est écrit). Sources : IL de `Assembly-CSharp.dll` (`m.mjs`, `d.mjs`, `xr.mjs`), table des ennemis `zones-jeu.json` (extraite de `createEnemyTable`, id 150) et valeurs de scène `level0` (`scene-dump.json`, lecteur `cloudflare/tools/banc-vrai-jeu/scene/`). Aucun code du jeu recopié ; uniquement des faits chiffrés. Ce fichier ne refait pas ce que `macguffins-sang-coeurs.md`, `ia-ennemis-titans.md`, `bestiaire-portraits-daycare-ygg.md`, `quirks-questing.md`, `succes.md`, `sets-bonus.md`, `atouts-tables.md`, `perks.md` ont déjà classé CONFORME ; il vérifie ce qu'ils avaient laissé « NON VÉRIFIÉ » (titans : récompenses, délais, statistiques, déblocages ; quirks : coûts) et contrôle que leurs écarts ont bien été corrigés dans `cloudflare/src`.

## 1. Écarts réels (par impact)

### E1. Tippi et le Traitor : délai de réapparition de 7,5 h dans le jeu, 1 h dans SOREAL (impact moyen)

- Jeu : `AdventureController::boss13SpawnTime` (99) et `boss14SpawnTime` (100) = 27 000 s de base, moins `min(900 x (Normal + Evil + Sadistic completions No Rebirth), 23 400)`, plancher 3 600 s (même forme que `boss10SpawnTime` à `boss12SpawnTime`, ids 96 à 98 : 23 400 / 25 200 / 27 000 s). Ils sont utilisés par `manageFight` (142, zones 44 et 45 : `boss13Spawn` / `boss14Spawn` comparés au minuteur, sinon pas d'apparition), `updateTimer` (145), `Character::adventureOfflineProgress` (2239).
- SOREAL : `idle-adventure-zones.js:686-687`, `tippi` et `traitor` ont `cooldown:H` (1 h) ; le commentaire (l. 681-684) dit « rien de publié » et applique seulement le plancher du wiki. Le rang (13, 14) sélectionne déjà les trois réductions de défi (`TITAN_RANK_V1`, `idle-adventure-combat.js:841`, `:880`) : seule la base manque.
- Correctif exact : `cooldown:7.5*H` pour `tippi` et `traitor` (comme `amalgamate`, qui est déjà `7.5*H` et vaut 27 000 s) ; remplacer la phrase « rien de publié » par « lu dans le jeu : AdventureController::boss13SpawnTime / boss14SpawnTime, build 1260, 2026-11-20 » ; adapter `cloudflare/tests/idle-adventure-titans-tippi-traitor.test.mjs` si elle fige 1 h ; relancer `build-moteur-local.mjs` puis `maj-pins.mjs` (règle n°7).

### E2. Tippi : accessible après le boss 295 dans le jeu, 296 dans SOREAL (impact faible, 1 boss)

- Jeu : `ZoneForwardClick::tryZoneForward` (711) : pour quitter la zone 43 vers la zone 44 (Tippi), `Character::effectiveBossID >= 897` = 295 + 602 (Sadistic), message « You need to defeat Boss 295 on Sadistic ». Pour quitter la zone 44 (vers le Traitor, zone 45) : 902 = 300 + 602 ET `Adventure.ratTitanDefeated` (« You need to defeat this Titan »). Les 44 autres seuils de zone coïncident exactement avec SOREAL (vérifié un à un, voir section 2) : Tippi est la seule exception.
- SOREAL : `idle-adventure-zones.js:686` `boss:296` ; le commentaire (l. 680-681) note que « la page du titan et le tableau de la page Titans se contredisent : 296 contre 295 » et suit la page du titan. Le code du jeu tranche : 295 (le tableau du wiki avait raison).
- Correctif exact : `boss:295` pour `tippi` (ne PAS toucher `idle-boss-cles-v1.js:304` ni `idle-daycare-skins-v1.js:47`, qui parlent du boss 296 du menu Fight Boss, autre sujet) ; mettre à jour le commentaire et les tests qui figent 296 (`idle-adventure-titans-tippi-traitor.test.mjs`, `idle-adventure-sadistic-zone-sets-audit.test.mjs`).

### E3. Greasy Nerd : chaîne « Maman du Nerd + cadenas à 5 lettres » absente (fonctionnalité, à trancher par Norman)

- Jeu : `AdventureController::spawnEnemy` (151) renvoie, dans la zone 23, `enemyList[23][0]` (GREASY NERD'S MOM : cadence 3, Puissance 6e13, Robustesse 6e13, Régénération 6e12, PV 6e15, type 14) tant que `Adventure.titan7Unlocked` est faux ; la version du Nerd n'apparaît qu'ensuite. `LootDrop::zone23Drop` (511) à la mort de la mère : `titan7questStarted = 1` et message du cadenas (« 5 letter combination lock »). `Character::Update` (2116) déroule `titan7QuestSequence` par touches à des endroits précis (menu 15, boss 81 pour la 4e étape, boss 120 pour la 5e) ; à la dernière étape : `titan7Unlocked = 1`.
- SOREAL : aucune occurrence de `titan7Unlocked` / `titan7quest` dans `cloudflare/src` ; le Nerd (`idle-adventure-zones.js:646`) est directement combattable dès le boss 125 en Evil. Les trois autres préludes (Squelette gardien, Consigliere, Prêtre de l'Exil) existent (`skeleton`, `consigliere`, `priest`).
- Correctif : implémenter comme le Consigliere (`remplacePar`, `hiddenWhenFlag:"titan7Unlocked"`, stats ci-dessus à ajouter à `IDLE_TITAN_COMBAT_V1`) ; l'énigme à touches (`Character::Update` 2116, lignes ~411-660 du désassemblage) est un secret du jeu : décision de Norman (anti-spoil, règle n°2) avant de la reproduire. NON VÉRIFIÉ : le texte et les touches exactes des étapes 0 à 3.

## 2. Points CONFORMES vérifiés ici pour la première fois (ne plus refaire)

| Point | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Statistiques de combat de tous les titans (cadence, Puissance, Robustesse, Régénération, PV) | `createEnemyTable` : GRB, GCT, Jake, UUG, 5 formes de Walderp, Beast, Nerd, Godmother, Exile, It Hungers, Rock Lobster, Amalgamate (V1 à V4), Tippi, Traitor, Squelette, Consigliere, Prêtre | `IDLE_TITAN_COMBAT_V1` (`idle-titans-combat-v1.js`) | CONFORME : comparaison automatique, 0 écart à 2e-6 près (relatif) sur les 5 valeurs |
| Seuils d'auto-kill Beast à Amalgamate, V1 à V4 (Puissance, Robustesse, Régénération) | `autokillTitan6V1Achieved` à `12V4` (183-186, 204-227) | `autoKillP/T/R` de `IDLE_ADVENTURE_TITANS` | CONFORME : 28 triplets, 0 écart |
| Or des titans | `LootDrop::goldDrop` (487) = base x `Random.Range(4,5)` x `totalGoldbonus` ; bases 250 000 / 400 000 / 300 000 / 500 000 / 1e6 / 5e6 / 1e10 / 1e11 / 1e12 / 2e15 / 2e16 / 1,5e17 (`zone6/8/11/14/16/19/23/26/30/34/38/42Drop`) | `TITAN_REWARDS_V1.gold` (x4 à x5 de ces bases) | CONFORME (12 titans) |
| EXP, AP, PP, QP des titans | `boss1Exp`..`boss12Exp` (101-112) : 35, 60, 200, 300, 500, 750, 1100, 1500, 2500, 4000, 6000, 8000 x `expFactor` ; `boss1AP`..`boss5AP` : 10, 15, 50, 60, 70 ; `boss6PP`..`boss12PP` : 250 000 / 250 000 / 300 000 / 400 000 / 500 000 / 700 000 / 1e6 x `totalPPBonus` ; `boss6QP`..`boss12QP` : 1, 1, 2, 3, 4, 5, 6 x `questRewardFactor` | `TITAN_REWARDS_V1`, `TITAN_QP_V1` | CONFORME (la numérotation du jeu boss7 = Nerd, boss8 = Godmother, boss9 = Exile est bien celle de SOREAL) |
| Facteur des paliers V2 à V4 (souhait 3) | `LootDrop::higherVFactor` (554) : 1,1 / 1,2 / 1,3 selon le niveau du souhait 3 et le type d'ennemi | `rewardMult = 1 + 0,1 x min(niveau, rang)` | CONFORME |
| Délais de base et réductions des titans 1 à 12 | `boss1SpawnTime`..`boss12SpawnTime` (87-98) : 1 h, 1 h, 2 h, 2 h, 3 h, 3,5 h, 4,5 h, 5 h, 5,5 h, 6,5 h, 7 h, 7,5 h ; réduction 900 s par No Rebirth (Normal dès le titan 3, +Evil dès le 7, +Sadistic dès le 10), plafond = base - 3 600 s | `cooldown` des titans et `idleAdventureTitanCooldownMsV1` | CONFORME (voir E1 pour les titans 13 et 14) |
| Seuils de boss pour entrer dans chaque zone (45 zones) | `ZoneForwardClick::tryZoneForward` (711) | `boss` de `IDLE_ADVENTURE_ZONES` et `IDLE_ADVENTURE_TITANS` | CONFORME sauf Tippi (E2) ; Evil = +301, Sadistic = +602 comme dans le jeu |
| Quirks : coût et niveau maximum des 186 quirks | `BeastQuestPerkController` (scène) : `cost[]`, `maxLevel[]` | `IDLE_QUIRKS_CATALOG_V1` | CONFORME : 186 / 186, aucun quirk de la scène absent de SOREAL |
| Quirks : effet par niveau | `effectPerLevel[]` (scène) | `bonus` du catalogue | CONFORME : 178 / 179 numériques (le seul écart apparent est le quirk 54, dont le jeu calcule 24 s x niveau en dur : conforme) |
| Perks : coûts, plafonds, difficulté | `perks-diff.json` (comparaison scène/SOREAL du 2026-11-16) | `idle-perks-v1.js` | CONFORME (0 écart de coût, de plafond, de difficulté) |

## 3. Écarts signalés par les audits précédents : état dans `cloudflare/src` au 2026-11-20 (contrôle ponctuel, tous CORRIGÉS)

MacGuffins : SEXY / SMART sur la vitesse des barbes (`idle-macguffins-v1.js:96-97`, `idle-ngu-pistes.js:220-250`), planchers et floor de Blood Spaghetti / Counterfeit Gold (`idle-ngu-systemes.js:289-294`), strict `>` des zones (`idle-macguffins-v1.js:579`), branche exposant à L + 1 > 100 (`:282`), coefficients arrondis (`:55-59`), base de kills 1000 (24 valeurs de scène), `maxCompletions` du No Equipment = 5 (scène). Brown Heart : `seedGainPct` base 35 (`idle-adventure-sets.js:908`). Gerbil, Clockwork Boots : alignés (`idle-adventure-sets.js:687`, `idle-adventure-set-specials-v1.js:53` : 1,8 / 18). Daycare : taux 386, 504, 505 et les sets récents (`idle-daycare-v1.js:358-456`), fragments de MacGuffin à 2 h par niveau (`:481`). Succès : barème des boss 190 et 230 (`idle-achievements-v1.js:70`). Perks : drop chance multiplicatif (`idle-perks-v1.js:448`).

## 4. Non vérifié (inchangé ou nouveau)

- Énigme à touches de la chaîne du Nerd (E3), et `Adventure.ratTitanDefeated` côté SOREAL (`requiresTitan:"tippi"` + `requiresKills:1` : équivalence supposée).
- Tables de butin (`zoneNDrop`, probabilités par objet et niveaux) des titans : seulement l'or, l'EXP, les AP, les PP et les QP ont été comparés ici ; les chances d'objets restent couvertes par l'audit du 2026-11-16 (mémoire projet).
- Autokill des titans 1 à 5 (pas de méthode `autokillTitanNV` : seuils portés par une autre fonction non lue).
- Tables de Cartes / Cuisine (valeurs de paliers) et QP / drops de Questing : relues par `cartes-cuisine*.md` et `quirks-questing.md` ; non reprises.

## 5. Liste courte des écarts réels

1. Tippi et Traitor : respawn de base 27 000 s (7,5 h) dans le jeu, 1 h dans SOREAL (`idle-adventure-zones.js:686-687`, mettre `7.5*H`).
2. Tippi : porte d'entrée du jeu = boss 295 (effectiveBossID 897 en Sadistic), SOREAL 296 (`idle-adventure-zones.js:686`).
3. Greasy Nerd : prélude de la Maman du Nerd et énigme de cadenas (`titan7Unlocked`) absents ; décision de Norman requise.
