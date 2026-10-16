/*
 * Aventure : sets, bonus, catalogues d'objets et noms (données) (audit d'architecture, 2026-10-16 : découpage de idle-adventure-v47.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { NOMS_SETS_FR_V1, NOMS_SPECIALS_FR_V1, NOMS_SETS_OBJETS_FR_V1, NOMS_PIECES_FR_V1 } from "./idle-noms-fr-v1.js";
import { SET_ITEM_SPECIALS_V1 } from "./idle-adventure-set-specials-v1.js";
import { BOOSTS, N } from "./idle-adventure-base.js";
import { base } from "./idle-adventure-objets.js";

export const SETS={
/*
 * Wiki Training (set), dernière mise à jour 2026-05-28 :
 * completion = +2 Energy Speed et 10 EXP. La FAQ conserve encore une
 * ancienne valeur de 20 EXP ; la page dédiée au set est la source la plus
 * récente et la plus spécifique.
 */
training:{name:"Training Set",source:"tutorial",slots:["head","chest","legs","boots","weapon"],p:6,t:8,reward:{experience:10,energySpeed:2}},
sewers:{name:"Sewers Set",source:"sewers",slots:["head","chest","legs","boots","weapon","ring","amulet"],p:52,t:52,reward:{experience:20,adventurePower:5,adventureToughness:5,adventureHp:15,adventureRegen:.2}},
/*
 * V152 — audit wiki (Norman, 2026-09-11, "parcours les pages du wiki et
 * applique tout") : la récompense de complétion réelle du set Forest
 * (wiki, page Forest_(set)) est "2 Energy potions α / 2 Energy potions β /
 * 2 Energy bar bars / +5 Energy power / 200 EXP" — energyBars:1 ci-dessous
 * n'a jamais été sourcé du wiki (aucune mention d'un bonus Energy Bars
 * plat dans cette récompense, seulement Energy Bar BAR — déjà repris
 * correctement par energyBarBar:2), retiré.
 */
forest:{name:"Forest Set",source:"forest",slots:["head","chest","legs","boots","weapon","ring","pendant"],p:176,t:176,reward:{experience:200,energyPower:5,energyPotionA:2,energyPotionB:2,energyBarBar:2}},
cave:{name:"Cave Set",source:"cave",slots:["head","chest","legs","boots","weapon","ring","amulet","combat"],p:470,t:470,reward:{experience:300,magicPower:2,magicBars:2,magicCap:40000}},
hsb:{name:"HSB Set",source:"hsb",slots:["head","chest","legs","boots","weapon","ring","amulet"],p:1090,t:1090,reward:{experience:500,magicPower:3,magicBars:3,magicCap:30000,magicPotionA:1,magicPotionB:1,magicBarBar:1}},
grb:{name:"GRB Set",source:"t1",slots:["head","chest","legs","boots","weapon","necklace","meat"],p:3120,t:2660,reward:{experience:2000,safeZoneRegen10x:true,noEquipmentChallenge:true}},
clock:{name:"Clock Set",source:"clock",slots:["head","chest","legs","boots","weapon","alarm","sands"],p:6080,t:4840,reward:{experience:1000,respawn:.05}},
"2d":{name:"2D Set",source:"2d",slots:["head","chest","legs","boots","weapon","cube","amulet"],p:10960,t:7310,reward:{experience:2000,drop:.0743}},
spoopy:{name:"Spoopy Set",source:"ancient",slots:["head","chest","legs","boots","weapon","ring","amulet"],p:20396,t:11070,reward:{experience:3000,idleAttack:true}},
jake:{name:"Jake Set",source:"t3",slots:["head","chest","legs","boots","weapon","tie","paperweight"],p:26540,t:13561,reward:{experience:7000,wandoosMeh:true}},
/*
 * 2026-09-23 (audit NGU) : wiki "Gold Diggers" > Digger Slot Locations :
 * "1 from Scrap of Paper Set" ; page "Scrap of Paper (set)" : un seul objet
 * (A Scrap of Paper), "Bonus for Completion: Gain a Digger Slot!". Jake
 * From Accounting le laisse tomber à coup sûr (lvl 0). Ce Digger Slot était
 * jusqu'ici attaché à tort à la complétion du set Jake (dont le bonus réel
 * est 7 000 EXP + Wandoos MEH).
 */
scrap:{name:"Scrap of Paper Set",source:"t3",slots:["paper"],p:0,t:0,reward:{diggerSlot:1}},
gaudy:{name:"Gaudy Set",source:"avsp",slots:["head","chest","legs","boots","weapon"],p:42060,t:19800,reward:{experience:5000,luckyCharms:2,extraDropLevelChance:.10}},
mega:{name:"Mega Set",source:"mega",slots:["head","chest","legs","boots","weapon"],p:90400,t:44800,reward:{experience:6000,chargeMultiplier:2.2}},
/*
 * V143 — p/t = "Total Power/Toughness Max" copiés directement des pages
 * de set du wiki NGU (vérifiées au navigateur le 2026-09-11), pas une
 * extrapolation. reward = uniquement les bonus de complétion RÉELLEMENT
 * exprimables avec le vocabulaire déjà existant de setRewards :
 * - beardverse (8 000 EXP réel) : le wiki ajoute aussi "10% de pénalité
 *   de vitesse en moins en équipant plusieurs Beards de même ressource",
 *   qui suppose tout le système "Beards" (non construit chez SOREAL) —
 *   volontairement omis plutôt qu'approximé.
 * - badly (30k EXP + 5k AP + boosts 20% plus efficaces réels) :
 *   "boostEffectiveness" est un NOUVEAU champ de reward, branché dans
 *   applyBoost() ci-dessous — la seule des 4 récompenses qui correspond
 *   à un mécanisme déjà existant côté SOREAL.
 * - stealth (50k EXP + 10k AP réels) : le wiki débloque aussi un coffre
 *   rare "The Stealthiest Armour" — nécessite un mécanisme de coffre/
 *   remplacement de pièce qui n'existe pas encore, omis.
 * - choco : la récompense réelle du wiki ("débloque MacGuffins/Bar Bar")
 *   dépend ENTIÈREMENT du système MacGuffins (non construit) — aucun
 *   nombre à mettre ici sans l'inventer, reward volontairement vide.
 */
beardverse:{name:"Beardverse Set",source:"beardverse",slots:["head","chest","legs","boots","weapon"],p:175000,t:111000,reward:{experience:8000}},
badly:{name:"Badly Drawn Set",source:"badly",slots:["head","chest","legs","boots","weapon"],p:1000000,t:530000,reward:{experience:30000,ap:5000,boostEffectiveness:.2}},
stealth:{name:"Stealth Set",source:"boring",slots:["head","chest","legs","boots","weapon"],p:2040000,t:1054000,reward:{experience:50000,ap:10000}},
choco:{name:"Choco Set",source:"chocolate",slots:["head","chest","legs","boots","weapon"],p:7780000,t:3286000,reward:{}},
/*
 * V144 — uug : UUG's Rings (set) est 5 anneaux COÉQUIPABLES simultanément
 * (Greed/Might/Utility/Way Too Much Energy/Way Too Much Magic), pas 5
 * emplacements corps distincts comme les autres sets. equip() traite déjà
 * tout item avec slot==="accessory" comme un ajout à un tableau (pas un
 * remplacement unique), sans jamais comparer o.slot — les 5 noms de slot
 * ci-dessous ne servent donc QU'au suivi de complétion (itemList/
 * checkSets), le vrai emplacement d'équipement reste "accessory" pour
 * les 5 (câblé côté client). wanderer/rerednaw : 4 pièces chacun (pas de
 * "weapon" — le Cane/Candy Cane sont des objets à part, pas repris ici).
 * Récompenses : uniquement exp/ap réels ; "Fanny Pack"/"Dorky Glasses"
 * ("débloque le 1er/2e emplacement accessoire") sont sans objet chez
 * SOREAL (accessories est déjà un tableau sans limite, aucun palier à
 * débloquer) ; "UUG's Special Ring" (coffre rare) et le bonus "Parry"
 * de Slimy dépendent de mécaniques non construites, omis.
 *
 * V149 — bug trouvé en vérifiant l'inventaire complet du monde Normal
 * (Norman, 2026-09-11 : "tu as terminé d'adapter le mode normal
 * alors ?") : le set était bien défini et se complétait correctement
 * une fois les objets obtenus, mais titan() (ci-dessous) n'avait JAMAIS
 * de branche id==="t4" pour le faire réellement tomber au combat — UUG
 * était donc battable indéfiniment sans jamais droper son propre set en
 * jeu normal, seulement via addItem manuel (comme utilisé par les
 * tests). Corrigé, même schéma que t1/t3/t5/t6.
 */
uug:{name:"UUG's Rings Set",source:"t4",slots:["ringGreed","ringMight","ringUtility","ringEnergy","ringMagic"],p:19332,t:19332,reward:{experience:20000,ap:20000}},
wanderer:{name:"Wanderer's Set",source:"t5",slots:["head","chest","legs","boots"],p:8000,t:184000,reward:{experience:50000,ap:10000}},
rerednaw:{name:"S'rerednaW Set",source:"t5",slots:["head","chest","legs","boots"],p:8000,t:180000,reward:{experience:50000,ap:10000}},
slimy:{name:"Slimy Set",source:"t6",slots:["head","chest","legs","boots","weapon"],p:4484000,t:2154000,reward:{experience:100000,ap:10000}},
/*
 * Evilverse (2026-09-18, Norman : "il faut tout faire" -- extension aux 17
 * zones Evil/Sadistic). Wiki NGU en direct (ngu-idle.fandom.com, le mirroir
 * local n'a pas les templates Item_data qui résolvent les stats -- même
 * méthode que les 16 sets déjà audités le 2026-09-15/16, cf. commentaire
 * SET_ITEM_STATS_V1 ci-dessus) :
 * - "Edgy (set)" (Helmet/Chest/Pants/Jaw Axe/A Cheap Plastic Amulet) :
 *   "Bonus for Completion: 250k EXP! Gain a MacGuffin slot!" -- MacGuffins
 *   non construit chez SOREAL (même statut que "choco" ci-dessus), reward
 *   limité à experience:250000.
 * - "Edgy Boots (set)" (Left+Right Edgy Boot) complète séparément et
 *   débloque uniquement l'objet fusionné "BOTH Edgy Boots" (pas de bonus
 *   numérique propre) -- SOREAL n'a qu'UN slot "boots" par set (pas de
 *   Left/Right distincts) : slot "boots" ci-dessous = les stats de "BOTH
 *   Edgy Boots" directement (Power 120 000 / Toughness 1 080 000 au
 *   niveau 100, vérifié sur sa fiche dédiée), la modélisation la plus
 *   fidèle disponible sans construire un système Left/Right inexistant.
 * Total p/t = somme des 6 pièces (Helmet+Chest+Pants+Jaw Axe+BOTH Boots+
 * Amulet) = 11 820 000 / 5 174 000.
 */
/*
 * 2026-09-23 (audit, wiki "Edgy (set)" / "Edgy Boots (set)") : "Edgy (set)" = Helmet, Chest,
 * Pants, Jaw Axe, A Cheap Plastic Amulet (5 pièces, 11 700 000 / 4 094 000). Les bottes forment
 * un set À PART, "Edgy Boots (set)" (Left + Right Edgy Boot, 100 000 / 2 064 000), dont la
 * complétion débloque le drop spécial "BOTH Edgy Boots" (0,0018 % de base, plafond 12 %, boss
 * de l'Evilverse). Auparavant "boots" était directement BOTH Edgy Boots.
 */
edgy:{name:"Edgy Set",source:"evilverse",slots:["head","chest","legs","weapon","amulet"],p:11700000,t:4094000,reward:{experience:250000}},
edgyboots:{name:"Edgy Boots Set",source:"evilverse",slots:["left","right"],p:100000,t:2064000,reward:{}},
bothedgy:{name:"BOTH Edgy Boots",source:"evilverse",slots:["boots"],p:120000,t:1080000,reward:{}},
/*
 * Pretty Pink Princess Land (2026-09-18, même passe Evil/Sadistic). Wiki
 * NGU en direct, page "Pretty Pink Princess (set)" : 6 pièces (Clown Hat/
 * Fabulous Super Chest/A Crappy Tutu/Pretty Pink Slippers/Giant Sticky
 * Foot/A Pretty Pink Bow), "Bonus for Completion: Gain 10% more PP."
 * "PP" = Perk Points ITOPOD (glossaire wiki) : ce bonus EST câblable chez
 * SOREAL puisque le calcul ITOPOD existe déjà (idle-ngu-progression.js,
 * itopodPpBase) -- nouveau champ setRewards.itopodPpPct branché comme
 * multiplicateur sur tower.data.ppProgress, même pont cross-système que
 * setRewards.diggerSlot (déjà utilisé par availableDiggerSlots).
 * Total p/t = 16 400 000 / 7 614 000 (somme des 6 pièces "Stats Max").
 */
pinkprincess:{name:"Pretty Pink Princess Set",source:"pinkprincess",slots:["head","chest","legs","boots","weapon","amulet"],p:16400000,t:7614000,reward:{itopodPpPct:.10}},
/*
 * Meta Land (2026-09-18, même passe). Wiki NGU en direct, page
 * "Meta (set)" : 7 pièces (Numerical Head/Chest/Legs/Boots + The Number 7
 * [arme] + Infinity Charm + 69 Charm, 2 accessoires distincts -- même
 * schéma que sewers/cave/hsb qui ont déjà 2 slots accessoires nommés).
 * "Bonus for Completion: +20% NGU Speed!" -- correction du 2026-09-18 :
 * le système "ngu" (trainers Attack/Defense/Adventure/Drop/etc., wiki
 * NGU "NGU" track) EST déjà construit chez SOREAL (state.systems.ngu,
 * IDLE_NGU_TRACKS.ngu, advanceTrackSystem) -- le déni initial de ce
 * bonus était une erreur, corrigée ci-dessous via setRewards.nguSpeedPct
 * (idle-ngu-progression.js, advanceTrackSystem). Total p/t =
 * 54 371 714 / 23 171 714 (somme des 7 pièces "Stats Max").
 */
meta:{name:"Meta Set",source:"metaland",slots:["head","chest","legs","boots","weapon","charmInfinity","charm69"],p:54371714,t:23171714,reward:{nguSpeedPct:.20}},
/*
 * Interdimensional Party (2026-09-18, même passe). Wiki NGU en direct,
 * page "Party (set)" : 7 pièces (Party Hat/Pogmail Chest/Tear Away Pants/
 * Pizza Boots/The God of Thunder's Hammer [arme]/Plastic Red Cup/Party
 * Whistle, 2 accessoires distincts). "Bonus for Completion: +5% Total
 * Diggers Level Bonus" -- câblé ci-dessus dans diggerGlobalBonus()
 * (idle-ngu-progression.js), qui référençait déjà ce bonus par son nom
 * exact ("Party (set) Bonus") sans jamais pouvoir le calculer faute
 * d'équipement Party construit. Total p/t = 109 000 000 / 46 000 000
 * (somme des 7 pièces "Stats Max").
 */
party:{name:"Party Set",source:"interdimensional",slots:["head","chest","legs","boots","weapon","cup","whistle"],p:109000000,t:46000000,reward:{diggerGlobalBonusPct:5}},
/*
 * Typo Zonw (2026-09-18, même passe). Wiki NGU en direct, page
 * "Typo (set)" : 7 pièces (Hamlet/Chess Plate/Logs/Booms/Wee pin [arme]/
 * The Ass-cessory/Eye of ELXU, 2 accessoires). "Bonus for Completion:
 * +20% Wish Speed!" -- le système Wishes est absent de SOREAL (statut
 * "Wishes" non construit, cf. audit wiki-parity) : reward volontairement
 * vide, jamais approximé. Total p/t = 362 133 332 / 172 333 332 (somme
 * des 7 pièces "Stats Max").
 */
typo:{name:"Typo Set",source:"typozone",slots:["head","chest","legs","boots","weapon","asscessory","eyeElxu"],p:362133332,t:172333332,reward:{wishSpeedPct:.20}},
/*
 * The Fad-lands (2026-09-18, même passe). Wiki NGU en direct, page
 * "Fad (set)" : 7 pièces (Spinning Tophat/Demonic Flurbie Chestplate/AAA
 * Battery Legs/Slinky Boots/THE MALF SLAMMER [arme]/Rare Foil Pokeyman
 * Card/A handful of Krazy Bonez, 2 accessoires). "Bonus for Completion:
 * 10% Faster Major Quests! + 3 Beast Butters" -- Questing (statut :
 * documenté mais jamais implémenté en mécanique jouable) et Beast Mode
 * (jamais construit chez SOREAL) sont tous deux hors périmètre : reward
 * volontairement vide. Total p/t = 585 200 000 / 278 000 000 (somme des
 * 7 pièces "Stats Max").
 */
fad:{name:"Fad Set",source:"fadlands",slots:["head","chest","legs","boots","weapon","pokeymanCard","krazyBonez"],p:585200000,t:278000000,reward:{}},
/*
 * JRPGVille (2026-09-18, même passe). Wiki NGU en direct, page
 * "JRPG (set)" : gag JRPG -- l'épée "Buster Sword" est démembrée en 4
 * pièces d'ARMURE (Top/Upper/Lower/Bottom = head/chest/legs/boots) tandis
 * que "Gift Shop Buster Sword Replica" est la vraie arme (800M Power,
 * de loin la plus grosse valeur du set) ; + 2 accessoires (A Gigantic
 * Zipper, Anime Hero Wig). "Bonus for Completion: A better Ultimate
 * Attack! (5.01x -> 7.01x)" -- "Ultimate Attack" est une compétence
 * ITOPOD/combat discrète qui n'existe pas dans le modèle de combat
 * SOREAL (attaque/défense continues, jamais de multiplicateur d'attaque
 * spéciale) : reward volontairement vide. Total p/t = 913 800 000 /
 * 442 000 000 (somme des 7 pièces "Stats Max").
 */
jrpg:{name:"JRPG Set",source:"jrpgville",slots:["head","chest","legs","boots","weapon","zipper","wig"],p:913800000,t:442000000,reward:{}},
/*
 * The Rad-Lands (2026-09-18, même passe -- dernière zone Evil, "Higher
 * zones continue only in SADISTIC difficulty"). Wiki NGU en direct, page
 * "Rad (set)" : 7 pièces (Cool Shades/Leather Jacket/Flamin' Hot Shorts/
 * A Skateboard/Nunchuks [arme]/Not Drugs/The Glove of Power, 2
 * accessoires). "Bonus for Completion: +5 Max Deck Size" -- système
 * Cards (débloqué par "A Still-Beating Heart", drop garanti de l'Exile,
 * cf. commentaire IDLE_ADVENTURE_TITANS ci-dessus) jamais construit chez
 * SOREAL : reward volontairement vide. Total p/t = 2 227 200 000 /
 * 1 100 000 000 (somme des 7 pièces "Stats Max").
 */
rad:{name:"Rad Set",source:"radlands",slots:["head","chest","legs","boots","weapon","notDrugs","gloveOfPower"],p:2227200000,t:1100000000,reward:{}},
/*
 * Back To School (2026-09-18, passe SADISTIC -- 9 zones restantes). Wiki
 * NGU en direct, page "Back To School (set)" : 7 pièces (Dunce Cap/School
 * Jersey/ULTRAWIDE Pants/Shoes With Wheels/Floppy Elastic Ruler [arme]/
 * THE S/A Walkman, 2 accessoires). "Bonus for Completion: +15% NGU
 * Speed!" -- même setRewards.nguSpeedPct que Meta Land ci-dessus (le
 * système "ngu" existe chez SOREAL, correction du déni initial). Total
 * p/t = 2 928 800 000 / 1 606 000 000 (somme des 7 pièces "Stats Max").
 */
backtoschool:{name:"Back To School Set",source:"backtoschool",slots:["head","chest","legs","boots","weapon","theS","walkman"],p:2928800000,t:1606000000,reward:{nguSpeedPct:.15}},
/*
 * The West World (2026-09-18, même passe SADISTIC). Wiki NGU en direct,
 * page "Western (set)" : 7 pièces (A 10 Litre Hat/Asslest Vest/Assful
 * Chaps/Extra Spiky Spurs/The Six Shooter [arme]/A Battle Corgi/A Pink
 * Bandana, 2 accessoires). "Bonus for Completion: An Extra Drop in this
 * zone!" -- formulation qualitative sans mécanique ni magnitude précisée
 * (double tirage complet ? un item garanti en plus ? le wiki ne le
 * détaille pas) : jamais implémenté sur une supposition, reward
 * volontairement vide (règle n°1, AGENTS.md). Le bonus post-complétion
 * "A 9mm Beretta" (drop supplémentaire "if Western (set) complete") est
 * un 8e objet de loot hors des 7 pièces de complétion -- même statut que
 * les autres rares multi-zones (Ascended Pendant, Sir Looty) déjà
 * laissés hors de IDLE_ADVENTURE_SETS pour toutes les zones précédentes,
 * jamais un oubli. Total p/t = 3 788 000 000 / 2 174 000 000 (somme des
 * 7 pièces "Stats Max").
 */
western:{name:"Western Set",source:"westworld",slots:["head","chest","legs","boots","weapon","corgi","bandana"],p:3788000000,t:2174000000,reward:{}},
/*
 * The Breadverse (2026-09-18, même passe SADISTIC). Wiki NGU en direct,
 * page "Bread (set)" : 8 pièces, PAS 7 -- "Without accessories" (le
 * bloc qui isole l'armure+arme(s) des accessoires) additionne À LA FOIS
 * "1 Day-Old Baguette" ET "A Rolling Pin" comme 2 objets à arme distincts
 * (confirmé par la somme exacte du total officiel de la page), en plus
 * des 4 pièces d'armure et de 2 accessoires (A Cream Pie, A Spoonful of
 * Yeast). SOREAL n'a qu'UN slot "weapon" par set : "weapon" porte A
 * Rolling Pin (la plus grosse Power), "baguette" porte 1 Day-Old
 * Baguette comme second slot arme distinct -- déjà le même principe que
 * les 2 slots accessoires des sets précédents, juste appliqué à une arme
 * au lieu d'un bijou. "Bonus for Completion: Faster Cooks!!" -- le
 * système Cooking n'existe pas du tout chez SOREAL : reward
 * volontairement vide. Total p/t = 16 524 000 000 / 5 080 000 000
 * (somme des 8 pièces "Stats Max").
 */
bread:{name:"Bread Set",source:"breadverse",slots:["head","chest","legs","boots","weapon","baguette","creamPie","yeast"],p:16524000000,t:5080000000,reward:{}},
/*
 * That 70's Zone (2026-09-18, même passe SADISTIC). Wiki NGU en direct,
 * page "Disco (set)" : même structure à 8 pièces que Bread ci-dessus --
 * "Without accessories" additionne "A Rusty Old Sabre" ET "A Vinyl
 * Record Shard" comme 2 armes distinctes, + 4 pièces d'armure + 2
 * accessoires (A Bit of White Powder, Some Rolling Paper). "weapon" =
 * A Rusty Old Sabre, "vinylShard" = second slot arme (même principe que
 * "baguette" pour Bread). "Bonus for Completion: Less crappy cards!" --
 * système Cards non construit chez SOREAL : reward volontairement vide.
 * Total p/t = 22 076 601 000 / 6 820 000 000 (somme des 8 pièces
 * "Stats Max").
 */
disco:{name:"Disco Set",source:"seventies",slots:["head","chest","legs","boots","weapon","vinylShard","whitePowder","rollingPaper"],p:22076601000,t:6820000000,reward:{}},
/*
 * The Halloweenies (2026-09-18, même passe SADISTIC). Wiki NGU en
 * direct, page "Halloweenie (set)" : même structure à 8 pièces que
 * Bread/Disco -- "Without accessories" additionne "An Ordinary Apple" ET
 * "A Giant Scythe" comme 2 armes distinctes, + 4 pièces d'armure (Neck
 * Bolts/Skeleton Shirt/A Broomstick/Fuzzy Boots) + 2 accessoires (A Roll
 * of Toilet Paper, Pandora's Box). "weapon" = A Giant Scythe (la plus
 * grosse Power), "apple" = second slot arme. "Bonus for Completion: +45%
 * PP gain!" -- ITOPOD, même pont setRewards.itopodPpPct que Pretty Pink
 * Princess ci-dessus (les deux s'additionnent naturellement via
 * checkSets, jamais un plafond artificiel). Total p/t = 31 331 600 000 /
 * 9 226 000 000 (somme des 8 pièces "Stats Max").
 */
