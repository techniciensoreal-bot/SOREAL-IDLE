# Contrôle croisé Cards/Mayo, MacGuffins, Cooking, Yggdrasil, Beards, Diggers, Wandoos

Date : 2026-09-25. Contrôle en lecture seule (aucun fichier du jeu ni du wiki modifié).
Version JSON des écarts : `cards-cooking-ygg.json` (même dossier).

Jeu : `cloudflare/src/idle-cards-v1.js`, `idle-macguffins-v1.js`, `idle-cooking-v1.js`, `idle-yggdrasil-extra-v1.js`, `idle-wandoos-os-v1.js`, `idle-hearts-v1.js`, `idle-questing-v1.js`, `idle-ngu-progression.js` (Beards, Diggers, Yggdrasil, Wandoos), `idle-sellout-shop-v1.js`, `idle-portraits-v1.js`.
Wiki (référence n°1) : Cards (Mayo, Card = redirections), MacGuffin Fragments, Cooking, Build Cooking, Yggdrasil, Experience (section Yggdrasil), Beards Of Power, Gold Diggers, Wandoos, Blood Magic, 4G's Sellout Shop, Perk Points, Quirk Points, Wishes, THE END, Cooking-sample.png.
Tierce (GPL, à confronter) : `ngu-idle-calculators-ts/` cards.ts, macguffins.ts, cooking.ts, yggdrasil.ts, beards.ts, diggers.ts, wandoos.ts (+ player.ts, playerData.ts, stat.ts, items.ts pour les identifiants et les cibles de stat). Plus `cooking-exp-formula.json`.
Scripts d'analyse (hors dépôt) : `C:\Users\n0rma\AppData\Local\Temp\claude\...\scratchpad\xcheck\` (cards-check, tier-table, tier-ids, ygg-check, cooking-sim, dig, cookgear).

## Ce que contiennent (et ne contiennent pas) les sources tierces

| Fichier | Contient | Ne contient pas |
|---|---|---|
| cards.ts | 14 types, constantes C1..C4, bornes de rareté (dont un 8e libellé « Chonker » pour 1,2), `tagFormula`, `rarityRate` (rareté supposée UNIFORME entre le min et 1,2), `bonusPerMayo` (tier + 2 avec les stylos) | cartes End et Foil, coûts, perks/quirks (ceux-ci sont dans player.ts) |
| macguffins.ts | 23 entrées avec leur STAT CIBLE (dont Golden = Stat.GOLD_DROP) | aucune formule de gain par Rebirth, aucun slot |
| cooking.ts | 20 plats (noms), 20 ingrédients (nom, unité, incrément par niveau), score d'ingrédient et de paire, recherche exhaustive 21 x 21 | AUCUNE formule de gain d'EXP par repas |
| yggdrasil.ts | 21 fruits (les 6 fruits de Mayo inclus) : base de graines, coût de tier, formule de rendement, formule de graines | coûts d'activation |
| beards.ts | 7 barbes, bonus temporaire et permanent | diviseurs de vitesse, facteur de temps, combinaison temp x perm (helpers absents) |
| diggers.ts | 12 diggers, effet par niveau | coût, drain, plafond de niveau, bonus global |
| wandoos.ts | 3 OS (multiplicateurs et exposant), niveau d'OS = OS + Money Pit + XL + 2 x perk 22 | seuils d'énergie/magie, boot |

## (D) Résumé chiffré

