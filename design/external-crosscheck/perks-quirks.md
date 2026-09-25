# Contrôle croisé Perks et Quirks : jeu, wiki, source tierce

Date : 2026-09-25. Contrôle en lecture seule (aucun fichier de jeu modifié).
Jeu : `cloudflare/src/idle-perks-v1.js`, `idle-quirks-v1.js` et `idle-cards-v1.js` (perks 161-216, quirks 99-169). Wiki : pages Perk Points, Quirk Points, Fibonacci Perk, MacGuffin Fragments, THE END. Tierce : `ngu-idle-calculators-ts/perks.ts` et `quirks.ts` (GPL, donnée à confronter).
Version JSON des écarts : perks-quirks.json (même dossier). Le tableau complet de chaque entrée est en annexe.

## Limite de la source tierce

perks.ts et quirks.ts ne contiennent NI coût NI niveau max. Ils donnent seulement : id, nom, mode de difficulté (Normal / Evil / Sadistic), valeur par niveau des stats. Le coût et le cap ne se contrôlent donc que contre le wiki. La tierce sert à contrôler les identifiants, les noms, la difficulté et l'effet.

## (D) Résumé chiffré

| | Perks | Quirks |
|---|---|---|
| ids dans le wiki | 232 (0-231) | 186 (0-185) |
| ids dans la source tierce | 232 | 186 |
| ids dans le jeu | 231 (manque 56) | 186 |
| noms concordants jeu/wiki | 231/231 | 186/186 |
| coûts concordants jeu/wiki | 231/231 | 186/186 |
| caps concordants jeu/wiki | 231/231 (Fibonacci : cap 1597, coût 500, OK) | 186/186 |
| effets comparables à la tierce (la tierce a des stats) | 116 | 91 |
| effets concordants avec la tierce | 116/116 après analyse (114 bruts, 2 artefacts expliqués en B) | 91/91 |
| effets lus par du code de jeu | 230 sur 231 (231 ERROR = blague sans effet) | 185 sur 186 (176 = blague sans effet) |
| effets non branchés | 0 | 0 |
| difficulté modélisée par le jeu | non (aucun champ, aucun verrou) | non |

Bilan : 1 perk manquante, 0 écart de coût, 0 écart de cap, 0 écart réel de valeur. Le seul écart de fond est la difficulté (voir B).

## (A) Manquants

### Perk 56 : Macguffin Daycare! (seul manquant, trou connu)