halloweenie:{name:"Halloweenie Set",source:"halloweenies",slots:["head","chest","legs","boots","weapon","apple","toiletPaper","pandora"],p:31331600000,t:9226000000,reward:{itopodPpPct:.45}},
/*
 * Construction Zone (2026-09-18, même passe SADISTIC). Wiki NGU en
 * direct, page "Construction (set)" : même structure à 8 pièces --
 * "Without accessories" additionne "A Wooden Hammer" ET "A Giant
 * Wrecking Ball" comme 2 armes distinctes, + 4 pièces d'armure (A
 * Hardhat/High Visibility Vest/Yet Another Generic Pair Of Jeans/Steel
 * Toed Boots) + 2 accessoires (The Toolbox, A Level Level). "weapon" =
 * A Giant Wrecking Ball (la plus grosse Power), "hammer" = second slot
 * arme. "Bonus for Completion: 20% Boostier Boosts!" -- réutilise
 * exactement setRewards.boostEffectiveness, déjà câblé dans applyBoost()
 * depuis le set "badly" (Badly Drawn World, V143) : s'additionne
 * naturellement avec lui via checkSets, jamais un nouveau champ. Total
 * p/t = 87 119 800 000 / 23 276 000 000 (somme des 8 pièces
 * "Stats Max").
 */
construction:{name:"Construction Set",source:"construction",slots:["head","chest","legs","boots","weapon","hammer","toolbox","levelLevel"],p:87119800000,t:23276000000,reward:{boostEffectiveness:.20}},
/*
 * DUCK DUCK ZONE (2026-09-18, même passe SADISTIC). Wiki NGU en direct,
 * page "Duck (set)" : même structure à 8 pièces -- "Without accessories"
 * additionne "A shotgun" ET "The Zapper" comme 2 armes distinctes, + 4
 * pièces d'armure (A Fake Duckbill/An Inflatable Ducky Innertube/Duck
 * Duck Shorts/Duck Slippers) + 2 accessoires (Some Duck-t Tape, A Duck
 * Caller). "weapon" = The Zapper (la plus grosse Power), "shotgun" =
 * second slot arme. "Bonus for Completion: +6% Mayo and Card Speed!" --
 * Mayo et Cards n'existent ni l'un ni l'autre chez SOREAL : reward
 * volontairement vide. Total p/t = 123 080 000 000 / 32 100 000 000
 * (somme des 8 pièces "Stats Max").
 */
duck:{name:"Duck Set",source:"duckduck",slots:["head","chest","legs","boots","weapon","shotgun","ducktTape","duckCaller"],p:123080000000,t:32100000000,reward:{}},
/*
 * The Nether Regions (2026-09-18, même passe SADISTIC). Wiki NGU en
 * direct, page "Dutch (set)" : même structure à 8 pièces -- "Without
 * accessories" additionne "Black Tulip" ET "Weaponized Hollandaise
 * sauce" comme 2 armes distinctes, + 4 pièces d'armure (A Dutch Hat/
 * Windmill Shirt/Stroopwaffel Pants/Clogs) + 2 accessoires (Pocket
 * Netherlands, Rest of the Combat Cheese). "weapon" = Weaponized
 * Hollandaise sauce (la plus grosse Power), "tulip" = second slot arme.
 * "Bonus for Completion: +25% Faster Blood Magic Rituals!" -- câblé
 * ci-dessus dans advanceBloodMagic() via le nouveau
 * setRewards.bloodMagicSpeedPct, système déjà entièrement construit chez
 * SOREAL. Total p/t = 166 160 000 000 / 45 680 000 000 (somme des 8
 * pièces "Stats Max").
 */
dutch:{name:"Dutch Set",source:"netherregions",slots:["head","chest","legs","boots","weapon","tulip","netherlands","cheese"],p:166160000000,t:45680000000,reward:{bloodMagicSpeedPct:.25}},
/*
 * The Aethereal Sea (2026-09-18, dernière zone -- "It was formerly named
 * The Aethereal Sea Part 1 but apparently an intended Part 2 got
 * cancelled"). Wiki NGU en direct, page "Pirate (set)" : même structure
 * à 8 pièces -- "Without accessories" additionne "The Cutlass" ET "The
 * Flintlock" comme 2 armes distinctes, + 4 pièces d'armure (Pirate Hat/
 * Swashbuckler Chest/Piratey Pants/Piratey Peglegs) + 2 accessoires (A
 * Giant's Eyepatch, A Compass!). "weapon" = The Flintlock (la plus
 * grosse Power), "cutlass" = second slot arme. "Bonus for Completion:
 * \"Pride and Accomplishment.\"" -- texte d'ambiance littéral, PAS un
 * bonus chiffré (blague NGU habituelle sur les sets de fin de contenu) :
 * reward vide à raison, rien à câbler. Total p/t = 289 540 000 000 /
 * 72 200 000 000 (somme des 8 pièces "Stats Max").
 */
pirate:{name:"Pirate Set",source:"aethereansea",slots:["head","chest","legs","boots","weapon","cutlass","eyepatch","compass"],p:289540000000,t:72200000000,reward:{}},
/*
 * Sets des titans Evil/Sadistic (2026-09-23, miroir local NGU-Wiki : page
 * "<Set> (set)" pour le total et le bonus, fiche de chaque pièce pour les
 * stats/Specials, recoupées avec les gabarits "Item data <pièce>"). p/t =
 * "Total Power/Toughness" de "Total Stats Max" de la page du set, égal à la
 * somme des "Max stat at max lvl" des pièces (vérifié pièce par pièce).
 * Même convention que Bread/Disco pour les sets à 2 armes : "weapon" porte
 * l'arme à la plus grosse Power, la seconde arme a son propre slot.
 * Bonus de complétion : AUCUN n'est exprimable avec les champs setRewards
 * existants, donc reward:{} (jamais approximé, règle n°1 AGENTS.md) :
 * - Greasy Nerd : "All MacGuffins drop 1 level higher!"
 * - Mobster : "+15% QP Gain"
 * - Exile : "Unlocks something secret!" (drops Sack/Face of the Exile, consommables absents)
 * - Space : "+10% Cooking EXP Bonus!"
 * - Rock : "+1 tier to ALL CARDS!"
 * - Amalgamate : "+10 Max Deck size!"
 */
greasynerd:{name:"Greasy Nerd Set",source:"nerd",slots:["head","chest","legs","boots","weapon"],p:22580000,t:10440000,reward:{}},
mobster:{name:"Mobster Set",source:"godmother",slots:["head","chest","legs","boots","weapon","garrote","brassKnuckles"],p:218200000,t:103000000,reward:{}},
exile:{name:"Exile Set",source:"t7",slots:["head","chest","legs","boots","weapon"],p:1257800000,t:518000000,reward:{}},
space:{name:"Space Set",source:"hungers",slots:["head","chest","legs","boots","weapon","manhole","redShirt"],p:4952400000,t:2240000002,reward:{}},
rock:{name:"Rock Set",source:"lobster",slots:["head","chest","legs","boots","weapon","rocket","petRock","rollingStone"],p:45340800000,t:13328000000,reward:{}},
amalgamate:{name:"Amalgamate Set",source:"amalgamate",slots:["head","chest","legs","boots","weapon","deathstick","corruptedLeaf","glued"],p:229820000000,t:55600000000,reward:{}}
};

/* Noms français (Norman, 2026-10-03) : seul l'affichage change, jamais les identifiants ni les valeurs du wiki. */
/* Noms d'origine (anglais) conservés pour le choix de langue (idle-traductions-v1.js). */
export const NOMS_SETS_EN_V1=Object.freeze(Object.fromEntries(Object.entries(SETS).map(([id,s])=>[id,s.name])));

for(const[id,s]of Object.entries(SETS))if(NOMS_SETS_FR_V1[id])s.name=NOMS_SETS_FR_V1[id];

export const IDLE_ADVENTURE_SETS=Object.freeze(Object.fromEntries(Object.entries(SETS).map(([id,s])=>[id,Object.freeze({id,...s})])));

/*
 * Audit wiki par pièce (2026-09-15, Norman : "je veux que chaque item ait
 * exactement les mêmes statistiques que dans NGU Idle... tu dois regarder
 * chacune des pages du wiki avec les sets d'armures"). item()/idleAdventureBaseStatsV1
 * ci-dessous répartissaient jusqu'ici Power/Toughness du SET de façon
 * ÉGALE entre toutes ses pièces (s.p/k, s.t/k) — jamais la vraie
 * répartition du wiki, où l'arme porte l'essentiel du Power (et rien en
 * Toughness) tandis que les pièces d'armure portent le Toughness (et peu
 * ou pas de Power), avec des valeurs souvent inégales entre elles.
 *
 * Chaque entrée ci-dessous = "Stats Max" (niveau 100) copié tel quel de
 * la fiche wiki dédiée (ngu-idle.fandom.com/wiki/<Set>_(set)), vérifiée au
 * navigateur le 2026-09-15 pour les 16 sets déjà présents dans SETS
 * ci-dessus. Même convention que s.p/s.t au niveau SET (déjà établie
 * plus haut) : ces valeurs sont le total à NIVEAU 100 (double du niveau
 * 0) — item() continue de diviser par 2 puis d'appliquer q=1+niveau/100,
 * jamais une nouvelle formule.
 *
 * Découverte en vérifiant : dans TOUS les objets contrôlés (armes,
 * armures, anneaux/amulettes), HP Max = Power×3 et HP Regen =
 * Toughness×0.03, SANS EXCEPTION (aux arrondis wiki près sur 1 item de
 * Mega). C'est manifestement une vraie règle du moteur NGU, pas une
 * coïncidence par set — jamais besoin de stocker HP Max/Regen à part,
 * item()/special() les dérivent directement de power/toughness.
 *
 * Audit complété 2026-09-16 (Norman : "mets à jour les stats des objets
 * avant notre update des chiffres") pour les 4 derniers sets non audités
 * (2d, uug, wanderer, rerednaw) — mêmes fiches wiki dédiées
 * (ngu-idle.fandom.com/wiki/2D_(set), .../UUG's_rings_(set),
 * .../Wanderer's_(set), .../S'rerednaW_(set)), même convention "Stats Max"
 * niveau 100. Les totaux par set (s.p/s.t ci-dessus) étaient déjà
 * corrects — seule la répartition PAR PIÈCE était fausse (égale au lieu
 * de suivre la vraie fiche wiki).
 */
const SET_ITEM_STATS_V1=Object.freeze({
  "training:weapon":{p:6,t:0},"training:head":{p:0,t:2},"training:chest":{p:0,t:2},"training:legs":{p:0,t:2},"training:boots":{p:0,t:2},
  "sewers:weapon":{p:40,t:0},"sewers:head":{p:0,t:10},"sewers:chest":{p:0,t:10},"sewers:legs":{p:0,t:10},"sewers:boots":{p:0,t:10},"sewers:ring":{p:2,t:2},"sewers:amulet":{p:10,t:10},
  "forest:weapon":{p:160,t:0},"forest:head":{p:0,t:40},"forest:chest":{p:0,t:40},"forest:legs":{p:0,t:40},"forest:boots":{p:0,t:40},"forest:ring":{p:16,t:16},"forest:pendant":{p:0,t:0},
  "cave:weapon":{p:400,t:0},"cave:head":{p:0,t:100},"cave:chest":{p:0,t:100},"cave:legs":{p:0,t:100},"cave:boots":{p:0,t:100},"cave:ring":{p:8,t:8},"cave:amulet":{p:2,t:2},"cave:combat":{p:60,t:60},
  "hsb:weapon":{p:1000,t:0},"hsb:head":{p:0,t:250},"hsb:chest":{p:0,t:250},"hsb:legs":{p:0,t:250},"hsb:boots":{p:0,t:250},"hsb:ring":{p:90,t:90},"hsb:amulet":{p:0,t:0},
  "grb:weapon":{p:2000,t:160},"grb:head":{p:500,t:500},"grb:chest":{p:40,t:500},"grb:legs":{p:40,t:500},"grb:boots":{p:40,t:500},"grb:necklace":{p:500,t:500},"grb:meat":{p:0,t:0},
  "clock:weapon":{p:5000,t:160},"clock:head":{p:60,t:860},"clock:chest":{p:40,t:890},"clock:legs":{p:40,t:1000},"clock:boots":{p:40,t:1030},"clock:alarm":{p:900,t:900},"clock:sands":{p:0,t:0},
  "spoopy:weapon":{p:17776,t:600},"spoopy:head":{p:100,t:2000},"spoopy:chest":{p:160,t:2070},"spoopy:legs":{p:140,t:2120},"spoopy:boots":{p:120,t:2180},"spoopy:ring":{p:2100,t:2100},"spoopy:amulet":{p:0,t:0},
  "jake:weapon":{p:23000,t:0},"jake:head":{p:160,t:2600},"jake:chest":{p:160,t:2500},"jake:legs":{p:160,t:2798},"jake:boots":{p:160,t:2600},"scrap:paper":{p:0,t:0},"jake:tie":{p:0,t:163},"jake:paperweight":{p:2900,t:2900},
  "gaudy:weapon":{p:40000,t:0},"gaudy:head":{p:560,t:4800},"gaudy:chest":{p:500,t:5000},"gaudy:legs":{p:600,t:5200},"gaudy:boots":{p:400,t:4800},
  "mega:weapon":{p:88000,t:0},"mega:head":{p:600,t:11200},"mega:chest":{p:600,t:11200},"mega:legs":{p:600,t:11400},"mega:boots":{p:600,t:11000},
  "beardverse:weapon":{p:166000,t:12000},"beardverse:head":{p:2200,t:24000},"beardverse:chest":{p:2200,t:25000},"beardverse:legs":{p:2200,t:25000},"beardverse:boots":{p:2400,t:25000},
  "badly:weapon":{p:1000000,t:50000},"badly:head":{p:0,t:120000},"badly:chest":{p:0,t:120000},"badly:legs":{p:0,t:120000},"badly:boots":{p:0,t:120000},
  "stealth:weapon":{p:2000000,t:120000},"stealth:head":{p:10000,t:224000},"stealth:chest":{p:10000,t:230000},"stealth:legs":{p:10000,t:236000},"stealth:boots":{p:10000,t:244000},
  "choco:weapon":{p:7600000,t:400000},"choco:head":{p:60000,t:704000},"choco:chest":{p:40000,t:740000},"choco:legs":{p:40000,t:710000},"choco:boots":{p:40000,t:732000},
  "slimy:weapon":{p:4400000,t:200000},"slimy:head":{p:22000,t:484000},"slimy:chest":{p:22000,t:500000},"slimy:legs":{p:20000,t:490000},"slimy:boots":{p:20000,t:480000},
  "2d:weapon":{p:9200,t:600},"2d:head":{p:100,t:1200},"2d:chest":{p:100,t:1290},"2d:legs":{p:140,t:1520},"2d:boots":{p:120,t:1400},"2d:cube":{p:1300,t:1300},"2d:amulet":{p:0,t:0},
  "uug:ringGreed":{p:0,t:0},"uug:ringMight":{p:13332,t:13332},"uug:ringUtility":{p:2000,t:2000},"uug:ringEnergy":{p:2000,t:2000},"uug:ringMagic":{p:2000,t:2000},
  "wanderer:head":{p:2000,t:44000},"wanderer:chest":{p:2000,t:46000},"wanderer:legs":{p:2000,t:46000},"wanderer:boots":{p:2000,t:48000},
  "rerednaw:head":{p:2000,t:42000},"rerednaw:chest":{p:2000,t:44000},"rerednaw:legs":{p:2000,t:46000},"rerednaw:boots":{p:2000,t:48000},
  "edgy:weapon":{p:11200000,t:600000},"edgy:head":{p:80000,t:1004000},"edgy:chest":{p:60000,t:1080000},"edgy:legs":{p:60000,t:1110000},"edgyboots:left":{p:40000,t:1032000},"edgyboots:right":{p:60000,t:1032000},"bothedgy:boots":{p:120000,t:1080000},"edgy:amulet":{p:300000,t:300000},
  "pinkprincess:weapon":{p:15200000,t:880000},"pinkprincess:head":{p:120000,t:1484000},"pinkprincess:chest":{p:120000,t:1480000},"pinkprincess:legs":{p:100000,t:1510000},"pinkprincess:boots":{p:60000,t:1460000},"pinkprincess:amulet":{p:800000,t:800000},
  "meta:weapon":{p:50000000,t:2400000},"meta:head":{p:300000,t:4400000},"meta:chest":{p:300000,t:4400000},"meta:legs":{p:300000,t:4400000},"meta:boots":{p:300000,t:4400000},"meta:charmInfinity":{p:1777776,t:1777776},"meta:charm69":{p:1393938,t:1393938},
  "party:weapon":{p:100000000,t:4000000},"party:head":{p:500000,t:9000000},"party:chest":{p:500000,t:9000000},"party:legs":{p:500000,t:9000000},"party:boots":{p:500000,t:9000000},"party:cup":{p:3000000,t:2000000},"party:whistle":{p:4000000,t:4000000},
  "typo:weapon":{p:320000000,t:12000000},"typo:head":{p:1200000,t:30000000},"typo:chest":{p:1200000,t:32000000},"typo:legs":{p:1200000,t:31000000},"typo:boots":{p:1200000,t:30000000},"typo:asscessory":{p:24000000,t:24000000},"typo:eyeElxu":{p:13333332,t:13333332},
  "fad:weapon":{p:500000000,t:20000000},"fad:head":{p:1800000,t:44000000},"fad:chest":{p:1800000,t:48000000},"fad:legs":{p:1800000,t:46000000},"fad:boots":{p:1800000,t:42000000},"fad:pokeymanCard":{p:38000000,t:38000000},"fad:krazyBonez":{p:40000000,t:40000000},
  "jrpg:weapon":{p:800000000,t:32000000},"jrpg:head":{p:2800000,t:76000000},"jrpg:chest":{p:3000000,t:74000000},"jrpg:legs":{p:3000000,t:78000000},"jrpg:boots":{p:3000000,t:76000000},"jrpg:zipper":{p:42000000,t:46000000},"jrpg:wig":{p:60000000,t:60000000},
  "rad:weapon":{p:1760000000,t:70000000},"rad:head":{p:6600000,t:174000000},"rad:chest":{p:6800000,t:172000000},"rad:legs":{p:7000000,t:172000000},"rad:boots":{p:6800000,t:172000000},"rad:notDrugs":{p:180000000,t:180000000},"rad:gloveOfPower":{p:260000000,t:160000000},
  "backtoschool:weapon":{p:2280000000,t:90000000},"backtoschool:head":{p:9200000,t:244000000},"backtoschool:chest":{p:9200000,t:244000000},"backtoschool:legs":{p:9200000,t:244000000},"backtoschool:boots":{p:9200000,t:244000000},"backtoschool:theS":{p:360000000,t:360000000},"backtoschool:walkman":{p:252000000,t:180000000},
  "western:weapon":{p:2960000000,t:116000000},"western:head":{p:12000000,t:318000000},"western:chest":{p:12000000,t:320000000},"western:legs":{p:12000000,t:316000000},"western:boots":{p:12000000,t:324000000},"western:corgi":{p:440000000,t:440000000},"western:bandana":{p:340000000,t:340000000},
  "bread:weapon":{p:7640000000,t:180000000},"bread:baguette":{p:7200000000,t:274000000},"bread:head":{p:26000000,t:760000000},"bread:chest":{p:26000000,t:764000000},"bread:legs":{p:26000000,t:766000000},"bread:boots":{p:26000000,t:756000000},"bread:creamPie":{p:820000000,t:820000000},"bread:yeast":{p:760000000,t:760000000},
  "disco:weapon":{p:9720001000,t:274000000},"disco:vinylShard":{p:10000000000,t:220000000},"disco:head":{p:35000000,t:1026000000},"disco:chest":{p:35200000,t:1024000000},"disco:legs":{p:35200000,t:1028000000},"disco:boots":{p:35200000,t:1032000000},"disco:whitePowder":{p:1106000000,t:1106000000},"disco:rollingPaper":{p:1110000000,t:1110000000},
  "halloweenie:weapon":{p:14500000000,t:420000000},"halloweenie:apple":{p:14040000000,t:274000000},"halloweenie:head":{p:50600000,t:1486000000},"halloweenie:chest":{p:51000000,t:1480000000},"halloweenie:legs":{p:51000000,t:1490000000},"halloweenie:boots":{p:51000000,t:1488000000},"halloweenie:toiletPaper":{p:1286000000,t:1286000000},"halloweenie:pandora":{p:1302000000,t:1302000000},
  "construction:weapon":{p:41020000000,t:600000000},"construction:hammer":{p:40000000000,t:800000000},"construction:head":{p:145200000,t:4110000000},"construction:chest":{p:144800000,t:4080000000},"construction:legs":{p:151800000,t:4060000000},"construction:boots":{p:152000000,t:4120000000},"construction:toolbox":{p:3640000000,t:3640000000},"construction:levelLevel":{p:1866000000,t:1866000000},
  "duck:weapon":{p:57800000000,t:840000000},"duck:shotgun":{p:57000000000,t:1100000000},"duck:head":{p:200000000,t:5640000000},"duck:chest":{p:200000000,t:5620000000},"duck:legs":{p:200000000,t:5740000000},"duck:boots":{p:200000000,t:5680000000},"duck:ducktTape":{p:5080000000,t:5080000000},"duck:duckCaller":{p:2400000000,t:2400000000},
  "dutch:weapon":{p:76400000000,t:1200000000},"dutch:tulip":{p:76000000000,t:1200000000},"dutch:head":{p:280000000,t:7700000000},"dutch:chest":{p:280000000,t:7640000000},"dutch:legs":{p:280000000,t:7600000000},"dutch:boots":{p:280000000,t:7700000000},"dutch:netherlands":{p:5620000000,t:5620000000},"dutch:cheese":{p:7020000000,t:7020000000},
  "pirate:weapon":{p:138000000000,t:2000000000},"pirate:cutlass":{p:126000000000,t:2000000000},"pirate:head":{p:480000000,t:11200000000},"pirate:chest":{p:500000000,t:11400000000},"pirate:legs":{p:480000000,t:11000000000},"pirate:boots":{p:480000000,t:11000000000},"pirate:eyepatch":{p:11800000000,t:11800000000},"pirate:compass":{p:11800000000,t:11800000000},
  // Sets des titans Evil/Sadistic (2026-09-23) : "Max stat at max lvl" de la fiche de chaque pièce (= "Stats Max" de la page du set).
  "greasynerd:head":{p:160000,t:2200000},"greasynerd:chest":{p:160000,t:2240000},"greasynerd:legs":{p:100000,t:2400000},"greasynerd:boots":{p:160000,t:2400000},"greasynerd:weapon":{p:22000000,t:1200000},
  "mobster:head":{p:800000,t:20000000},"mobster:chest":{p:800000,t:20000000},"mobster:legs":{p:800000,t:20000000},"mobster:boots":{p:800000,t:20000000},"mobster:weapon":{p:200000000,t:8000000},"mobster:garrote":{p:8000000,t:8000000},"mobster:brassKnuckles":{p:7000000,t:7000000},
  "exile:head":{p:4400000,t:114000000},"exile:chest":{p:4600000,t:120000000},"exile:legs":{p:4400000,t:118000000},"exile:boots":{p:4400000,t:116000000},"exile:weapon":{p:1240000000,t:50000000},
  "space:head":{p:15600000,t:410000000},"space:chest":{p:15600000,t:410000000},"space:legs":{p:15600000,t:410000000},"space:boots":{p:15600000,t:410000000},"space:weapon":{p:3840000000,t:150000000},"space:manhole":{p:450000000,t:450000000},"space:redShirt":{p:600000000,t:2},
  "rock:head":{p:73200000,t:2150000000},"rock:chest":{p:73200000,t:2150000000},"rock:legs":{p:73200000,t:2140000000},"rock:boots":{p:73200000,t:2160000000},"rock:weapon":{p:21020000000,t:600000000},"rock:rocket":{p:20300000000,t:400000000},"rock:petRock":{p:1862000000,t:1862000000},"rock:rollingStone":{p:1866000000,t:1866000000},
  "amalgamate:head":{p:340000000,t:9200000000},"amalgamate:chest":{p:9200000000,t:9200000000},"amalgamate:legs":{p:340000000,t:9200000000},"amalgamate:boots":{p:340000000,t:9200000000},"amalgamate:weapon":{p:104000000000,t:1600000000},"amalgamate:deathstick":{p:100000000000,t:1600000000},"amalgamate:corruptedLeaf":{p:6400000000,t:6400000000},"amalgamate:glued":{p:9200000000,t:9200000000}
});