| Domaine | Ce qui a été comparé | Résultat |
|---|---|---|
| Cartes | 14 constantes C1..C4 (jeu / wiki / tierce) | 14/14 identiques |
| Cartes | bonus par mayo au tier 1, raretés 0,8 et 1,2 (14 types) | 28/28 dans 0,0006 point |
| Cartes | sources de tier par type (perks, quirks, souhaits), jeu contre player.ts | 0 écart sur 14 types x 3 familles ; recyclage (perk 216, quirk 156), Chonkers (quirk 149, souhaits 229/230), BEEFY/WIMPY (162/220/227, 163/221/228) identiques |
| Cartes | perks 161-216, quirks 99-169, souhaits de cartes : nom, coût, cap/niveaux contre le wiki | 56/56, 71/71, 95/95 identiques |
| Cartes | totaux : tiers 3/5/7 (PP 0/5/8, QP 3/0/8), vitesses x1,1585 / x1,2291, deck 15+15+15, tags 1,7 %+1,7 %+2,1 % | tous conformes au wiki |
| MacGuffins | 22 types, 10 groupes de formules, slots (22), ratio de temps, kills 720/1 800, Blood alpha/beta | conformes au wiki ; 1 type non branché (Golden) |
| Cooking | constantes de score, multiplicateurs (x1,9481 / x2,007), 7 pièces d'équipement, timer 23,5 h / 24,5 h | conformes wiki et tierce |
| Cooking | formule d'EXP par repas | AUCUNE source tierce ; forum Steam seul (jshepler), variable « exp bonus » toujours ambiguë |
| Yggdrasil | 15 fruits (coût d'activation, ressource, graines, coût de tier) et 15 Auto-Activate | 15/15 et 15/15 identiques (wiki + tierce) |
| Yggdrasil | formules de rendement des 15 fruits | 14/15 identiques ; Fruit of Quirks : QPRewardModifier laissé à 1 |
| Yggdrasil | fruits de Mayo | 0/6 dans le jeu ; 6/6 spécifiables (voir A1) |
| Beards | 7 barbes : bonus temporaire + permanent, diviseurs, facteur de temps, slots | 14/14 formules et 7/7 diviseurs identiques |
| Diggers | 12 diggers (déblocage, drain, croissance, plafond, effet), bonus global | 12/12 ; plafond global 67,848 % recalculé (67,8477 %) |
| Wandoos | 3 OS (formules), 9 seuils Normal/Evil/Sadistic, niveau d'OS, perk 22 | conformes |

Bilan : 0 écart de valeur numérique dans les tables sourcées. Les vrais trous sont des systèmes absents (fruits de Mayo, cartes End/Foil), une cible non branchée (Golden MacGuffin), une variable ambiguë (Cooking) et un facteur laissé à 1 (Fruit of Quirks).

## (A) MANQUANTS

### A1. Fruits de Mayo (6 fruits) : entièrement spécifiables, l'ambiguïté « 10 Qa Energy or Magic » est levée

Les trois sources se recoupent :

| Élément | Wiki | Tierce (yggdrasil.ts) | Valeur à retenir |
|---|---|---|---|
| Fruits | Angry, Sad, Moldy, Ayy(y) Lmayo, Cinco de Mayo, Pretty | ids 15 à 20, `FruitOfMayo` | 6 fruits, un par générateur de mayo |
| Graines de base | 10 | `baseSeedFactor = 10` | 10 |
| Coût de tier | T² x 250 000 graines | `tier ** 2 * 250000` | 250 000 |
| Coût d'activation | « 10 Qa Energy or Magic » | absent | 10 Qa = 1e16 (« 60 Qa (6E16) » dans la page Wishes fixe Qa = 1e15) |
| Ressource | page Experience, Auto-Activate : Angry Energy, Sad Magic, Moldy Energy, Ayyy LMayo Magic, Cinco De Mayo Energy, Pretty Magic | absent | alternance Énergie/Magie dans l'ordre des mayos |
| Auto-Activate | 1 B EXP chacun, cap requis « 100 Q » | absent | 1e9 EXP ; cap 1e17 |
| Rendement | progression du générateur associé = T^1,1 x 0,025 x Poop x MayoSpeed | même formule (mayoSpeed / 100) | identique |
| NGU Yggdrasil / Yggdrasil Yield | non / non | non | pas de FirstHarvest (il n'est pas dans la formule) |
| Mayo Infuser | « Doubles Mayo generation speed for 24 hours. Affects Fruit reward. » (4G's Sellout Shop) | absent | le MayoSpeed de la formule inclut l'Infuser (x2, x2,2 avec Blue Heart) |

Pourquoi « 100 Q » = 100 Qa : sur les 15 autres lignes de la table Auto-Activate, le cap requis vaut EXACTEMENT 10 fois le coût d'activation du fruit (Gold 100 k -> 1 M, Power alpha 200 k -> 2 M, ... MacGuffin beta 100 B -> 1 T, Quirks 40 B -> 400 B). 10 Qa x 10 = 100 Qa. Le commentaire du jeu (idle-yggdrasil-extra-v1.js, idle-ngu-progression.js:693) qui parle d'écart entre « 100 Q » et « 100 Qa » est donc sans objet : « Q » est ici « Qa ».

Ordre de grandeur : un fruit tier 24 sans Poop donne 0,82 x MayoSpeed points de mayo (2,9 avec Poop x1,5 et MayoSpeed x2,33), soit environ une heure de génération : « small amounts of mayo » (page Cards) est cohérent, l'unité de la formule est bien le point de mayo (la barre de progression va de 0 à 1).

Reste NON tranché (impact minime, jamais sur le rendement) : les graines quand le fruit est MANGÉ. Le wiki (note « weird_seeds ») dit « based on the tier formula used for the fruit's specific bonus » ; la tierce devine `10 x (T + floor((T-1)/3))`, avec des points marqués « ? ». `floor(T^1,1)` colle aussi aux 4 points non douteux de la tierce (T = 15, 16, 19, 20 -> 19, 21, 25, 26) ; les deux lectures divergent aux tiers 4, 5, 7, 8, 10, 11, 13, 18, 21, 23, 24 (écart d'1 unité de base, x10 graines). À la récolte : graines standard (comme les autres fruits).

Blocage d'implémentation : aucun. Le jeu a déjà le progrès de mayo par générateur, `mods.mayoSpeed`, l'Infuser et la Poop.

### A2. Cartes Foil (~1 %)

Wiki : « On rare occasion (~1% of the time), a card will drop with a gold-coloured background... no special properties ». Tierce : rien. Jeu : absent (déclaré non implémenté). Effet de jeu : aucun, purement cosmétique. (Le wiki cite aussi des « Permanent Foil Cards » dans un pack payant du Sellout Shop : hors périmètre.) Si ajoutée : un drapeau `foil` tiré à 1 %, sans conséquence sur le bonus.

### A3. Carte End

Wiki (Cards, THE END) : en Sadistic, ~1 % de chances d'apparaître EN PLUS d'une carte normale ; coût 99 de chacun des 6 mayos (594 au total) ; une fois lancée, donne la pièce n° 492 de THE END ; d'autres cartes End réapparaissent pour remplacer une pièce jetée ; le recyclage marche (10 % du minuteur, 20 % de progression de mayo). Tierce : rien (`CardKeys` sans End ; le tableau du wiki donne « End N/A »). Jeu : absent, et bloqué par un prérequis : les 16 pièces de THE END n'existent pas dans SOREAL (idle-adventure-v47.js:2164 et 4854). À ne traiter qu'avec le système THE END, et à garder invisible jusqu'en Sadistic (règle « pas de spoilers »).

### A4. Cooking : noms des plats et des ingrédients

cooking.ts fournit 20 plats et 20 ingrédients avec unité et incrément par niveau (Hot Sauce 50 ml, Coconut Milk 50 ml, Lemon Juice 50 ml, Rice x2 tasses ; les autres x1). La capture Cooking-sample.png confirme la source : les 7 ingrédients visibles (Garlic Cloves, Snake Oil Bottle, MALK Cartons, Bread Loaves, Eggs Egg, Onion Onions, Candy Canes Canes) et l'icône du plat (Jello, id 9) sont identiques à cooking.ts. Le jeu numérote « ingrédient n° » sans nom. Purement cosmétique ; les 8 ingrédients d'un repas sont 8 parmi les 20 (le jeu n'a pas cette notion). Aucune mécanique manquante.

### A5. Déjà connus, sans source nouvelle

Perk 56 « Macguffin Daycare! » : la tierce (perks.ts) n'ajoute aucune vitesse de Daycare (voir perks-quirks.md). Souhaits 59/60 (« also didn't suck », +20 %/niveau, 10 niveaux) : ni le wiki ni la tierce (wish.ts, yggdrasil.ts, macguffins.ts) ne donnent la place dans l'arrondi ; rien à combler.

## (B) ÉCARTS (wiki / source / jeu)

### B1. Cooking : la formule d'EXP par repas et la variable « exp bonus » (point central)

1) cooking.ts contient-il la formule exacte ? NON. Il ne contient que le score (constantes 0,03 / puissance 30 pour un ingrédient, 0,02 / puissance 40 pour une paire, niveaux 0 à 20, optimum par recherche exhaustive : tout cela est IDENTIQUE au wiki et au jeu). Seule trace de l'EXP dans les fichiers tiers : `player.ts:449 this.set("cookingExp", playerData.cooking.expBonus)` et `playerData.ts:72 cookingExp {number, default 0}`. C'est un champ de sauvegarde `cooking.expBonus`, déclaré mais jamais relu ailleurs, sans unité. Il confirme seulement le NOM « expBonus » (accumulateur propre à Cooking), pas la formule. Le fil Steam de jshepler (cooking-exp-formula.json) reste donc la seule source, à une réponse de forum près.

2) Comparaison avec cooking-exp-formula.json : sur ce qui est vérifiable, cohérent. Le maximum `multiplicateur x 0,005` recoupe la capture (1,32 x 0,005 = 0,66 %) et le jeu la reproduit (0,66). Le plafond 300 % recoupe le wiki. Le multiplicateur 132 % de la capture = Space set x1,1 x slot 7 x1,2, sans équipement (7 ingrédients visibles).

