# Contrôle externe : zones, ennemis, butin des zones, titans, types de monstres

Date : 2026-09-25. Contrôle en lecture seule (aucun fichier de code modifié). Écarts détaillés en JSON : `zones-enemies-titans.json` (même dossier).

Référence n°1 : wiki local `NGU-Wiki/pages`. Sources tierces confrontées : `ngu-idle-calculators-ts/{zones,enemy}.ts` (GPL, commit 42aafcb, 2025-03-14), `sheet-boost-exp-zones.csv` (NGU 1.220), `sheet-daily-gains.csv` (NGU 1.260), plus la couche `external/` (README lu en premier : late-zone-enemies, attack-rate-gaps, proposed-corrections, tippi-comments).

Méthode : import direct de `IDLE_ADVENTURE_MOB_BESTIARY_V1`, `IDLE_ADVENTURE_ZONES`, `IDLE_ADVENTURE_TITANS`, `IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2` depuis `cloudflare/src/idle-adventure-v47.js` ; extraction par lecture du source de `ZONE_GOLD_RANGES_V1` et `ZONE_BOSS_EXP_CHANCE_V1` (non exportées) ; évaluation de `enemy.ts`/`zones.ts` dans un bac à sable ; lecture des gabarits `{{Enemy}}`, `{{Infobox Titan}}` et des sections Loot du wiki. Tolérance : 0,5 % sur les nombres. Scripts hors dépôt : `C:\Users\n0rma\AppData\Local\Temp\claude\zt\`.

Conclusion générale : le jeu est très fidèle. Les 283 ennemis d'aventure du jeu sont retrouvés un par un dans la source (mêmes zones, mêmes boss, mêmes types, mêmes stats sauf le type d'un boss), les 32 zones ont les mêmes boss chances, déblocages, boosts, or et EXP de boss que le wiki, et les 12 titans présents ont les mêmes seuils Manual/Idle, EXP, AP, PP, or, QP et respawn que le wiki (sauf le désaccord de source sur Amalgamate). Les vrais trous sont ailleurs : deux titans absents, aucun comportement de titan, aucun comportement de type de monstre, et quelques lignes de butin d'Aethereal Sea et de trois boss.

---

## (A) MANQUANTS

### A1. Titan 13 TIPPI THE TUTORIAL MOUSE : absent du jeu (ni titan, ni zone)

| Donnée | Wiki | Calculateur (`enemy.ts`) | Tableur 1.260 | Verdict |
|---|---|---|---|---|
| Attack rate | vide | 2 | absent | source seule |
| Power / Toughness | 2e34 / 4e34 | 2e34 / 4e34 | absent | identiques |
| PV / Regen | 2e36 / 1e32 | 2e36 / 1e32 | absent | identiques |
| Bestiary id | 377 | 377 | absent | identiques |
| Stats recommandées | Power 4e34, Toughness 1,5e34 | (AutoKill impossible : `canAutoKill` faux pour id > 12) | absent | wiki |
| Déblocage | boss 295 Sadistic (page Titans) ou 296 (page du titan, Boss Fights) | zone 44 sans ennemi | absent | wiki, contradictoire |
| Respawn | vide | 0 (placeholder) | aucune ligne | **introuvable** |
| EXP / AP / PPP / QP / or | vide | 0 / 0 / 0 / 0 / [0,0] | aucune ligne | **introuvable** |
| Butin | aucune section | aucun | aucune ligne | **introuvable** |

Le tableur 1.260 s'arrête à l'ID interne 33 (Amalgamate v4) : il n'a pas de ligne Tippi, alors que le titan date de 1.260 (commentaire joueur). Les commentaires (`tippi-comments.json`) disent seulement qu'il ne donne pas d'EXP et sert à débloquer le Traitor : indice, pas donnée. Texte de victoire connu (wiki).

### A2. Titan 14 THE TRAITOR : absent du jeu

Stats de combat : wiki et calculateur identiques (attack rate 1,8, Power 5e34, Toughness 1e35, PV 2e37, regen 1e33) ; bestiary 378 selon le calculateur (la fiche wiki n'a pas le champ). Seuils recommandés (wiki) : Power 1,5e35, Toughness 4e34, PV 1,5e35, regen 1,5e33. Déblocage : boss 300 Sadistic (Boss Fights écrit 301) et avoir tué Tippi au moins une fois. Butin : drop fixe THE END #495 (wiki) ; sa mort fixe aussi le nombre de Rebirths à 10 000 (dernier succès). Capacités (wiki, sans chiffres) : power attacks, PV ramenés à un niveau critique, croissance de puissance accélérée définitivement, bouclier d'énergie qui annule les dégâts. Respawn, EXP, AP, PPP, or : **aucune source** (calculateur : tout à 0 ; tableur : pas de ligne).

### A3. The Aethereal Sea : EXP de boss absent du jeu

Wiki : « Exp 1,200 » sans taux. Calculateur : 1200 EXP, chance de base 0,0000012 % (1,2e-8), plafond 15 %. Tableur 1.220 (ligne « Aethereal Sea Part 1 ») : EXP 1200, EXP DC 0,0000012 %, max 15 % : **la valeur existe dans deux sources tierces** (`zones.ts` PIRATE et le tableur 1.220). Le jeu a 31 zones sur 32 dans `ZONE_BOSS_EXP_CHANCE_V1` (aethereansea absente, par prudence documentée).

### A4. The Aethereal Sea : Ascended x6 Pendant et GALACTIC HERALD LOOTY (boss) absents

Wiki : lvl 16, chance « ? » pour les deux. Calculateur (`otherDrops` 295 et 296) : Ascended x6 Pendant 4e-6 % (4e-8), GALACTIC HERALD LOOTY 1,8e-6 % (1,8e-8), plafond 12 % pour les deux, niveau 16. **Valeur donnée par le calculateur** (pas par le tableur, qui ne couvre pas les objets). Le jeu donne ces deux objets à Construction, Duck Duck et Nether, pas à Aethereal.

### A5. Ascended x3 Pendant (id 142) absent des boss de Chocolate World, The Evilverse, Pretty Pink Princess Land

Wiki : Chocolate lvl 0 (0,1 % + 0,0000001 %, plafond 1 %) ; Evilverse lvl 1 (0,15 % + 0,00000001 %, plafond 1,5 %) ; PPPL lvl 2 (0,15 % + 0,000000002 %, plafond 2 %). Calculateur : ne garde que la composante minuscule (1e-7 %, 1e-8 %, 2e-9 %) sans le 0,1 %/0,15 % du wiki : le wiki est plus complet. L'objet est déjà lâché par Meta Land jusqu'à JRPGVille.

### A6. THE END (16 pièces)

Aucune pièce n'existe dans le jeu (commentaire du code). Le wiki en liste les sources : Amalgamate (#483 V1+, #489 V2+, #493 V3+, #484 V4, taux non publiés), Traitor (#495, fixe), boss 300 Sadistic (#487), etc. Aucune source tierce ne donne de taux.

### A7. Zones 44/45

Le wiki et le calculateur ont des zones Tippi et Traitor après Aethereal Sea ; le jeu s'arrête à Aethereal Sea (boss 269).

### Trous connus : récapitulatif « qui donne la valeur ? »

| Trou | Wiki | Calculateur | Tableur 1.220 | Tableur 1.260 | Autre | Résultat |
|---|---|---|---|---|---|---|
| Tippi : respawn, EXP, AP, PPP, or, butin | non | 0 (placeholder) | non | pas de ligne | commentaires : « pas d'EXP » | introuvable |
| Traitor : respawn, EXP, AP, PPP, or | non | 0 | non | pas de ligne | | introuvable |
| Traitor : butin | THE END #495 fixe | 0 | non | non | | wiki |
| Capacités spéciales des titans, chiffrées | oui pour 10 titans (voir C2) | non | non | non | | wiki, sauf IT HUNGERS, ROCK LOBSTER, AMALGAMATE, Tippi (aucune capacité publiée) |
| Mécaniques des types de monstres | quasi rien | drapeau paralyze seulement ; attack rate d'un exploder = délai d'explosion | colonne « Paralyzer? » = part des ennemis paralyzers | non | | voir « Types de monstres » |
| EXP boss Aethereal Sea (taux) | non | oui | oui | non | | calculateur + tableur 1.220 |
| Pendants Aethereal Sea | chance « ? » | oui | non | non | | calculateur |
| attack_rate « ? » de Rad-Lands (7) et Nether (7) | non | oui | non | non | | calculateur (déjà repris par le jeu) |
| Stats d'ennemis Nether (7 sans stats, 1 sans fiche) et Aethereal (21 sans fiche) | non | oui | partiel (dureté du plus fort seulement) | non | | calculateur (déjà repris par le jeu) |
| Bonus « Titan EXP perk bug » | non | non | non | mention seule (facteur 1,024 dans la case « Accounts for Titan EXP Perk bug ») | | valeur du bug non exploitable |

---

## (B) ÉCARTS (wiki / source / jeu)

Légende : « jeu suit » indique quelle référence le jeu a reprise.

### Ennemis (283 comparés ; le jeu suit presque toujours la source, y compris quand le wiki est fautif ou vide)

| # | Sujet | Wiki | Source | Jeu | Jeu suit |
|---|---|---|---|---|---|
| B1 | **Back To School**, 8 ennemis (A Different Greasy Nerd ... BELDING) | Power/Toughness 6e26 ..., PV 6,1e28 ... (x2) | 3e26 ..., 3,1e28 ... | bestiaire = source ; mais `oneHitP` de la zone = 5,239e28 (calculé sur les valeurs doublées du wiki), 1,93 fois la valeur cohérente avec ses propres mobs (2,72e28) | source (bestiaire) / wiki (oneHitP) : incohérence interne |
| B2 | 15 `attack_rate` (Flying Spinelli 1 contre 1,1 ; Strict Nun, Nun's Ruler 1 contre 1,2 ; Entire Bar 1 contre 1,1 ; Tumbleweed, Single Cow 1,1 contre 1,2 ; Bearded Breaded Braid 1,1 contre 1 ; Elevator Full of Blood 1 contre 1,1 ; Candy Corn, Texas Chainsaw Mascara, Jigsaw 1 contre 1,2 ; 3 Guys 1 contre 1,1 ; MotherDucker 1 contre 1,1 ; Totally a Duck 1 contre 1,2 ; **A Piano-Safe 1 contre 14**) | valeur par défaut 1 probable | valeurs réelles | source | source |
| B3 | A Bulldozer : PV | 2,7e33 | 2,07e33 | 2,07e33 | source (les voisins sont à 2,04 - 2,08e33) |
| B4 | 3 Guys Carrying a Beam : type et stats | poison, 4e31 | normal, 4,04e31 | source | source |
| B5 | THE ELUSIVE C.S (boss Boring-Ass Earth) : type | poison/paralyze | poison | poison/paralyze | wiki (seule divergence de type jeu/source sur 283) |
| B6 | Rad-Lands : 7 attack rate « ? » | ? | 1 ; 1,1 ; 1,2 | valeurs de la source | source |

Autres constats : aucun ennemi du jeu sans équivalent dans la source ; 24 ennemis de la source sans fiche wiki exacte dont 2 faux positifs de nom (Choco-Freeman, Choco Giant = Choco Golem) ; 29 ennemis sans stats au wiki (Aethereal 21, Nether 7, Daan 1), tous présents dans le jeu avec les valeurs de la source.

### Titans (12 présents contre 14)

| # | Sujet | Wiki | Source | Jeu | Jeu suit |
|---|---|---|---|---|---|
| B7 | **AMALGAMATE respawn** | 7:13:20 (433,33 min) | 7,45 h (447 min) ; tableur 1.260 : 7,5 h | 433,33 min | wiki (deux sources tierces s'accordent, à 14 - 17 min de plus) |
| B8 | Godmother PP | fiche et page Titans 300 000 ; ligne Loot 250 000 | 300 000 | 300 000 | wiki (fiche), source et tableur (60 000 x 5 h) confirment |
| B9 | Walderp attack rate | 3 (5 formes) | 3,2 / 3,15 / 3,1 / 3,05 / 3 | non modélisé | |
| B10 | Godmother v2 AutoKill regen | 1e18 | 1e17 | non modélisé | source probablement fautive (progression x20, x20, x25) |
| B11 | ROCK LOBSTER v2 Power/Toughness | 6e31 / 2e31 | 2e31 / 6e31 | non modélisé | wiki probablement fautif (Toughness = 3 x Power partout ailleurs) |
| B12 | Déblocage Tippi / Traitor | 295 ou 296 ; 300 ou 301 | sans objet | aucun titan | contradiction interne du wiki |
| B13 | Walderp forme 5 : ligne Idle | 2E7 / 6E6 (« nearly impossible to idle ») | sans objet | commentaire : « aucune valeur Idle publiée » | sans conséquence tant que les titans sont des seuils Manual |
| B14 | Chaîne de déblocage GRB, GCT, Jake, UUG (24 / 24 / 28 kills du précédent + objet consommé) | seul le numéro de boss compte | sans objet | invention SOREAL assumée (`requiresTitan` / `requiresKills`) | écart voulu |

Identiques wiki / jeu : seuils Manual et Idle des 12 titans et de leurs difficultés (Beast, Nerd, Godmother, Exile, IT HUNGERS, ROCK LOBSTER, AMALGAMATE), 5 formes de Walderp, respawn de chacun (GRB 1 h, GCT 1 h, Jake 2 h, UUG 2 h, Walderp 3 h, Beast 3,5 h, Nerd 4,5 h, Godmother 5 h, Exile 5,5 h, IT HUNGERS 6,5 h, ROCK LOBSTER 7 h), EXP, AP, PP, or, QP (par souhait), boss de déblocage et difficulté minimale, plancher de 60 min et -15 min par défi No Rebirth. Les stats de combat des titans (attack rate, Power, Toughness, PV, regen, AutoKill) sont identiques entre le wiki et la source pour 12 titans sur 12 aux quatre écarts près B9 à B11 ; le jeu ne les utilise pas (voir C2). Le butin des titans (chances de base, plafond de 25 %, racine cubique) est conforme aux sections Loot du wiki.

### Butin de zone

| # | Sujet | Wiki | Source | Jeu | Jeu suit |
|---|---|---|---|---|---|
| B15 | `oneHitP` : définition hétérogène | hp/0,8 + T/2 (jusqu'à 2D), hp/1,2 + T/2 (bonus 1,5 du set Spoopy, jusqu'à Rad-Lands), ~0,55 (zones Sadistic) | formule de `enemy.ts` : hp/(0,8 x modificateur) + T/2 | valeurs du wiki recopiées ; rapport jeu / formule sur les mobs du jeu : 1,00 puis 0,67 puis 1,29 (Back To School) / 1,07 (West World) / 0,51 (Seventies, Halloweenies) / 0,55 (Aethereal) | wiki ; sans effet sur les PV réels (le bestiaire prime, `oneHitP` n'est qu'un repli) |
| B16 | Or de zone | Sewers 800-1000 (normal), 1600-2000 (boss) ; Fad-lands normal 1,8e11-3e11 | Sewers x2 plus haut (gold [400,600]) ; Fad 2,4e11-3e11 | wiki | wiki (Fad-lands : le minimum du wiki casse le rapport x4/x5, probable coquille du wiki) |
| B17 | Coquilles ou oublis de la source | valeurs justes | Sky Wandoos 98 à 3 % (wiki 0,3 %) ; Ancient Dragon Wings 1,5 % (wiki 0,15 %) ; PPPL set de boss 0,1 % (wiki 0,01 %) ; Nether set de boss `1.8e6` au lieu de `1.8e-6` ; plafond de boost Typo 9 % et Fad 10 % (wiki 8 %) ; sans A Stick (Tutorial), sans Stealthiest Armour, sans Energy/Magic Bar Bar, sans 9mm Beretta ; liste Evilverse : Evil Goblin en double (Evil Gorgon oublié) | identique au wiki | wiki |

Vérifiés identiques wiki / source / jeu sur les 32 zones : boss chance (dont 2/9 de Clock Dimension et Boring-Ass Earth, 1/5 de Mega Lands, 4/21 d'Aethereal Sea), numéro de boss et difficulté de déblocage, forces et chances de boosts, EXP de boss (31 zones), plages d'or, niveaux d'objets, chance des sets de boss et de zone. ITOPOD : paliers de boost (1 à 10 000 par tranche de 50 étages), EXP par palier, un kill sur 40 - n, 14 % de boost, PPP (200/700/2000 + étage) identiques au wiki et au calculateur.

---

## (C) ÉLÉMENTS NON BRANCHÉS DANS LE JEU

### C1. Types de monstres : aucun effet en combat

`startZoneFight` place `mobType` (et `mobAttackFactor`) dans `s.fight` ; `soreal-idle-ui.js` ne lit ni l'un ni l'autre (seuls mobPower, mobToughness, mobHpRegen, mobAttackRate, mobName servent). Le type n'apparaît que dans la fiche Collection (`typeMob`). Conséquence : les 172 ennemis non « normal » sur 283 (le bestiaire compte 63 boss au total) se comportent comme des ennemis normaux.

Effectifs (jeu, identiques à la source) : normal 111, rapid 46, charger 42, poison 31, grower 22, paralyze 20, exploder 10, poison/paralyze 1.

Ce que les sources publient réellement :

| Type | Wiki | Calculateur | Tableur 1.220 |
|---|---|---|---|
| exploder | Fairy (Forêt) = plus faible exploder, environ 2500 dégâts ; succès « Survive an attack from an exploder » ; l'Idle doit « tuer n'importe quel exploder » ; Build History 2018 : temps d'explosion du Kitten 6 s puis 10 s | l'`attack_rate` d'un exploder vaut 5 à 14 (Fairy 5, Icarus 9, six à 12, Piano-Safe 14) : c'est le délai d'explosion, pas une cadence ; `oneHitPower` = hp/(0,8 x mod) + toughness/2 | - |
| paralyze | aucune durée pour l'ennemi normal ; compétence Paralyze du joueur 3 s ; GRB 4 s ou 2 attaques ; Exile 2 s | simple drapeau, `Zone.paralyzeEnemies()` = part du roster, pondérée par la boss chance | colonne « Paralyzer? » = cette part ; **reproduite avec les types du jeu pour 31 zones sur 32** (Boring-Ass Earth : 0,222 au tableur, 0,333 avec le type poison/paralyze du boss) |
| charger, poison | « la Toughness compte pour l'idle à cause des chargers et du poison » (Advanced Guide), aucun chiffre | aucun | - |
| rapid | mécanique citée en référence (Godmother) ; Jake : 10 coups à x0,5 toutes les 0,15 s (capacité de titan) | aucun | - |
| grower | rien | rien | - |

Autrement dit : aucune source locale ne donne de multiplicateur ni de durée pour poison, charger, rapid, grower, ni les dégâts d'une explosion au-delà de l'ordre de grandeur de Fairy.

### C2. Titans : aucun combat, seulement un seuil Manual

`titan()` compare `stats.power` / `stats.toughness` au seuil `p` / `t` et ouvre le butin. Attack rate, PV, regen, AutoKill (wiki et calculateur) ne sont lus nulle part. Capacités publiées par le wiki, toutes absentes :

- GRB : Paralyze (1/7, 4 s ou 2 attaques, bloque moves et Idle) ; Bleed (2/7, retire de la regen, cumulable) ; Power Attack x2 (2/7). Tous les titans : +1 % de force par attaque (page Titans).
- Grand Corrupted Tree : spores (dégâts sortants x2/3 pendant 15 s ; dégâts entrants x1,5 à 4 pendant 15 s) ; Power Attack x1,5.
- Jake : Locusts (1/5, 10 attaques rapides x0,5 toutes les 0,15 s) ; Power Attack x1,5 (2/5) ; Shirt-flapping toutes les 20 attaques (désactive Ultimate Attack, Heal, Piercing, Ultimate Buff, Strong, Offensive Buff dans cet ordre).
- UUG : Invincibility après la première attaque (énigme du Ring of Apathy) ; Power Growth x2 par tour ; Power Attack x1,5.
- Walderp : « Walderp Says » (mauvaise attaque = explosion d'environ 150 x sa puissance, toutes les 18 s).
- The Beast : dès la 3e attaque puis toutes les 10 : Hyper Red Anime Aura (regen x5), Power Smash (x2), Layer of Metal Armor (dégâts / 3) ; V2+ Time Dilation ; V3+ Rubbery Slime (2 % réfléchis) ; V4 Rancid Fart (regen inversée).
- Greasy Nerd : Hack (dès la 7e, +8 % de dégâts de base cumulable) ; Power Glove (dès la 3e, toutes les 8 : 1x puis 5x).
- The Godmother : Explosions (dès la 3e, toutes les 9 : 4 coups à x25) ; Knee cap (dès la 8e : cooldowns / 3 pendant 2 attaques).
- The Exile : dès la 3e attaque puis toutes les 10 / 9 / 8 / 7 (V1 à V4), au hasard : Buster Arm blast (charge puis x6), Gores with antlers (V2+, regen inversée), Mind control (V3+, paralysie 2 s), Life drain (V4, x2 et soigne 10 %).
- The Traitor : voir A2.
- IT HUNGERS, ROCK LOBSTER, AMALGAMATE, Tippi : aucune capacité publiée (fiches du miroir sans section). Seul indice : le titan 10 peut consommer un objet précis à chaque combat pour s'affaiblir.

### C3. AutoKill des titans

Le jeu n'a pas le réglage « Automatically Kill Titans ». Seuils (wiki et calculateur) : Exile 24 kills manuels suffisent ; IT HUNGERS, ROCK LOBSTER, AMALGAMATE 5 kills ; Walderp forme 5 : 13M / 7M / 150k regen et 3 kills ; Tippi et Traitor jamais.

### C4. Butin de titan volontairement non tiré

The First / Second / Third Clue (lvl 100), Sack of the Exile (2 % fixe), Face of the Exile (25 % fixe), Blue Eyes Ultimate Chestplate, pièces de THE END, ligne « 20 % lvl 4-7 » de GCT pour Wandoos 98. Branchés ailleurs et conformes : MacGuffin Fragments, QP par souhait, perk 34 (Titan EXP), souhait 3 (x1,1 / 1,2 / 1,3).

### C5. Contraintes de titans absentes

Amalgamate : chaque version est accompagnée d'une version renforcée de GRB (Easy), GCT (Normal), Jake (Hard) ou UUG (Brutal), et le Ring of Apathy est requis en Brutal ; regen recommandée d'Amalgamate (8,7e30 / 1,98e32 / 1,67e32).

### C6. `mobAttackFactor`

Calculé par le serveur (facteur 0,2 à 3), stocké dans `s.fight`, jamais lu par le client.

---

## (D) RÉSUMÉ CHIFFRÉ

| Mesure | Valeur |
|---|---|
| Ennemis d'aventure dans le jeu / source / appariés | 283 / 283 / 283 |
| Écarts jeu contre source | 1 (type de THE ELUSIVE C.S, le jeu suit le wiki) |
| Ennemis où wiki et source divergent | 22 (Back To School 8, attack rate 11 hors Back To School, Bulldozer, 3 Guys, Elusive C.S) |
| Ennemis sans stats au wiki, comblés par la source | 29 (Aethereal 21, Nether 7, Daan 1) ; plus 14 attack rate « ? » (Rad-Lands 7, Nether 7) |
| Zones comparées | 32 |
| Zones dont boss chance, déblocage, boosts, or, EXP de boss = wiki | 32 (31 pour l'EXP de boss : Aethereal absent) |
| Lignes de butin de zone manquantes dans le jeu | 6 (Aethereal : EXP + 2 pendants ; Ascended x3 : 3 boss) |
| Coquilles ou oublis de la source relevés sur le butin | 11 |
| Titans dans le jeu / au wiki | 12 / 14 |
| Titans dont seuils, EXP, AP, PP, or, QP, respawn = wiki | 12 sur 12 (respawn d'Amalgamate en désaccord avec les deux sources tierces) |
| Titans avec capacités publiées / modélisées | 10 / 0 |
| Types de monstres non normaux / mécaniques branchées | 172 sur 283 / 0 |
| Trous connus comblés par une source tierce | EXP et pendants d'Aethereal (calculateur, tableur 1.220), attack rate Rad-Lands et Nether (calculateur) |
| Trous connus sans aucune source | respawn, EXP, AP, PPP, butin de Tippi et du Traitor ; valeurs de mécanique de poison, charger, rapid, grower ; capacités de IT HUNGERS, ROCK LOBSTER, AMALGAMATE |

---

## Résumé des écarts qui comptent pour le gameplay (10 lignes)

1. Tippi et le Traitor (titans 13 et 14, fin du jeu) n'existent pas ; stats de combat connues (wiki = source), respawn, EXP, AP, PPP introuvables partout.
2. Les titans ne combattent pas : simple seuil Power/Toughness Manual ; aucune capacité (paralysie, saignement, explosions, spores, Walderp Says...), aucune croissance de +1 % par attaque, pas d'AutoKill.
3. Les 172 ennemis non normaux (exploders, chargers, poison, paralyze, rapid, grower) se battent comme des ennemis normaux : `mobType` n'est jamais lu en combat.
4. Aethereal Sea : EXP de boss (1200) et Ascended x6 Pendant / GALACTIC HERALD LOOTY absents ; le calculateur et le tableur 1.220 donnent les taux.
5. Ascended x3 Pendant manque au butin des boss de Chocolate World, Evilverse, Pretty Pink Princess Land (wiki : 0,1 % à 0,15 % + composante minuscule).
6. Back To School : les mobs suivent la source (moitié du wiki) mais `oneHitP` suit le wiki doublé : à harmoniser (source probablement juste).
7. Amalgamate respawn : 7:13:20 (wiki, jeu) contre 7,45 h et 7,5 h (deux sources tierces) : à trancher.
8. Le jeu a bien repris les attack rate de la source (Piano-Safe 14 s de fuse contre 1 au wiki) mais un exploder reste un simple coup lent.
9. Butin de zone et de titan : conforme au wiki ; les coquilles trouvées sont dans la source (Wandoos 98 x10, Dragon Wings x10, PPPL, Nether 1.8e6).
10. Les 16 pièces de THE END n'existent pas ; le Traitor est le seul titan dont le butin fixe (#495) est connu.