export function idleAdventureItemStatsMaxV1(set,slot){
  const override=SET_ITEM_STATS_V1[`${set}:${slot}`];
  if(override)return override;
  const s=SETS[set],k=Math.max(1,s?.slots.length||1);
  return{p:N(s?.p)/k,t:N(s?.t)/k};
}

/*
 * Audit 2026-09-13 (Norman : "trop d'objets n'ont pas encore leurs stats") :
 * special() (plus bas) renvoyait systématiquement power:0/toughness:0 pour
 * TOUS les accessoires d'Aventure ci-dessous, quel que soit l'objet réel —
 * seul le champ `p`/`t` (absent jusqu'ici) aurait pu porter une vraie
 * valeur. Chaque objet vérifié individuellement sur sa fiche dédiée du wiki
 * NGU (ngu-idle.fandom.com/wiki/<Nom exact de l'objet>, gabarit "Item_data") :
 * `p`/`t` reprennent le "Max stat at lvl 0" de Power/Toughness quand la
 * fiche en liste un (même convention que basePower=s.p/k/2 pour
 * l'équipement — valeur au niveau 0, qui DOUBLE au niveau 100 ; vérifié sur
 * chaque fiche que "Max stat at max lvl" = 2× "Max stat at lvl 0").
 * Beaucoup d'accessoires réels n'ont EFFECTIVEMENT aucune stat Power/
 * Toughness (ils ne donnent que des bonus "Specials" en %, ex. Energy/Magic
 * Cap/Power/Speed, Drop Chance) : `p`/`t` valent alors bien 0 ci-dessous —
 * valeur réelle et vérifiée du wiki, pas un oubli.
 *
 * PISTE 2 (audit 2026-09-18, Norman : "Est-ce que tu as bien intégré chacune
 * des statistiques special etc ?") — chaque fiche "Specials" a été revérifiée
 * en direct au navigateur pour les ~17 objets SPECIALS restants (au-delà de
 * tutorialCube, déjà fait PISTE 1). `sType`/`sBase`/`sMax` portent désormais
 * le PREMIER bonus Special listé par la fiche (celui qui reste le seul
 * boostable/plafonné via le mécanisme existant `special()`/`applyBoost`/
 * `cleanItem` — inchangé, un seul scalaire `o.special` par objet). Quand une
 * fiche en liste D'AUTRES (2e/3e/4e/5e bonus, ex. Cheese Grater : Drop
 * Chance + Energy Speed + Magic Speed), ils sont portés par `sExtra`
 * ([{type,base,max0,max100}]) : leur "Base value" wiki (valeur garantie par
 * le simple fait d'équiper l'objet, SANS boost) alimente l'agrégat
 * `specialsByType`/`specials` ci-dessous (idleAdventureEquipmentStatsV47).
 * MISE À JOUR 2026-09-25 : les bonus `sExtra` SONT boostables — un Special Boost verse des POINTS dans les Specials de l'objet dans l'ordre de la fiche
 * (le 1er jusqu'à son plafond, puis le suivant ; wiki Build Cooking : « 30 Special Boosts before you can start leveling the Energy Power boost »), avec
 * le ratio points/valeur de chaque Special (idle-adventure-special-points-v1.js). Valeurs courantes : `special` (1er) et `specialExtra` (les suivants),
 * voir idleAdventureSpecialsListV1. L'ancien choix (sExtra figés à leur Base value) est abandonné.
 */