3) Variable « exp bonus » : trois lectures, une seule compatible avec la capture sans hypothèse supplémentaire.

| Lecture | Définition | Capture (gain 0,66 % avec « Total Exp Gain +100 % ») | Plafond | Affichage au départ | Statut |
|---|---|---|---|---|---|
| A (jeu actuel) | var = Total Exp Gain acquis, affiché tel quel (100 % = var 1) | base = 1 - 1 = 0 -> plancher 0,36 -> 0,24 % : CONTREDIT la capture ; il faut supposer que la capture précède le plancher | var 3, XP x4 au plafond | +0 % | non prouvée |
| B | var = accumulateur de Cooking, affiché en FORME MULTIPLICATEUR (100 % + var x 100 %) | var 0 -> base 1 -> 0,66 % : COHÉRENT | affiché 300 % = var 2, XP x3 | +100 % (la capture) | la plus économe |
| C | var = bonus d'EXP TOTAL du joueur (toutes sources) moins 1 | possible si le joueur avait ~x1 d'EXP total | plafond inchangé | inconnu | possible, gameplay très différent (le gain tombe au plancher 0,24 % dès qu'on cumule ~x1,8 d'EXP, donc quasi tout le temps) |

Arguments pour B : (i) jshepler écrit « un bonus affiché de 120 % vaut 0,2 », c'est-à-dire que l'affichage est de la forme 100 % + var ; (ii) la capture montre une fenêtre de repas frais (timer 20:50:39 sur 23,5 h, 7 ingrédients, aucun équipement) avec « Total Exp Gain +100 % » : atteindre +100 % en additif à 0,66 % par repas demanderait ~150 repas, soit ~5 mois de repas quotidiens, incompatible avec une capture de découverte ; (iii) A demande l'hypothèse « capture plus ancienne que le plancher », B non.
Test qui tranche (une capture) : après le premier repas mangé à 100 % d'efficacité et 132 %, le panneau affiche « +100,66 % » (B) ou « +0,66 % » (A).

