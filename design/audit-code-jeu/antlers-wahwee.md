# Chaîne secrète « Exile » (Antlers of the Exile / Wahwee) : code du jeu, build 1260

Source : IL de Assembly-CSharp.dll (outils m/d/g du scratchpad) + table `items-jeu.json` (indice = id du jeu). Rien n'est tiré de la mémoire.

## 0. Correction de la prémisse
L'id **338 n'est pas l'arme** : c'est un objet « indice » (type 10, `Items/Clue1`) dont la description est « You must recover the missing weapon. Use the armour and find Wahwee. End him. » (« l'arme manquante » = le Buster, voir 339). L'**arme** « Antlers of the Exile » (accessoire, id **328**) est un butin du titan Exile, déjà dans SOREAL (`antlersExile`). La chaîne complète compte **sept objets** 335 à 341, et les indices s'enchaînent ; `itemDropped[337]` n'est PAS l'indice « Wahwee » mais le maillon d'avant (le 338, lui, est donné par la quête de la Bête et c'est lui qui renvoie à Wahwee).

## 1. Objets impliqués (ids du jeu ; type 4 = arme, 10 = divers/quête)
| id | nom | type | description | obtenu par |
|---|---|---|---|---|
| 335 | Seal of the Exile | 4 (arme, se porte) | « ...The first lies with the one who sealed him. Wait for his return, and use his own seal against him to reveal the first piece... » | Prêtre (PRIEST OF EXILE) sans le sceau en main |
| 336 | Face of the Exile | 10 | « I tower over you, almost a thousand leagues. Persistance will grant you what you seek. » | Prêtre avec le sceau (335) équipé en arme |
| 337 | Tentacle of the Exile | 10 | « The Subcontractor can see the end of their task. But they hopes will be denied, turned to ash as you steal their work and claim it all as your own... » | ITOPOD étages 950 à 999, exige `itemDropped[336]` |
| 338 | Antlers of the Exile (indice) | 10 | « You must recover the missing weapon. Use the armour and find Wahwee. End him. » | Quête de la Bête (section 5), exige `itemDropped[337]` |
| 339 | Buster of the Exile (indice) | 10 | « Bet all but one on Red. No the other red, you hack! Give it a minute to spin, and you'll have your fortune made. » | Doctor Wahwee (sections 3 et 4), exige `itemDropped[338]` |
| 340 | Antennae of the Exile (indice) | 10 | « Now you can assemble us. The first is the anchor. Noseplugs are optional... » | Hack Hack, Ressource 3 = plafond - 1 (section 6), exige `itemDropped[339]` |
| 341 | Sack of the Exile | 10 | « You know what must be done. » | Titans Exile (types 28 à 31) une fois « exileComplete » : 2 % |

Armes d'accessoire du titan Exile (hors chaîne) : 328 Antlers, 330 Tentacle, 332 Antennae, 334 Buster (+ 327 Joker, 329 Credit Card, 331 Skip Card, 333 Black Lotus).
`itemDropped[id]` est mis à vrai par `AllItemListController::markItemAsDropped` (3404), appelé au début de `makeLevelledLoot` (3813) / `makeTitanLevelledLoot` (3814) AVANT l'ajout au sac : vrai même si le sac est plein, et il reste vrai après usage ou suppression.

## 2. Obtention de 337 : `LootDrop::checkExileDrop` (méthode 547)
Appelée en fin de `LootDrop::itopodDrop` (534), donc à CHAQUE kill ITOPOD :
1. `itemDropped[336]` doit être vrai, sinon retour ;
2. `itopodLevel` entre 950 et 999 inclus ;
3. tirage `Random` (état `lootState`) ; réussite si tirage <= `(itopodLevel - 949) * 0.0001` (0,01 % à l'étage 950, 0,5 % à l'étage 999), SANS facteur de loot ;
4. réussite : `makeLevelledLoot(337, 100)`, journal « The Pissed Off Dude Shimmers and disappers, leaving... *something* in it's place. » puis « You found <nom>! ». Si raté avec tirage < 0,1 : « Something seemed different about that Pissed Off Dude... » (sans effet).
Aucun dédoublonnage : plusieurs 337 possibles.

## 3. « Use the armour » : le set Mega (Tier 11, ids 130 à 134)
`LootDrop::zone13Drop` (501) est appelée par `dropLoot` quand `Adventure.zone == 13` = Mega Lands (l'indice de zone du jeu commence à -1 = Safe Zone, 0 = Tutorial, 1 = Sewers). Ids : 130 Mega Helmet, 131 Mega Chest, 132 Mega Blue Jeans, 133 Mega Boots, 134 Beam Laser Sword (arme). SOREAL les a déjà : `mega:head/chest/legs/boots/weapon` = 130 à 134 (`IDLE_ADVENTURE_WIKI_ITEM_IDS_V1`, idle-adventure-sets.js l.1186).
Effet : aucun effet de stats propre ; l'armure est une CONDITION (pièces portées) du drop de l'indice 339.

## 4. Où et comment on « trouve Wahwee » et on l'« achève »
Ennemi : « DOCTOR WAHWEE (BOSS) », Mega Lands (zone 13), `enemyType = 1` (boss), attaque 1,2, power 64 300, toughness 63 300, regen 7 660, PV 4 200 000 (`createEnemyTable`, présent deux fois dans la liste). SOREAL l'a déjà : `mega.boss` « Doctor Wahwee » (idle-adventure-zones.js l.435).
Branche boss de `zone13Drop` (seulement `enemyType == 1`) :
- or (base 290 000), EXP 0,5 % x lootFactor (plafond 10 %) ;
- **tirage d'une pièce Mega** : réussite si `Random < 0,08 x lootFactor` (SOREAL : `equipment:[{chance:.08,set:"mega",level:0}]`, butin boss de `mega`, idle-adventure-butin.js l.326) ; le type de pièce est `Random.Range(0,5)` -> 130..134 (« also dropped <pièce> ») ;
- **ENSUITE, uniquement si ce tirage de 8 % a réussi** (le code saute tout le reste si le tirage échoue : `bge.un IL_519`), vérifie : `itemDropped[338]` vrai ET équipés `head.id==130`, `chest.id==131`, `legs.id==132`, `boots.id==133`, `weapon.id==134` (ids de base, quel que soit le niveau) ;
- alors `makeLevelledLoot(339, 100)`, sans autre aléa. Journal : « As Wahwee's Machine explodes into wobbly energy balls, something metal launches at you! » puis « It comes to a stop at your feet, and you pick it up. You have found the Buster of the Exile! ».
Probabilité réelle de 339 par kill de Wahwee = `min(1, 0,08 x lootFactor)` avec le set complet porté. Pas de limite : chaque kill qualifiant en redonne un. « End him » = tuer le boss de zone Wahwee (pas un titan).

## 5. `giveRewardsAndClear` (méthodes 1241/1242) : l'objet 338
`BeastQuestController::giveRewardsAndClear(bool silencieux)` (1241 l'appelle avec faux) : sort si `!inQuest` ou `questID <= 0` ; verse QP/AP (mineure si `reducedRewards`, sinon majeure ; facteur `allActiveModifier` si `allActive`) ; puis, en fin, :
```
si (!idleMode && allActive && idleProgress >= 0.9 && idleProgress <= 1 && itemDropped[337])
    makeLevelledLoot(338, 100)   // + infobulle « The Beast stares at you with its wide, soul-piercing eyes.... 'It's time for my brother to be released, much like myself. I can see the truth inside you... Take this.' You have received the Antlers of the Exile! » (si !silencieux)
clearQuest()
```
Sémantique (`updateIdleQuest` 1257, `toggleIdleMode` 1243, `clearQuest` 1238, `startQuest` 1239, `advanceQuest` 1253, `completeQuest` 1240) :
- `idleMode` : la case idle. `toggleIdleMode` inverse seulement ce booléen ; `clearQuest` le met à faux, `allActive` à vrai, `idleProgress` à 0 ;
- `idleProgress` : jauge (0 à 1) du PROCHAIN objet de quête obtenu en idle ; à chaque tick (50 par s) `+= idleProgressPerTick = 1 / (expectedTimePerDrop x idleDropFactor) / 50`, UNIQUEMENT si `idleMode`, `beastOn`, `inQuest`, `questID > 0` ; à >= 1 : remise à 0, **`allActive = faux`**, `advanceQuest` (+1 objet) ;
- `allActive` : « aucun objet de cette quête n'est venu de l'idle » (vrai au départ ; devient faux dès qu'une jauge idle se remplit, y compris hors ligne : `questingOfflineProgress` 2238) ; sert aussi au facteur de récompense `allActiveModifier` (2 x souhaits 19 x 62) ;
- couper l'idle ne remet PAS `idleProgress` à 0 : il reste figé.
Conditions concrètes : démarrer une quête, activer l'idle, laisser la jauge entre 90 % et moins de 100 % (à 100 % elle se vide et `allActive` tombe), COUPER l'idle, finir la quête à la main (autres objets par drops actifs), la rendre (`completeQuest` / `startOrCompleteQuest`), avec `itemDropped[337]` déjà vrai. Le rendu automatique de l'idle (autocycle : `giveRewardsAndClear(true)` avec `idleMode` vrai) ne donne JAMAIS 338. Borne haute 1 inclusive dans le code, mais `updateIdleQuest` réinitialise à 0 à >= 1 ; hors ligne, le calcul peut clamper à 1. Pas de garde « déjà possédé » : 338 peut être redonné.

## 6. Maillon 340 et assemblage
- `HacksController::checkExilePiece` (3180), `InvokeRepeating` toutes les 60 s depuis `HacksController::Start` (3178) : si `res3On` ET `hacks[13].res3 == totalCapRes3() - 1` ET `itemDropped[339]` -> `makeLevelledLoot(340, 100)` ; infobulle « The Greasy Nerd's eyes turn a glossy white, and he silently reaches into his fanny pack. He turns, and hands you the Antennae of the Exile! Gross, though... ». Hack 13 = « Hack Hack » (ordre du wiki ; SOREAL `hackHack` en 14e position de la liste, idle-ngu-catalogues.js l.652 ; indice supposé identique, à vérifier). R3 allouée à ce hack = plafond total de R3 moins 1 (« Bet all but one... »).
- Assemblage (`ItemController::consumeItem` 3794, « utiliser » une pièce id 336 à 341 amovible) : `InventoryController::exileAssembled` (3770) exige `Adventure.zone == 1` (**Égouts**), un sac d'au moins 24 emplacements, et dans le sac `inventory[0]=340`, `[1]=336`, `[2]=338`, `[12]=339`, `[14]=337` (rangées de 12 : haut 340 336 338 ; bas 339 _ 337) ; `exileSpecialAssembled` (3771) ajoute `[13]=341`. Si assemblé : première fois `titan9Unlocked = vrai` (« You can now face THE EXILE in Adventure mode! ») ; ensuite, version spéciale (341) : `titan9SpecialReward = vrai` qui ouvre le drop 342 (Blue Eyes Ultimate Chestplate, 0,0001 % x loot, plafond 25 %) sur les titans Exile.
- Prêtre (enemyType 27) : tant que `titan9Unlocked` est faux, la zone de titan 30 fait apparaître « PRIEST OF EXILE » (atk 2, power/toughness 6e21, regen 6e20, PV 6e23) à la place d'Exile (`spawnEnemy` 151). `LootDrop::zone30Drop` : arme équipée id 335 -> `makeTitanLevelledLoot(336,100)` (« You slap the Priest's bald head with the Dark Seal... ») ; sinon -> `makeTitanLevelledLoot(335,100)` (« The Priest disappears in a beam of black light, leaving a dark seal... »). Accès au titan 9 : minuteur affiché si `effectiveBossID >= 491` (= boss 190 en Evil, `bossID + 301` par palier ; SOREAL : `t7 boss:190, evilOnly`, cohérent) ou `boss9Kills >= 1`.
- `titan9questStarted` : lu par l'interface (« Assemble the Exile ») mais aucune écriture hors chargement de sauvegarde trouvée : inconnu.

## 7. Traduction dans le modèle SOREAL
Constat : SOREAL a les accessoires 328/330/332/334 et le titan `t7`, mais AUCUN des 335 à 341, ni le Prêtre, ni l'assemblage ; `idle-adventure-combat.js` l.600 note « Sack/Face of the Exile » comme volontairement non tirés.
- Quête (`idle-questing-v1.js`) : `q.idleBar` (clampé < 1) = `idleProgress` ; `q.usedIdle` = NON `allActive` (vrai dès qu'une jauge idle donne >= 1 objet, l.507 et l.513) ; `d.idle` = `idleMode` ; `advanceIdleQuestingV1` n'avance que si `d.idle`, donc `idleBar` reste figé idle coupé (équivalent exact). Point d'insertion : `completeQuestV1(state,d,env,auto)` (l.386), avant `d.quest = null` (= `clearQuest`) : `if (!d.idle && !q.usedIdle && q.idleBar >= 0.9 && q.idleBar <= 1 && vu(337)) donner(338, niveau 100)`. L'appel auto (`auto=true`) a toujours `d.idle` vrai.
- Zones/ennemis (`idle-adventure-zones.js`) : `mega.boss[Doctor Wahwee]` existe ; « zone 13 du jeu » = `mega`. Boss via `ctx.forceBoss` / `wasBoss` (`resolveZoneFight`) dans `rollKill` (idle-adventure-butin.js l.807). Le tirage 8 % + l'indice vont dans `rollEquipmentAdventureV2` / `rollProfileLootAdventureV2` (pool `mega.boss.equipment`, l.320-326) : si le tirage du pool `mega` boss réussit ET `vu(338)` ET équipement complet, ajouter `add(s, special("<indice339>", 100))`.
- Équipement : `s.equipment = {head, chest, legs, boots, weapon, weapon2, accessories[]}` contient des ids d'objets du sac, chaque objet a un `definitionId` (`"mega:head"`...). Test : `s.inventory.find(x=>x.id===s.equipment.head)?.definitionId === "mega:head"`, idem chest/legs/boots/weapon.
- `itemDropped` : `s.itemList[definitionId].seen` (posé par `record` dans `add`, idle-adventure-inventaire.js l.147). Différence : `add` renvoie null et ne note PAS `seen` quand le sac est plein, alors que le jeu marque l'objet avant l'ajout : poser `seen` explicitement.
- Table d'objets : `idle-adventure-sets.js`, bloc SPECIALS (`slot:"special"`, p:0, t:0, modèle `severedUnicornHead` l.602), ids `IDLE_ADVENTURE_WIKI_ITEM_IDS_V1` (modèle l.1364) : ajouter 7 entrées (`sealExile`:335, `faceExile`:336, `exileClueTentacle`:337, `exileClueAntlers`:338, `exileClueBuster`:339, `exileClueAntennae`:340, `sackExile`:341 ; noms distincts de `antlersExile` etc. = 328 à 334), puis `SPECIALS_EN_V1`, `idle-noms-fr-v1.js`, `IDLE_ADVENTURE_COFFRE_TITAN_OBJETS_V1.t7` (idle-adventure-inventaire.js l.526) et images média.

## 8. Plan d'implémentation
1. `idle-adventure-sets.js` : 7 SPECIALS + ids + noms EN ; FR ; coffre `t7`.
2. Prêtre / Seal / Face : titan `t7` (`idle-adventure-zones.js`, `rollTitanLootV1` l.739 d'`idle-adventure-combat.js`) : avant le déblocage, combat du Prêtre (valeurs ci-dessus), règle « sceau équipé -> Face, sinon Seal ». Nouveau drapeau `unlockFlags.exileAssembled` qui remplace/complète `titanGate`.
3. ITOPOD : `checkExileDropV1(s, étage, rng)` appelée à chaque kill ITOPOD (module itopod à localiser) ; formule `(étage-949)*0.0001`, 950 à 999, exige `vu(336)`.
4. Quête : modification de `completeQuestV1` (section 7) + champ de retour pour l'affichage ; ne pas toucher `usedIdle`.
5. Wahwee : crochet dans `rollProfileLootAdventureV2` (zone `mega`, boss) -> 339 niveau 100.
6. Hack : contrôle toutes les 60 s de jeu (ou à chaque synchro) : R3 alloué à `hackHack` == capacité R3 totale - 1 (`resourceCapacityForCurrent` / `totalAllocated`, idle-ngu-ressources.js l.313) et `vu(339)` -> 340. Vérifier d'abord comment SOREAL stocke l'allocation par hack et si cap-1 est exact (entiers).
7. Assemblage : usage d'une pièce (voir `useUnlockItem`, idle-adventure-combat.js l.878) : zone sélectionnée `sewers`, sac >= 24 emplacements, objets aux emplacements 0/1/2/12/14 (+13 pour la version spéciale) ; pose `exileAssembled` puis `exileSpecial` ; drop 342 sur les titans Exile si `exileSpecial`. Si une opération est ajoutée : `idle-protocol.json`, `IDLE_OPERATIONS`, `LOCALES` + `OPERATIONS_DE_JEU_V1`, version de protocole (règle AGENTS.md).
8. Registre : toutes les valeurs viennent du code du jeu (citer méthode/ID en commentaire) ; aucune constante SOREAL requise. Régénérer `moteur-local` (`build-moteur-local.mjs`), `maj-pins.mjs`, note du jour.
9. Tests (`cloudflare/tests/idle-exile-chaine-v1.test.mjs`) : (a) ITOPOD : 949 -> 0, 950 -> 0,0001, 999 -> 0,005, sans 336 -> 0 ; (b) quête : jauge 0,89 / 0,9 / 0,999 avec idle coupé, `usedIdle` faux/vrai, sans 337 ; (c) Wahwee : 8 % x loot, set partiel -> pas de 339, set complet -> 339, hors boss rien ; (d) assemblage : zone, emplacements, version spéciale ; (e) tests existants à ajuster (comptes d'objets, `idle-coffre-specials-v1`, contrat de protocole).

## 9. Inconnu / à vérifier
- Probabilité/condition d'accès exacte au combat du Prêtre (seuil 491 lu pour le minuteur du titan 9 ; le départ du combat n'a pas été isolé).
- `titan9questStarted` : aucune écriture trouvée (peut-être inutilisé).
- Ordre exact des hacks du jeu (13 = Hack Hack déduit du wiki) ; sémantique de `Hack.res3` vs l'état SOREAL.
- Hors ligne : `questingOfflineProgress` peut laisser `idleProgress` à 1 exactement ; effet sur 338 non testé.
- Images/icônes `Items/Clue1` des indices à fournir.