export const SPECIALS_EN_V1=Object.freeze({
/*
 * Pas de fiche wiki dédiée ("Tutorial Cube" n'existe pas sur le wiki) :
 * ceci représente uniquement le déblocage SOREAL du Cube, jamais un objet
 * réel. Norman (2026-09-14) : "le cube de l'infini ne tombe plus dans le
 * monde tutoriel." Confirmé : zone valait "sewers" (une zone PLUS TARDIVE,
 * id="sewers", palier 7) alors que son propre nom et son dropLevel (4)
 * correspondent exactement à IDLE_ADVENTURE_ZONES[0] (id="tutorial",
 * palier 4, la toute première zone) — une vraie incohérence interne,
 * jamais une zone volontairement plus difficile.
 */
/*
 * Correctif 2026-09-14 (Norman : "le tutorial cube doit pouvoir être
 * équipé comme un bijoux avant d'être transformé en cube de l'infini") —
 * vérifié en direct sur le wiki NGU (page "4G's Merge and Boost Tutorial
 * Cube") : Type Accessory, Drop Zone "lvl 4 in Sewers" (pas Tutorial
 * Zone — la page Sewers le liste explicitement en "Rare Drops"), Power/
 * Toughness base 0, max au niveau 0 = 7, max au niveau 100 = 14 (la
 * formule ×(1+niveau/100) déjà utilisée par special() donne exactement
 * ce doublement avec p:7,t:7). Avant ce correctif, zone:"tutorial" et
 * p:0,t:0 (aucune stat, jamais sourcé du wiki) — et equip() rejetait
 * tout kind==='cube' sans distinction, alors que seul le Cube DÉJÀ
 * débloqué (transformé, cf. record() plus bas) doit rester inéquipable ;
 * avant ce seuil, c'est un accessoire normal comme n'importe quel autre.
 */
/*
 * Correctif 2026-09-16 (Norman : "tu ne dois rien laisser différent de
 * NGU") : wiki ngu-idle.fandom.com/wiki/Sewers, section Loot > Boss —
 * "4G's Merge and Boost Tutorial Cube lvl 4 (10% base chance)", listé
 * uniquement sous les drops du BOSS (Brown Slime), jamais des ennemis
 * normaux. bossOnly:true + dropChance:0.10 (roll dédié dans rollKill,
 * jamais mélangé au pool générique 4% partagé par les autres SPECIALS).
 */
/*
 * PISTE 1 de l'audit wiki 2026-09-18 : page ngu-idle.fandom.com/wiki/
 * 4G%27s_Merge_and_Boost_Tutorial_Cube vérifiée en direct (navigateur,
 * section "Specials") -- "Energy Speed -- Base value: 5% -- Max stat at
 * lvl 0: 15% -- Max stat at max lvl: 30% -- Base Points: 5 -- Max Points
 * at lvl 0: 15 -- Max Points at max lvl: 30". Aucun champ ne portait cette
 * magnitude avant ce correctif (SPECIALS.tutorialCube n'avait que p/t).
 * sBase:5 (valeur de départ SANS aucun boost -- seule stat de cet objet
 * dont le "Base value" wiki n'est PAS 0, contrairement à Power/Toughness/
 * HP Max/HP regen ci-dessus dont "Base value" vaut bien 0 chacun -- donc
 * PAS soumis au principe "démarre à 0" du commentaire special() plus bas,
 * la fiche wiki documente explicitement un plancher non nul pour ce
 * Special précis) ; sMax:15 (plafond au niveau 0, doublant à 30 au niveau
 * 100 via le même q=1+niveau/100 déjà utilisé pour p/t -- vérifié sur la
 * fiche que "Max stat at max lvl" = 2×"Max stat at lvl 0", identique à la
 * convention Power/Toughness). Câblé dans special()/idleAdventure
 * SpecialBaseStatsV1/applyBoost/cleanItem (voir ces fonctions). Le
 * multiplicateur Energy Speed réel (appliquer ce % à la vitesse Energy
 * effective) reste HORS PÉRIMÈTRE de ce correctif : stats.special (agrégat
 * idleAdventureEquipmentStatsV47, ligne ~2123) somme déjà TOUS les objets
 * SPECIALS équipés dans un seul nombre sans distinguer leur TYPE réel de
 * bonus (Energy Speed pour ce cube, mais Magic Cap/Power pour "A Dragon's
 * Left Ball", Energy/Magic Cap pour "A Sinusoidal Wave", etc. -- voir
 * commentaires "Specials seulement" plus bas, aucun avec magnitude vérifiée
 * pour l'instant) : câbler l'agrégat tel quel en "+X% Energy Speed"
 * mélangerait à tort des bonus de types différents. Nécessite d'abord un
 * audit par-objet du TYPE + magnitude de chaque Special (tâche séparée,
 * signalée dans le rapport final, pas un simple oubli).
 */
// PISTE 2 : sType ajouté (energySpeedPct) -- même magnitude PISTE 1, voir commentaire au-dessus de SPECIALS.
tutorialCube:{name:"Tutorial Cube",zone:"sewers",slot:"special",cube:true,dropLevel:4,p:7,t:7,sBase:5,sMax:15,sType:"energySpeedPct",bossOnly:true,dropChance:0.10},
// wiki : "The Tuba of Time" — Power/Toughness Max stat at lvl 0 = 10/10. Specials : Energy Power -- Base 5%, Max lvl0 15%, Max lvl100 30%.
tubaTime:{name:"Tuba of Time",zone:"forest",slot:"accessory",dropLevel:1,p:10,t:10,sBase:5,sMax:15,sType:"energyPowerPct"},
// wiki : "Cheese Grater" — Power Max at lvl 0 = 15 ; aucune stat Toughness listée. Specials : Drop Chance (1/2/4%), Energy Speed (20/40/80%), Magic Speed (15/30/60%).
cheeseGrater:{name:"Cheese Grater",zone:"cave",slot:"accessory",dropLevel:1,p:15,t:0,sBase:1,sMax:2,sType:"dropChancePct",sExtra:[{type:"energySpeedPct",base:20,max0:40,max100:80},{type:"magicSpeedPct",base:15,max0:30,max100:60}]},
// wiki : "A Dragon's Left Ball" — aucune stat Power/Toughness. Specials : Magic Cap (2/3/6%), Magic Power (20/50/100%).
skyBall:{name:"A Dragon's Left Ball",zone:"sky",slot:"accessory",dropLevel:1,p:0,t:0,sBase:2,sMax:3,sType:"magicCapPct",sExtra:[{type:"magicPowerPct",base:20,max0:50,max100:100}]},
// wiki : "Pissed Off Key" — Type Consumable, aucune stat.
pissedOffKey:{name:"Pissed Off Key",zone:"sky",slot:"special",unlock:"tower",bossOnly:true,dropLevel:0,p:0,t:0},
/*
 * Consommables de déblocage des titans (audit des bonus de complétion,
 * 2026-09-23) : jusqu'ici seulement des drapeaux unlockItems (premier kill),
 * jamais de vrais objets à fusionner -- leur set à un objet ("Number",
 * "Armpit", "Incriminating Evidence", "Severed Head", voir SETS_OBJETS_V1)
 * était donc incomplétable. Même modèle que Pissed Off Key : slot "special",
 * aucune stat (fiches wiki "Type: Consumable"), zone "" (drop de titan,
 * rollTitanLootV1, section Loot de la page du titan). Le drapeau
 * unlockItems/consume() qui débloque le système reste inchangé.
 */
// wiki : "A Number" (Id 102, Consumable) -- GRB : "A Number lvl 0 (guaranteed)".
aNumber:{name:"A Number",zone:"",slot:"special",dropLevel:0,p:0,t:0},
/*
 * wiki : "A Giant Seed" (Id 92, Consumable) -- Grand Corrupted Tree, Loot : "A Giant Seed lvl 0
 * (guaranteed)". 2026-09-24 : vrai objet fusionnable du Seed (set) ; réutilisé une fois
 * Yggdrasil débloqué, il donne max(1, ⌊L + L²/100⌋) graines (idleYggConsumeGiantSeedV1).
 */
giantSeed:{name:"A Giant Seed",zone:"",slot:"special",dropLevel:0,p:0,t:0},
// wiki : "UUG's Armpit Hair" (Id 141, Consumable) -- UUG : "UUG's Armpit Hair lvl 0 (guaranteed)".
uugHair:{name:"UUG's Armpit Hair",zone:"",slot:"special",dropLevel:0,p:0,t:0},
// wiki : "Incriminating Evidence" (Id 294, Consumable) -- Greasy Nerd : "Incriminating Evidence lvl 1 - guaranteed".
incriminatingEvidence:{name:"Incriminating Evidence",zone:"",slot:"special",dropLevel:1,p:0,t:0},
/*
 * wiki : "A Severed Unicorn's Head" (Id 343, Consumable) -- The Godmother :
 * "A Severed Unicorn's Head lvl 0 - guaranteed" (section Loot). Le gabarit
 * "Item data" indique "GM1lvldrop = 1" : désaccord entre deux pages du wiki ;
 * on suit la section Loot du titan, source déjà retenue par rollTitanLootV1.
 */
severedUnicornHead:{name:"A Severed Unicorn's Head",zone:"",slot:"special",dropLevel:0,p:0,t:0},
/*
 * Audit 2026-09-16 (Norman, page wiki réelle vérifiée en direct
 * ngu-idle.fandom.com/wiki/The_Lonely_Flubber) : Accessoire, Tutorial
 * Zone, ID 120, Set None, aucune stat Power/Toughness (le Respawn 8%
 * n'apparaît qu'à l'évolution "The Triple Flubber" à la maximisation,
 * non implémentée ici). Chance de drop unique parmi les SPECIALS :
 * "drop chance is based off in CURRENT run's highest defeated boss,
 * starting at 0.82% at boss 59, and increasing by 0.41% every boss
 * after, up to 100% at boss 300... This item is NOT affected by drop
 * chance multipliers." Roll dédié dans rollKill (jamais gagné avant
 * boss 59, jamais multiplié par dropMult) -- contrairement à Tutorial
 * Cube (bossOnly), tombe aussi bien sur les mobs normaux que sur le
 * boss de zone (confirmé par le wiki : "the item drops equally from
 * normal enemies and bosses"). set:"training" est purement cosmétique
 * (partage le dossier R2 déjà résolu pour le Training Set,
 * "SOREAL_IDLE_Tutorial_Set" -- voir IDLE_ITEM_SET_FOLDER_ALIASES côté
 * SOREAL-APP), jamais compté comme une pièce du set (checkSets() ignore
 * ce champ, voir commentaire de special() plus haut).
 */
/*
 * Correctif 2026-09-18 (wiki réel : "Id: 120... Item Drop Level / Drop
 * Zone(s): lvl 10 in Tutorial Zone") : dropLevel corrigé de 0 à 10 --
 * l'objet apparaît déjà au niveau 10 quand il tombe, comme documenté,
 * jamais niveau 0.
 */
flubber:{name:"The Lonely Flubber",zone:"tutorial",slot:"accessory",set:"training",dropLevel:10,p:0,t:0,customDropRoll:true},
// wiki : "A busted copy of Wandoos 98" — consommable de déblocage d'OS, aucune stat.
wandoos98:{name:"Wandoos 98",zone:"sky",slot:"special",unlock:"wandoos",dropLevel:0,p:0,t:0},
// wiki : "Magicite Crystal" — Power/Toughness Max at lvl 0 = 50/50. Specials : Magic Cap (4/6/12%), Magic Speed (25/50/100%).
magicite:{name:"Magicite Crystal",zone:"hsb",slot:"accessory",dropLevel:1,p:50,t:50,sBase:4,sMax:6,sType:"magicCapPct",sExtra:[{type:"magicSpeedPct",base:25,max0:50,max100:100}]},
// wiki : "Giant Windup Gear" — Power/Toughness Max at lvl 0 = 150/150. Specials : Drop Chance (4/8/16%), Energy Cap (3/5/10%), Magic Cap (3/5/10%).
windupGear:{name:"Giant Windup Gear",zone:"clock",slot:"accessory",dropLevel:1,p:150,t:150,sBase:4,sMax:8,sType:"dropChancePct",sExtra:[{type:"energyCapPct",base:3,max0:5,max100:10},{type:"magicCapPct",base:3,max0:5,max100:10}]},
// wiki : "A Sinusoidal Wave" — aucune stat Power/Toughness. Specials : Energy Cap (2.5/7/14%), Magic Cap (2.5/7/14%).
sinusoidalWave:{name:"A Sinusoidal Wave",zone:"2d",slot:"accessory",dropLevel:1,p:0,t:0,sBase:2.5,sMax:7,sType:"energyCapPct",sExtra:[{type:"magicCapPct",base:2.5,max0:7,max100:14}]},
// wiki : "Ghost Typewriter" — Power/Toughness Max at lvl 0 = 600/600. Specials : Drop Chance (9/18/36%), Energy Cap (8/16/32%), Magic Power (30/60/120%).
ghostTypewriter:{name:"Ghost Typewriter",zone:"ancient",slot:"accessory",dropLevel:1,p:600,t:600,sBase:9,sMax:18,sType:"dropChancePct",sExtra:[{type:"energyCapPct",base:8,max0:16,max100:32},{type:"magicPowerPct",base:30,max0:60,max100:120}]},
// wiki : "Gaudy Epaulettes" — Power/Toughness Max at lvl 0 = 900/900. Specials : Energy Bars (60/100/200%), Energy Cap (12/24/48%), Energy Power (50/90/180%).
gaudyShoulders:{name:"Gaudy Epaulettes",zone:"avsp",slot:"accessory",dropLevel:1,p:900,t:900,sBase:60,sMax:100,sType:"energyBarsPct",sExtra:[{type:"energyCapPct",base:12,max0:24,max100:48},{type:"energyPowerPct",base:50,max0:90,max100:180}]},
// wiki : "The F Tank" — Power/Toughness Max at lvl 0 = 4 000/4 000. Specials : Energy Bars (100/100/200%), Energy Cap (50/50/100%), Energy Power (100/160/320%).
fTank:{name:"The F Tank",zone:"mega",slot:"accessory",dropLevel:1,p:4000,t:4000,sBase:100,sMax:100,sType:"energyBarsPct",sExtra:[{type:"energyCapPct",base:50,max0:50,max100:100},{type:"energyPowerPct",base:100,max0:160,max100:320}]},
// wiki : "Ring of Apathy" — pas de section Stats du tout, aucune stat Power/Toughness, aucun Special (son seul effet réel est un mécanisme de parité de niveau pour UUG, pas un bonus chiffré).
ringOfApathy:{name:"Ring of Apathy",zone:"forest",slot:"accessory",dropLevel:1,maxFlag:"ringOfApathyMaxed",requiresBoss:100,p:0,t:0},
// wiki : "A Beard Comb" — aucune stat Power/Toughness. Specials : Beard Speed (6/12/24%), Energy Cap (40/60/120%), Magic Power (350/450/900%).
beardComb:{name:"Beard Comb",zone:"beardverse",slot:"accessory",dropLevel:1,p:0,t:0,sBase:6,sMax:12,sType:"beardSpeedPct",sExtra:[{type:"energyCapPct",base:40,max0:60,max100:120},{type:"magicPowerPct",base:350,max0:450,max100:900}]},
// wiki : "Random Crayons" — aucune stat Power/Toughness. Specials : Drop Chance (40/40/80%), Energy Cap (40/40/80%), Energy Power (400/400/800%), Magic Cap (40/40/80%), Magic Power (400/400/800%).
randomCrayons:{name:"Random Crayons",zone:"badly",slot:"accessory",dropLevel:1,p:0,t:0,sBase:40,sMax:40,sType:"dropChancePct",sExtra:[{type:"energyCapPct",base:40,max0:40,max100:80},{type:"energyPowerPct",base:400,max0:400,max100:800},{type:"magicCapPct",base:40,max0:40,max100:80},{type:"magicPowerPct",base:400,max0:400,max100:800}]},
// wiki : "Red Lipstick" — aucune stat Power/Toughness. Specials : Beard Speed (25/25/50%), Energy Power (1000/1000/2000%), Magic Cap (150/150/300%), Magic Power (1000/1000/2000%).
redLipstick:{name:"Red Lipstick",zone:"boring",slot:"accessory",dropLevel:1,p:0,t:0,sBase:25,sMax:25,sType:"beardSpeedPct",sExtra:[{type:"energyPowerPct",base:1000,max0:1000,max100:2000},{type:"magicCapPct",base:150,max0:150,max100:300},{type:"magicPowerPct",base:1000,max0:1000,max100:2000}]},
// wiki : "Candy Corn Necklace" — aucune stat Power/Toughness. Specials : Energy Bars (2000/2000/4000%), Magic Bars (2000/2000/4000%), NGU Speed (200/200/400%), Seed Gain (50/50/100%).
candyCornNecklace:{name:"Candy Corn Necklace",zone:"chocolate",slot:"accessory",dropLevel:1,p:0,t:0,sBase:2000,sMax:2000,sType:"energyBarsPct",sExtra:[{type:"magicBarsPct",base:2000,max0:2000,max100:4000},{type:"nguSpeedPct",base:200,max0:200,max100:400},{type:"seedGainPct",base:50,max0:50,max100:100}]},
/*
 * Audit round 3 (2026-09-14, Norman : "trop d'objets n'ont pas encore
 * leurs stats") : le butin garanti de Walderp (t5, IDLE_ADVENTURE_TITANS)
 * était `drop:"wanderersCane"`, traité par titan() UNIQUEMENT comme un
 * flag unlockItems.wanderersCane — jamais dans unlockMap (consume()
 * l'aurait rejeté) ni dans IDLE_ADVENTURE_UNLOCK_ITEMS_V1 côté client
 * (Soreal_Idle_UI.html, jamais de bouton "Utiliser" proposé pour lui) : un
 * flag inerte, jamais consommé, jamais transformé en objet réel. Vérifié
 * sur sa fiche wiki dédiée (ngu-idle.fandom.com/wiki/Wanderer's_Cane) :
 * "Type: Weapon", PAS un consommable de déblocage comme A Number/Giant
 * Seed/Scrap Paper/UUG's Armpit Hair/Heroic Sigil (ceux-là restent
 * corrects, vérifiés individuellement, chacun bien "Type: Consumable" sans
 * aucune stat sur sa propre fiche) — une vraie arme équipable manquante,
 * pas juste un déblocage de fonctionnalité. Power Max at lvl 0 = 170 000,
 * Toughness Max at lvl 0 = 12 000 (doublement à 340 000/12 000→24 000 au
 * niveau 100, même formule q=1+niveau/100 que les autres SPECIALS),
 * "Item Drop Level : lvl 10 from Titan Walderp" (guaranteed). Ajoutée ici
 * au catalogue et distribuée par titan() (voir plus bas, branche t5) au
 * lieu du flag unlockItems seul — laissé en place, inoffensif, pour ne pas
 * élargir le correctif au-delà du gap stat identifié.
 */
// PISTE 2 (2026-09-18) : fiche revérifiée -- aucune section "Specials", seulement Power/Toughness ci-dessus. Pas d'oubli.
wanderersCane:{name:"Wanderer's Cane",zone:"",slot:"weapon",dropLevel:10,p:170000,t:12000},
/*
 * V145 — butin exclusif aux paliers Normal+/Hard+/Brutal de The Beast
 * (t6), garanti au kill plutôt que le jet aléatoire à % du wiki (voir
 * commentaire sur IDLE_ADVENTURE_TITANS). zone:"" volontairement : ce
 * ne sont pas des butins de zone (jamais sélectionnés par rollKill),
 * uniquement distribués depuis titan().
 */
// wiki : "A Shrunken Voodoo Doll" (lvl 4, Titan The Beast Normal+) — Power/Toughness Max at lvl 0 = 66 666/66 666. Specials : Beard Speed (200/200/400%), NGU Speed (200/200/400%).
shrunkenVoodooDoll:{name:"Shrunken Voodoo Doll",zone:"",slot:"accessory",dropLevel:4,p:66666,t:66666,sBase:200,sMax:200,sType:"beardSpeedPct",sExtra:[{type:"nguSpeedPct",base:200,max0:200,max100:400}]},
// wiki : "A Priceless Van-Gogh Painting" (lvl 4, Titan The Beast Hard+) — Power/Toughness Max at lvl 0 = 30 000/30 000. Specials : Energy Cap (200/200/400%), Gold Drops (3000/3000/6000%), Magic Cap (200/200/400%).
pricelessVanGoghPainting:{name:"A Priceless Van-Gogh Painting",zone:"",slot:"accessory",dropLevel:4,p:30000,t:30000,sBase:200,sMax:200,sType:"energyCapPct",sExtra:[{type:"goldDropsPct",base:3000,max0:3000,max100:6000},{type:"magicCapPct",base:200,max0:200,max100:400}]},
// wiki : "A Small Gerbil" (lvl 4, Titan The Beast Brutal) — Power/Toughness Max at lvl 0 = 100 000/100 000. Specials : Energy Power (2000/6000/12000%), Magic Cap (200/600/1200%), Magic Power (2000/6000/12000%).
smallGerbil:{name:"A Small Gerbil",zone:"",slot:"accessory",dropLevel:4,p:100000,t:100000,sBase:2000,sMax:6000,sType:"energyPowerPct",sExtra:[{type:"magicCapPct",base:200,max0:600,max100:1200},{type:"magicPowerPct",base:2000,max0:6000,max100:12000}]},
/*
 * Compétences Adventure avancées — objets de déblocage NGU.
 * - Red Liquid : lvl 5, rare drop du Grand Corrupted Tree, consommé pour
 *   Hyper Regen ; niveau 100 = Red Liquid Set.
 * - Purple Liquid : lvl 1, rare drop The Beast Normal+, consommé pour
 *   Beast Mode ; niveau 100 = Purple Liquid Set.
 * - Grey Liquid : transformation d'un Small Gerbil lvl 100 en Sadistic,
 *   consommé pour MOVE 69.
 * Ce sont des consommables, jamais des accessoires équipables.
 */
mysteriousRedLiquid:{name:"Mysterious Red Liquid",zone:"",slot:"consumable",dropLevel:5,p:0,t:0,consumable:true,maxFlag:"redLiquidMaxed"},
mysteriousPurpleLiquid:{name:"Mysterious Purple Liquid",zone:"",slot:"consumable",dropLevel:1,p:0,t:0,consumable:true,maxFlag:"purpleLiquidMaxed"},
mysteriousGreyLiquid:{name:"Mysterious Grey Liquid",zone:"",slot:"consumable",dropLevel:0,p:0,t:0,consumable:true},
/*
 * Objets manquants (audit 2026-09-23) : chaque ligne est copiée de la fiche
 * wiki de l'objet (miroir local NGU-Wiki, section "Stats" et "Specials"), puis
 * recoupée avec son gabarit "Item data <objet>" (mêmes nombres). Même
 * convention que les accessoires ci-dessus : p/t = "Max stat at lvl 0" de
 * Power/Toughness (0 si la fiche n'en liste pas), sBase/sMax = "Base value"/
 * "Max stat at lvl 0" du 1er Special, sExtra = les suivants ; "Max stat at max
 * lvl" = 2x "Max stat at lvl 0" vérifié pour chaque stat. "A Broken Pair Of
 * Scissors" : sa page est écrasée dans le miroir par une redirection (collision
 * de casse Windows), valeurs lues sur son gabarit "Item data". zone = zone
 * d'Aventure unique de l'objet, "" quand il vient d'un titan ou de plusieurs
 * zones (les vrais taux sont dans IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2 et
 * rollTitanLootV1). Les Evil Bonus Accs (Edgy Magicite Crystal ... Rad Mixtape)
 * suivent le modèle des accessoires "Normal Bonus Accs" (Tuba ... Candy Corn
 * Necklace) : des SPECIALS, sans set (bonus du set "+20% Adventure stats!" non
 * exprimable avec les setRewards existants).
 */
// wiki : "Looty McLootFace" (Id 67, Accessory) — Power/Toughness Max at lvl 0 = 2/2. Specials : Drop Chance (5/10/20%).
lootyMcLootFace:{name:"Looty McLootFace",zone:"",slot:"accessory",dropLevel:0,p:2,t:2,sBase:5,sMax:10,sType:"dropChancePct"},
// wiki : "Ascended Forest Pendant" (Id 76, Accessory) — Power/Toughness Max at lvl 0 = 100/100. Specials : Drop Chance (0/20/40%), Gold Drops (0/200/400%).
ascendedForestPendant:{name:"Ascended Forest Pendant",zone:"",slot:"accessory",dropLevel:0,p:100,t:100,sBase:0,sMax:20,sType:"dropChancePct",sExtra:[{type:"goldDropsPct",base:0,max0:200,max100:400}]},
// wiki : "Ascended Ascended Forest Pendant" (Id 94, Accessory) — Power/Toughness Max at lvl 0 = 800/800. Specials : Drop Chance (20/40/80%), Gold Drops (200/400/800%), Magic Power (20/100/200%).
ascendedAscendedForestPendant:{name:"Ascended Ascended Forest Pendant",zone:"",slot:"accessory",dropLevel:1,p:800,t:800,sBase:20,sMax:40,sType:"dropChancePct",sExtra:[{type:"goldDropsPct",base:200,max0:400,max100:800},{type:"magicPowerPct",base:20,max0:100,max100:200}]},
// wiki : "Dragon Wings" (Id 110, Accessory) — Power/Toughness Max at lvl 0 = 82/82. Specials : Gold Drops (0/200/400%), Magic Cap (14.14/22.82/45.64%), Magic Power (41.4/108.2/216.2%).
dragonWings:{name:"Dragon Wings",zone:"ancient",slot:"accessory",dropLevel:4,p:82,t:82,sBase:0,sMax:200,sType:"goldDropsPct",sExtra:[{type:"magicCapPct",base:14.14,max0:22.82,max100:45.64},{type:"magicPowerPct",base:41.4,max0:108.2,max100:216.2}]},
// wiki : "Stapler" (Id 118, Accessory) — Power/Toughness Max at lvl 0 = 500/0. Specials : Energy Cap (22.33/30/60%), Respawn (3/6/12%).
stapler:{name:"Stapler",zone:"",slot:"accessory",dropLevel:4,p:500,t:0,sBase:22.33,sMax:30,sType:"energyCapPct",sExtra:[{type:"respawnReductionPct",base:3,max0:6,max100:12}]},
// wiki : "A Beanie" (Id 127, Head) — Power/Toughness Max at lvl 0 = 2000/3000. Specials : Magic Cap (20/53/106%), Magic Power (70/184.9/369.8%).
aBeanie:{name:"A Beanie",zone:"avsp",slot:"head",dropLevel:4,p:2000,t:3000,sBase:20,sMax:53,sType:"magicCapPct",sExtra:[{type:"magicPowerPct",base:70,max0:184.9,max100:369.8}]},
// wiki : "Sir Looty McLootington III, Esquire" (Id 128, Accessory) — Power/Toughness Max at lvl 0 = 200/200. Specials : Drop Chance (10/40/80%), Energy Power (0/100/200%), Magic Power (0/100/200%).
sirLooty:{name:"Sir Looty McLootington III, Esquire",zone:"",slot:"accessory",dropLevel:5,p:200,t:200,sBase:10,sMax:40,sType:"dropChancePct",sExtra:[{type:"energyPowerPct",base:0,max0:100,max100:200},{type:"magicPowerPct",base:0,max0:100,max100:200}]},
// wiki : "Ascended Ascended Ascended Pendant" (Id 142, Accessory) — Power/Toughness Max at lvl 0 = 40000/40000. Specials : Drop Chance (100/100/200%), Energy Power (270/270/540%), Gold Drops (800/800/1600%).
ascendedX3Pendant:{name:"Ascended Ascended Ascended Pendant",zone:"",slot:"accessory",dropLevel:1,p:40000,t:40000,sBase:100,sMax:100,sType:"dropChancePct",sExtra:[{type:"energyPowerPct",base:270,max0:270,max100:540},{type:"goldDropsPct",base:800,max0:800,max100:1600}]},
// wiki : "An Infinitely Long Strand of Beard Hair" (Id 148, Accessory) — Power/Toughness Max at lvl 0 = 8000/8000. Specials : Beard Speed (10/10/20%), Energy Power (450/450/900%), Magic Power (350/350/700%).
beardHairStrand:{name:"An Infinitely Long Strand of Beard Hair",zone:"beardverse",slot:"accessory",dropLevel:5,p:8000,t:8000,sBase:10,sMax:10,sType:"beardSpeedPct",sExtra:[{type:"energyPowerPct",base:450,max0:450,max100:900},{type:"magicPowerPct",base:350,max0:350,max100:700}]},
// wiki : "UUG's 'Special' Ring" (Id 149, Accessory) — Power/Toughness Max at lvl 0 = 12000/12000. Specials : Beard Speed (10/10/20%), NGU Speed (100/100/200%), Seed Gain (15/15/30%).
uugSpecialRing:{name:"UUG's 'Special' Ring",zone:"",slot:"accessory",dropLevel:4,p:12000,t:12000,sBase:10,sMax:10,sType:"beardSpeedPct",sExtra:[{type:"nguSpeedPct",base:100,max0:100,max100:200},{type:"seedGainPct",base:15,max0:15,max100:30}]},
// wiki : "The Candy Cane of Destiny" (Id 159, Weapon) — Power/Toughness Max at lvl 0 = 170000/12000. Specials : Energy Bars (1000/1000/2000%), Energy Cap (100/100/200%), Energy Power (1000/1000/2000%), Magic Bars (1000/1000/2000%), Magic Cap (100/100/200%), Magic Power (1000/1000/2000%).
candyCaneDestiny:{name:"The Candy Cane of Destiny",zone:"",slot:"weapon",dropLevel:0,p:170000,t:12000,sBase:1000,sMax:1000,sType:"energyBarsPct",sExtra:[{type:"energyCapPct",base:100,max0:100,max100:200},{type:"energyPowerPct",base:1000,max0:1000,max100:2000},{type:"magicBarsPct",base:1000,max0:1000,max100:2000},{type:"magicCapPct",base:100,max0:100,max100:200},{type:"magicPowerPct",base:1000,max0:1000,max100:2000}]},
// wiki : "Fanny Pack" (Id 160, Accessory) — Power/Toughness Max at lvl 0 = 15000/15000. Specials : Drop Chance (30/30/60%), Energy Cap (30/30/60%), Energy Power (500/500/1000%), Magic Cap (30/30/60%), Magic Power (500/500/1000%).
fannyPack:{name:"Fanny Pack",zone:"",slot:"accessory",dropLevel:10,p:15000,t:15000,sBase:30,sMax:30,sType:"dropChancePct",sExtra:[{type:"energyCapPct",base:30,max0:30,max100:60},{type:"energyPowerPct",base:500,max0:500,max100:1000},{type:"magicCapPct",base:30,max0:30,max100:60},{type:"magicPowerPct",base:500,max0:500,max100:1000}]},
// wiki : "Dorky Glasses" (Id 161, Accessory) — Power/Toughness Max at lvl 0 = 5000/5000. Specials : Energy Bars (500/500/1000%), Magic Bars (500/500/1000%), NGU Speed (150/150/300%), Wandoos Speed (120/120/240%).
dorkyGlasses:{name:"Dorky Glasses",zone:"",slot:"accessory",dropLevel:10,p:5000,t:5000,sBase:500,sMax:500,sType:"energyBarsPct",sExtra:[{type:"magicBarsPct",base:500,max0:500,max100:1000},{type:"nguSpeedPct",base:150,max0:150,max100:300},{type:"wandoosSpeedPct",base:120,max0:120,max100:240}]},
// wiki : "King Looty" (Id 169, Accessory) — Power/Toughness Max at lvl 0 = 100000/100000. Specials : Drop Chance (100/100/200%), Energy Cap (40/40/80%), Energy Power (400/400/800%), Magic Cap (40/40/80%), Magic Power (400/400/800%).
kingLooty:{name:"King Looty",zone:"",slot:"accessory",dropLevel:1,p:100000,t:100000,sBase:100,sMax:100,sType:"dropChancePct",sExtra:[{type:"energyCapPct",base:40,max0:40,max100:80},{type:"energyPowerPct",base:400,max0:400,max100:800},{type:"magicCapPct",base:40,max0:40,max100:80},{type:"magicPowerPct",base:400,max0:400,max100:800}]},
// wiki : "Ascended x4 Pendant" (Id 170, Accessory) — Power/Toughness Max at lvl 0 = 100000/100000. Specials : Drop Chance (250/250/500%), Energy Cap (120/120/240%), Magic Cap (120/120/240%), Quest Drops (5/5/10%).
ascendedX4Pendant:{name:"Ascended x4 Pendant",zone:"",slot:"accessory",dropLevel:1,p:100000,t:100000,sBase:250,sMax:250,sType:"dropChancePct",sExtra:[{type:"energyCapPct",base:120,max0:120,max100:240},{type:"magicCapPct",base:120,max0:120,max100:240},{type:"questDropsPct",base:5,max0:5,max100:10}]},
// wiki : "The Stealthiest Armour" (Id 178, Chest) — Power/Toughness Max at lvl 0 = 8000/150000. Specials : Energy Bars (2000/2000/4000%), Energy Cap (210/210/420%), Magic Bars (2000/2000/4000%), Magic Cap (210/210/420%), NGU Speed (200/200/400%).
stealthiestArmour:{name:"The Stealthiest Armour",zone:"boring",slot:"chest",dropLevel:5,p:8000,t:150000,sBase:2000,sMax:2000,sType:"energyBarsPct",sExtra:[{type:"energyCapPct",base:210,max0:210,max100:420},{type:"magicBarsPct",base:2000,max0:2000,max100:4000},{type:"magicCapPct",base:210,max0:210,max100:420},{type:"nguSpeedPct",base:200,max0:200,max100:400}]},
// wiki : "A Bald Egg" (Id 189, Accessory) — Power/Toughness Max at lvl 0 = 33333/33333. Specials : Energy Cap (150/150/300%), Magic Cap (150/150/300%), Wandoos Speed (200/200/400%).
baldEgg:{name:"A Bald Egg",zone:"",slot:"accessory",dropLevel:4,p:33333,t:33333,sBase:150,sMax:150,sType:"energyCapPct",sExtra:[{type:"magicCapPct",base:150,max0:150,max100:300},{type:"wandoosSpeedPct",base:200,max0:200,max100:400}]},
// wiki : "A Giant Apple" (Id 193, Accessory) — Power/Toughness Max at lvl 0 = 50000/50000. Specials : Seed Gain (50/50/100%), Yggdrasil Yield (10/10/20%).
giantApple:{name:"A Giant Apple",zone:"",slot:"accessory",dropLevel:4,p:50000,t:50000,sBase:50,sMax:50,sType:"seedGainPct",sExtra:[{type:"yggdrasilYieldPct",base:10,max0:10,max100:20}]},
// wiki : "A Power Pill" (Id 194, Accessory) — Power/Toughness Max at lvl 0 = 250000/250000. Specials : Energy Bars (3000/3000/6000%), Energy Cap (300/300/600%), Energy Power (3000/3000/6000%), Magic Bars (3000/3000/6000%), Magic Cap (300/300/600%), Magic Power (3000/3000/6000%).
powerPill:{name:"A Power Pill",zone:"",slot:"accessory",dropLevel:4,p:250000,t:250000,sBase:3000,sMax:3000,sType:"energyBarsPct",sExtra:[{type:"energyCapPct",base:300,max0:300,max100:600},{type:"energyPowerPct",base:3000,max0:3000,max100:6000},{type:"magicBarsPct",base:3000,max0:3000,max100:6000},{type:"magicCapPct",base:300,max0:300,max100:600},{type:"magicPowerPct",base:3000,max0:3000,max100:6000}]},
// wiki : "Energy Bar Bar (Accessory)" (Id 226, Accessory) — Power/Toughness Max at lvl 0 = 50000/50000. Specials : Energy Bars (2200/2200/4400%), Energy Cap (250/250/500%), Energy Power (3000/3000/6000%).
energyBarBarAccessory:{name:"Energy Bar Bar (Accessory)",zone:"chocolate",slot:"accessory",dropLevel:1,p:50000,t:50000,sBase:2200,sMax:2200,sType:"energyBarsPct",sExtra:[{type:"energyCapPct",base:250,max0:250,max100:500},{type:"energyPowerPct",base:3000,max0:3000,max100:6000}]},
// wiki : "Magic Bar Bar (Accessory)" (Id 227, Accessory) — Power/Toughness Max at lvl 0 = 50000/50000. Specials : Magic Bars (2200/2200/4400%), Magic Cap (250/250/500%), Magic Power (3000/3000/6000%).
magicBarBarAccessory:{name:"Magic Bar Bar (Accessory)",zone:"chocolate",slot:"accessory",dropLevel:1,p:50000,t:50000,sBase:2200,sMax:2200,sType:"magicBarsPct",sExtra:[{type:"magicCapPct",base:250,max0:250,max100:500},{type:"magicPowerPct",base:3000,max0:3000,max100:6000}]},
// wiki : "Ascended x5 Pendant" (Id 229, Accessory) — Power/Toughness Max at lvl 0 = 400000/400000. Specials : Energy Cap (500/500/1000%), Energy Power (5000/5000/10000%), Magic Cap (500/500/1000%), Magic Power (5000/5000/10000%), NGU Speed (250/250/500%).
ascendedX5Pendant:{name:"Ascended x5 Pendant",zone:"",slot:"accessory",dropLevel:1,p:400000,t:400000,sBase:500,sMax:500,sType:"energyCapPct",sExtra:[{type:"energyPowerPct",base:5000,max0:5000,max100:10000},{type:"magicCapPct",base:500,max0:500,max100:1000},{type:"magicPowerPct",base:5000,max0:5000,max100:10000},{type:"nguSpeedPct",base:250,max0:250,max100:500}]},
// wiki : "Emperor Looty" (Id 230, Accessory) — Power/Toughness Max at lvl 0 = 300000/300000. Specials : Drop Chance (300/300/600%), Energy Cap (150/150/300%), Energy Power (1500/1500/3000%), Magic Cap (150/150/300%), Magic Power (1500/1500/3000%).
emperorLooty:{name:"Emperor Looty",zone:"",slot:"accessory",dropLevel:1,p:300000,t:300000,sBase:300,sMax:300,sType:"dropChancePct",sExtra:[{type:"energyCapPct",base:150,max0:150,max100:300},{type:"energyPowerPct",base:1500,max0:1500,max100:3000},{type:"magicCapPct",base:150,max0:150,max100:300},{type:"magicPowerPct",base:1500,max0:1500,max100:3000}]},
// wiki : "Ascended x6 Pendant" (Id 295, Accessory) — Power/Toughness Max at lvl 0 = 20000000/20000000. Specials : Resource 3 Cap (50/50/100%), Resource 3 Bars (100/100/200%), Resource 3 Power (100/100/200%).
ascendedX6Pendant:{name:"Ascended x6 Pendant",zone:"",slot:"accessory",dropLevel:2,p:20000000,t:20000000,sBase:50,sMax:50,sType:"r3CapPct",sExtra:[{type:"r3BarsPct",base:100,max0:100,max100:200},{type:"r3PowerPct",base:100,max0:100,max100:200}]},
// wiki : "GALACTIC HERALD LOOTY" (Id 296, Accessory) — Power/Toughness Max at lvl 0 = 30000000/30000000. Specials : Drop Chance (600/600/1200%), Energy Power (25000/25000/50000%), Magic Power (25000/25000/50000%), Resource 3 Cap (20/20/40%).
galacticHeraldLooty:{name:"GALACTIC HERALD LOOTY",zone:"",slot:"accessory",dropLevel:2,p:30000000,t:30000000,sBase:600,sMax:600,sType:"dropChancePct",sExtra:[{type:"energyPowerPct",base:25000,max0:25000,max100:50000},{type:"magicPowerPct",base:25000,max0:25000,max100:50000},{type:"r3CapPct",base:20,max0:20,max100:40}]},
// wiki : "Ascended x7 Pendant" (Id 388, Accessory) — Power/Toughness Max at lvl 0 = 400000000/400000000. Specials : Resource 3 Cap (40/40/80%), Resource 3 Power (400/400/800%), Wish Speed (40/40/80%).
ascendedX7Pendant:{name:"Ascended x7 Pendant",zone:"",slot:"accessory",dropLevel:50,p:400000000,t:400000000,sBase:40,sMax:40,sType:"r3CapPct",sExtra:[{type:"r3PowerPct",base:400,max0:400,max100:800},{type:"wishSpeedPct",base:40,max0:40,max100:80}]},
// wiki : "SUPREME INTELLIGENCE LOOTY" (Id 389, Accessory) — Power/Toughness Max at lvl 0 = 500000000/500000000. Specials : Drop Chance (3000/3000/6000%), Energy Power (500000/500000/1000000%), Gold Drops (200000/200000/400000%), Magic Power (500000/500000/1000000%).
supremeIntelligenceLooty:{name:"SUPREME INTELLIGENCE LOOTY",zone:"",slot:"accessory",dropLevel:50,p:500000000,t:500000000,sBase:3000,sMax:3000,sType:"dropChancePct",sExtra:[{type:"energyPowerPct",base:500000,max0:500000,max100:1000000},{type:"goldDropsPct",base:200000,max0:200000,max100:400000},{type:"magicPowerPct",base:500000,max0:500000,max100:1000000}]},
/*
 * Ascensions finales (audit des objets, 2026-09-24) : ces quatre objets ne tombent nulle part ;
 * on les obtient uniquement par ascension (ITEM_EVOLUTIONS_V1, transformAdventureItemV1). Valeurs
 * des modèles "Template:Item data <objet>" (Base value = Max stat at lvl 0 pour chacun, x2 au
 * niveau 100) ; pBase/tBase = Base value Power/Toughness. Specials dans l'ordre de la fiche.
 */
// wiki "Ascended x8 Pendant" (Id 430, Accessory, évolution de Ascended x7 Pendant) : Power/Toughness 1 500 000 000 ; Specials : Hack Speed (100/100/200%), Resource 3 Cap (100/100/200%), Wish Speed (100/100/200%).
ascendedX8Pendant:{name:"Ascended x8 Pendant",zone:"",slot:"accessory",dropLevel:0,p:1500000000,t:1500000000,pBase:1500000000,tBase:1500000000,sBase:100,sMax:100,sType:"hackSpeedPct",sExtra:[{type:"r3CapPct",base:100,max0:100,max100:200},{type:"wishSpeedPct",base:100,max0:100,max100:200}]},
// wiki "Ascended x9 Pendant" (Id 504, Accessory, évolution de Ascended x8 Pendant) : Power/Toughness 3 000 000 000 ; Specials : Hack Speed (200/200/400%), Resource 3 Cap (200/200/400%), Wish Speed (200/200/400%).
ascendedX9Pendant:{name:"Ascended x9 Pendant",zone:"",slot:"accessory",dropLevel:0,p:3000000000,t:3000000000,pBase:3000000000,tBase:3000000000,sBase:200,sMax:200,sType:"hackSpeedPct",sExtra:[{type:"r3CapPct",base:200,max0:200,max100:400},{type:"wishSpeedPct",base:200,max0:200,max100:400}]},
// wiki "GRAND DEMON LOOTZIFER" (Id 431, Accessory, évolution de SUPREME INTELLIGENCE LOOTY) : Power/Toughness 1 000 000 000 ; Specials : Drop Chance (6660/6660/13320%), Energy Power (3330000/3330000/6660000%), Gold Drops (666000/666000/1332000%), Magic Power (3330000/3330000/6660000%).
grandDemonLootzifer:{name:"GRAND DEMON LOOTZIFER",zone:"",slot:"accessory",dropLevel:0,p:1000000000,t:1000000000,pBase:1000000000,tBase:1000000000,sBase:6660,sMax:6660,sType:"dropChancePct",sExtra:[{type:"energyPowerPct",base:3330000,max0:3330000,max100:6660000},{type:"goldDropsPct",base:666000,max0:666000,max100:1332000},{type:"magicPowerPct",base:3330000,max0:3330000,max100:6660000}]},
// wiki "LootzLrtozlOtZlOtTlooTTLoooLLLTTTToTlOOt" (Id 505, Accessory, évolution de GRAND DEMON LOOTZIFER ; "Glitchy Looty" du Glossary) : Power/Toughness 3 000 000 000 ; Specials : Drop Chance (26660/26660/53320%), Energy Power (10000000/10000000/20000000%), Gold Drops (2200000/2200000/4400000%), Magic Power (10000000/10000000/20000000%).
glitchyLooty:{name:"LootzLrtozlOtZlOtTlooTTLoooLLLTTTToTlOOt",zone:"",slot:"accessory",dropLevel:0,p:3000000000,t:3000000000,pBase:3000000000,tBase:3000000000,sBase:26660,sMax:26660,sType:"dropChancePct",sExtra:[{type:"energyPowerPct",base:10000000,max0:10000000,max100:20000000},{type:"goldDropsPct",base:2200000,max0:2200000,max100:4400000},{type:"magicPowerPct",base:10000000,max0:10000000,max100:20000000}]},
// wiki : "A 9mm Beretta" (Id 366, Weapon) — Power/Toughness Max at lvl 0 = 1400000000/70000000. Specials : Augment Speed (750/750/1500%), NGU Speed (700/700/1400%), Resource 3 Cap (21/21/42%).
beretta9mm:{name:"A 9mm Beretta",zone:"westworld",slot:"weapon",dropLevel:1,p:1400000000,t:70000000,sBase:750,sMax:750,sType:"augmentSpeedPct",sExtra:[{type:"nguSpeedPct",base:700,max0:700,max100:1400},{type:"r3CapPct",base:21,max0:21,max100:42}]},
// wiki : "Edgy Magicite Crystal" (Id 445, Accessory) — Power/Toughness Max at lvl 0 = 666000/666000. Specials : Energy Power (6000/6000/12000%), Magic Cap (600/600/1200%), NGU Speed (250/250/500%).
edgyMagicite:{name:"Edgy Magicite Crystal",zone:"evilverse",slot:"accessory",dropLevel:1,p:666000,t:666000,sBase:6000,sMax:6000,sType:"energyPowerPct",sExtra:[{type:"magicCapPct",base:600,max0:600,max100:1200},{type:"nguSpeedPct",base:250,max0:250,max100:500}]},
// wiki : "Creepy Doll" (Id 446, Accessory) — Power/Toughness Max at lvl 0 = 930000/930000. Specials : Daycare Speed (12/12/24%), Energy Power (8500/8500/17000%), Magic Power (8500/8500/17000%), Respawn (3/3/6%).
creepyDoll:{name:"Creepy Doll",zone:"pinkprincess",slot:"accessory",dropLevel:1,p:930000,t:930000,sBase:12,sMax:12,sType:"daycareSpeedPct",sExtra:[{type:"energyPowerPct",base:8500,max0:8500,max100:17000},{type:"magicPowerPct",base:8500,max0:8500,max100:17000},{type:"respawnReductionPct",base:3,max0:3,max100:6}]},
// wiki : "THE EXPONENTIAL" (Id 447, Accessory) — Power/Toughness Max at lvl 0 = 2800000/2800000. Specials : Drop Chance (200/200/400%), Energy Cap (1200/1200/2400%), Energy Power (12000/12000/24000%), Magic Cap (1200/1200/2400%), Magic Power (12000/12000/24000%).
theExponential:{name:"THE EXPONENTIAL",zone:"metaland",slot:"accessory",dropLevel:1,p:2800000,t:2800000,sBase:200,sMax:200,sType:"dropChancePct",sExtra:[{type:"energyCapPct",base:1200,max0:1200,max100:2400},{type:"energyPowerPct",base:12000,max0:12000,max100:24000},{type:"magicCapPct",base:1200,max0:1200,max100:2400},{type:"magicPowerPct",base:12000,max0:12000,max100:24000}]},
// wiki : "Mt. Rushmore Roosevelt's Nose" (Id 448, Accessory) — Power/Toughness Max at lvl 0 = 5000000/5000000. Specials : Energy Bars (15000/15000/30000%), Energy Power (15000/15000/30000%), Magic Bars (15000/15000/30000%), Magic Cap (2500/2500/5000%), Magic Power (15000/15000/30000%).
rushmoreNose:{name:"Mt. Rushmore Roosevelt's Nose",zone:"interdimensional",slot:"accessory",dropLevel:1,p:5000000,t:5000000,sBase:15000,sMax:15000,sType:"energyBarsPct",sExtra:[{type:"energyPowerPct",base:15000,max0:15000,max100:30000},{type:"magicBarsPct",base:15000,max0:15000,max100:30000},{type:"magicCapPct",base:2500,max0:2500,max100:5000},{type:"magicPowerPct",base:15000,max0:15000,max100:30000}]},
// wiki : "THRO, ODIGNSLUG" (Id 449, Accessory) — Power/Toughness Max at lvl 0 = 17000000/17000000. Specials : Energy Power (38000/38000/76000%), Magic Power (38000/38000/76000%), NGU Speed (450/450/900%), Wish Speed (4/4/8%).
throOdignslug:{name:"THRO, ODIGNSLUG",zone:"typozone",slot:"accessory",dropLevel:1,p:17000000,t:17000000,sBase:38000,sMax:38000,sType:"energyPowerPct",sExtra:[{type:"magicPowerPct",base:38000,max0:38000,max100:76000},{type:"nguSpeedPct",base:450,max0:450,max100:900},{type:"wishSpeedPct",base:4,max0:4,max100:8}]},
// wiki : "A Link Cable" (Id 450, Accessory) — Power/Toughness Max at lvl 0 = 28000000/28000000. Specials : Energy Cap (6200/6200/12400%), Energy Power (62000/62000/124000%), Hack Speed (10/10/20%), Magic Cap (6200/6200/12400%), Magic Power (62000/62000/124000%).
linkCable:{name:"A Link Cable",zone:"fadlands",slot:"accessory",dropLevel:1,p:28000000,t:28000000,sBase:6200,sMax:6200,sType:"energyCapPct",sExtra:[{type:"energyPowerPct",base:62000,max0:62000,max100:124000},{type:"hackSpeedPct",base:10,max0:10,max100:20},{type:"magicCapPct",base:6200,max0:6200,max100:12400},{type:"magicPowerPct",base:62000,max0:62000,max100:124000}]},
// wiki : "A Hand Cursor" (Id 451, Accessory) — Power/Toughness Max at lvl 0 = 35000000/35000000. Specials : Drop Chance (900/900/1800%), Resource 3 Power (110/110/220%), Wish Speed (7/7/14%).
handCursor:{name:"A Hand Cursor",zone:"jrpgville",slot:"accessory",dropLevel:1,p:35000000,t:35000000,sBase:900,sMax:900,sType:"dropChancePct",sExtra:[{type:"r3PowerPct",base:110,max0:110,max100:220},{type:"wishSpeedPct",base:7,max0:7,max100:14}]},
// wiki : "Rad Mixtape" (Id 452, Accessory) — Power/Toughness Max at lvl 0 = 100000000/100000000. Specials : Energy Power (150000/150000/300000%), Magic Power (150000/150000/300000%), NGU Speed (500/500/1000%), Resource 3 Cap (15/15/30%).
radMixtape:{name:"Rad Mixtape",zone:"radlands",slot:"accessory",dropLevel:1,p:100000000,t:100000000,sBase:150000,sMax:150000,sType:"energyPowerPct",sExtra:[{type:"magicPowerPct",base:150000,max0:150000,max100:300000},{type:"nguSpeedPct",base:500,max0:500,max100:1000},{type:"r3CapPct",base:15,max0:15,max100:30}]},
// wiki : "An Ordinary Calculator" (Id 242, Accessory) — Power/Toughness Max at lvl 0 = 250000/250000. Specials : Energy Bars (6000/6000/12000%), Magic Bars (6000/6000/12000%), NGU Speed (300/300/600%), Resource 3 Power (5/5/10%).
ordinaryCalculator:{name:"An Ordinary Calculator",zone:"",slot:"accessory",dropLevel:4,p:250000,t:250000,sBase:6000,sMax:6000,sType:"energyBarsPct",sExtra:[{type:"magicBarsPct",base:6000,max0:6000,max100:12000},{type:"nguSpeedPct",base:300,max0:300,max100:600},{type:"r3PowerPct",base:5,max0:5,max100:10}]},
// wiki : "Anime Figurine" (Id 243, Accessory) — Power/Toughness Max at lvl 0 = 250000/250000. Specials : Energy Bars (6000/6000/12000%), Energy Power (8000/8000/16000%), Magic Cap (500/500/1000%), Magic Power (8000/8000/16000%).
animeFigurine:{name:"Anime Figurine",zone:"",slot:"accessory",dropLevel:4,p:250000,t:250000,sBase:6000,sMax:6000,sType:"energyBarsPct",sExtra:[{type:"energyPowerPct",base:8000,max0:8000,max100:16000},{type:"magicCapPct",base:500,max0:500,max100:1000},{type:"magicPowerPct",base:8000,max0:8000,max100:16000}]},
// wiki : "The D20" (Id 244, Accessory) — Power/Toughness Max at lvl 0 = 250000/250000. Specials : Energy Bars (9000/9000/18000%), Energy Cap (800/800/1600%), Energy Power (9000/9000/18000%).
theD20:{name:"The D20",zone:"",slot:"accessory",dropLevel:4,p:250000,t:250000,sBase:9000,sMax:9000,sType:"energyBarsPct",sExtra:[{type:"energyCapPct",base:800,max0:800,max100:1600},{type:"energyPowerPct",base:9000,max0:9000,max100:18000}]},
// wiki : "The D8" (Id 245, Accessory) — Power/Toughness Max at lvl 0 = 300000/250000. Specials : Magic Bars (9000/9000/18000%), Magic Cap (800/800/1600%), Magic Power (9000/9000/18000%).
theD8:{name:"The D8",zone:"",slot:"accessory",dropLevel:4,p:300000,t:250000,sBase:9000,sMax:9000,sType:"magicBarsPct",sExtra:[{type:"magicCapPct",base:800,max0:800,max100:1600},{type:"magicPowerPct",base:9000,max0:9000,max100:18000}]},
// wiki : "Anime Bodypillow" (Id 246, Accessory) — Power/Toughness Max at lvl 0 = 500000/500000. Specials : NGU Speed (150/150/300%), Resource 3 Power (10/10/20%), Respawn (2/2/4%).
animeBodypillow:{name:"Anime Bodypillow",zone:"",slot:"accessory",dropLevel:4,p:500000,t:500000,sBase:150,sMax:150,sType:"nguSpeedPct",sExtra:[{type:"r3PowerPct",base:10,max0:10,max100:20},{type:"respawnReductionPct",base:2,max0:2,max100:4}]},
// wiki : "Red Meeple Thingy" (Id 247, Accessory) — Power/Toughness Max at lvl 0 = 500000/500000. Specials : Augment Speed (250/250/500%), Magic Power (12000/12000/24000%), Resource 3 Power (10/10/20%).
redMeeple:{name:"Red Meeple Thingy",zone:"",slot:"accessory",dropLevel:4,p:500000,t:500000,sBase:250,sMax:250,sType:"augmentSpeedPct",sExtra:[{type:"magicPowerPct",base:12000,max0:12000,max100:24000},{type:"r3PowerPct",base:10,max0:10,max100:20}]},
// wiki : "A Bag of Trash" (Id 248, Accessory) — Power/Toughness Max at lvl 0 = 500000/500000. Specials : Daycare Speed (10/10/20%), Energy Cap (1000/1000/2000%), Magic Cap (1000/1000/2000%), Resource 3 Bars (5/5/10%).
bagOfTrash:{name:"A Bag of Trash",zone:"",slot:"accessory",dropLevel:4,p:500000,t:500000,sBase:10,sMax:10,sType:"daycareSpeedPct",sExtra:[{type:"energyCapPct",base:1000,max0:1000,max100:2000},{type:"magicCapPct",base:1000,max0:1000,max100:2000},{type:"r3BarsPct",base:5,max0:5,max100:10}]},
// wiki : "Heart Shaped Panties" (Id 249, Accessory) — Power/Toughness Max at lvl 0 = 666666/666666. Specials : Energy Cap (667/667/1333%), Magic Cap (667/667/1333%), NGU Speed (333/333/666%), Resource 3 Power (6.67/6.67/13.33%).
heartShapedPanties:{name:"Heart Shaped Panties",zone:"",slot:"accessory",dropLevel:4,p:666666,t:666666,sBase:667,sMax:667,sType:"energyCapPct",sExtra:[{type:"magicCapPct",base:667,max0:667,max100:1333},{type:"nguSpeedPct",base:333,max0:333,max100:666},{type:"r3PowerPct",base:6.67,max0:6.67,max100:13.33}]},
// wiki : "Violin Case" (Id 272, Accessory) — Power/Toughness Max at lvl 0 = 7000000/7000000. Specials : Energy Bars (13000/13000/26000%), Energy Cap (1300/1300/2600%), Magic Bars (13000/13000/26000%), Magic Cap (1300/1300/2600%), Resource 3 Power (13/13/26%).
violinCase:{name:"Violin Case",zone:"",slot:"accessory",dropLevel:4,p:7000000,t:7000000,sBase:13000,sMax:13000,sType:"energyBarsPct",sExtra:[{type:"energyCapPct",base:1300,max0:1300,max100:2600},{type:"magicBarsPct",base:13000,max0:13000,max100:26000},{type:"magicCapPct",base:1300,max0:1300,max100:2600},{type:"r3PowerPct",base:13,max0:13,max100:26}]},
// wiki : "Molotov Cocktail" (Id 273, Accessory) — Power/Toughness Max at lvl 0 = 10000000/10000000. Specials : NGU Speed (200/200/400%), Seed Gain (50/50/100%), Wandoos Speed (800/800/1600%).
molotovCocktail:{name:"Molotov Cocktail",zone:"",slot:"accessory",dropLevel:4,p:10000000,t:10000000,sBase:200,sMax:200,sType:"nguSpeedPct",sExtra:[{type:"seedGainPct",base:50,max0:50,max100:100},{type:"wandoosSpeedPct",base:800,max0:800,max100:1600}]},
// wiki : "The Godmother's Ring" (Id 274, Accessory) — Power/Toughness Max at lvl 0 = 15000000/15000000. Specials : Drop Chance (700/700/1400%), Gold Drops (30000/30000/60000%), Resource 3 Cap (5.5/5.5/11%).
godmothersRing:{name:"The Godmother's Ring",zone:"",slot:"accessory",dropLevel:4,p:15000000,t:15000000,sBase:700,sMax:700,sType:"dropChancePct",sExtra:[{type:"goldDropsPct",base:30000,max0:30000,max100:60000},{type:"r3CapPct",base:5.5,max0:5.5,max100:11}]},
// wiki : "The Godmother's Wand" (Id 275, Accessory) — Power/Toughness Max at lvl 0 = 22000000/22000000. Specials : Energy Cap (6000/6000/12000%), Energy Power (60000/60000/120000%), Magic Cap (6000/6000/12000%), Magic Power (60000/60000/120000%), Yggdrasil Yield (7.5/7.5/15%).
godmothersWand:{name:"The Godmother's Wand",zone:"",slot:"accessory",dropLevel:4,p:22000000,t:22000000,sBase:6000,sMax:6000,sType:"energyCapPct",sExtra:[{type:"energyPowerPct",base:60000,max0:60000,max100:120000},{type:"magicCapPct",base:6000,max0:6000,max100:12000},{type:"magicPowerPct",base:60000,max0:60000,max100:120000},{type:"yggdrasilYieldPct",base:7.5,max0:7.5,max100:15}]},
// wiki : "Left Fairy Wing" (Id 276, Accessory) — Power/Toughness Max at lvl 0 = 60000000/60000000. Specials : Energy Cap (8000/8000/16000%), Resource 3 Cap (8/8/16%), Resource 3 Power (80/80/160%).
leftFairyWing:{name:"Left Fairy Wing",zone:"",slot:"accessory",dropLevel:4,p:60000000,t:60000000,sBase:8000,sMax:8000,sType:"energyCapPct",sExtra:[{type:"r3CapPct",base:8,max0:8,max100:16},{type:"r3PowerPct",base:80,max0:80,max100:160}]},
// wiki : "Right Fairy Wing" (Id 277, Accessory) — Aucune stat Power/Toughness. Specials : Energy Bars (90000/90000/180000%), Energy Power (90000/90000/180000%), Magic Bars (90000/90000/180000%), Magic Cap (9000/9000/18000%), Magic Power (90000/90000/180000%).
rightFairyWing:{name:"Right Fairy Wing",zone:"",slot:"accessory",dropLevel:4,p:0,t:0,sBase:90000,sMax:90000,sType:"energyBarsPct",sExtra:[{type:"energyPowerPct",base:90000,max0:90000,max100:180000},{type:"magicBarsPct",base:90000,max0:90000,max100:180000},{type:"magicCapPct",base:9000,max0:9000,max100:18000},{type:"magicPowerPct",base:90000,max0:90000,max100:180000}]},
// wiki : "The Joker" (Id 327, Accessory) — Power/Toughness Max at lvl 0 = 66600000/66600000. Specials : Cooking (10000000/10000000/20000000%), Resource 3 Cap (40/40/80%), Wish Speed (5/5/10%).
theJoker:{name:"The Joker",zone:"",slot:"accessory",dropLevel:4,p:66600000,t:66600000,sBase:10000000,sMax:10000000,sType:"cookingPct",sExtra:[{type:"r3CapPct",base:40,max0:40,max100:80},{type:"wishSpeedPct",base:5,max0:5,max100:10}]},
// wiki : "Antlers of the Exile" (Id 328, Accessory) — Power/Toughness Max at lvl 0 = 80000000/0. Specials : Energy Cap (12000/12000/24000%), Energy Power (100000/100000/200000%), Magic Cap (12000/12000/24000%), Magic Power (100000/100000/200000%), Resource 3 Power (120/120/240%).
antlersExile:{name:"Antlers of the Exile",zone:"",slot:"accessory",dropLevel:4,p:80000000,t:0,sBase:12000,sMax:12000,sType:"energyCapPct",sExtra:[{type:"energyPowerPct",base:100000,max0:100000,max100:200000},{type:"magicCapPct",base:12000,max0:12000,max100:24000},{type:"magicPowerPct",base:100000,max0:100000,max100:200000},{type:"r3PowerPct",base:120,max0:120,max100:240}]},
// wiki : "The Credit Card" (Id 329, Accessory) — Aucune stat Power/Toughness. Specials : Energy Bars (170000/170000/340000%), Gold Drops (250000/250000/500000%), Magic Bars (170000/170000/340000%), Quest Drops (5/5/10%).
creditCard:{name:"The Credit Card",zone:"",slot:"accessory",dropLevel:4,p:0,t:0,sBase:170000,sMax:170000,sType:"energyBarsPct",sExtra:[{type:"goldDropsPct",base:250000,max0:250000,max100:500000},{type:"magicBarsPct",base:170000,max0:170000,max100:340000},{type:"questDropsPct",base:5,max0:5,max100:10}]},
// wiki : "Tentacle of the Exile" (Id 330, Accessory) — Power/Toughness Max at lvl 0 = 110000000/100000000. Specials : Energy Power (190000/190000/380000%), Magic Power (190000/190000/380000%), Resource 3 Cap (18/18/36%), Resource 3 Bars (180/180/360%).
tentacleExile:{name:"Tentacle of the Exile",zone:"",slot:"accessory",dropLevel:4,p:110000000,t:100000000,sBase:190000,sMax:190000,sType:"energyPowerPct",sExtra:[{type:"magicPowerPct",base:190000,max0:190000,max100:380000},{type:"r3CapPct",base:18,max0:18,max100:36},{type:"r3BarsPct",base:180,max0:180,max100:360}]},
// wiki : "The Skip Card" (Id 331, Accessory) — Power/Toughness Max at lvl 0 = 120000000/120000000. Specials : Energy Power (280000/280000/560000%), Magic Power (280000/280000/560000%), NGU Speed (250/250/500%), Resource 3 Power (260/260/520%).
skipCard:{name:"The Skip Card",zone:"",slot:"accessory",dropLevel:4,p:120000000,t:120000000,sBase:280000,sMax:280000,sType:"energyPowerPct",sExtra:[{type:"magicPowerPct",base:280000,max0:280000,max100:560000},{type:"nguSpeedPct",base:250,max0:250,max100:500},{type:"r3PowerPct",base:260,max0:260,max100:520}]},
// wiki : "Antennae of the Exile" (Id 332, Accessory) — Power/Toughness Max at lvl 0 = 100000000/100000000. Specials : Energy Cap (26000/26000/52000%), Hack Speed (12/12/24%), Magic Cap (26000/26000/52000%), Resource 3 Power (270/270/540%).
antennaeExile:{name:"Antennae of the Exile",zone:"",slot:"accessory",dropLevel:4,p:100000000,t:100000000,sBase:26000,sMax:26000,sType:"energyCapPct",sExtra:[{type:"hackSpeedPct",base:12,max0:12,max100:24},{type:"magicCapPct",base:26000,max0:26000,max100:52000},{type:"r3PowerPct",base:270,max0:270,max100:540}]},
// wiki : "The Black Lotus" (Id 333, Accessory) — Power/Toughness Max at lvl 0 = 150000000/150000000. Specials : Energy Cap (40000/40000/80000%), Magic Cap (40000/40000/80000%), Resource 3 Cap (45/45/90%), Wish Speed (20/20/40%).
blackLotus:{name:"The Black Lotus",zone:"",slot:"accessory",dropLevel:4,p:150000000,t:150000000,sBase:40000,sMax:40000,sType:"energyCapPct",sExtra:[{type:"magicCapPct",base:40000,max0:40000,max100:80000},{type:"r3CapPct",base:45,max0:45,max100:90},{type:"wishSpeedPct",base:20,max0:20,max100:40}]},
// wiki : "Buster of the Exile" (Id 334, Accessory) — Power/Toughness Max at lvl 0 = 250000000/250000000. Specials : Energy Power (400000/400000/800000%), Hack Speed (20/20/40%), Magic Power (400000/400000/800000%), Resource 3 Power (400/400/800%).
busterExile:{name:"Buster of the Exile",zone:"",slot:"accessory",dropLevel:4,p:250000000,t:250000000,sBase:400000,sMax:400000,sType:"energyPowerPct",sExtra:[{type:"hackSpeedPct",base:20,max0:20,max100:40},{type:"magicPowerPct",base:400000,max0:400000,max100:800000},{type:"r3PowerPct",base:400,max0:400,max100:800}]},
// wiki : "'The Cricket'" (Id 380, Weapon) — Power/Toughness Max at lvl 0 = 2100000000/90000000. Specials : Energy Cap (28300/28300/56600%), Energy Power (249000/249000/498000%), Magic Cap (28300/28300/56600%), Magic Power (249000/249000/498000%), Resource 3 Power (253/253/506%).
theCricket:{name:"'The Cricket'",zone:"",slot:"weapon",dropLevel:4,p:2100000000,t:90000000,sBase:28300,sMax:28300,sType:"energyCapPct",sExtra:[{type:"energyPowerPct",base:249000,max0:249000,max100:498000},{type:"magicCapPct",base:28300,max0:28300,max100:56600},{type:"magicPowerPct",base:249000,max0:249000,max100:498000},{type:"r3PowerPct",base:253,max0:253,max100:506}]},
// wiki : "Evil Rubber Ducky" (Id 381, Accessory) — Power/Toughness Max at lvl 0 = 225000000/225000000. Specials : Energy Bars (304000/304000/608000%), Energy Cap (30300/30300/60600%), Magic Bars (304000/304000/608000%), Magic Cap (30300/30300/60600%), Magic Power (301000/301000/602000%).
evilRubberDucky:{name:"Evil Rubber Ducky",zone:"",slot:"accessory",dropLevel:4,p:225000000,t:225000000,sBase:304000,sMax:304000,sType:"energyBarsPct",sExtra:[{type:"energyCapPct",base:30300,max0:30300,max100:60600},{type:"magicBarsPct",base:304000,max0:304000,max100:608000},{type:"magicCapPct",base:30300,max0:30300,max100:60600},{type:"magicPowerPct",base:301000,max0:301000,max100:602000}]},
// wiki : "A Gas Giant" (Id 382, Accessory) — Power/Toughness Max at lvl 0 = 290000000/290000000. Specials : Augment Speed (800/800/1600%), Resource 3 Cap (30.4/30.4/60.8%), Resource 3 Power (302/302/604%).
gasGiant:{name:"A Gas Giant",zone:"",slot:"accessory",dropLevel:4,p:290000000,t:290000000,sBase:800,sMax:800,sType:"augmentSpeedPct",sExtra:[{type:"r3CapPct",base:30.4,max0:30.4,max100:60.8},{type:"r3PowerPct",base:302,max0:302,max100:604}]},
// wiki : "An Inanimate Carbon Rod" (Id 383, Accessory) — Power/Toughness Max at lvl 0 = 400000000/400000000. Specials : Hack Speed (20/20/40%), Yggdrasil Yield (4/4/8%), Wandoos Speed (1300/1300/2600%).
carbonRod:{name:"An Inanimate Carbon Rod",zone:"",slot:"accessory",dropLevel:4,p:400000000,t:400000000,sBase:20,sMax:20,sType:"hackSpeedPct",sExtra:[{type:"yggdrasilYieldPct",base:4,max0:4,max100:8},{type:"wandoosSpeedPct",base:1300,max0:1300,max100:2600}]},
// wiki : "A Funky Klein Bottle" (Id 384, Accessory) — Power/Toughness Max at lvl 0 = 380000000/380000000. Specials : Energy Power (255000/255000/510000%), Magic Power (255000/255000/510000%), Resource 3 Power (365/365/730%), 2nd Energy Power (255000/255000/510000%), 2nd Magic Power (255000/255000/510000%).
kleinBottle:{name:"A Funky Klein Bottle",zone:"",slot:"accessory",dropLevel:4,p:380000000,t:380000000,sBase:255000,sMax:255000,sType:"energyPowerPct",sExtra:[{type:"magicPowerPct",base:255000,max0:255000,max100:510000},{type:"r3PowerPct",base:365,max0:365,max100:730},{type:"energyPowerPct",base:255000,max0:255000,max100:510000},{type:"magicPowerPct",base:255000,max0:255000,max100:510000}]},
// wiki : "Giant Alien Bug Nest" (Id 385, Accessory) — Power/Toughness Max at lvl 0 = 456000000/456000000. Specials : Energy Power (437000/437000/874000%), Magic Power (437000/437000/874000%), Resource 3 Cap (44/44/88%), Quest Drops (8/8/16%).
alienBugNest:{name:"Giant Alien Bug Nest",zone:"",slot:"accessory",dropLevel:4,p:456000000,t:456000000,sBase:437000,sMax:437000,sType:"energyPowerPct",sExtra:[{type:"magicPowerPct",base:437000,max0:437000,max100:874000},{type:"r3CapPct",base:44,max0:44,max100:88},{type:"questDropsPct",base:8,max0:8,max100:16}]},
// wiki : "The Key" (Id 386, Accessory) — Power/Toughness Max at lvl 0 = 456000000/456000000. Specials : Augment Speed (750/750/1500%), Energy Power (437000/437000/874000%), Magic Power (437000/437000/874000%), NGU Speed (1600/1600/3200%).
theKey:{name:"The Key",zone:"",slot:"accessory",dropLevel:4,p:456000000,t:456000000,sBase:750,sMax:750,sType:"augmentSpeedPct",sExtra:[{type:"energyPowerPct",base:437000,max0:437000,max100:874000},{type:"magicPowerPct",base:437000,max0:437000,max100:874000},{type:"nguSpeedPct",base:1600,max0:1600,max100:3200}]},
// wiki : "A Skipping Stone" (Id 424, Accessory) — Power/Toughness Max at lvl 0 = 1582000000/1582000000. Specials : Energy Bars (711000/711000/1422000%), Energy Power (703000/703000/1406000%), Hack Speed (78.8/78.8/157.6%), Magic Bars (711000/711000/1422000%), Magic Power (703000/703000/1406000%).
skippingStone:{name:"A Skipping Stone",zone:"",slot:"accessory",dropLevel:4,p:1582000000,t:1582000000,sBase:711000,sMax:711000,sType:"energyBarsPct",sExtra:[{type:"energyPowerPct",base:703000,max0:703000,max100:1406000},{type:"hackSpeedPct",base:78.8,max0:78.8,max100:157.6},{type:"magicBarsPct",base:711000,max0:711000,max100:1422000},{type:"magicPowerPct",base:703000,max0:703000,max100:1406000}]},
// wiki : "A Bed Rock" (Id 425, Accessory) — Power/Toughness Max at lvl 0 = 1576000000/1576000000. Specials : Energy Power (999000/999000/1998000%), Magic Power (999000/999000/1998000%), Resource 3 Cap (72.1/72.1/144.2%), Wish Speed (99.9/99.9/199.8%).
bedRock:{name:"A Bed Rock",zone:"",slot:"accessory",dropLevel:4,p:1576000000,t:1576000000,sBase:999000,sMax:999000,sType:"energyPowerPct",sExtra:[{type:"magicPowerPct",base:999000,max0:999000,max100:1998000},{type:"r3CapPct",base:72.1,max0:72.1,max100:144.2},{type:"wishSpeedPct",base:99.9,max0:99.9,max100:199.8}]},
// wiki : "Rock Candy" (Id 426, Accessory) — Power/Toughness Max at lvl 0 = 2679000000/2679000000. Specials : Energy Bars (1300000/1300000/2600000%), Energy Power (1250000/1250000/2500000%), Hack Speed (100/100/200%), Magic Bars (1300000/1300000/2600000%), Magic Power (1250000/1250000/2500000%).
rockCandy:{name:"Rock Candy",zone:"",slot:"accessory",dropLevel:4,p:2679000000,t:2679000000,sBase:1300000,sMax:1300000,sType:"energyBarsPct",sExtra:[{type:"energyPowerPct",base:1250000,max0:1250000,max100:2500000},{type:"hackSpeedPct",base:100,max0:100,max100:200},{type:"magicBarsPct",base:1300000,max0:1300000,max100:2600000},{type:"magicPowerPct",base:1250000,max0:1250000,max100:2500000}]},
// wiki : "A Broken Pair Of Scissors" (Id 427, Accessory) — Power/Toughness Max at lvl 0 = 2700000000/2700000000. Specials : Energy Power (1320000/1320000/2640000%), Magic Power (1320000/1320000/2640000%), NGU Speed (4000/4000/8000%), Resource 3 Cap (132/132/264%).
brokenScissors:{name:"A Broken Pair Of Scissors",zone:"",slot:"accessory",dropLevel:4,p:2700000000,t:2700000000,sBase:1320000,sMax:1320000,sType:"energyPowerPct",sExtra:[{type:"magicPowerPct",base:1320000,max0:1320000,max100:2640000},{type:"nguSpeedPct",base:4000,max0:4000,max100:8000},{type:"r3CapPct",base:132,max0:132,max100:264}]},
// wiki : "Portable Stairway (To Heaven)" (Id 428, Accessory) — Power/Toughness Max at lvl 0 = 4860000000/4860000000. Specials : Hack Speed (160/160/320%), NGU Speed (10000/10000/20000%), Wish Speed (160/160/320%).
portableStairway:{name:"Portable Stairway (To Heaven)",zone:"",slot:"accessory",dropLevel:4,p:4860000000,t:4860000000,sBase:160,sMax:160,sType:"hackSpeedPct",sExtra:[{type:"nguSpeedPct",base:10000,max0:10000,max100:20000},{type:"wishSpeedPct",base:160,max0:160,max100:320}]},
// wiki : "Amplifier" (Id 429, Accessory) — Power/Toughness Max at lvl 0 = 4840000000/4840000000. Specials : Energy Power (2000000/2000000/4000000%), Magic Power (2000000/2000000/4000000%), Resource 3 Power (2000/2000/4000%), Yggdrasil Yield (10/10/20%).
amplifier:{name:"Amplifier",zone:"",slot:"accessory",dropLevel:4,p:4840000000,t:4840000000,sBase:2000000,sMax:2000000,sType:"energyPowerPct",sExtra:[{type:"magicPowerPct",base:2000000,max0:2000000,max100:4000000},{type:"r3PowerPct",base:2000,max0:2000,max100:4000},{type:"yggdrasilYieldPct",base:10,max0:10,max100:20}]},
// wiki : "Raw Slab of Wood" (Id 477, Accessory) — Power/Toughness Max at lvl 0 = 6300000000/6300000000. Specials : Energy Cap (185000/185000/370000%), Magic Cap (185000/185000/370000%), Resource 3 Cap (187/187/374%), Resource 3 Power (1860/1860/3720%).
rawSlabOfWood:{name:"Raw Slab of Wood",zone:"",slot:"accessory",dropLevel:4,p:6300000000,t:6300000000,sBase:185000,sMax:185000,sType:"energyCapPct",sExtra:[{type:"magicCapPct",base:185000,max0:185000,max100:370000},{type:"r3CapPct",base:187,max0:187,max100:374},{type:"r3PowerPct",base:1860,max0:1860,max100:3720}]},
// wiki : "Tie of Apathy" (Id 478, Accessory) — Power/Toughness Max at lvl 0 = 8999999000/8999999000. Specials : Gold Drops (4000000/4000000/8000000%), Resource 3 Power (1850/1850/3700%), Wish Speed (185/185/370%).
tieOfApathy:{name:"Tie of Apathy",zone:"",slot:"accessory",dropLevel:4,p:8999999000,t:8999999000,sBase:4000000,sMax:4000000,sType:"goldDropsPct",sExtra:[{type:"r3PowerPct",base:1850,max0:1850,max100:3700},{type:"wishSpeedPct",base:185,max0:185,max100:370}]},
// wiki : "The Titan Effigy" (Id 479, Accessory) — Power/Toughness Max at lvl 0 = 13000000000/13000000000. Specials : Resource 3 Cap (220/220/440%), Resource 3 Bars (2200/2200/4400%), Resource 3 Power (2200/2200/4400%).
titanEffigy:{name:"The Titan Effigy",zone:"",slot:"accessory",dropLevel:4,p:13000000000,t:13000000000,sBase:220,sMax:220,sType:"r3CapPct",sExtra:[{type:"r3BarsPct",base:2200,max0:2200,max100:4400},{type:"r3PowerPct",base:2200,max0:2200,max100:4400}]},
/*
 * Cœurs du 4G's Sellout Shop (2026-09-23) : fiches "My <X> Heart" et gabarits
 * "Item data My <X> Heart" du miroir NGU-Wiki. Jamais lâchés en Aventure
 * (zone "", aucune ligne de butin) : uniquement achetés au Sellout Shop
 * (idle-hearts-v1.js), puis montés au niveau 100 par fusion ou en Daycare.
 * Même convention que les autres accessoires : p/t = "Max stat at lvl 0" de
 * Power/Toughness ("Max stat at max lvl" = 2x vérifié pour chacun), sType =
 * 1er Special de la fiche, sExtra = les suivants ({base,max0,max100}).
 * pBase/tBase = "Base value" Power/Toughness (69 sur la plupart des cœurs,
 * non nul contrairement aux objets de zone) : valeur de départ de l'objet
 * acheté, avant tout Boost. HP Max/HP regen de la fiche = 3 x Power et
 * 0,03 x Toughness (vérifié sur les 10 fiches), déjà dérivés par
 * idleAdventureEquipmentStatsV47. Aucune fiche ne donne de niveau d'achat :
 * dropLevel 0 (pas de "Item Drop Level" publié).
 * expPct / apPct : nouveaux types de Special (EXP du Red Heart, AP du Yellow
 * Heart), seuls objets du wiki à les porter ; consommés par idle-hearts-v1.js.
 */
// wiki "My Red Heart" (Id 119) : Power 69/100/200, Toughness 69/100/200 ; Specials : Drop Chance (0/30/60%), EXP (2.5/5/10%).
heartRed:{name:"My Red Heart",zone:"",slot:"accessory",dropLevel:0,sellout:"heartRed",p:100,t:100,pBase:69,tBase:69,sBase:0,sMax:30,sType:"dropChancePct",sExtra:[{type:"expPct",base:2.5,max0:5,max100:10}]},
// wiki "My Yellow Heart" (Id 129) : Power 69/100/200, Toughness 69/100/200 ; Specials : Arbitrary Points (5/10/20%), Gold Drops (0/300/600%).
heartYellow:{name:"My Yellow Heart",zone:"",slot:"accessory",dropLevel:0,sellout:"heartYellow",p:100,t:100,pBase:69,tBase:69,sBase:5,sMax:10,sType:"apPct",sExtra:[{type:"goldDropsPct",base:0,max0:300,max100:600}]},
// wiki "My Brown Heart" (Id 162) : Power 69/100/200, Toughness 69/100/200 ; Specials : Energy Power (100/100/200%), Magic Power (100/100/200%), Seed Gain (0/35/70%).
heartBrown:{name:"My Brown Heart",zone:"",slot:"accessory",dropLevel:0,sellout:"heartBrown",p:100,t:100,pBase:69,tBase:69,sBase:100,sMax:100,sType:"energyPowerPct",sExtra:[{type:"magicPowerPct",base:100,max0:100,max100:200},{type:"seedGainPct",base:0,max0:35,max100:70}]},
// wiki "My Green Heart" (Id 171) : Power 69/100/200, Toughness 69/100/200 ; Specials : Beard Speed (30/30/60%), Drop Chance (50/50/100%), Respawn (4/4/8%).
heartGreen:{name:"My Green Heart",zone:"",slot:"accessory",dropLevel:0,sellout:"heartGreen",p:100,t:100,pBase:69,tBase:69,sBase:30,sMax:30,sType:"beardSpeedPct",sExtra:[{type:"dropChancePct",base:50,max0:50,max100:100},{type:"respawnReductionPct",base:4,max0:4,max100:8}]},
// wiki "My Blue Heart" (Id 196) : Power 69/420/840, Toughness 69/420/840 ; Specials : Gold Drops (100/100/200%), NGU Speed (40/40/80%).
heartBlue:{name:"My Blue Heart",zone:"",slot:"accessory",dropLevel:0,sellout:"heartBlue",p:420,t:420,pBase:69,tBase:69,sBase:100,sMax:100,sType:"goldDropsPct",sExtra:[{type:"nguSpeedPct",base:40,max0:40,max100:80}]},
// wiki "My Purple Heart" (Id 212) : Power 69/100/200, Toughness 69/1 000/2 000 ; Specials : Beard Speed (40/40/80%), Drop Chance (40/40/80%).
heartPurple:{name:"My Purple Heart",zone:"",slot:"accessory",dropLevel:0,sellout:"heartPurple",p:100,t:1000,pBase:69,tBase:69,sBase:40,sMax:40,sType:"beardSpeedPct",sExtra:[{type:"dropChancePct",base:40,max0:40,max100:80}]},
// wiki "My Orange Heart" (Id 293) : Power 69/100/200, Toughness 69/1 000/2 000 ; Specials : Gold Drops (300/300/600%), Quest Drops (5/5/10%).
heartOrange:{name:"My Orange Heart",zone:"",slot:"accessory",dropLevel:0,sellout:"heartOrange",p:100,t:1000,pBase:69,tBase:69,sBase:300,sMax:300,sType:"goldDropsPct",sExtra:[{type:"questDropsPct",base:5,max0:5,max100:10}]},
// wiki "My Grey Heart" (Id 297, "unlocked by Resource 3 unlocked") : Power/Toughness 1M/1M/2M ; Specials : Resource 3 Cap (20/20/40%), Resource 3 Bars (20/20/40%).
heartGrey:{name:"My Grey Heart",zone:"",slot:"accessory",dropLevel:0,sellout:"heartGrey",p:1000000,t:1000000,pBase:1000000,tBase:1000000,sBase:20,sMax:20,sType:"r3CapPct",sExtra:[{type:"r3BarsPct",base:20,max0:20,max100:40}]},
// wiki "My Pink Heart" (Id 344) : Power/Toughness 3M/3M/6M ; Specials : Daycare Speed (10/10/20%), Wish Speed (10/10/20%).
heartPink:{name:"My Pink Heart",zone:"",slot:"accessory",dropLevel:0,sellout:"heartPink",p:3000000,t:3000000,pBase:3000000,tBase:3000000,sBase:10,sMax:10,sType:"daycareSpeedPct",sExtra:[{type:"wishSpeedPct",base:10,max0:10,max100:20}]},
/*
 * wiki "My Rainbow Heart" (Id 390) : Power 69/100/200, Toughness 69/100/200 ; Specials : Cooking
 * (0/69 000 000/138 000 000 -- valeur telle que publiée ; page Cooking : chaque objet "Cooking %"
 * compte x1,03 quelle que soit sa valeur, idleCookingGearV1), Resource 3 Bars (100/100/200%),
 * Seed Gain (30/30/60%).
 */
heartRainbow:{name:"My Rainbow Heart",zone:"",slot:"accessory",dropLevel:0,sellout:"heartRainbow",p:100,t:100,pBase:69,tBase:69,sBase:0,sMax:69000000,sType:"cookingPct",sExtra:[{type:"r3BarsPct",base:100,max0:100,max100:200},{type:"seedGainPct",base:30,max0:30,max100:60}]},
/*
 * wiki "A busted copy of Wandoos XL" (Id 163, Consumable, aucune stat) : "lvl 20 from Titan
 * Walderp / lvl 3 in Badly Drawn World / lvl 8 in Boring-Ass Earth" (la page "Wandoos" écrit
 * "level 5" pour Badly Drawn World : on suit la fiche de l'objet et la page de la zone, qui
 * concordent sur 3). Tranché le 2026-09-24 : quatre sources disent 3 contre une seule pour 5 --
 * le modèle de données "Template:Item data A busted copy of Wandoos XL" (BDlvldrop = 3, source
 * structurée d'où la fiche est générée), la fiche de l'objet, la section Loot de "Badly Drawn
 * World" et le tableau des zones de "Adventure Mode" ("A busted copy of Wandoos XL (3)").
 * Consommé pour débloquer Wandoos XL puis pour monter le niveau d'OS XL
 * (idle-hearts-v1.js, action méta consumeWandoosCopy).
 */
wandoosXl:{name:"Wandoos XL",zone:"",slot:"special",dropLevel:20,p:0,t:0},
/*
 * wiki "The Triple Flubber" (Id 121, Accessory, évolution de The Lonely Flubber) : aucune stat
 * Power/Toughness ; Specials : Respawn (2/4/8%). Obtenu uniquement en transformant une Lonely
 * Flubber niveau 100 ("level it to level 100 and CTRL + Click to transform it").
 */
tripleFlubber:{name:"The Triple Flubber",zone:"",slot:"accessory",dropLevel:0,p:0,t:0,sBase:2,sMax:4,sType:"respawnReductionPct"},
/*
 * wiki "Heroic Sigil" (Id 292, Consumable) : "lvl 4 (guaranteed) from Titan The Beast (Easy+)" ;
 * wiki "A Still-Beating Heart" (Id 391, Consumable) : The Exile, Loot : "A Still-Beating Heart lvl 4
 * (guaranteed)". Jusqu'ici seulement des drapeaux unlockItems (déblocage de Questing / Cards,
 * inchangé) : ils deviennent de vrais objets fusionnables pour que leur set à un objet ("Heroic
 * Sigil (set)", "Still-Beating Heart (set)") soit complétable, comme A Number / UUG's Armpit Hair.
 */
heroicSigil:{name:"Heroic Sigil",zone:"",slot:"special",dropLevel:4,p:0,t:0},
stillBeatingHeart:{name:"A Still-Beating Heart",zone:"",slot:"special",dropLevel:4,p:0,t:0}
});