4) Ce que fait le jeu (A) et ce que coûterait une erreur : la séquence de gains par repas est IDENTIQUE en A et en B (même var) ; seuls diffèrent l'affichage (le jeu montre « +0 % / 300 % » au lieu de « +100 % ») et le plafond (var 3 au lieu de 2 : XP x4 au lieu de x3). Simulation (multiplicateur de cuisine 2,007, efficacité 100 %) : plancher atteint (var 0,8) après 109 repas (~106 jours), var 1 après 165, var 2 après 442, var 3 après 718 repas (~703 jours). Le plafond ne se joue donc qu'après ~14 mois de repas quotidiens ; l'affichage se joue dès le premier. Si la lecture C était vraie, le gameplay changerait (gain ~x0,36 en milieu de partie).

### B2. Page Cards : tableau des paliers de tier annoncé à rareté 1,0, calculé à 1,2

Le texte dit « figures given are for a card having 1.0 rarity », mais les rapports de la table collent à la formule à rareté 1,2 (erreur maximale 0,0064 sur 14 types) et pas à 1,0 (jusqu'à 0,18 d'écart, type A/D). Colonne TOTAL : 9 types sur 14 à moins de 0,1 % de la formule (E-NGU 38,88, M-NGU 28,76, WANDOOS et AUGS 38,62, HACKS 5,99, A/D 1 489 817,36, DROPS 139,07, PP 16,19, QP 8,75) ; TM 78,71 (formule 78,97), GOLD 78,45 (78,97), ADV 6,79 (6,88), DAYCARE 4,98 (5,01), et WISHES 3,96 contre 4,37 (la colonne TOTAL(pen) 5,25 est juste). Fautes du wiki ; le jeu suit la formule, qui est correcte (bonus au tier 1 : 28/28). Aucune action côté jeu.
De même « Total x2,1157 » (vitesse des cartes) donne 2,1159 par le produit des facteurs, et « x2,3273 » (mayo) donne 2,3275 : arrondis du wiki.