| Source | Ce qu'elle dit |
|---|---|
| Wiki Perk Points | coût 5000 PP, cap 1, total 5000, note "Evil only", effet : "With this perk, the Daycare Kitty can use her power of happiness to improve your ancient cosmic artifacts! c:" |
| Wiki MacGuffin Fragments (tableau Perks) | "Allow MacGuffins to be put in daycare slots", 5,000 PP, 1 niveau, difficulté Evil |
| Source tierce | Perk(56, "macguffinDaycare!", "Macguffin Daycare!", GameMode.EVIL, 0, []) : aucun stat, donc RIEN de plus que le wiki |
| Jeu | absent du catalogue (l'en-tête dit : aucune vitesse de Daycare publiée pour les fragments) |

Conclusion : la source tierce ne comble pas le trou. Le seul contenu réel est "les MacGuffins peuvent être mis dans des slots de garderie". Aucune source ne donne la vitesse de croissance d'un MacGuffin en garderie ni la formule de niveaux. Le catalogue peut recevoir l'entrée (id 56, coût 5000, cap 1) avec bonus:{}, mais elle serait sans effet tant que la garderie n'accepte pas les MacGuffins. Décision à prendre : l'ajouter en "acheté sans effet" (comme 231) ou la laisser absente.

### Quirks : aucun manquant (0..185 tous présents).

## (B) Écarts

Aucun écart réel de nom, coût, cap ou valeur entre wiki, tierce et jeu. Quatre différences de surface et une différence de structure importante.

| id | objet | wiki | tierce | jeu | gravité |
|---|---|---|---|---|---|
| perk 90 | Improved Quest Looting (drop d'objets de quête) | +0,5 % par niveau | QUEST_DROP 0.5 | questDropsPct: 0.5 (en POURCENT, lu /100 dans idle-questing-v1.js:196) | aucune : effet correct, mais convention d'unité différente des autres clés (0.01 = 1 %) |
| perk 203 | Faster Mayo Generation II | Mayo Speed +0,4 %/niv | CARD_SPEED 0.4 (faute de la tierce, devrait être MAYO_SPEED) | mayoSpeedPct: 0.004 | aucune : le jeu suit le wiki, la tierce se trompe |
| perk 94 | nom de la Fibonacci Perk | "The Fibonacci Perk" | "Fibonacci Perk" | "The Fibonacci Perk" | cosmétique |
| perk 53, quirk 148 | noms | "Ooh, Another Digger Slot!" (jeu) contre "ooh, ..." (tierce) ; quirk 148 "Bigger Deck III" (le wiki affiche "Bigger Deck II<s>I</s>", balise de rendu) | idem | idem | cosmétique |

Fibonacci Perk : les 15 paliers du jeu (1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987) concordent avec le wiki ET avec la tierce (1 : Energy et Magic Power +10 % ; 2 : Energy Cap +10 % ; 3 : Magic Cap +10 % ; 5 : Energy NGU +5 % ; 8 : Magic NGU +5 % ; 13 : PP +5 % ; 21 : Energy et Magic Bars +10 % ; 34 : Power/Toughness/Health/Regen +13 % ; 55 : Daycare speed +5 % ; 89 : AP +2 % ; 144 : +5 % de chance de +1 niveau au loot ; 233 : QP +10 % ; 377 : Attack/Defense +377 % ; 610 : quêtes à 50 objets fixes ; 987 : EXP +5 % ; 1597 : art du chaton, sans effet).

### Écart de STRUCTURE : la difficulté

C'est l'écart qui compte le plus. Le jeu n'a aucun champ de difficulté et ne vérifie rien : buyPerkV1 et buyQuirkV1 (idle-ngu-progression.js, lignes ~6182 et ~6207) ne testent que la monnaie et le cap, et perkBonusesV1 applique l'effet quelle que soit la difficulté. L'en-tête des deux catalogues justifie cela par : la colonne "Buy Early?" (perks) / "Note" (quirks) ne serait qu'un conseil communautaire.

Les données contredisent cette lecture :

1. Concordance à 100 % entre le wiki et la tierce. La note "Evil only" / "Sadistic only" du wiki coïncide avec le champ mode (Evil = 1, Sadistic = 2) de la source tierce pour les 418 entrées (perks : 65 Normal, 85 Evil, 82 Sadistic ; quirks : 27 Normal, 55 Evil, 104 Sadistic), sans une exception. Un simple conseil d'ordre d'achat ne suivrait pas un champ de code aussi exactement.
2. La source tierce utilise ce champ comme un vrai verrou : Resource.appliesToGameMode(gameMode) renvoie mode <= gameMode (resource.ts). Un perk Evil ne s'applique donc pas en Normal dans le calculateur.
3. La page wiki MacGuffin Fragments a une colonne "Difficulty" explicite pour ses perks (56 Evil, 65 Normal, 66 Normal, 67 Evil, 68 Normal, 69 Normal, 70 Evil, 71 Evil, 72 Normal, 73 Evil, 88 Evil), identique à la tierce, présentée comme une propriété de la perk.

Conséquence de jeu : en difficulté Normal, un joueur peut aujourd'hui acheter et bénéficier de perks Evil/Sadistic (par exemple 125 "Welcome to Evil Difficulty" : +200 % Attack/Defense pour 200 PP ; 144 "Welcome to Sadistic" : +1000 % pour 500 000 PP) et de quirks Sadistic. C'est une décision de design de Norman (2026-09-18, "il faut tout faire"), à confirmer en connaissance de cause : les sources indiquent que le jeu réel verrouille par mode. Rien n'est modifié ici. La difficulté de chaque entrée est dans l'annexe.

## (C) Effets non branchés

Méthode : (1) chaque champ retourné par perkBonusesV1 et quirkBonusesV1 (55 champs perk, 32 champs quirk) a été cherché par grep dans tout cloudflare/src hors définition : tous sont lus ; (2) relance de design/audit-catalog-effects-read.mjs (exécution au niveau 1 de chaque entrée) ; (3) vérification manuelle des champs lus une seule fois (consommateur réel et non simple exposition dans un objet de sortie) : dropChanceMultiplier, ppEarningsMultiplier, expEarningsMultiplier, ironPillMultiplier, respawnRemaining, augmentSpeedMultiplier, bossExpMultiplier (via bossExpMultiplierFromPerks, lu dans idle-sqlite-runtime.js, 4 chemins de combat), titanExpBonusKills, beardTrimSpeedLevel, lootGoblinChance, yggYieldMultiplier, wishSlotBonus, itopodPppFlat, bloodGainMultiplier, hackMilestoneReduction (les ids de hacks des perks et des quirks correspondent aux id de IDLE_NGU_TRACKS.hacks).

Résultat : aucun effet catalogué n'est ignoré. Points à connaître :

| entrée | statut |
|---|---|
| perk 231 ERROR | aucun effet dans aucune source (blague). La page THE END l'associe à la pièce #482 "NGU.EXE WILL NOW CLOSE." ; SOREAL n'a pas les pièces THE END. |
| quirk 176 A PROBLEM HAS BEEN DETECTED | idem ; pièce THE END #486 "A FATAL EXCEPTION HAS OCCURED." |
| perk 30 What a Crappy Perk | lu par la constante IDLE_YGG_ITOPOD_POOP_PERK_ID_V1 = 30 (idle-yggdrasil-extra-v1.js:94-103). L'audit existant la signale à tort "id jamais cité" : faux positif (lecture par constante nommée). |
| quirk 13 The Beast's Fertilizer | lu par la constante IDLE_YGG_FERTILIZER_QUIRK_ID_V1 = 13 (idle-yggdrasil-extra-v1.js:232-237, moins 60 s par niveau). Même faux positif de l'audit. |
| perks 16, 17 | lus par id (perks[16], perks[17], idle-yggdrasil-extra-v1.js:253-254). |
| perks 65-73, 88 et quirks 19, 50 | lus par id dans idle-macguffins-v1.js (slots, drops ITOPOD, sorts Blood alpha/beta). |
| perks 111, 112 et quirk 55 | lus par id dans idle-inventory-auto-v1.js:166-167 (automerge). |
| quirks 14, 89 | propagation des niveaux de NGU (grantNguLevelsV1, idle-ngu-progression.js:4385-4391). |
| perk 144 | augmentSpeedPct et nguSpeed*Pct (0.2) sont bien dans bonus et lus ; le commentaire d'en-tête d'idle-perks-v1.js (lignes 33-41) dit encore l'inverse : commentaire périmé à corriger, pas de bug. |

Points de vigilance non bloquants : (a) l'audit existant ne suit pas la chaîne au-delà de la première lecture (limite qu'il déclare) ; (b) perk 34 : le wiki décrit un bug du vrai jeu (auto-kill de Titans à l'ouverture ne décrémente pas le compteur), non répliqué ici, ce qui est correct.

## Perks et quirks "à effet inconnu" : ce que dit la source tierce

- Perk 56 : mode Evil, aucun stat (voir A).
- Perk 231 et quirk 176 : mode Sadistic, aucun stat. Aucune information supplémentaire ; seule la page wiki THE END les relie à des pièces du puzzle THE END.
- Quirks 13, 14, 19, 50, 55, 89 : effet purement qualitatif (Fertilizer -60 s de pousse par niveau, propagation de niveaux de NGU, slots MacGuffin, slot d'automerge) : la tierce n'a aucun stat, le jeu les implémente depuis le wiki (voir C).
- Autres quirks sans stat côté tierce (17, 18, banques 20-34, 54, 56-60, 70, 71, 74, 75, 90, 146-149, 151, 156, 174, 175 et les tiers de cartes) : la tierce ne contredit pas le jeu et ne fournit aucune valeur ; les valeurs du jeu viennent du wiki.
- Quirk 10 (Beard Tonic) : tierce MAGIC_BEARD_SPEED 1 + ENERGY_BEARD_SPEED 1 par niveau, jeu beardSpeedPct 0.01 : concordant.

## Ambiguïtés

1. Difficulté : voir la section B, à trancher par Norman.
2. Unité de questDropsPct (perk 90) : exception à la convention "fraction" des autres clés.
3. Le wiki ne donne aucune formule pour le perk 56 ni pour la vitesse des MacGuffins en garderie.
4. Les paraphrases d'effet du jeu (perks 21, 32, 34, 94 ; quirks 15, 16) diffèrent du texte du wiki, mais les nombres sont ceux du wiki (vérifié dans le code pour 21 : pente 8 / (24 - niveau), minimum 12 h).
5. La tierce n'a ni coût ni cap : aucun contrôle indépendant du wiki n'est possible sur ces deux colonnes.

## Annexe : tableau complet

Colonne "branché" : agrégat = champ de perkBonusesV1/quirkBonusesV1 lu ailleurs ; cartes = idleCardsModifiersV1 ; quêtes = idleQuestBonusTotalsV1 ; "id via constante" / "lecture par id" = lu par identifiant ; "aucun (blague)" = sans effet dans les sources. Statut OK = nom, coût, cap et valeur identiques entre wiki, tierce et jeu.

### Perks (232)

| id | nom | coût | cap | effet par niveau (clés du jeu) | difficulté (tierce) | branché | statut |
|---|---|---|---|---|---|---|---|
| 0 | The Newbie Energy Perk | 1 | 1 | energyPowerFlat=3, energyBarsFlat=3 | Normal | agrégat | OK |
| 1 | The Newbie Magic Perk | 1 | 1 | magicPowerFlat=1, magicBarsFlat=1, magicCapFlat=10000 | Normal | agrégat | OK |
| 2 | The Newbie Adventure Perk | 1 | 1 | adventurePowerFlat=100, adventureToughnessFlat=100, adventureStatsPct=0.1 | Normal | agrégat | OK |
| 3 | The Newbie Drop Chance Perk | 1 | 1 | dropChancePct=0.1 | Normal | agrégat | OK |
| 4 | The Newbie Stat Perk | 1 | 1 | statPct=1 | Normal | agrégat | OK |
| 5 | Stat Boost for Rich Perks I | 1 | 1000 | statPct=0.1 | Normal | agrégat | OK |
| 6 | Generic Energy Power Perk I | 1 | 50 | energyPowerPct=0.01 | Normal | agrégat | OK |
| 7 | Generic Energy Bar Perk I | 1 | 50 | energyBarsPct=0.01 | Normal | agrégat | OK |
| 8 | Generic Energy Cap Perk I | 1 | 50 | energyCapPct=0.01 | Normal | agrégat | OK |
| 9 | Generic Magic Power Perk I | 1 | 50 | magicPowerPct=0.01 | Normal | agrégat | OK |
| 10 | Generic Magic Bar Perk I | 1 | 50 | magicBarsPct=0.01 | Normal | agrégat | OK |
| 11 | Generic Magic Cap Perk I | 1 | 50 | magicCapPct=0.01 | Normal | agrégat | OK |
| 12 | Boosted Boosts I | 1 | 60 | boostPowerPct=0.025 | Normal | agrégat | OK |
| 13 | Faster NGU Energy | 5 | 20 | nguSpeedEnergyPct=0.025 | Normal | agrégat | OK |
| 14 | Faster NGU Magic | 5 | 20 | nguSpeedMagicPct=0.025 | Normal | agrégat | OK |
| 15 | Double Basic Training | 100 | 1 | doubleBasicTraining=1 | Normal | agrégat | OK |
| 16 | Quicker Power Fruit Beta Activation | 50 | 1 | (par id / sans agrégat) | Normal | lecture par id | OK |
| 17 | Quicker Fruit of Numbers Bonus Activation | 50 | 1 | (par id / sans agrégat) | Normal | lecture par id | OK |
| 18 | Instant Advanced Training Levels! | 2 | 100 | advancedTrainingStartBonus=1 | Normal | agrégat | OK |
| 19 | Fruit of Knowledge sucks, 1/5 | 20 | 1 | fruitKnowledgeExpPerks=1 | Normal | agrégat | OK |
| 20 | Fruit of Knowledge STILL sucks, 1/5 | 150 | 1 | fruitKnowledgeExpPerks=1 | Normal | agrégat | OK |
| 21 | Five O'Clock Shadow | 10 | 12 | beardTrimSpeedLevel=1 | Normal | agrégat | OK |
| 22 | Wandoos Lover | 1 | 50 | wandoosOsLevelFlat=2 | Normal | agrégat | OK |
| 23 | Golden Showers | 1 | 200 | adventureGoldPct=0.05 | Normal | agrégat | OK |
| 24 | I Want Your Seeds ;) | 10 | 20 | seedYieldPct=0.05 | Normal | agrégat | OK |
| 25 | The Loot Goblin's Blessing | 10 | 10 | lootGoblinChancePct=0.01 | Normal | agrégat | OK |
| 26 | Improved Cube Boosting! | 100 | 1 | cubeBoostRatePct=0.01 | Normal | agrégat | OK |
| 27 | Daycare Kitty's Blessing I | 5 | 5 | daycareTimePct=0.01 | Normal | agrégat | OK |
| 28 | Daycare Kitty's Blessing II | 25 | 5 | daycareTimePct=0.01 | Normal | agrégat | OK |
| 29 | You'll Really Want This | 250 | 1 | accessorySlotBonus=1 | Normal | agrégat | OK |
| 30 | What a Crappy Perk | 25 | 1 | (par id / sans agrégat) | Normal | id via constante | OK |
| 31 | More Inventory Space I | 2 | 12 | inventorySlotBonus=1 | Normal | agrégat | OK |
| 32 | More Inventory Space II | 10 | 12 | inventorySlotBonus=1 | Normal | agrégat | OK |
| 33 | Boosted Boosts II | 5 | 60 | boostPowerPct=0.02 | Normal | agrégat | OK |
| 34 | Bonus Titan EXP! | 30 | 3 | titanExpBonusKills=3 | Normal | agrégat | OK |
| 35 | Bonus Boss Exp! | 20 | 25 | bossExpPct=0.02 | Normal | agrégat | OK |
| 36 | Advanced Training Level Bank I | 3 | 10 | atBankPct=0.01 | Normal | agrégat | OK |
| 37 | Advanced Training Level Bank II | 10 | 10 | atBankPct=0.01 | Normal | agrégat | OK |
| 38 | Advanced Training Level Bank III | 25 | 10 | atBankPct=0.01 | Normal | agrégat | OK |
| 39 | Advanced Training Level Bank IV | 50 | 10 | atBankPct=0.01 | Normal | agrégat | OK |
| 40 | Advanced Training Level Bank V | 100 | 10 | atBankPct=0.01 | Normal | agrégat | OK |
| 41 | Time Machine Level Bank I | 3 | 10 | tmBankPct=0.01 | Normal | agrégat | OK |
| 42 | Time Machine Level Bank II | 10 | 10 | tmBankPct=0.01 | Normal | agrégat | OK |
| 43 | Time Machine Level Bank III | 25 | 10 | tmBankPct=0.01 | Normal | agrégat | OK |
| 44 | Time Machine Level Bank IV | 50 | 10 | tmBankPct=0.01 | Normal | agrégat | OK |
| 45 | Time Machine Level Bank V | 100 | 10 | tmBankPct=0.01 | Normal | agrégat | OK |
| 46 | Beard Temp Level Bank I | 3 | 10 | beardBankPct=0.01 | Normal | agrégat | OK |
| 47 | Beard Temp Level Bank II | 10 | 10 | beardBankPct=0.01 | Normal | agrégat | OK |
| 48 | Beard Temp Level Bank III | 25 | 10 | beardBankPct=0.01 | Normal | agrégat | OK |
| 49 | Beard Temp Level Bank IV | 50 | 10 | beardBankPct=0.01 | Normal | agrégat | OK |
| 50 | Beard Temp Level Bank V | 100 | 10 | beardBankPct=0.01 | Normal | agrégat | OK |
| 51 | The First Harvest's The Best | 25 | 5 | firstHarvestPct=0.1 | Normal | agrégat | OK |
| 52 | A Digger Slot! | 25 | 1 | diggerSlotBonus=1 | Normal | agrégat | OK |
| 53 | Ooh, Another Digger Slot! | 250 | 1 | diggerSlotBonus=1 | Normal | agrégat | OK |
| 54 | Stat Boost for Rich Perks II | 100 | 1000 | statPct=0.01 | Normal | agrégat | OK |
| 55 | Adventure Boost For Rich Perks I | 100 | 1000 | adventureStatsPct=0.001 | Normal | agrégat | OK |
| 56 | Macguffin Daycare! | 5000 | 1 | With this perk, the Daycare Kitty can use her powe | Evil | absent | ABSENT JEU |
| 57 | Generic Energy Power Perk II | 50 | 100 | energyPowerPct=0.01 | Evil | agrégat | OK |
| 58 | Generic Energy Bar Perk II | 50 | 100 | energyBarsPct=0.01 | Evil | agrégat | OK |
| 59 | Generic Energy Cap Perk II | 50 | 100 | energyCapPct=0.01 | Evil | agrégat | OK |
| 60 | Generic Magic Power Perk II | 50 | 100 | magicPowerPct=0.01 | Evil | agrégat | OK |
| 61 | Generic Magic Bar Perk II | 50 | 100 | magicBarsPct=0.01 | Evil | agrégat | OK |
| 62 | Generic Magic Cap Perk II | 50 | 100 | magicCapPct=0.01 | Evil | agrégat | OK |
| 63 | Faster NGU Energy II | 100 | 100 | nguSpeedEnergyPct=0.02 | Evil | agrégat | OK |
| 64 | Faster NGU Magic II | 100 | 100 | nguSpeedMagicPct=0.02 | Evil | agrégat | OK |
| 65 | Improved Macguffin Drops I | 150 | 1 | (par id / sans agrégat) | Normal | lecture par id | OK |
| 66 | A MacGuffin Slot! | 250 | 1 | (par id / sans agrégat) | Normal | lecture par id | OK |
| 67 | Another MacGuffin Slot! | 5000 | 1 | (par id / sans agrégat) | Evil | lecture par id | OK |
| 68 | MacGuffin ITOPOD Drops! | 50 | 1 | (par id / sans agrégat) | Normal | lecture par id | OK |
| 69 | Improved MacGuffin ITOPOD Drops I | 150 | 1 | (par id / sans agrégat) | Normal | lecture par id | OK |
| 70 | Improved MacGuffin ITOPOD Drops II | 500 | 1 | (par id / sans agrégat) | Evil | lecture par id | OK |
| 71 | Improved MacGuffin ITOPOD Drops III | 2500 | 1 | (par id / sans agrégat) | Evil | lecture par id | OK |
| 72 | Blood Macguffin α Spell! | 100 | 1 | (par id / sans agrégat) | Normal | lecture par id | OK |
| 73 | Blood Macguffin β Spell! | 5000 | 1 | (par id / sans agrégat) | Evil | lecture par id | OK |
| 74 | Generic Energy Power Perk III | 250 | 100 | energyPowerPct=0.003 | Evil | agrégat | OK |
| 75 | Generic Energy Bar Perk III | 250 | 100 | energyBarsPct=0.003 | Evil | agrégat | OK |
| 76 | Generic Energy Cap Perk III | 250 | 100 | energyCapPct=0.003 | Evil | agrégat | OK |
| 77 | Generic Magic Power Perk III | 250 | 100 | magicPowerPct=0.003 | Evil | agrégat | OK |
| 78 | Generic Magic Bar Perk III | 250 | 100 | magicBarsPct=0.003 | Evil | agrégat | OK |
| 79 | Generic Magic Cap Perk III | 250 | 100 | magicCapPct=0.003 | Evil | agrégat | OK |
| 80 | Faster NGU Energy III | 250 | 100 | nguSpeedEnergyPct=0.003 | Evil | agrégat | OK |
| 81 | Faster NGU Magic III | 250 | 100 | nguSpeedMagicPct=0.003 | Evil | agrégat | OK |
| 82 | Stat Boost for Rich Perks III | 1000 | 1000 | statPct=0.01 | Evil | agrégat | OK |
| 83 | Adventure Boost For Rich Perks II | 1000 | 1000 | adventureStatsPct=0.001 | Evil | agrégat | OK |
| 84 | "Iron Pill Also Sucks 1/5" | 500 | 5 | ironPillA=5 | Evil | agrégat | OK |
| 85 | "Iron Pill Still Sucks 1/5" | 33333 | 3 | ironPillB=1 | Evil | agrégat | OK |
| 86 | Daycare Slot! c: | 50000 | 1 | daycareSlotBonus=1 | Evil | agrégat | OK |
| 87 | Not So Minor Anymore | 30000 | 1 | questMinorBaseQp=2 | Evil | quêtes | OK |
| 88 | Another MacGuffin Slot! | 40000 | 1 | (par id / sans agrégat) | Evil | lecture par id | OK |
| 89 | Better QP Rewards! | 400 | 50 | qpEarningsPct=0.002 | Evil | agrégat | OK |
| 90 | Improved Quest Looting | 200 | 30 | questDropsPct=0.5 | Evil | quêtes | effet_tierce |
| 91 | Advanced Gooder Idle Questing | 25000 | 1 | questIdleDividerReduction=1 | Evil | quêtes | OK |
| 92 | Even More Advanced Gooder Idle Questing | 250000 | 1 | questIdleDividerReduction=1 | Evil | quêtes | OK |
| 93 | SPAWN FASTER DAMMIT | 2500 | 100 | respawnPct=0.001 | Evil | agrégat | OK |
| 94 | The Fibonacci Perk | 500 | 1597 | paliers Fibonacci (voir §Fibonacci) | Normal | agrégat+quêtes | nom_tierce,nom_wiki_vs_tierce |
| 95 | Generic Resource 3 Power Perk I | 250 | 100 | r3PowerPct=0.01 | Evil | agrégat | OK |
| 96 | Generic Resource 3 Bar Perk I | 250 | 100 | r3BarsPct=0.01 | Evil | agrégat | OK |
| 97 | Generic Resource 3 Cap Perk I | 250 | 100 | r3CapPct=0.01 | Evil | agrégat | OK |
| 98 | Generic Resource 3 Power Perk II | 2500 | 100 | r3PowerPct=0.01 | Evil | agrégat | OK |
| 99 | Generic Resource 3 Bar Perk II | 2500 | 100 | r3BarsPct=0.01 | Evil | agrégat | OK |
| 100 | Generic Resource 3 Cap Perk II | 2500 | 100 | r3CapPct=0.01 | Evil | agrégat | OK |
| 101 | Generic Resource 3 Power Perk III | 25000 | 100 | r3PowerPct=0.01 | Evil | agrégat | OK |
| 102 | Generic Resource 3 Bar Perk III | 25000 | 100 | r3BarsPct=0.01 | Evil | agrégat | OK |
| 103 | Generic Resource 3 Cap Perk III | 25000 | 100 | r3CapPct=0.01 | Evil | agrégat | OK |
| 104 | Truly Idle Questing | 200 | 1 | questTrulyIdle=1 | Normal | quêtes | OK |
| 105 | Gooder Idle Questing | 100 | 1 | questIdleDividerReduction=2 | Normal | quêtes | OK |
| 106 | Another Gooder Idle Questing | 5000 | 1 | questIdleDividerReduction=1 | Evil | quêtes | OK |
| 107 | Boosted Boosts III | 20000 | 60 | boostPowerPct=0.02 | Evil | agrégat | OK |
| 108 | Faster Wishes I | 5000 | 50 | wishSpeedPct=0.002 | Evil | agrégat | OK |
| 109 | Minimum Wish Time Reduction I | 10000 | 50 | wishMinTimeSeconds=24 | Evil | agrégat | OK |
| 110 | Minimum Wish Time Reduction II | 100000 | 50 | wishMinTimeSeconds=24 | Evil | agrégat | OK |
| 111 | An Inventory Merge Slot | 250 | 1 | (par id / sans agrégat) | Normal | lecture par id | OK |
| 112 | Another Inventory Merge Slot | 500000 | 1 | (par id / sans agrégat) | Evil | lecture par id | OK |
| 113 | Adventure Hack Milestone Reduces I | 4000000 | 5 | hackReduce_adventureStats=1 | Evil | agrégat | OK |
| 114 | Blood Hack Milestone Reduces I | 10000 | 5 | hackReduce_bloodGain=1 | Evil | agrégat | OK |
| 115 | Daycare Hack Milestone Reduces I | 200000 | 5 | hackReduce_daycare=1 | Evil | agrégat | OK |
| 116 | Generic Energy Power Perk IV | 100000 | 100 | energyPowerPct=0.002 | Evil | agrégat | OK |
| 117 | Generic Energy Bar Perk IV | 100000 | 100 | energyBarsPct=0.002 | Evil | agrégat | OK |
| 118 | Generic Energy Cap Perk IV | 100000 | 100 | energyCapPct=0.002 | Evil | agrégat | OK |
| 119 | Generic Magic Power Perk IV | 100000 | 100 | magicPowerPct=0.002 | Evil | agrégat | OK |
| 120 | Generic Magic Bar Perk IV | 100000 | 100 | magicBarsPct=0.002 | Evil | agrégat | OK |
| 121 | Generic Magic Cap Perk IV | 100000 | 100 | magicCapPct=0.002 | Evil | agrégat | OK |
| 122 | Generic Resource 3 Power Perk IV | 100000 | 100 | r3PowerPct=0.01 | Evil | agrégat | OK |
| 123 | Generic Resource 3 Bar Perk IV | 100000 | 100 | r3BarsPct=0.01 | Evil | agrégat | OK |
| 124 | Generic Resource 3 Cap Perk IV | 100000 | 100 | r3CapPct=0.01 | Evil | agrégat | OK |
| 125 | Welcome to Evil Difficulty | 200 | 1 | statPct=2, dropChancePct=0.5 | Evil | agrégat | OK |
| 126 | Generic Energy Power Perk V | 500000 | 100 | energyPowerPct=0.002 | Sadistic | agrégat | OK |
| 127 | Generic Energy Bar Perk V | 500000 | 100 | energyBarsPct=0.001 | Sadistic | agrégat | OK |
| 128 | Generic Energy Cap Perk V | 500000 | 100 | energyCapPct=0.001 | Sadistic | agrégat | OK |
| 129 | Generic Magic Power Perk V | 500000 | 100 | magicPowerPct=0.002 | Sadistic | agrégat | OK |
| 130 | Generic Magic Bar Perk V | 500000 | 100 | magicBarsPct=0.001 | Sadistic | agrégat | OK |
| 131 | Generic Magic Cap Perk V | 500000 | 100 | magicCapPct=0.001 | Sadistic | agrégat | OK |
| 132 | Generic Resource 3 Power Perk V | 500000 | 100 | r3PowerPct=0.01 | Sadistic | agrégat | OK |
| 133 | Generic Resource 3 Bar Perk V | 500000 | 100 | r3BarsPct=0.005 | Sadistic | agrégat | OK |
| 134 | Generic Resource 3 Cap Perk V | 500000 | 100 | r3CapPct=0.005 | Sadistic | agrégat | OK |
| 135 | Generic Energy Power Perk VI | 2500000 | 100 | energyPowerPct=0.002 | Sadistic | agrégat | OK |
| 136 | Generic Energy Bar Perk VI | 2500000 | 100 | energyBarsPct=0.001 | Sadistic | agrégat | OK |
| 137 | Generic Energy Cap Perk VI | 2500000 | 100 | energyCapPct=0.001 | Sadistic | agrégat | OK |
| 138 | Generic Magic Power Perk VI | 2500000 | 100 | magicPowerPct=0.002 | Sadistic | agrégat | OK |
| 139 | Generic Magic Bar Perk VI | 2500000 | 100 | magicBarsPct=0.001 | Sadistic | agrégat | OK |
| 140 | Generic Magic Cap Perk VI | 2500000 | 100 | magicCapPct=0.001 | Sadistic | agrégat | OK |
| 141 | Generic Resource 3 Power Perk VI | 2500000 | 100 | r3PowerPct=0.01 | Sadistic | agrégat | OK |
| 142 | Generic Resource 3 Bar Perk VI | 2500000 | 100 | r3BarsPct=0.005 | Sadistic | agrégat | OK |
| 143 | Generic Resource 3 Cap Perk VI | 2500000 | 100 | r3CapPct=0.005 | Sadistic | agrégat | OK |
| 144 | Welcome to Sadistic Difficulty | 500000 | 1 | statPct=10, adventureStatsPct=0.15, augmentSpeedPct=0.2, nguSpeedEnergyPct=0.2, nguSpeedMagicPct=0.2 | Sadistic | agrégat | OK |
| 145 | Bonus Quest Handin Progess I | 1500 | 1 | questHandinReduction=1 | Evil | quêtes | OK |
| 146 | Bonus Quest Handin Progess II | 50000 | 2 | questHandinReduction=1 | Evil | quêtes | OK |
| 147 | Improved Major Quest QP Rewards | 1000000 | 10 | questMajorBaseQp=1 | Sadistic | quêtes | OK |
| 148 | Improved Minor Quest QP Rewards | 5000000 | 2 | questMinorBaseQp=1 | Sadistic | quêtes | OK |
| 149 | Stat Boost for rich Perks IV | 10000 | 1000 | statPct=0.01 | Evil | agrégat | OK |
| 150 | Adventure Boost For Rich Perks III | 10000 | 1000 | adventureStatsPct=0.0005 | Evil | agrégat | OK |
| 151 | Stat Boost for rich Perks V | 100000 | 1000 | statPct=0.01 | Sadistic | agrégat | OK |
| 152 | Adventure Boost For Rich Perks IV | 100000 | 1000 | adventureStatsPct=0.0005 | Sadistic | agrégat | OK |
| 153 | Stat Boost for rich Perks VI | 1000000 | 1000 | statPct=0.01 | Sadistic | agrégat | OK |
| 154 | Adventure Boost For Rich Perks V | 1000000 | 1000 | adventureStatsPct=0.0005 | Sadistic | agrégat | OK |
| 155 | Faster Wishes II | 50000 | 100 | wishSpeedPct=0.001 | Evil | agrégat | OK |
| 156 | Faster Wishes III | 200000 | 100 | wishSpeedPct=0.001 | Evil | agrégat | OK |
| 157 | Improved Sadistic Boss Multiplier I | 1000000 | 10 | sadisticBossMultiplierBonus=0.0005 | Sadistic | agrégat | OK |
| 158 | Improved Sadistic Boss Multiplier II | 20000000 | 10 | sadisticBossMultiplierBonus=0.0005 | Sadistic | agrégat | OK |
| 159 | Faster Wishes IV | 800000 | 100 | wishSpeedPct=0.001 | Sadistic | agrégat | OK |
| 160 | Faster Wishes V | 3000000 | 100 | wishSpeedPct=0.001 | Sadistic | agrégat | OK |
| 161 | Augment Card Tier Up I | 150000 | 1 | cardTier_augments=1 | Evil | cartes | OK |
| 162 | Gold Drop Card Tier Up I | 200000 | 1 | cardTier_gold=1 | Evil | cartes | OK |
| 163 | Wishes Card Tier Up I | 300000 | 1 | cardTier_wishes=1 | Evil | cartes | OK |
| 164 | A/D Card Tier Up I | 150000 | 1 | cardTier_stats=1 | Evil | cartes | OK |
| 165 | Magic NGU Card Tier Up I | 600000 | 1 | cardTier_magicNgu=1 | Evil | cartes | OK |
| 166 | TM Card Tier Up I | 500000 | 1 | cardTier_timeMachine=1 | Evil | cartes | OK |
| 167 | QP Card Tier Up I | 800000 | 1 | cardTier_qp=1 | Evil | cartes | OK |
| 168 | Daycare Card Tier Up I | 1000000 | 1 | cardTier_daycare=1 | Evil | cartes | OK |
| 169 | Energy NGU Card Tier Up I | 2000000 | 1 | cardTier_energyNgu=1 | Evil | cartes | OK |
| 170 | Drop Chance Card Tier Up I | 1500000 | 1 | cardTier_drop=1 | Evil | cartes | OK |
| 171 | Wandoos Card Tier Up I | 1000000 | 1 | cardTier_wandoos=1 | Evil | cartes | OK |
| 172 | Adventure Stats Card Tier Up I | 3000000 | 1 | cardTier_adventure=1 | Evil | cartes | OK |
| 173 | Hacks Card Tier Up I | 2500000 | 1 | cardTier_hacks=1 | Evil | cartes | OK |
| 174 | Augment Card Tier Up II | 1500000 | 1 | cardTier_augments=1 | Sadistic | cartes | OK |
| 175 | Gold Drop Card Tier Up II | 2000000 | 1 | cardTier_gold=1 | Sadistic | cartes | OK |
| 176 | Wishes Card Tier Up II | 3000000 | 1 | cardTier_wishes=1 | Sadistic | cartes | OK |
| 177 | A/D Card Tier Up II | 1500000 | 1 | cardTier_stats=1 | Sadistic | cartes | OK |
| 178 | Magic NGU Card Tier Up II | 6000000 | 1 | cardTier_magicNgu=1 | Sadistic | cartes | OK |
| 179 | TM Card Tier Up II | 5000000 | 1 | cardTier_timeMachine=1 | Sadistic | cartes | OK |
| 180 | QP Card Tier Up II | 8000000 | 1 | cardTier_qp=1 | Sadistic | cartes | OK |
| 181 | Daycare Card Tier Up II | 10000000 | 1 | cardTier_daycare=1 | Sadistic | cartes | OK |
| 182 | Energy NGU Card Tier Up II | 20000000 | 1 | cardTier_energyNgu=1 | Sadistic | cartes | OK |
| 183 | Drop Chance Card Tier Up II | 15000000 | 1 | cardTier_drop=1 | Sadistic | cartes | OK |
| 184 | Wandoos Card Tier Up II | 10000000 | 1 | cardTier_wandoos=1 | Sadistic | cartes | OK |
| 185 | Adventure Stats Card Tier Up II | 30000000 | 1 | cardTier_adventure=1 | Sadistic | cartes | OK |
| 186 | Hacks Card Tier Up II | 25000000 | 1 | cardTier_hacks=1 | Sadistic | cartes | OK |
| 187 | Augment Card Tier Up III | 15000000 | 1 | cardTier_augments=1 | Sadistic | cartes | OK |
| 188 | Gold Drop Card Tier Up III | 20000000 | 1 | cardTier_gold=1 | Sadistic | cartes | OK |
| 189 | Wishes Card Tier Up III | 30000000 | 1 | cardTier_wishes=1 | Sadistic | cartes | OK |
| 190 | A/D Card Tier Up III | 15000000 | 1 | cardTier_stats=1 | Sadistic | cartes | OK |
| 191 | Magic NGU Card Tier Up III | 60000000 | 1 | cardTier_magicNgu=1 | Sadistic | cartes | OK |
| 192 | TM Card Tier Up III | 50000000 | 1 | cardTier_timeMachine=1 | Sadistic | cartes | OK |
| 193 | QP Card Tier Up III | 80000000 | 1 | cardTier_qp=1 | Sadistic | cartes | OK |
| 194 | Daycare Card Tier Up III | 100000000 | 1 | cardTier_daycare=1 | Sadistic | cartes | OK |
| 195 | Energy NGU Card Tier Up III | 200000000 | 1 | cardTier_energyNgu=1 | Sadistic | cartes | OK |
| 196 | Drop Chance Card Tier Up III | 150000000 | 1 | cardTier_drop=1 | Sadistic | cartes | OK |
| 197 | Wandoos Card Tier Up III | 100000000 | 1 | cardTier_wandoos=1 | Sadistic | cartes | OK |
| 198 | Adventure Stats Card Tier Up III | 300000000 | 1 | cardTier_adventure=1 | Sadistic | cartes | OK |
| 199 | Hacks Card Tier Up III | 250000000 | 1 | cardTier_hacks=1 | Sadistic | cartes | OK |
| 200 | Faster Card Generation I | 200000 | 10 | cardSpeedPct=0.005 | Evil | cartes | OK |
| 201 | Faster Mayo Generation I | 200000 | 10 | mayoSpeedPct=0.005 | Evil | cartes | OK |
| 202 | Faster Card Generation II | 2000000 | 10 | cardSpeedPct=0.004 | Sadistic | cartes | OK |
| 203 | Faster Mayo Generation II | 2000000 | 10 | mayoSpeedPct=0.004 | Sadistic | cartes | effet_tierce |
| 204 | Faster Card Generation III | 20000000 | 10 | cardSpeedPct=0.003 | Sadistic | cartes | OK |
| 205 | Faster Mayo Generation III | 20000000 | 10 | mayoSpeedPct=0.003 | Sadistic | cartes | OK |
| 206 | Faster Card Generation IV | 200000000 | 10 | cardSpeedPct=0.003 | Sadistic | cartes | OK |
| 207 | Faster Mayo Generation IV | 200000000 | 10 | mayoSpeedPct=0.003 | Sadistic | cartes | OK |
| 208 | Bigger Deck Size I | 500000 | 5 | cardDeckSize=1 | Evil | cartes | OK |
| 209 | Bigger Deck Size II | 5000000 | 5 | cardDeckSize=1 | Sadistic | cartes | OK |
| 210 | Bigger Deck Size III | 50000000 | 5 | cardDeckSize=1 | Sadistic | cartes | OK |
| 211 | Extra Mayo Generator! | 750000 | 1 | mayoGenerators=1 | Evil | cartes | OK |
| 212 | Better Tags I | 200000 | 10 | cardTagEffectPct=0.0005 | Evil | cartes | OK |
| 213 | Better Tags II | 1000000 | 10 | cardTagEffectPct=0.0004 | Sadistic | cartes | OK |
| 214 | Better Tags III | 5000000 | 10 | cardTagEffectPct=0.0004 | Sadistic | cartes | OK |
| 215 | Better Tags IV | 20000000 | 10 | cardTagEffectPct=0.0004 | Sadistic | cartes | OK |
| 216 | Card Recycling: Card Spawn | 3000000 | 1 | cardRecycleSpawn=1 | Sadistic | cartes | OK |
| 217 | Drop Chance Hack Milestone Reducer I | 3000000 | 4 | hackReduce_dropChance=1 | Sadistic | agrégat | OK |
| 218 | Augments Hack Milestone Reducer I | 5000000 | 2 | hackReduce_augmentSpeed=1 | Sadistic | agrégat | OK |
| 219 | Magic NGU Hack Milestone Reducer I | 8000000 | 3 | hackReduce_magicNguSpeed=1 | Sadistic | agrégat | OK |
| 220 | The Final Generic Energy Power Perk | 10000000 | 100 | energyPowerPct=0.01 | Sadistic | agrégat | OK |
| 221 | The Final Generic Energy Bar Perk | 10000000 | 100 | energyBarsPct=0.01 | Sadistic | agrégat | OK |
| 222 | The Final Generic Energy Cap Perk | 10000000 | 100 | energyCapPct=0.01 | Sadistic | agrégat | OK |
| 223 | The Final Generic Magic Power Perk | 10000000 | 100 | magicPowerPct=0.01 | Sadistic | agrégat | OK |
| 224 | The Final Generic Magic Bar Perk | 10000000 | 100 | magicBarsPct=0.01 | Sadistic | agrégat | OK |
| 225 | The Final Generic Magic Cap Perk | 10000000 | 100 | magicCapPct=0.01 | Sadistic | agrégat | OK |
| 226 | The Final Generic Resource 3 Power Perk | 10000000 | 100 | r3PowerPct=0.01 | Sadistic | agrégat | OK |
| 227 | The Final Generic Resource 3 Bar Perk | 10000000 | 100 | r3BarsPct=0.01 | Sadistic | agrégat | OK |
| 228 | The Final Generic Resource 3 Cap Perk | 10000000 | 100 | r3CapPct=0.01 | Sadistic | agrégat | OK |
| 229 | Boosted Boosts IV | 2000000 | 50 | boostPowerPct=0.01 | Sadistic | agrégat | OK |
| 230 | Boosted Boosts V | 10000000 | 50 | boostPowerPct=0.01 | Sadistic | agrégat | OK |
| 231 | ERROR | 2500000000 | 1 | (par id / sans agrégat) | Sadistic | aucun (blague) | OK |

### Quirks (186)

| id | nom | coût | cap | effet par niveau (clés du jeu) | difficulté (tierce) | branché | statut |
|---|---|---|---|---|---|---|---|
| 0 | Baby's First Quirk: Energy Power | 100 | 1 | energyPowerPct=0.1 | Normal | agrégat | OK |
| 1 | Baby's First Quirk: Energy Cap | 100 | 1 | energyCapPct=0.1 | Normal | agrégat | OK |
| 2 | Baby's First Quirk: Energy Bars | 100 | 1 | energyBarsPct=0.1 | Normal | agrégat | OK |
| 3 | Baby's First Quirk: Magic Power | 100 | 1 | magicPowerPct=0.1 | Normal | agrégat | OK |
| 4 | Baby's First Quirk: Magic Cap | 100 | 1 | magicCapPct=0.1 | Normal | agrégat | OK |
| 5 | Baby's First Quirk: Magic Bars | 100 | 1 | magicBarsPct=0.1 | Normal | agrégat | OK |
| 6 | Baby's First Quirk: Adventure | 300 | 1 | adventureStatsPct=0.25 | Normal | agrégat | OK |
| 7 | Stat Boost For Rich Quirks I | 25 | 1000 | statPct=0.01 | Normal | agrégat | OK |
| 8 | Adventure Boost For Rich Quirks I | 25 | 1000 | adventureStatsPct=0.001 | Normal | agrégat | OK |
| 9 | GOOOOOLLLLLLLLLLLD! | 50 | 25 | adventureGoldPct=0.1 | Normal | agrégat | OK |
| 10 | The Beast's Special Beard Tonic | 50 | 50 | beardSpeedPct=0.01 | Normal | agrégat | OK |
| 11 | Beasted Boosts I | 40 | 50 | boostPowerPct=0.01 | Normal | agrégat | OK |
| 12 | The Beast's Seed ;) | 35 | 25 | seedYieldPct=0.01 | Normal | agrégat | OK |
| 13 | The Beast's Fertilizer | 3000 | 3 | (par id / sans agrégat) | Normal | id via constante | OK |
| 14 | The Beast NGU Quirk Ever | 15000 | 1 | (par id / sans agrégat) | Evil | lecture par id | OK |
| 15 | Energy Wandoos BEAST-a | 32 | 50 | wandoosEnergySpeedPct=0.02 | Evil | agrégat | OK |
| 16 | Magic Wandoos BEAST-a | 37 | 50 | wandoosMagicSpeedPct=0.02 | Evil | agrégat | OK |
| 17 | Super Advanced Beast Training! | 4000 | 1 | basicTrainingExtraLevel=1 | Evil | agrégat | OK |
| 18 | Accessory Slot! | 20000 | 1 | accessorySlotBonus=1 | Evil | agrégat | OK |
| 19 | MacGuffin Slot! | 7500 | 1 | (par id / sans agrégat) | Normal | lecture par id | OK |
| 20 | Adv. Training Level Bank I | 100 | 10 | atBankPct=0.005 | Normal | agrégat | OK |
| 21 | Adv. Training Level Bank II | 250 | 10 | atBankPct=0.005 | Normal | agrégat | OK |
| 22 | Adv. Training Level Bank III | 500 | 10 | atBankPct=0.005 | Evil | agrégat | OK |
| 23 | Adv. Training Level Bank IV | 1000 | 10 | atBankPct=0.005 | Evil | agrégat | OK |
| 24 | Adv. Training Level Bank V | 2000 | 10 | atBankPct=0.005 | Evil | agrégat | OK |
| 25 | Time Machine Level Bank I | 100 | 10 | tmBankPct=0.005 | Normal | agrégat | OK |
| 26 | Time Machine Level Bank II | 250 | 10 | tmBankPct=0.005 | Normal | agrégat | OK |
| 27 | Time Machine Level Bank III | 500 | 10 | tmBankPct=0.005 | Evil | agrégat | OK |
| 28 | Time Machine Level Bank IV | 1000 | 10 | tmBankPct=0.005 | Evil | agrégat | OK |
| 29 | Time Machine Level Bank V | 2000 | 10 | tmBankPct=0.005 | Evil | agrégat | OK |
| 30 | Beard Temp Level Bank I | 100 | 10 | beardBankPct=0.005 | Normal | agrégat | OK |
| 31 | Beard Temp Level Bank II | 250 | 10 | beardBankPct=0.005 | Normal | agrégat | OK |
| 32 | Beard Temp Level Bank III | 500 | 10 | beardBankPct=0.005 | Evil | agrégat | OK |
| 33 | Beard Temp Level Bank IV | 1000 | 10 | beardBankPct=0.005 | Evil | agrégat | OK |
| 34 | Beard Temp Level Bank V | 2000 | 10 | beardBankPct=0.005 | Evil | agrégat | OK |
| 35 | Generic Energy Power Quirk I | 75 | 50 | energyPowerPct=0.01 | Normal | agrégat | OK |
| 36 | Generic Energy Cap Quirk I | 75 | 50 | energyCapPct=0.01 | Normal | agrégat | OK |
| 37 | Generic Energy Bars Quirk I | 75 | 50 | energyBarsPct=0.01 | Normal | agrégat | OK |
| 38 | Generic Magic Power Quirk I | 75 | 50 | magicPowerPct=0.01 | Normal | agrégat | OK |
| 39 | Generic Magic Cap Quirk I | 75 | 50 | magicCapPct=0.01 | Normal | agrégat | OK |
| 40 | Generic Magic Bars Quirk I | 75 | 50 | magicBarsPct=0.01 | Normal | agrégat | OK |
| 41 | Generic Energy Power Quirk II | 300 | 50 | energyPowerPct=0.01 | Evil | agrégat | OK |
| 42 | Generic Energy Cap Quirk II | 300 | 50 | energyCapPct=0.01 | Evil | agrégat | OK |
| 43 | Generic Energy Bars Quirk II | 300 | 50 | energyBarsPct=0.01 | Evil | agrégat | OK |
| 44 | Generic Magic Power Quirk II | 300 | 50 | magicPowerPct=0.01 | Evil | agrégat | OK |
| 45 | Generic Magic Cap Quirk II | 300 | 50 | magicCapPct=0.01 | Evil | agrégat | OK |
| 46 | Generic Magic Bars Quirk II | 300 | 50 | magicBarsPct=0.01 | Evil | agrégat | OK |
| 47 | Generic Resource 3 Power Quirk I | 300 | 50 | r3PowerPct=0.01 | Evil | agrégat | OK |
| 48 | Generic Resource 3 Cap Quirk I | 300 | 50 | r3CapPct=0.01 | Evil | agrégat | OK |
| 49 | Generic Resource 3 Bars Quirk I | 300 | 50 | r3BarsPct=0.01 | Evil | agrégat | OK |
| 50 | Another MacGuffin Slot! | 20000 | 1 | (par id / sans agrégat) | Evil | lecture par id | OK |
| 51 | Stat Boost For Rich Quirks II | 125 | 1000 | statPct=0.02 | Evil | agrégat | OK |
| 52 | Adventure Boost For Rich Quirks II | 125 | 1000 | adventureStatsPct=0.001 | Evil | agrégat | OK |
| 53 | Beasted Boosts II | 200 | 60 | boostPowerPct=0.02 | Evil | agrégat | OK |
| 54 | Lower Minimum Wish Speed? | 400 | 50 | wishMinTimeSeconds=24 | Evil | agrégat | OK |
| 55 | An Inventory Automerge Slot! | 5000 | 1 | (par id / sans agrégat) | Evil | lecture par id | OK |
| 56 | A Wish Slot! | 50000 | 1 | wishSlotBonus=1 | Evil | agrégat | OK |
| 57 | Atk/Def Hack Milestone Reducer I | 2000 | 2 | hackMilestoneAttackDefense=1 | Evil | agrégat | OK |
| 58 | PP Hack Milestone Reducer I | 7000 | 3 | hackMilestonePp=1 | Evil | agrégat | OK |
| 59 | EXP Hack Milestone Reducer I | 60000 | 5 | hackMilestoneExp=1 | Evil | agrégat | OK |
| 60 | Wish Hack Milestone Reducer I | 25000 | 5 | hackMilestoneWish=1 | Evil | agrégat | OK |
| 61 | Generic Energy Power Quirk III | 1000 | 50 | energyPowerPct=0.005 | Sadistic | agrégat | OK |
| 62 | Generic Energy Cap Quirk III | 1000 | 50 | energyCapPct=0.002 | Sadistic | agrégat | OK |
| 63 | Generic Energy Bars Quirk III | 1000 | 50 | energyBarsPct=0.002 | Sadistic | agrégat | OK |
| 64 | Generic Magic Power Quirk III | 1000 | 50 | magicPowerPct=0.005 | Sadistic | agrégat | OK |
| 65 | Generic Magic Cap Quirk III | 1000 | 50 | magicCapPct=0.002 | Sadistic | agrégat | OK |
| 66 | Generic Magic Bars Quirk III | 1000 | 50 | magicBarsPct=0.002 | Sadistic | agrégat | OK |
| 67 | Generic Resource 3 Power Quirk II | 1000 | 50 | r3PowerPct=0.01 | Sadistic | agrégat | OK |
| 68 | Generic Resource 3 Cap Quirk II | 1000 | 50 | r3CapPct=0.005 | Sadistic | agrégat | OK |
| 69 | Generic Resource 3 Bars Quirk II | 1000 | 50 | r3BarsPct=0.005 | Sadistic | agrégat | OK |
| 70 | Improved Base ITOPOD PPP! | 800 | 50 | itopodPppFlat=10 | Sadistic | agrégat | OK |
| 71 | Bonus Quest Handin Progress I | 4000 | 2 | questHandinReduction=1 | Evil | quêtes | OK |
| 72 | Beasted Boosts III | 600 | 50 | boostPowerPct=0.01 | Evil | agrégat | OK |
| 73 | Beasted Boosts IV | 1800 | 50 | boostPowerPct=0.005 | Sadistic | agrégat | OK |
| 74 | Improved Sadistic Boss Multiplier I | 20000 | 10 | sadisticBossMultiplierBonus=0.001 | Sadistic | agrégat | OK |
| 75 | Improved Sadistic Boss Multiplier II | 100000 | 10 | sadisticBossMultiplierBonus=0.001 | Sadistic | agrégat | OK |
| 76 | Stat Boost for Rich Quirks III | 400 | 1000 | statPct=0.01 | Sadistic | agrégat | OK |
| 77 | Adventure Boost for Rich Quirks III | 400 | 1000 | adventureStatsPct=0.0003 | Sadistic | agrégat | OK |
| 78 | Stat Boost for Rich Quirks IV | 1300 | 1000 | statPct=0.01 | Sadistic | agrégat | OK |
| 79 | Adventure Boost for Rich Quirks IV | 1300 | 1000 | adventureStatsPct=0.0003 | Sadistic | agrégat | OK |
| 80 | Generic Energy Power Quirk IV | 3000 | 50 | energyPowerPct=0.005 | Sadistic | agrégat | OK |
| 81 | Generic Energy Cap Quirk IV | 3000 | 50 | energyCapPct=0.002 | Sadistic | agrégat | OK |
| 82 | Generic Energy Bars Quirk IV | 3000 | 50 | energyBarsPct=0.002 | Sadistic | agrégat | OK |
| 83 | Generic Magic Power Quirk IV | 3000 | 50 | magicPowerPct=0.005 | Sadistic | agrégat | OK |
| 84 | Generic Magic Cap Quirk IV | 3000 | 50 | magicCapPct=0.002 | Sadistic | agrégat | OK |
| 85 | Generic Magic Bars Quirk IV | 3000 | 50 | magicBarsPct=0.002 | Sadistic | agrégat | OK |
| 86 | Generic Resource 3 Power Quirk III | 3000 | 50 | r3PowerPct=0.01 | Sadistic | agrégat | OK |
| 87 | Generic Resource 3 Cap Quirk III | 3000 | 50 | r3CapPct=0.005 | Sadistic | agrégat | OK |
| 88 | Generic Resource 3 Bars Quirk III | 3000 | 50 | r3BarsPct=0.005 | Sadistic | agrégat | OK |
| 89 | An even Beast-er NGU Quirk | 100000 | 1 | (par id / sans agrégat) | Sadistic | lecture par id | OK |
| 90 | Even More Inventory Space? | 700 | 24 | inventorySlotBonus=1 | Evil | agrégat | OK |
| 91 | Better Blood Magic I | 2000 | 50 | bloodGainPct=0.01 | Sadistic | agrégat | OK |
| 92 | Even Better Yggdrasil Yields | 2500 | 50 | yggYieldPct=0.001 | Sadistic | agrégat | OK |
| 93 | Faster Energy NGU I | 1000 | 50 | nguSpeedEnergyPct=0.004 | Sadistic | agrégat | OK |
| 94 | Faster Magic NGU I | 1000 | 50 | nguSpeedMagicPct=0.004 | Sadistic | agrégat | OK |
| 95 | Faster Energy NGU II | 3000 | 50 | nguSpeedEnergyPct=0.003 | Sadistic | agrégat | OK |
| 96 | Faster Magic NGU II | 3000 | 50 | nguSpeedMagicPct=0.003 | Sadistic | agrégat | OK |
| 97 | Faster Energy NGU III | 10000 | 50 | nguSpeedEnergyPct=0.003 | Sadistic | agrégat | OK |
| 98 | Faster Magic NGU III | 10000 | 50 | nguSpeedMagicPct=0.003 | Sadistic | agrégat | OK |
| 99 | Magic NGU Speed Card Tier Up I | 5000 | 1 | cardTier_magicNgu=1 | Evil | cartes | OK |
| 100 | TM Card Tier Up I | 5000 | 1 | cardTier_timeMachine=1 | Evil | cartes | OK |
| 101 | Wishes Card Tier Up I | 3000 | 1 | cardTier_wishes=1 | Evil | cartes | OK |
| 102 | Daycare Card Tier Up I | 10000 | 1 | cardTier_daycare=1 | Evil | cartes | OK |
| 103 | Energy NGU Speed Tier Up I | 8000 | 1 | cardTier_energyNgu=1 | Evil | cartes | OK |
| 104 | Drop Chance Card Tier Up I | 7500 | 1 | cardTier_drop=1 | Evil | cartes | OK |
| 105 | Wandoos Card Tier Up I | 6000 | 1 | cardTier_wandoos=1 | Evil | cartes | OK |
| 106 | Adventure Stats Card Tier Up I | 13000 | 1 | cardTier_adventure=1 | Evil | cartes | OK |
| 107 | Hacks Card Tier Up I | 15000 | 1 | cardTier_hacks=1 | Evil | cartes | OK |
| 108 | Augment Card Tier Up I | 10000 | 1 | cardTier_augments=1 | Evil | cartes | OK |
| 109 | Gold Drop Card Tier Up I | 11000 | 1 | cardTier_gold=1 | Evil | cartes | OK |
| 110 | PP Card Tier Up I | 20000 | 1 | cardTier_pp=1 | Evil | cartes | OK |
| 111 | A/D Card Tier Up I | 12000 | 1 | cardTier_stats=1 | Evil | cartes | OK |
| 112 | Magic NGU Speed Card Tier Up II | 15000 | 1 | cardTier_magicNgu=1 | Sadistic | cartes | OK |
| 113 | TM Card Tier Up II | 15000 | 1 | cardTier_timeMachine=1 | Sadistic | cartes | OK |
| 114 | Wishes Card Tier Up II | 9000 | 1 | cardTier_wishes=1 | Sadistic | cartes | OK |
| 115 | Daycare Card Tier Up II | 30000 | 1 | cardTier_daycare=1 | Sadistic | cartes | OK |
| 116 | Energy NGU Speed Card Tier Up II | 24000 | 1 | cardTier_energyNgu=1 | Sadistic | cartes | OK |
| 117 | Drop Chance Card Tier Up II | 22000 | 1 | cardTier_drop=1 | Sadistic | cartes | OK |
| 118 | Wandoos Card Tier Up II | 18000 | 1 | cardTier_wandoos=1 | Sadistic | cartes | OK |
| 119 | Adventure Stats Card Tier Up II | 39000 | 1 | cardTier_adventure=1 | Sadistic | cartes | OK |
| 120 | Hacks Card Tier Up II | 45000 | 1 | cardTier_hacks=1 | Sadistic | cartes | OK |
| 121 | Augment Card Tier Up II | 30000 | 1 | cardTier_augments=1 | Sadistic | cartes | OK |
| 122 | Gold Drop Card Tier Up II | 33000 | 1 | cardTier_gold=1 | Sadistic | cartes | OK |
| 123 | PP Card Tier Up II | 60000 | 1 | cardTier_pp=1 | Sadistic | cartes | OK |
| 124 | A/D Card Tier Up II | 36000 | 1 | cardTier_stats=1 | Sadistic | cartes | OK |
| 125 | Magic NGU Speed Card Tier Up III | 45000 | 1 | cardTier_magicNgu=1 | Sadistic | cartes | OK |
| 126 | TM Card Tier Up III | 45000 | 1 | cardTier_timeMachine=1 | Sadistic | cartes | OK |
| 127 | Wishes Card Tier Up III | 27000 | 1 | cardTier_wishes=1 | Sadistic | cartes | OK |
| 128 | Daycare Card Tier Up III | 90000 | 1 | cardTier_daycare=1 | Sadistic | cartes | OK |
| 129 | Energy NGU Speed Card Tier Up III | 72000 | 1 | cardTier_energyNgu=1 | Sadistic | cartes | OK |
| 130 | Drop Chance Card Tier Up III | 66000 | 1 | cardTier_drop=1 | Sadistic | cartes | OK |
| 131 | Wandoos Card Tier Up III | 54000 | 1 | cardTier_wandoos=1 | Sadistic | cartes | OK |
| 132 | Adventure Stats Card Tier Up III | 117000 | 1 | cardTier_adventure=1 | Sadistic | cartes | OK |
| 133 | Hacks Card Tier Up III | 135000 | 1 | cardTier_hacks=1 | Sadistic | cartes | OK |
| 134 | Augment Card Tier Up III | 90000 | 1 | cardTier_augments=1 | Sadistic | cartes | OK |
| 135 | Gold Drop Card Tier Up III | 99000 | 1 | cardTier_gold=1 | Sadistic | cartes | OK |
| 136 | PP Card Tier Up III | 180000 | 1 | cardTier_pp=1 | Sadistic | cartes | OK |
| 137 | A/D Card Tier Up III | 108000 | 1 | cardTier_stats=1 | Sadistic | cartes | OK |
| 138 | Faster Card Generation I | 2000 | 10 | cardSpeedPct=0.005 | Evil | cartes | OK |
| 139 | Faster Mayo Generation I | 2000 | 10 | mayoSpeedPct=0.005 | Evil | cartes | OK |
| 140 | Faster Card Generation II | 6000 | 10 | cardSpeedPct=0.004 | Sadistic | cartes | OK |
| 141 | Faster Mayo Generation II | 6000 | 10 | mayoSpeedPct=0.004 | Sadistic | cartes | OK |
| 142 | Faster Card Generation III | 15000 | 10 | cardSpeedPct=0.003 | Sadistic | cartes | OK |
| 143 | Faster Mayo Generation III | 15000 | 10 | mayoSpeedPct=0.003 | Sadistic | cartes | OK |
| 144 | Faster Card Generation IV | 40000 | 10 | cardSpeedPct=0.003 | Sadistic | cartes | OK |
| 145 | Faster Mayo Generation IV | 40000 | 10 | mayoSpeedPct=0.003 | Sadistic | cartes | OK |
| 146 | Bigger Deck I | 5000 | 5 | cardDeckSize=1 | Evil | cartes | OK |
| 147 | Bigger Deck II | 14000 | 5 | cardDeckSize=1 | Sadistic | cartes | OK |
| 148 | Bigger Deck III | 42000 | 5 | cardDeckSize=1 | Sadistic | cartes | OK |
| 149 | BIG CHONKER CARDS | 38888 | 1 | bigChonkers=1 | Sadistic | cartes | OK |
| 150 | Extra Mayo Generator! | 25000 | 1 | mayoGenerators=1 | Sadistic | cartes | OK |
| 151 | Extra Tag Slot! | 20000 | 1 | cardTagSlots=1 | Evil | cartes | OK |
| 152 | Better Tags I | 4000 | 10 | cardTagEffectPct=0.0005 | Evil | cartes | OK |
| 153 | Better Tags II | 13000 | 10 | cardTagEffectPct=0.0004 | Sadistic | cartes | OK |
| 154 | Better Tags III | 40000 | 10 | cardTagEffectPct=0.0004 | Sadistic | cartes | OK |
| 155 | Better Tags IV | 125000 | 10 | cardTagEffectPct=0.0004 | Sadistic | cartes | OK |
| 156 | Card Recycling: Mayo | 40000 | 1 | cardRecycleMayo=1 | Sadistic | cartes | OK |
| 157 | Magic NGU Speed Card Tier Up IV | 125000 | 2 | cardTier_magicNgu=1 | Sadistic | cartes | OK |
| 158 | TM Card Tier Up IV | 125000 | 2 | cardTier_timeMachine=1 | Sadistic | cartes | OK |
| 159 | Wishes Card Tier Up IV | 80000 | 2 | cardTier_wishes=1 | Sadistic | cartes | OK |
| 160 | Daycare Card Tier Up IV | 250000 | 2 | cardTier_daycare=1 | Sadistic | cartes | OK |
| 161 | Energy NGU Speed Card Tier Up IV | 200000 | 2 | cardTier_energyNgu=1 | Sadistic | cartes | OK |
| 162 | Drop Chance Card Tier Up IV | 175000 | 2 | cardTier_drop=1 | Sadistic | cartes | OK |
| 163 | Wandoos Card Tier Up IV | 150000 | 2 | cardTier_wandoos=1 | Sadistic | cartes | OK |
| 164 | Adventure Stats Card Tier Up IV | 320000 | 2 | cardTier_adventure=1 | Sadistic | cartes | OK |
| 165 | Hacks Card Tier Up IV | 350000 | 2 | cardTier_hacks=1 | Sadistic | cartes | OK |
| 166 | Augment Card Tier Up IV | 225000 | 2 | cardTier_augments=1 | Sadistic | cartes | OK |
| 167 | Gold Drop Card Tier Up IV | 250000 | 2 | cardTier_gold=1 | Sadistic | cartes | OK |
| 168 | PP Card Tier Up IV | 500000 | 2 | cardTier_pp=1 | Sadistic | cartes | OK |
| 169 | A/D Card Tier Up IV | 300000 | 2 | cardTier_stats=1 | Sadistic | cartes | OK |
| 170 | Stat Boost for Rich Quirks V | 2800 | 1000 | statPct=0.01 | Sadistic | agrégat | OK |
| 171 | Adventure Boost for Rich Quirks V | 2800 | 1000 | adventureStatsPct=0.0003 | Sadistic | agrégat | OK |
| 172 | Stat Boost for Rich Quirks VI | 6000 | 1000 | statPct=0.01 | Sadistic | agrégat | OK |
| 173 | Adventure Boost for Rich Quirks VI | 6000 | 1000 | adventureStatsPct=0.0003 | Sadistic | agrégat | OK |
| 174 | Energy NGU Hack Milestone reducer I | 80000 | 3 | hackMilestoneEnergyNguSpeed=1 | Sadistic | agrégat | OK |
| 175 | TM Hack Milestone reducer I | 65000 | 5 | hackMilestoneTimeMachineSpeed=1 | Sadistic | agrégat | OK |
| 176 | A PROBLEM HAS BEEN DETECTED | 10000000 | 1 | (par id / sans agrégat) | Sadistic | aucun (blague) | OK |
| 177 | The Final Generic Energy Power Quirk | 50000 | 50 | energyPowerPct=0.01 | Sadistic | agrégat | OK |
| 178 | The Final Generic Energy Cap Quirk | 50000 | 50 | energyCapPct=0.01 | Sadistic | agrégat | OK |
| 179 | The Final Generic Energy Bars Quirk | 50000 | 50 | energyBarsPct=0.01 | Sadistic | agrégat | OK |
| 180 | The Final Generic Magic Power Quirk | 50000 | 50 | magicPowerPct=0.01 | Sadistic | agrégat | OK |
| 181 | The Final Generic Magic Cap Quirk | 50000 | 50 | magicCapPct=0.01 | Sadistic | agrégat | OK |
| 182 | The Final Generic Magic Bars Quirk | 50000 | 50 | magicBarsPct=0.01 | Sadistic | agrégat | OK |
| 183 | The Final Generic Resource 3 Power Quirk | 100000 | 50 | r3PowerPct=0.01 | Sadistic | agrégat | OK |
| 184 | The Final Generic Resource 3 Cap Quirk | 100000 | 50 | r3CapPct=0.01 | Sadistic | agrégat | OK |
| 185 | The Final Generic Resource 3 Bars Quirk | 100000 | 50 | r3BarsPct=0.01 | Sadistic | agrégat | OK |