export const SPECIALS=Object.freeze(Object.fromEntries(Object.entries(SPECIALS_EN_V1).map(([id,d])=>[id,{...d,name:NOMS_SPECIALS_FR_V1[id]||d.name}])));

export const IDLE_ADVENTURE_SPECIALS=SPECIALS;

/*
 * Sets d'objets hors équipement (audit des bonus de complétion, 2026-09-23) :
 * pages "<Set> (set)" du miroir NGU-Wiki dont les objets sont des SPECIALS
 * (consommables de déblocage ou accessoires) plutôt que des pièces de SETS.
 * Même règle de complétion que SETS : chaque objet listé doit avoir atteint
 * le niveau 100 (itemList[definitionId].maxLevel, par fusion). Clés de
 * récompense = le vocabulaire setRewards déjà consommé par les moteurs.
 * Volontairement hors de SETS : SETS pilote aussi les pièces d'équipement
 * (item(), catalogue, drops de zone), ces objets-là n'en sont pas.
 */
export const SETS_OBJETS_V1=Object.freeze({
  /*
   * "Pissed Off Key (set)" : un seul objet (Pissed Off Key). "Bonus for
   * Completion: Gain 10% faster progress towards Perk Points (PP) in the
   * I.T.O.P.O.D!" -- même pont setRewards.itopodPpPct que Pretty Pink Princess
   * (multiplicateur de la progression de PP, idle-ngu-progression.js).
   */
  pissedOffKey:{name:"Pissed Off Key Set",items:["pissedOffKey"],reward:{itopodPpPct:.10}},
  /*
   * "Wandoos (set)" : un seul objet (A busted copy of Wandoos 98). "When
   * Wandoos completes the booting process, gain an additional 10% speed
   * bonus. Also, 300 EXP" ; page "Wandoos" > Boot-up : "After booting-up, it
   * gains a 10% speed boost by maxing the Wandoos set". Consommé par
   * advanceWandoos() (idle-ngu-progression.js) seulement une fois le boot fini.
   */
  wandoos:{name:"Wandoos Set",items:["wandoos98"],reward:{experience:300,wandoosBootedSpeedPct:.10}},
  /*
   * "Normal Bonus Accs (set)" : 13 accessoires (The Tuba of Time ... Candy
   * Corn Necklace), tous présents dans SPECIALS ; "Bonus for Completion: +25%
   * drop rate" -> setRewards.drop (même champ que le "7.43% bonus drop chance"
   * du set 2D). Total Stats Max du wiki (Power 11 450 / Toughness 11 420) =
   * 2 x la somme des p/t niveau 0 de ces 13 SPECIALS (vérifié).
   */
  normalBonusAccs:{name:"Normal Bonus Accs Set",items:["tubaTime","cheeseGrater","skyBall","magicite","windupGear","sinusoidalWave","ghostTypewriter","gaudyShoulders","fTank","beardComb","randomCrayons","redLipstick","candyCornNecklace"],reward:{drop:.25}},
  /*
   * "Evil Bonus Accs (Set)" (audit des objets, 2026-09-24) : les 8 accessoires propres aux
   * zones Evil (ids 445 à 452, "Total Power 378 792 000"), chacun au niveau 100 ; "Bonus for
   * Completion: +20% Adventure stats!". Pont setRewards.adventureStatsPct, lu comme facteur
   * d'Adventure stats par idle-ngu-progression.js (même famille que les perks, quirks et
   * souhaits "Adventure stats", combinés par produit comme eux). Le wiki ne dit pas si ce +20 %
   * s'additionne aux autres sources ou les multiplie : convention du moteur (un facteur par
   * source) conservée.
   */
  evilBonusAccs:{name:"Evil Bonus Accs Set",items:["edgyMagicite","creepyDoll","theExponential","rushmoreNose","throOdignslug","linkCable","handCursor","radMixtape"],reward:{adventureStatsPct:.20}},
  /*
   * "Number (set)" : un seul objet (A Number) ; fiche "A Number" : "Merging
   * 'A Number' to level 100, will give you a permanent completion bonus of:
   * +10% NGU speed!" -- même setRewards.nguSpeedPct que Meta/Back To School.
   */
  number:{name:"Number Set",items:["aNumber"],reward:{nguSpeedPct:.10}},
  /*
   * "Seed (set)" : un seul objet (A Giant Seed), "10 Premium samples of Icarus Proudbottom's
   * Homemade Boom Boom Fertilizers!" ; fiche "A Giant Seed" : "the completion bonus grants 10
   * poop" ; Build History 2018 : "Level 100 seed has set bonus which awards you with 10 poops".
   * Versées une fois dans state.selloutEffects.poop (accorderConsommablesSetsV1).
   */
  seed:{name:"Seed Set",items:["giantSeed"],reward:{poop:10}},
  /*
   * "Armpit (set)" : un seul objet (UUG's Armpit Hair), "+10% Beard Speed!" --
   * setRewards.beardSpeedPct, consommé par advanceBeardTrack()
   * (idle-ngu-progression.js), même terme que les Specials "Beard Speed".
   */
  armpit:{name:"Armpit Set",items:["uugHair"],reward:{beardSpeedPct:.10}},
  /*
   * "Incriminating Evidence (set)" : "+2 base Resource 3 Power / +80K base
   * Resource 3 Cap / +2 base Resource 3 Bars / +1 of every Resource 3 Potion!"
   * -- les trois bonus "base" s'ajoutent à la valeur brute de Resource 3
   * (adventure.permanent.r3*Flat, idleNguEffectiveResourceStatV1).
   */
  incriminatingEvidence:{name:"Incriminating Evidence Set",items:["incriminatingEvidence"],reward:{r3PowerFlat:2,r3CapFlat:80000,r3BarsFlat:2,r3PotionAlpha:1,r3PotionBeta:1,r3PotionDelta:1}},
  /* "Severed Head (set)" : un seul objet (A Severed Unicorn's Head), "+13.37% Wish Speed!" -- même setRewards.wishSpeedPct que Typo. */
  severedHead:{name:"Severed Head Set",items:["severedUnicornHead"],reward:{wishSpeedPct:.1337}},
  /*
   * Sets des cœurs (pages "<X> Heart (set)" et section Items du "4G's Sellout Shop" :
   * "When this heart reaches 100, ..."), un objet chacun. Récompenses lues par
   * idle-hearts-v1.js et les modules concernés :
   *  - Red : "the max heart EXP bonus (10%) even when the heart is not equipped" ;
   *  - Yellow : "the max heart AP bonus (20%) even when the heart is not equipped" ;
   *  - Green : "Gain 20% faster progress towards Perk Points (PP) in the I.T.O.P.O.D!"
   *    (même pont itopodPpPct que Pissed Off Key) ;
   *  - Blue : "All consumable give 10% better effects" ;
   *  - Purple : "MacGuffins drop 20% more often" (lu par idle-macguffins-v1.js via completedSets) ;
   *  - Orange : "Quests give 20% more QP!" ;
   *  - Grey : "25% Faster Hacks!" ;
   *  - Rainbow : "+10% Mayo and Card Generation Speed!".
   * Brown ("every 10th poop ... will not be consumed") et Pink ("an additional Wish slot") :
   * aucun setReward, l'effet est lu directement sur completedSets (2026-09-24, commentaire mis
   * à jour) : Brown par idleYggBrownHeartActiveV1 (idle-yggdrasil-extra-v1.js, chaque 10e Poop
   * gratuite), Pink par wishSlotBreakdownV1 (idle-ngu-progression.js, +1 slot de souhait).
   */
  heartRed:{name:"Red Heart Set",items:["heartRed"],reward:{heartExpPct:.10}},
  heartYellow:{name:"Yellow Heart Set",items:["heartYellow"],reward:{heartApPct:.20}},
  heartBrown:{name:"Brown Heart Set",items:["heartBrown"],reward:{}},
  heartGreen:{name:"Green Heart Set",items:["heartGreen"],reward:{itopodPpPct:.20}},
  heartBlue:{name:"Blue Heart Set",items:["heartBlue"],reward:{consumablesEffectPct:.10}},
  heartPurple:{name:"Purple Heart Set",items:["heartPurple"],reward:{}},
  heartOrange:{name:"Orange Heart Set",items:["heartOrange"],reward:{questQpPct:.20}},
  heartGrey:{name:"Grey Heart Set",items:["heartGrey"],reward:{hackSpeedPct:.25}},
  heartPink:{name:"Pink Heart Set",items:["heartPink"],reward:{}},
  heartRainbow:{name:"Rainbow Heart Set",items:["heartRainbow"],reward:{cardMayoSpeedPct:.10}},
  /* "Wandoos XL (set)" : "Wandoos now boots up 10% faster!" (page Wandoos : "60 minutes x 90% for the Wandoos XL set"). */
  wandoosXl:{name:"Wandoos XL Set",items:["wandoosXl"],reward:{wandoosBootReductionPct:.10}},
  /* "Flubber (set)" : un seul objet (The Triple Flubber), "30,000 AP" (page Arbitrary Points : "Triple Flubber to level 100 : 30,000, once"). */
  flubber:{name:"Flubber Set",items:["tripleFlubber"],reward:{ap:30000}},
  /* "Heroic Sigil (set)" : "Quest items drop 10% more often!" (page Questing : "Quest Drops +10%"). */
  heroicSigil:{name:"Heroic Sigil Set",items:["heroicSigil"],reward:{questDropsSetPct:.10}},
  /* "Still-Beating Heart (set)" : "+1% Tag Effect!" (page Cards : base 10 % ... total 16.5 % dont ce set). */
  stillBeatingHeart:{name:"Still-Beating Heart Set",items:["stillBeatingHeart"],reward:{cardTagEffect:.01}}
});