### B3. Libellé de la rareté 1,2 (cartes Chonker)

Tierce : 8e libellé « Chonker » pour la rareté exactement 1,2. Wiki : « Hot Damn » 1,19 - 1,20 et « Chonkers » sans libellé de rareté. Jeu : `idleCardRarityLabelV1` renvoie « Hot Damn » pour 1,2. Cosmétique.

### B4. Purple Heart et kills d'ITOPOD : contradiction interne du wiki, le jeu suit les minima publiés

Wiki (tableau Items) : « Purple Heart Set : reduce number of kills needed OUTSIDE of ITOPOD by 20 % ». Mais les minima publiés (720 en zone, 1 800 à l'ITOPOD) ne se retrouvent qu'avec le Purple Heart aussi à l'ITOPOD : 5 000 x 0,8 x 0,75 x 0,75 = 2 250 ; x 0,8 = 1 800. Le jeu applique donc x0,8 aux deux (macguffinKillsRequiredV1). Sans le Purple Heart, l'ITOPOD reste à 2 250 (le jeu et le wiki concordent).

### B5. Fruit of Quirks : QPRewardModifier

Wiki (Nerdy Formulas) : ⌈T x 3 x QPRewardModifier x Poop x Quirk_Ygg x Equip_YggYield x FirstHarvest⌉, avec QPRewardModifier jamais défini. Tierce (yggdrasil.ts:475-490) : paramètre `qpRewardBonus` = total du stat `QUEST_REWARD` (player.ts : perks « Better QP Rewards », cartes QP, QP Hack, souhait 47, sans les « ...Active » qui sont un stat séparé `QUEST_REWARD_ACTIVE`). Jeu : `idleYggFruitOfQuirksQpV1` laisse 1. Le jeu calcule déjà un facteur équivalent (`qpMultiplier` dans idleQuestRewardV1, idle-questing-v1.js:251). Écart : le rendement du fruit est sous-évalué du facteur QP complet. Gravité : moyenne (le fruit donne des QP, sa valeur suit tout le stack QP). Le rapprochement exact (Mobster, Orange Heart, objets de quête inclus ou non) n'est pas publié : à trancher.

### B6. Golden MacGuffin : cible d'or

Wiki : aucune cible (page MacGuffin Fragments, Adventure Mode, Badly Drawn World, Item List). Tierce (macguffins.ts) : `Stat.GOLD_DROP` ("goldDrops"), le MÊME stat que la Gold Drop Card, le Gold Drop des équipements et de challenges.ts (No Time Machine). Il est distinct de `Stat.TIME_MACHINE`, cible de la Golden Beard. Cible probable dans le jeu : `adventureGoldMultiplier` (celui de la carte GOLD, idle-cards-v1.js:658), et non la production de la Time Machine. Confiance : moyenne-haute (une seule source, mais la cible est nommée sans ambiguïté et cohérente avec le nom « Golden Drop »). Formule de gain : (L+1) x 0,005 % x T par Rebirth (pas de branche L > 100).

### B7. Noms et cosmétique (aucun impact)

- Beards : le jeu nomme la 3e barbe « Reverse Beard » (id "defense"), le wiki « The Reverse Hitler » ; ids internes « attack/drop/defense/ngu/pp/adventure/gold » sans lien avec l'effet (LadyBeard = "pp"). Le commentaire d'idle-ngu-progression.js:4609 emploie « Reverse Hitler ».
- macguffins.ts contient un 23e type fantôme (id 14, « Bibe MacGuffin », clé `nomacguffin`, commentaire du dépôt : « not in the game? »). Le wiki et le jeu ont 22 types : aucun impact.
- Commentaires périmés : idle-macguffins-v1.js:76-77 dit que le système de portraits est absent alors que idle-portraits-v1.js gère SEXY/SMART à 250 % ; idle-ngu-progression.js:1094 donne « 1+(niveau+1) x 0,04 » pour le niveau d'OS de Wandoos alors que le code (ligne 1121) renvoie niveau + 1 (401 fois au niveau 400, formulation explicite du wiki : « 401x faster »). Le wiki se contredit sur ce point (« +1604 % » d'un côté, « 401x » de l'autre) ; la phrase explicite est celle retenue par le code, à raison.
- idle-cards-v1.js:59 et idle-yggdrasil-extra-v1.js:24 disent que les fruits de Mayo sont « ambigus » : voir A1, l'ambiguïté est levée.

### B8. Points non vérifiables faute de source (à ne pas corriger sans preuve)

- Beards : combinaison du bonus temporaire et du bonus permanent. Le jeu multiplie (1 + temp) x (1 + perm) (`beardBonusMultiplier`). Le wiki donne les deux termes sans dire comment ils s'assemblent ; beards.ts sépare `getTempStatValue` et `getPermStatValue` mais l'assemblage est dans des helpers absents du dossier. De même l'Armpit set (+10 % de vitesse de barbe) est multiplicatif dans le jeu, le wiki ne dit pas s'il s'ajoute à Equip_BeardSpeed.
- Cartes : loi de tirage de la rareté (uniforme dans le jeu). La tierce la suppose uniforme aussi (`rarityRate` : (1,2 - seuil) / (1,2 - min)) : appui indirect, pas une preuve.
- Cartes : nombre de types de mayo par carte (uniforme 1..min(6, coût) dans le jeu), aucune source.
- Cooking : loi de tirage des cibles et des poids (uniforme dans les bornes du wiki), niveau initial des ingrédients (0).

## (C) ÉLÉMENTS NON BRANCHÉS DANS LE JEU

| Élément | État | Source utilisable ? |
|---|---|---|
| Golden MacGuffin | bonus permanent calculé et affiché, jamais appliqué (`effect: null`) | oui, cible Gold Drop (tierce), voir B6 |
| Fruits de Mayo (6) | absents | oui, spécification complète (A1) |
| Fruit of Quirks : QPRewardModifier | forcé à 1 | oui, définition tierce (B5) |
| Cartes Foil | absentes | oui, cosmétique (A2) |
| Carte End | absente | oui, mais bloquée par THE END (A3) |
| Perk 56 MacGuffin Daycare | absente | non (aucune vitesse publiée) |
| Souhaits 59/60 (+20 % / niveau) | non appliqués | non (arrondi inconnu) |
| Noms de plats et d'ingrédients Cooking | absents | oui (cooking.ts), cosmétique |

Tout le reste des systèmes du domaine est câblé de bout en bout : les 14 types de cartes ont leur consommateur (idleCardsApplyToBonusesV1 pour Attack/Defense, Adventure, Drop, Gold, PP, Daycare, Hacks, Wishes, QP ; appels directs pour E-NGU, M-NGU, Wandoos, Augments, TM), 19 des 22 MacGuffins appliquent leur bonus (SEXY et SMART n'en ont pas, conformément au wiki ; Golden est le troisième cas, non conforme), les 7 barbes, 12 diggers et 3 OS Wandoos sont lus par le moteur.

## Annexe : contrôles positifs (rien à signaler)

- Cartes : formule de tags (jeu = wiki = tierce), 10 % de base + 1,7 % + 1,7 % + 2,1 % + 1 % (Still-Beating Heart) = 16,5 % ; deck 10 + 15 + 15 + 15 + 50 + 5 + 10 = 120 ; coûts de mayo 5-13 avec BEEFY/WIMPY, Chonkers 26-34 ; Mayo Infuser x2 (x2,2 Blue Heart) ; 4 tags = 1 de base + quirk + souhait + shop (le total « 4 » du wiki implique la base).
- MacGuffins : ratio de temps (0,03 à 5 min, 1 à 30 min, 6,93 à 24 h, 48 à 24 h avec le 2e Troll Sadistic, 104,86 au plafond), 22 slots (1 + 2 + 3 + 2 + 1 + 1 + 1 + 11), Blood alpha floor(log10(Blood / 1e9) + 1) et beta floor(log20(Blood / 1e6) + 1), cooldowns 23,5 h et 47,5 h.
- Cooking : 7 pièces (5 objets du Build Cooking + The Joker + My Rainbow Heart), pantalon x2, Cleaver en slot principal, bank 24,5 h / 25,5 h Bread, repas 23,5 h / 22,5 h.
- Yggdrasil : tier max 10 puis 24 (Troll 3), Fruit of Numbers au Troll 5, formules de graines (Quirks : T linéaire à la consommation, ceil(T^1,5) à la récolte, Pomegranate et Watermelon toujours x2), Power alpha (valeur^1,5), beta (niveau² x 0,05 %), delta (niveau^1,3 x 0,0001 %), Numbers (niveau^1,3 x 0,05 %).
- Beards : 7 diviseurs (1e7, 3e7, 3e7, 1e8, 1e8, 3e8, 3e8), facteur de temps +1/3 par heure jusqu'à 8, permanent = min(floor(sqrt(temp) x facteur), temp), 7 slots (1 + Troll 4 + EXP + 4 Sellout).
- Diggers : 12 slots (1 + set + EXP + 2 perks + No TM 5 + 6 Sellout), bonus global 25 % + 0,05 % x (N - 500)^0,7 au-delà de 500 niveaux.
- Wandoos : niveau d'OS 0-400, multiplicateur niveau + 1, boot 1 h (27 min au minimum), seuils 1e9/1e21/1e33 (98), 1e12/1e27/1e39 (MEH), 1e15/1e33/1e45 (XL).