export const NOMS_SETS_OBJETS_EN_V1=Object.freeze(Object.fromEntries(Object.entries(SETS_OBJETS_V1).map(([id,o])=>[id,o.name])));

for(const[id,o]of Object.entries(SETS_OBJETS_V1))if(NOMS_SETS_OBJETS_FR_V1[id])Object.defineProperty(o,"name",{value:NOMS_SETS_OBJETS_FR_V1[id],enumerable:true});

export const IDLE_ADVENTURE_ITEM_SETS_V1=SETS_OBJETS_V1;

/*
 * Collection (2026-09-11) — Norman : "je voudrais Renommer Bestiaire en
 * Collection... toutes les armes obtenues et montées niveau max... avec
 * l'image et les stats." itemList (record(), plus bas) ne garde que
 * {maxLevel,seen} par definitionId — jamais de quoi afficher un nom ou
 * une image, et un objet totalement fusionné/jeté n'a alors plus aucune
 * trace exploitable côté client. Ce catalogue statique (même forme que
 * item()/special() ci-dessous, jamais recalculé par joueur) permet de
 * retrouver nom/slot/set pour N'IMPORTE QUEL definitionId déjà rencontré,
 * même longtemps après que l'objet réel a disparu de l'inventaire.
 */
/*
 * Audit 2026-09-13 (Norman) : "Quand on la range dans le coffre, elles
 * doivent se classer dans le bon ordre, pas dans l'ordre où je les mets.
 * Exemple arme, tête, torse, jambe, bottes, anneaux, items de la zone..."
 * SETS déclare ses slots dans un ordre arbitraire de rédaction
 * (head/chest/legs/boots/weapon...), jamais pensé comme un ordre
 * d'affichage. Ce rang canonique reclasse chaque pièce d'équipement à
 * l'intérieur de sa zone, sans jamais réordonner les zones elles-mêmes
 * (déjà dans l'ordre de progression wiki-vérifié) — un seul tri, réutilisé
 * par tout consommateur du catalogue (Collection, Coffre), jamais un
 * second ordre inventé ailleurs.
 */
/*
 * Identifiants d'items officiels NGU (2026-09-18).
 *
 * Source de vérité média : les fichiers R2 suivent exactement la convention
 * `idle/items/Item_<ID wiki sur 4 chiffres>_<nom NGU>.<ext>`.
 * Les 241 pièces de sets ci-dessous ont été recoupées par nom NGU exact
 * avec le listing R2 réel. Les 22 SPECIALS sont couverts aussi ; cinq ont
 * un libellé SOREAL abrégé/différent du fichier R2 et sont explicitement
 * verrouillés : Tutorial Cube=77, Tuba=432, Wandoos 98=66,
 * Beard Comb=441, Shrunken Voodoo Doll=190.
 *
 * Cette table vit côté moteur IDLE : APP ne doit plus maintenir une copie
 * géante des noms/IDs. Le client transporte wikiItemId et le Worker média
 * résout d'abord l'ID exact, puis conserve le nom comme compatibilité.
 */
export const IDLE_ADVENTURE_WIKI_ITEM_IDS_V1=Object.freeze({
  "training:weapon":75,
  "training:head":62,
  "training:chest":63,
  "training:legs":64,
  "training:boots":65,
  "sewers:weapon":44,
  "sewers:head":40,
  "sewers:chest":41,
  "sewers:legs":42,
  "sewers:boots":43,
  "sewers:ring":45,
  "sewers:amulet":46,
  "forest:weapon":51,
  "forest:head":47,
  "forest:chest":48,
  "forest:legs":49,
  "forest:boots":50,
  "forest:ring":52,
  "forest:pendant":53,
  "cave:weapon":58,
  "cave:head":54,
  "cave:chest":55,
  "cave:legs":56,
  "cave:boots":57,
  "cave:ring":59,
  "cave:amulet":60,
  "cave:combat":61,
  "hsb:weapon":72,
  "hsb:head":68,
  "hsb:chest":69,
  "hsb:legs":70,
  "hsb:boots":71,
  "hsb:ring":73,
  "hsb:amulet":74,
  "grb:weapon":82,
  "grb:head":78,
  "grb:chest":79,
  "grb:legs":80,
  "grb:boots":81,
  "grb:necklace":83,
  "grb:meat":84,
  "clock:weapon":89,
  "clock:head":85,
  "clock:chest":86,
  "clock:legs":87,
  "clock:boots":88,
  "clock:alarm":90,
  "clock:sands":91,
  "2d:weapon":99,
  "2d:head":95,
  "2d:chest":96,
  "2d:legs":97,
  "2d:boots":98,
  "2d:cube":100,
  "2d:amulet":101,
  "spoopy:weapon":107,
  "spoopy:head":103,
  "spoopy:chest":104,
  "spoopy:legs":105,
  "spoopy:boots":106,
  "spoopy:ring":108,
  "spoopy:amulet":109,
  "jake:weapon":115,
  "jake:head":111,
  "jake:chest":112,
  "jake:legs":113,
  "jake:boots":114,
  "jake:tie":116,
  "jake:paperweight":117,
  "scrap:paper":197,
  "gaudy:weapon":126,
  "gaudy:head":122,
  "gaudy:chest":123,
  "gaudy:legs":124,
  "gaudy:boots":125,
  "mega:weapon":134,
  "mega:head":130,
  "mega:chest":131,
  "mega:legs":132,
  "mega:boots":133,
  "beardverse:weapon":147,
  "beardverse:head":143,
  "beardverse:chest":144,
  "beardverse:legs":145,
  "beardverse:boots":146,
  "badly:weapon":168,
  "badly:head":164,
  "badly:chest":165,
  "badly:legs":166,
  "badly:boots":167,
  "stealth:weapon":177,
  "stealth:head":173,
  "stealth:chest":174,
  "stealth:legs":175,
  "stealth:boots":176,
  "choco:weapon":225,
  "choco:head":221,
  "choco:chest":222,
  "choco:legs":223,
  "choco:boots":224,
  "uug:ringGreed":136,
  "uug:ringMight":137,
  "uug:ringUtility":138,
  "uug:ringEnergy":139,
  "uug:ringMagic":140,
  "wanderer:head":150,
  "wanderer:chest":151,
  "wanderer:legs":152,
  "wanderer:boots":153,
  "rerednaw:head":155,
  "rerednaw:chest":156,
  "rerednaw:legs":157,
  "rerednaw:boots":158,
  "slimy:weapon":188,
  "slimy:head":184,
  "slimy:chest":185,
  "slimy:legs":186,
  "slimy:boots":187,
  "edgy:head":213,
  "edgy:chest":214,
  "edgy:legs":215,
  "edgyboots:left":216,
  "edgyboots:right":219,
  "bothedgy:boots":220,
  "edgy:weapon":217,
  "edgy:amulet":218,
  "pinkprincess:head":231,
  "pinkprincess:chest":232,
  "pinkprincess:legs":233,
  "pinkprincess:boots":234,
  "pinkprincess:weapon":235,
  "pinkprincess:amulet":236,
  "meta:weapon":255,
  "meta:head":251,
  "meta:chest":252,
  "meta:legs":253,
  "meta:boots":254,
  "meta:charmInfinity":256,
  "meta:charm69":257,
  "party:weapon":262,
  "party:head":258,
  "party:chest":259,
  "party:legs":260,
  "party:boots":261,
  "party:cup":263,
  "party:whistle":264,
  "typo:head":301,
  "typo:chest":302,
  "typo:legs":303,
  "typo:boots":304,
  "typo:weapon":305,
  "typo:asscessory":306,
  "typo:eyeElxu":307,
  "fad:head":308,
  "fad:chest":309,
  "fad:legs":310,
  "fad:boots":311,
  "fad:weapon":312,
  "fad:pokeymanCard":313,
  "fad:krazyBonez":314,
  "jrpg:head":315,
  "jrpg:chest":316,
  "jrpg:legs":317,
  "jrpg:boots":318,
  "jrpg:weapon":319,
  "jrpg:zipper":320,
  "jrpg:wig":321,
  "rad:head":345,
  "rad:chest":346,
  "rad:legs":347,
  "rad:boots":348,
  "rad:weapon":349,
  "rad:notDrugs":350,
  "rad:gloveOfPower":351,
  "backtoschool:head":352,
  "backtoschool:chest":353,
  "backtoschool:legs":354,
  "backtoschool:boots":355,
  "backtoschool:weapon":356,
  "backtoschool:theS":357,
  "backtoschool:walkman":358,
  "western:head":359,
  "western:chest":360,
  "western:legs":361,
  "western:boots":362,
  "western:weapon":363,
  "western:corgi":364,
  "western:bandana":365,
  "bread:head":392,
  "bread:chest":393,
  "bread:legs":394,
  "bread:boots":395,
  "bread:weapon":399,
  "bread:baguette":396,
  "bread:creamPie":397,
  "bread:yeast":398,
  "disco:head":400,
  "disco:chest":401,
  "disco:legs":402,
  "disco:boots":403,
  "disco:weapon":404,
  "disco:vinylShard":407,
  "disco:whitePowder":405,
  "disco:rollingPaper":406,
  "halloweenie:head":408,
  "halloweenie:chest":409,
  "halloweenie:legs":410,
  "halloweenie:boots":411,
  "halloweenie:weapon":415,
  "halloweenie:apple":412,
  "halloweenie:toiletPaper":413,
  "halloweenie:pandora":414,
  "construction:head":453,
  "construction:chest":454,
  "construction:legs":455,
  "construction:boots":456,
  "construction:weapon":460,
  "construction:hammer":457,
  "construction:toolbox":458,
  "construction:levelLevel":459,
  "duck:head":496,
  "duck:chest":497,
  "duck:legs":498,
  "duck:boots":499,
  "duck:weapon":503,
  "duck:shotgun":500,
  "duck:ducktTape":501,
  "duck:duckCaller":502,
  "dutch:head":461,
  "dutch:chest":462,
  "dutch:legs":463,
  "dutch:boots":464,
  "dutch:weapon":468,
  "dutch:tulip":465,
  "dutch:netherlands":466,
  "dutch:cheese":467,
  "pirate:head":507,
  "pirate:chest":508,
  "pirate:legs":509,
  "pirate:boots":510,
  "pirate:weapon":514,
  "pirate:cutlass":511,
  "pirate:eyepatch":512,
  "pirate:compass":513,
  "tutorialCube":77,
  "tubaTime":432,
  "cheeseGrater":433,
  "skyBall":434,
  "pissedOffKey":172,
  "aNumber":102,
  "giantSeed":92,
  "uugHair":141,
  "incriminatingEvidence":294,
  "severedUnicornHead":343,
  /* Cœurs du Sellout Shop, Wandoos XL, Triple Flubber, Heroic Sigil, Still-Beating Heart (fiches wiki, champ "Id"). */
  "heartRed":119,
  "heartYellow":129,
  "heartBrown":162,
  "heartGreen":171,
  "heartBlue":196,
  "heartPurple":212,
  "heartOrange":293,
  "heartGrey":297,
  "heartPink":344,
  "heartRainbow":390,
  "wandoosXl":163,
  "tripleFlubber":121,
  "heroicSigil":292,
  "stillBeatingHeart":391,
  "flubber":120,
  "wandoos98":66,
  "magicite":435,
  "windupGear":436,
  "sinusoidalWave":437,
  "ghostTypewriter":438,
  "gaudyShoulders":439,
  "fTank":440,
  "ringOfApathy":135,
  "beardComb":441,
  "randomCrayons":442,
  "redLipstick":443,
  "candyCornNecklace":444,
  "wanderersCane":154,
  "shrunkenVoodooDoll":190,
  "pricelessVanGoghPainting":192,
  "smallGerbil":195,
  "mysteriousRedLiquid":93,
  "mysteriousPurpleLiquid":191,
  "mysteriousGreyLiquid":506,
  // Audit 2026-09-23 : "Id" de la fiche wiki de chaque nouvel objet.
  "greasynerd:head":237,
  "greasynerd:chest":238,
  "greasynerd:legs":239,
  "greasynerd:boots":240,
  "greasynerd:weapon":241,
  "mobster:head":265,
  "mobster:chest":266,
  "mobster:legs":267,
  "mobster:boots":268,
  "mobster:weapon":269,
  "mobster:garrote":270,
  "mobster:brassKnuckles":271,
  "exile:head":322,
  "exile:chest":323,
  "exile:legs":324,
  "exile:boots":325,
  "exile:weapon":326,
  "space:head":373,
  "space:chest":374,
  "space:legs":375,
  "space:boots":376,
  "space:weapon":377,
  "space:manhole":378,
  "space:redShirt":379,
  "rock:head":416,
  "rock:chest":417,
  "rock:legs":418,
  "rock:boots":419,
  "rock:weapon":423,
  "rock:rocket":420,
  "rock:petRock":421,
  "rock:rollingStone":422,
  "amalgamate:head":469,
  "amalgamate:chest":470,
  "amalgamate:legs":471,
  "amalgamate:boots":472,
  "amalgamate:weapon":476,
  "amalgamate:deathstick":473,
  "amalgamate:corruptedLeaf":474,
  "amalgamate:glued":475,
  "lootyMcLootFace":67,
  "ascendedForestPendant":76,
  "ascendedAscendedForestPendant":94,
  "dragonWings":110,
  "stapler":118,
  "aBeanie":127,
  "sirLooty":128,
  "ascendedX3Pendant":142,
  "beardHairStrand":148,
  "uugSpecialRing":149,
  "candyCaneDestiny":159,
  "fannyPack":160,
  "dorkyGlasses":161,
  "kingLooty":169,
  "ascendedX4Pendant":170,
  "stealthiestArmour":178,
  "baldEgg":189,
  "giantApple":193,
  "powerPill":194,
  "energyBarBarAccessory":226,
  "magicBarBarAccessory":227,
  "ascendedX5Pendant":229,
  "emperorLooty":230,
  "ascendedX6Pendant":295,
  "galacticHeraldLooty":296,
  "ascendedX7Pendant":388,
  "supremeIntelligenceLooty":389,
  "beretta9mm":366,
  "edgyMagicite":445,
  "creepyDoll":446,
  "theExponential":447,
  "rushmoreNose":448,
  "throOdignslug":449,
  "linkCable":450,
  "handCursor":451,
  "radMixtape":452,
  "ordinaryCalculator":242,
  "animeFigurine":243,
  "theD20":244,
  "theD8":245,
  "animeBodypillow":246,
  "redMeeple":247,
  "bagOfTrash":248,
  "heartShapedPanties":249,
  "violinCase":272,
  "molotovCocktail":273,
  "godmothersRing":274,
  "godmothersWand":275,
  "leftFairyWing":276,
  "rightFairyWing":277,
  "theJoker":327,
  "antlersExile":328,
  "creditCard":329,
  "tentacleExile":330,
  "skipCard":331,
  "antennaeExile":332,
  "blackLotus":333,
  "busterExile":334,
  "theCricket":380,
  "evilRubberDucky":381,
  "gasGiant":382,
  "carbonRod":383,
  "kleinBottle":384,
  "alienBugNest":385,
  "theKey":386,
  "skippingStone":424,
  "bedRock":425,
  "rockCandy":426,
  "brokenScissors":427,
  "portableStairway":428,
  "amplifier":429,
  "rawSlabOfWood":477,
  "tieOfApathy":478,
  "titanEffigy":479,
  // Ascensions finales (2026-09-24), Id des modèles "Template:Item data".
  "ascendedX8Pendant":430,
  "grandDemonLootzifer":431,
  "ascendedX9Pendant":504,
  "glitchyLooty":505
});

export function wikiItemIdAdventureV1(definitionId){
  return Number(IDLE_ADVENTURE_WIKI_ITEM_IDS_V1[String(definitionId||"")])||0;
}

const IDLE_ADVENTURE_SLOT_RANK_V1={weapon:0,head:1,chest:2,legs:3,boots:4};

export function idleAdventureSlotRankV1(slot){
  return IDLE_ADVENTURE_SLOT_RANK_V1[slot]!=null?IDLE_ADVENTURE_SLOT_RANK_V1[slot]:5;
}

/*
 * Ascensions / évolutions d'objets (audit des objets, 2026-09-24). Source : champs
 * `evolutionto` / `evolutionof` des modèles "Template:Item data", rendus sur chaque fiche
 * "<objet> can be upgraded to <suivant> (level it to level 100 and CTRL + Click to transform
 * it)". Niveau de l'objet obtenu : 0 (page Inventory : "Once the Forest Pendant reaches Level
 * 100, it ascends into a 0 lvl 'Ascended Forest Pendant'" ; "it can Ascend again into a Level 0
 * 'Ascended Ascended Forest Pendant'" ; même règle pour la lignée Looty, "Similar to the
 * infamous Forest Pendant"). L'objet obtenu démarre à sa Base value (ITEM_BASE_VALUE_PT_V1).
 * Non modélisés : Ascended x9 Pendant -> THE END #480 et LootzL...OOt -> THE END (485) (les
 * morceaux de THE END n'existent pas dans SOREAL). A Small Gerbil -> Mysterious Grey Liquid garde
 * sa condition propre (SADISTIC, fiche : "can only be transformed in SADISTIC difficulty").
 */
export const ITEM_EVOLUTIONS_V1=Object.freeze({
  "forest:pendant":"ascendedForestPendant",
  ascendedForestPendant:"ascendedAscendedForestPendant",
  ascendedAscendedForestPendant:"ascendedX3Pendant",
  ascendedX3Pendant:"ascendedX4Pendant",
  ascendedX4Pendant:"ascendedX5Pendant",
  ascendedX5Pendant:"ascendedX6Pendant",
  ascendedX6Pendant:"ascendedX7Pendant",
  ascendedX7Pendant:"ascendedX8Pendant",
  ascendedX8Pendant:"ascendedX9Pendant",
  lootyMcLootFace:"sirLooty",
  sirLooty:"kingLooty",
  kingLooty:"emperorLooty",
  emperorLooty:"galacticHeraldLooty",
  galacticHeraldLooty:"supremeIntelligenceLooty",
  supremeIntelligenceLooty:"grandDemonLootzifer",
  grandDemonLootzifer:"glitchyLooty",
  wanderersCane:"candyCaneDestiny",
  flubber:"tripleFlubber",
  smallGerbil:"mysteriousGreyLiquid"
});

export const IDLE_ADVENTURE_ITEM_EVOLUTIONS_V1=ITEM_EVOLUTIONS_V1;

export const IDLE_ADVENTURE_ITEM_CATALOG_V1=Object.freeze((()=>{
  const catalog={};
  for(const[setId,s]of Object.entries(SETS)){
    const slotsTries=[...s.slots].sort((a,b)=>idleAdventureSlotRankV1(a)-idleAdventureSlotRankV1(b));
    for(const slot of slotsTries){
      /*
       * Mêmes bases que item() ci-dessus (idleAdventureItemStatsMaxV1/2) —
       * permet au Collection (client) de recalculer Power/Toughness/HP
       * Max/Regen au niveau maxLevel enregistré dans itemList, sans
       * dupliquer une seconde fois la formule ni exiger un objet vivant
       * dans l'inventaire.
       */
      const{p,t}=idleAdventureItemStatsMaxV1(setId,slot);
      const baseP=p/2,baseT=t/2;
      catalog[`${setId}:${slot}`]=Object.freeze({
        kind:"equipment",set:setId,setName:s.name,slot,name:NOMS_PIECES_FR_V1[`${setId}:${slot}`]||`${s.name} ${slot}`,
        wikiItemId:wikiItemIdAdventureV1(`${setId}:${slot}`),
        basePower:baseP,baseToughness:baseT,baseHp:baseP*3,baseRegen:baseT*.03,
        /* Specials (type, plafond au niveau 0) : le plafond au niveau n vaut plafond0 × (1 + n/100). Sert au popup d'objet unifié de la Collection (Norman, 2026-10-03). */
        specials:(SET_ITEM_SPECIALS_V1[`${setId}:${slot}`]||[]).map(([type,,max0])=>[type,N(max0)]),
        evolutionTo:ITEM_EVOLUTIONS_V1[`${setId}:${slot}`]||""
      });
    }
  }
  for(const[id,d]of Object.entries(SPECIALS)){
    catalog[id]=Object.freeze({kind:d.cube?"cube":"special",zone:d.zone||"",set:"",setName:"",slot:d.slot,name:d.name,wikiItemId:wikiItemIdAdventureV1(id),basePower:N(d.p),baseToughness:N(d.t),baseHp:N(d.p)*3,baseRegen:N(d.t)*.03,specials:d.sType?[[d.sType,N(d.sMax)],...(d.sExtra||[]).map(e=>[e.type,N(e.max0)])]:[],evolutionTo:ITEM_EVOLUTIONS_V1[id]||""});
  }
  return catalog;
})());

const IDLE_ADVENTURE_BOOST_WIKI_ID_BASE_V1=Object.freeze({power:1,toughness:14,special:27});

export function wikiItemIdBoostV1(type,strength){
  const idx=BOOSTS.indexOf(Number(strength));
  const base=Number(IDLE_ADVENTURE_BOOST_WIKI_ID_BASE_V1[String(type||"")])||0;
  return idx>=0&&base?base+idx:0;
}

export const IDLE_ADVENTURE_BOOSTS=BOOSTS;

/*
 * hp/regen (2026-09-15) : dérivés de power/toughness (HP Max=Power×3,
 * HP Regen=Toughness×0.03), une règle du moteur NGU vérifiée sans
 * exception sur les ~90 objets audités (voir SET_ITEM_STATS_V1
 * ci-dessus) — jamais une donnée par objet à stocker séparément.
 */
/*
 * Correctif 2026-09-18 (Norman, capture d'écran du vrai NGU en direct :
 * "Power 0/7... Use the boosts you find to improve this item's stats!")
 * -- un objet fraîchement créé (drop ou addItem) doit démarrer à 0/0,
 * JAMAIS déjà à son plafond du moment. Le correctif du 2026-09-16
 * ci-dessous (applyBoost) avait conclu l'inverse ("un objet neuf est
 * TOUJOURS déjà à son plafond") en interprétant le texte du wiki
 * ("maximum potential will go up and require to be boosted" à chaque
 * fusion) comme si l'état INITIAL était déjà maxé -- la capture d'écran
 * du jeu réel (Tutorial Cube jamais fusionné, Power 0/7, Toughness 0/7,
 * Max Health 0/21, Health Regen 0/0,21) contredit directement cette
 * lecture : le plafond grandit avec le niveau (via fusion), mais la
 * valeur COURANTE part toujours de 0 et ne monte QUE par boost, y
 * compris pour un objet jamais encore fusionné. hp/regen restent
 * dérivés de power/toughness (0 tant que non boosté).
 */
/*
 * PISTE 2 de l'audit wiki 2026-09-18 : pages ngu-idle.fandom.com/wiki/
 * Tutorial_Zone et .../Training_(set) vérifiées en direct (navigateur) --
 * "Items in Training (set): A Stick, Cloth Hat, Cloth Shirt, Cloth
 * Leggings, Cloth Boots". Sans entrée dans SET_ITEM_NAMES_V1, item()
 * retombait sur un nom générique inventé ("Training Set head", "Training
 * Set weapon", ...) au lieu du vrai nom wiki par pièce -- les STATS par
 * pièce (SET_ITEM_STATS_V1 plus haut) étaient déjà correctes, seul le nom
 * était un reskin SOREAL. Seul le set "training" était couvert par cette
 * piste (portée initiale).
 *
 * Round 2 (2026-09-18, sweep "renommage des sets d'équipement") : les 35
 * sets restants de IDLE_ADVENTURE_ZONES/SETS (sewers -> pirate, la totalité
 * du catalogue mode Normal) sont maintenant couverts, sourcés depuis le
 * miroir wiki local (C:\Users\n0rma\Documents\NGU-Wiki\pages\<Nom> (set).json,
 * un export MediaWiki réel -- même source que build-idle-boss-fight-real-
 * names-v1.mjs). Méthode : chaque page {{Set}} liste ses N objets dans un
 * ORDRE CONSTANT par page (soit arme-en-tête puis tête/torse/jambes/
 * bottes/accessoires, soit tête/torse/jambes/bottes/arme/accessoires selon
 * la page -- jamais mélangé au sein d'une même page) ; le slot de chaque
 * objet est identifié par sa position dans cette énumération recoupée avec
 * son nom (casque/chapeau=head, plastron/chemise/veste=chest, pantalon/
 * jambières=legs, bottes/chaussures=boots) et, quand le nom seul est
 * ambigu (ex. Pretty Pink Princess, où "Giant Sticky Foot" n'a rien d'une
 * arme au premier regard), vérifié via la catégorie de la fiche objet
 * individuelle ([[Category:Weapon]]/[[Category:Accessory]] -- cf.
 * "Giant Sticky Foot.json" = Category:Weapon, "A Pretty Pink Bow.json" =
 * Category:Accessory, confirmant le slot malgré l'ordre de page atypique).
 * Les slots à nom explicite (necklace/meat, alarm/sands, cube, tie/
 * paperweight, ringGreed.../charmInfinity/charm69, cup/whistle,
 * asscessory/eyeElxu, pokeymanCard/krazyBonez, zipper/wig, notDrugs/
 * gloveOfPower, theS/walkman, corgi/bandana, baguette/creamPie/yeast,
 * vinylShard/whitePowder/rollingPaper, apple/toiletPaper/pandora, hammer/
 * toolbox/levelLevel, shotgun/ducktTape/duckCaller, tulip/netherlands/
 * cheese, cutlass/eyepatch/compass) se recoupent directement avec le nom
 * de l'objet correspondant sur sa page wiki (ex. slot "hammer" du set
 * Construction = l'objet "A Wooden Hammer", séparé du VRAI slot weapon
 * de ce set = "A Giant Wrecking Ball" -- la blague récurrente NGU où
 * l'accessoire "thématique" n'est pas l'arme réellement équipée).
 *
 * edgy (Evilverse) : le wiki documente Left/Right/BOTH Edgy Boots comme
 * trois objets distincts qui fusionnent (aucun équivalent Left/Right côté
 * SOREAL, un seul slot "boots") -- "BOTH Edgy Boots" retenu comme nom du
 * slot boots, déjà la modélisation actée dans le commentaire "Evilverse"
 * au-dessus de la définition SETS.edgy (2026-09-18, avant ce round).
 *
 * wanderer/rerednaw : 4 pièces seulement (head/chest/legs/boots), pas de
 * slot weapon défini dans SETS -- cohérent avec le commentaire déjà en
 * place au-dessus de SETS.uug ("le Cane/Candy Cane sont des objets à
 * part, pas repris ici").
 *
 * Portée : les 36 sets de SETS (training -> pirate) sont maintenant tous
 * couverts -- ce qui inclut, en réalité, les 17 zones marquées
 * requiredDifficulty ("difficile"/"extreme", cf. IDLE_ADVENTURE_ZONES :
 * evilverse -> aethereansea) : contrairement à une première lecture, il
 * n'existe PAS de table de noms séparée pour l'équipement Evil/Sadistic --
 * z.set pointe vers le même SETS/SET_ITEM_NAMES_V1 que les zones Normal
 * (vérifié en relisant unlockedZone()/rollKill() : requiredDifficulty ne
 * change que le déverrouillage et le diviseur de drop, jamais l'identité
 * de l'objet). Ces 17 zones sont donc déjà couvertes par ce round, pas
 * seulement les 19 zones "Normal" au sens strict.
 */
export const SET_ITEM_NAMES_EN_V1=Object.freeze({
  "training:weapon":"Un bâton","training:head":"Chapeau en tissu","training:chest":"Chemise en tissu","training:legs":"Jambières en tissu","training:boots":"Bottes en tissu",

  // Sewers (set) -- ngu-idle.fandom.com/wiki/Sewers_(set)
  "sewers:weapon":"Épée rouillée","sewers:head":"Casque pourri","sewers:chest":"Plastron pourri","sewers:legs":"Jambières pourries","sewers:boots":"Bottes pourries","sewers:ring":"Anneau dégoûtant","sewers:amulet":"Amulette fissurée",

  // Forest (set) -- ngu-idle.fandom.com/wiki/Forest_(set) (pendant = objet de base "Forest Pendant", pas une variante Ascended)
  "forest:weapon":"Kokiri Blade","forest:head":"Forest Helmet","forest:chest":"Forest Chestplate","forest:legs":"Forest Leggings","forest:boots":"Forest Boots","forest:ring":"Mossy Ring","forest:pendant":"Forest Pendant",

  // Cave (set) -- ngu-idle.fandom.com/wiki/Cave_(set)
  "cave:weapon":"Mole Hammer","cave:head":"Blue Cheese Helmet","cave:chest":"Gouda Chestplate","cave:legs":"Swiss Leggings","cave:boots":"Limburger Boots","cave:ring":"Havarti Ring","cave:amulet":"Cheddar Amulet","cave:combat":"Combat Cheese",

  // HSB (set) -- ngu-idle.fandom.com/wiki/HSB_(set)
  "hsb:weapon":"Magitech Blade","hsb:head":"Magitech Helmet","hsb:chest":"Magitech Chestplate","hsb:legs":"Magitech Leggings","hsb:boots":"Magitech Boots","hsb:ring":"Magitech Ring","hsb:amulet":"Magitech Amulet",

  // GRB (set) -- ngu-idle.fandom.com/wiki/GRB_(set)
  "grb:weapon":"Bloody Cleaver","grb:head":"Chef's Hat","grb:chest":"Chef's Apron","grb:legs":"Regular Pants","grb:boots":"Non Slip Shoes","grb:necklace":"Suspicious Sausage Necklace","grb:meat":"Raw Slab of Meat",

  // Clock (set) -- ngu-idle.fandom.com/wiki/Clock_(set)
  "clock:weapon":"A Comically Oversized Minute-Hand","clock:head":"Clockwork Hat","clock:chest":"Clockwork Chest","clock:legs":"Clockwork Pants","clock:boots":"Clockwork Boots","clock:alarm":"Alarm Clock","clock:sands":"The Sands of Time",

  // 2D (set) -- ngu-idle.fandom.com/wiki/2D_(set)
  "2d:weapon":"A Triangle","2d:head":"Circle Helmet","2d:chest":"Square Chestpiece","2d:legs":"Rectangle Pants","2d:boots":"Polygon Boots","2d:cube":"THE CUBE","2d:amulet":"King Circle's Amulet of Helping Random Stuff",

  // Spoopy (set) (Ancient Battlefield) -- ngu-idle.fandom.com/wiki/Spoopy_(set)
  "spoopy:weapon":"Spooky Sword","spoopy:head":"Spoopy Helmet","spoopy:chest":"Ghostly Chest","spoopy:legs":"Pants of Horror","spoopy:boots":"Spectral Boots","spoopy:ring":"Cursed Ring","spoopy:amulet":"Amulet of Sunshine, Sparkles, and Gore",

  // Jake (set) (titan Jake From Accounting) -- ngu-idle.fandom.com/wiki/Jake_(set)
  "jake:weapon":"The Pen-Is","jake:head":"Office Hat","jake:chest":"Office Shirt","jake:legs":"Office Pants","jake:boots":"Office Shoes","jake:tie":"A Regular Tie","scrap:paper":"A Scrap of Paper","jake:paperweight":"Generic Paperweight",

  // Gaudy (set) (A Very Special Place) -- ngu-idle.fandom.com/wiki/Gaudy_(set), pas d'accessoires publiés
  "gaudy:weapon":"Paper Fan","gaudy:head":"Gaudy Hat","gaudy:chest":"Gaudy Shirt","gaudy:legs":"Gaudy Pants","gaudy:boots":"Gaudy Boots",

  // Mega (set) (Mega Lands) -- ngu-idle.fandom.com/wiki/Mega_(set)
  "mega:weapon":"Beam Laser Sword","mega:head":"Mega Helmet","mega:chest":"Mega Chest","mega:legs":"Mega Blue Jeans","mega:boots":"Mega Boots",

  // Beardverse (set) -- ngu-idle.fandom.com/wiki/Beardverse_(set)
  "beardverse:weapon":"Bearded Axe","beardverse:head":"Groucho Marx Disguise","beardverse:chest":"Gossamer Chest","beardverse:legs":"Braided Beard Legs","beardverse:boots":"Fuzzy Orange Cheeto Slippers!",

  // Badly Drawn (set) -- ngu-idle.fandom.com/wiki/Badly_Drawn_(set)
  "badly:weapon":"Badly Drawn Gun","badly:head":"Badly Drawn Smiley Face","badly:chest":"Badly Drawn Chest","badly:legs":"Badly Drawn Pants","badly:boots":"Badly Drawn Foot",

  // Stealth (set) (Boring/Stealth World) -- ngu-idle.fandom.com/wiki/Stealth_(set)
  "stealth:weapon":"A Giant Bazooka","stealth:head":"Stealthy Hat","stealth:chest":"Stealthy Chest","stealth:legs":"No Pants","stealth:boots":"High Heeled Boots",

  // Choco (set) (Chocolate World) -- ngu-idle.fandom.com/wiki/Choco_(set)
  "choco:weapon":"Chocolate Crowbar","choco:head":"Chocolate Helmet","choco:chest":"Chocolate Chest","choco:legs":"Chocolate Pants","choco:boots":"Chocolate Boots",

  // UUG's rings (set) (titan UUG) -- ngu-idle.fandom.com/wiki/UUG's_rings_(set) -- 5 anneaux, pas de slots corps
  "uug:ringGreed":"Ring of Greed","uug:ringMight":"Ring of Might","uug:ringUtility":"Ring of Utility","uug:ringEnergy":"Ring of Way Too Much Energy","uug:ringMagic":"Ring of Way Too Much Magic",

  // Wanderer's (set) (titan Wanderer, mode Normal) -- ngu-idle.fandom.com/wiki/Wanderer's_(set) -- pas de weapon (Cane à part)
  "wanderer:head":"Wanderer's Hat","wanderer:chest":"Wanderer's Chest","wanderer:legs":"Wanderer's Pants","wanderer:boots":"Wanderer's Boots",

  // S'rerednaW (set) (même titan, mode Evil -- texte inversé, blague NGU) -- ngu-idle.fandom.com/wiki/S'rerednaW_(set)
  "rerednaw:head":"taH s'rerednaW","rerednaw:chest":"tsehC s'rerednaW","rerednaw:legs":"stnaP s'rerednaW","rerednaw:boots":"stooB s'rerednaW",

  // Slimy (set) (titan Slimy) -- ngu-idle.fandom.com/wiki/Slimy_(set)
  "slimy:weapon":"The Fists of Flubber","slimy:head":"Slimy Helmet","slimy:chest":"Slimy Chest","slimy:legs":"Slimy Pants","slimy:boots":"Slimy Boots",

  // Edgy (set) (Evilverse) -- ngu-idle.fandom.com/wiki/Edgy_(set) -- boots="BOTH Edgy Boots" (fusion Left+Right, cf. commentaire SETS.edgy)
  "edgy:head":"Edgy Helmet","edgy:chest":"Edgy Chest","edgy:legs":"Edgy Pants","edgyboots:left":"Left Edgy Boot","edgyboots:right":"Right Edgy Boot","bothedgy:boots":"BOTH Edgy Boots","edgy:weapon":"Edgy Jaw Axe","edgy:amulet":"A Cheap Plastic Amulet",

  // Pretty Pink Princess (set) -- ngu-idle.fandom.com/wiki/Pretty_Pink_Princess_(set) -- slot confirmé via catégorie objet (Giant Sticky Foot=Weapon, A Pretty Pink Bow=Accessory)
  "pinkprincess:head":"Clown Hat","pinkprincess:chest":"Fabulous Super Chest","pinkprincess:legs":"A Crappy Tutu","pinkprincess:boots":"Pretty Pink Slippers","pinkprincess:weapon":"Giant Sticky Foot","pinkprincess:amulet":"A Pretty Pink Bow",

  // Meta (set) (Metaland) -- ngu-idle.fandom.com/wiki/Meta_(set)
  "meta:weapon":"The Number 7","meta:head":"Numerical Head","meta:chest":"Numerical Chest","meta:legs":"Numerical Legs","meta:boots":"Numerical Boots","meta:charmInfinity":"Infinity Charm","meta:charm69":"69 Charm",

  // Party (set) (Interdimensional Party) -- ngu-idle.fandom.com/wiki/Party_(set)
  "party:weapon":"The God of Thunder's Hammer","party:head":"Party Hat","party:chest":"Pogmail Chest","party:legs":"Tear Away Pants","party:boots":"Pizza Boots","party:cup":"Plastic Red Cup","party:whistle":"Party Whistle",

  // Typo (set) (Typo Zone) -- ngu-idle.fandom.com/wiki/Typo_(set) -- noms tous des jeux de mots (Hamlet=Helmet, Chess Plate=Chestplate, Logs=Legs, Booms=Boots, Wee pin=Weapon)
  "typo:head":"Hamlet","typo:chest":"Chess Plate","typo:legs":"Logs","typo:boots":"Booms","typo:weapon":"Wee pin","typo:asscessory":"The Ass-cessory","typo:eyeElxu":"Eye of ELXU",

  // Fad (set) (Fadlands) -- ngu-idle.fandom.com/wiki/Fad_(set)
  "fad:head":"Spinning Tophat","fad:chest":"Demonic Flurbie Chestplate","fad:legs":"AAA Battery Legs","fad:boots":"Slinky Boots","fad:weapon":"THE MALF SLAMMER","fad:pokeymanCard":"Rare Foil Pokeyman Card","fad:krazyBonez":"A handful of Krazy Bonez",

  // JRPG (set) (JRPGVille) -- ngu-idle.fandom.com/wiki/JRPG_(set) -- 4 pièces "Buster Sword Top/Upper/Lower/Bottom" (armure), arme réelle = "...Replica"
  "jrpg:head":"Buster Sword Top","jrpg:chest":"Buster Sword Upper","jrpg:legs":"Buster Sword Lower","jrpg:boots":"Buster Sword Bottom","jrpg:weapon":"Gift Shop Buster Sword Replica","jrpg:zipper":"A Gigantic Zipper","jrpg:wig":"Anime Hero Wig",

  // Rad (set) (Radlands) -- ngu-idle.fandom.com/wiki/Rad_(set)
  "rad:head":"Cool Shades","rad:chest":"Leather Jacket","rad:legs":"Flamin' Hot Shorts","rad:boots":"A Skateboard","rad:weapon":"Nunchuks","rad:notDrugs":"Not Drugs","rad:gloveOfPower":"The Glove of Power",

  // Back To School (set) -- ngu-idle.fandom.com/wiki/Back_To_School_(set)
  "backtoschool:head":"Dunce Cap","backtoschool:chest":"School Jersey","backtoschool:legs":"ULTRAWIDE Pants","backtoschool:boots":"Shoes With Wheels","backtoschool:weapon":"Floppy Elastic Ruler","backtoschool:theS":"THE S","backtoschool:walkman":"A Walkman",

  // Western (set) (Westworld) -- ngu-idle.fandom.com/wiki/Western_(set)
  "western:head":"A 10 Litre Hat","western:chest":"Asslest Vest","western:legs":"Assful Chaps","western:boots":"Extra Spiky Spurs","western:weapon":"The Six Shooter","western:corgi":"A Battle Corgi","western:bandana":"A Pink Bandana",

  // Bread (set) (Breadverse) -- ngu-idle.fandom.com/wiki/Bread_(set) -- slot "baguette" = objet "1 Day-Old Baguette" (arme réelle = A Rolling Pin)
  "bread:head":"Bread Bowl Helmet","bread:chest":"Paper Thin Crepe Cape","bread:legs":"Flour Sack Pants","bread:boots":"Gingerbread Boots","bread:weapon":"A Rolling Pin","bread:baguette":"1 Day-Old Baguette","bread:creamPie":"A Cream Pie","bread:yeast":"A Spoonful of Yeast",

  // Disco (set) (Seventies) -- ngu-idle.fandom.com/wiki/Disco_(set)
  "disco:head":"Disco Ball Helmet","disco:chest":"Disco Shirt","disco:legs":"Bell Bottoms","disco:boots":"Roller Skates","disco:weapon":"A Rusty Old Sabre","disco:vinylShard":"A Vinyl Record Shard","disco:whitePowder":"A Bit of White Powder","disco:rollingPaper":"Some Rolling Paper",

  // Halloweenie (set) -- ngu-idle.fandom.com/wiki/Halloweenie_(set) -- legs="A Broomstick" (blague sorcière), weapon="A Giant Scythe"
  "halloweenie:head":"Neck Bolts","halloweenie:chest":"Skeleton Shirt","halloweenie:legs":"A Broomstick","halloweenie:boots":"Fuzzy Boots","halloweenie:weapon":"A Giant Scythe","halloweenie:apple":"An Ordinary Apple","halloweenie:toiletPaper":"A Roll of Toilet Paper","halloweenie:pandora":"Pandora's Box",

  // Construction (set) -- ngu-idle.fandom.com/wiki/Construction_(set) -- slot "hammer" = objet "A Wooden Hammer" (arme réelle = A Giant Wrecking Ball)
  "construction:head":"A Hardhat","construction:chest":"High Visibility Vest","construction:legs":"Yet Another Generic Pair Of Jeans","construction:boots":"Steel Toed Boots","construction:weapon":"A Giant Wrecking Ball","construction:hammer":"A Wooden Hammer","construction:toolbox":"The Toolbox","construction:levelLevel":"A Level Level",

  // Duck (set) (DuckDuckGoose) -- ngu-idle.fandom.com/wiki/Duck_(set) -- slot "shotgun" = objet "A shotgun" (arme réelle = The Zapper)
  "duck:head":"A Fake Duckbill","duck:chest":"An Inflatable Ducky Innertube","duck:legs":"Duck Duck Shorts","duck:boots":"Duck Slippers","duck:weapon":"The Zapper","duck:shotgun":"A shotgun","duck:ducktTape":"Some Duck-t Tape","duck:duckCaller":"A Duck Caller",

  // Dutch (set) (Netherregions) -- ngu-idle.fandom.com/wiki/Dutch_(set)
  "dutch:head":"A Dutch Hat","dutch:chest":"Windmill Shirt","dutch:legs":"Stroopwaffel Pants","dutch:boots":"Clogs","dutch:weapon":"Weaponized Hollandaise sauce","dutch:tulip":"Black Tulip","dutch:netherlands":"Pocket Netherlands","dutch:cheese":"Rest of the Combat Cheese",

  // Pirate (set) (Aetherean Sea) -- ngu-idle.fandom.com/wiki/Pirate_(set) -- slot "cutlass" = objet "The Cutlass" (arme réelle = The Flintlock)
  "pirate:head":"Pirate Hat","pirate:chest":"Swashbuckler Chest","pirate:legs":"Piratey Pants","pirate:boots":"Piratey Peglegs","pirate:weapon":"The Flintlock","pirate:cutlass":"The Cutlass","pirate:eyepatch":"A Giant's Eyepatch","pirate:compass":"A Compass!",

  // Greasy Nerd (set)
  "greasynerd:head":"A Worn Out Fedora","greasynerd:chest":"Sweat-Stained NGU Shirt","greasynerd:legs":"Not Sweat-Stained Underpants","greasynerd:boots":"Nerdy Shoes","greasynerd:weapon":"Superior Japanese Katana",

  // Mobster (set)
  "mobster:head":"Mobster Hat","mobster:chest":"Mobster Vest","mobster:legs":"Mobster Pants","mobster:boots":"Cement Boots","mobster:weapon":"Tommy Gun","mobster:garrote":"A Garrote","mobster:brassKnuckles":"Brass Knuckles",

  // Exile (set)
  "exile:head":"Hat of Greed","exile:chest":"Blue Eyes White Chestplate","exile:legs":"Trap Pants","exile:boots":"All the other Titans' Missing Shoes","exile:weapon":"The Disk of Dueling",

  // Space (set)
  "space:head":"Space Helmet","space:chest":"Space Suit Chest","space:legs":"Space Suit Legs","space:boots":"Space Boots","space:weapon":"Space Gun!","space:manhole":"A Manhole","space:redShirt":"A Red Shirt",

  // Rock (set)
  "rock:head":"A Bandana","rock:chest":"Broken Drum","rock:legs":"Stonehenge Pants","rock:boots":"Platform Boots","rock:weapon":"Giant Drumsticks","rock:rocket":"A Rocket","rock:petRock":"A Pet Rock","rock:rollingStone":"A Rolling Stone",

  // Amalgamate (set)
  "amalgamate:head":"Choffice Hat of Greed","amalgamate:chest":"Wooden Office Apron of Might","amalgamate:legs":"Papapapantstststs of Utility","amalgamate:boots":"A Shoe.","amalgamate:weapon":"UUG's Big Book of Insults","amalgamate:deathstick":"THE DEATHSTICK","amalgamate:corruptedLeaf":"A Corrupted Leaf","amalgamate:glued":"8 Old Accessories Glued Together"
});

/* Noms français (Norman, 2026-10-03) : la table anglaise ci-dessus garde les noms du wiki pour référence ; le jeu affiche la traduction. */
export const SET_ITEM_NAMES_V1=Object.freeze({...SET_ITEM_NAMES_EN_V1,...NOMS_PIECES_FR_V1});

export const defById=id=>{const [set,slot]=String(id).split(":");return SETS[set]?.slots.includes(slot)?{kind:"set",set,slot}:SPECIALS[id]?{kind:"special",id}:null};

export const IDLE_ADVENTURE_SPECIAL_ORDRE_V1=Object.freeze(Object.fromEntries(Object.keys(SPECIALS).map((id,i)=>[id,i])));
