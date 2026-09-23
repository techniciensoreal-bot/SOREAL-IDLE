/*
 * SOREAL IDLE — Cards et Mayo (système « Cards » de NGU Idle).
 *
 * Source unique : miroir local du wiki NGU (NGU-Wiki/pages), pages « Cards »
 * (la page « Mayo » n'est qu'une redirection vers elle), « Perk Points »,
 * « Quirk Points », « Wishes », « 4G's Sellout Shop », « Challenges »,
 * « Rebirths », et les pages de sets « Rock (set) », « Rad (set) »,
 * « Disco (set) », « Duck (set) », « Amalgamate (set) ». Règle n°1
 * d'AGENTS.md : aucune valeur inventée, chaque constante ci-dessous cite sa
 * section. Ce qui n'est pas documenté de façon exacte est listé en fin
 * d'en-tête et volontairement NON implémenté.
 *
 * Mécanique (page Cards) :
 *  - Déblocage par A Still-Beating Heart (drop garanti de The Exile) — géré
 *    par IDLE_NGU_SYSTEMS (unlock:{item:"stillBeatingHeart"}).
 *  - « you will receive a card every hour, unless your deck is full » :
 *    1 carte / 3600 s à vitesse de base ; deck de 10 au départ.
 *  - 14 types de cartes, chacun avec 4 constantes C1..C4 ; bonus d'une carte
 *    = (C1 + C2 x R x T^C3 x C4^T) x (M / 100), R = rareté, T = tier,
 *    M = coût total en mayo. Vérifié contre le tableau « Bonus per mayo at
 *    tier 1 » (ex. E-NGU R=0.8 : 0.03 + 0.1 x 0.8 x 1.03 = 0.112 %/mayo).
 *    Le résultat de la formule est une fraction ; on stocke ici des POUR-CENT
 *    (fraction x 100), additionnés par type à chaque carte lancée (« the bonus
 *    they grant is permanent ») et appliqués comme multiplicateur (1 + % / 100)
 *    — même lecture que la page Item Daycare (« 130% from cards » utilisé
 *    comme diviseur du temps, soit un facteur x1,30).
 *  - Rareté : aléatoire entre 0.80 et 1.20 (0.85 avec le set Disco).
 *  - Coût en mayo : 1 à 9 mayo répartis sur 1 à 6 types (souhaits BEEFY/
 *    WIMPY : 5 à 13 au maximum).
 *  - Tier : 1 + Perks (3) + Quirks (5) + Wishes (7, 8 pour PP/QP) + set Rock
 *    (+1 à toutes) ; Regular Black Pens : +2 tiers sur les 25 prochaines
 *    cartes (utilisés automatiquement).
 *  - Tags : effet de base 10 % ; chance d'un type taggé = effet + (1 − N x
 *    effet) / 14, type non taggé = (1 − N x effet) / 14 (formule de la page).
 *  - Mayo : 6 types ; 1 générateur au départ ; « With two generators
 *    active, it would take two hours (at base speed) to get one point of
 *    mayo from each generator » => 1 mayo / 3600 s à la base, réparti entre
 *    les générateurs actifs.
 *  - Big Chonkers (quirk BIG CHONKER CARDS) : une carte toutes les 72 h
 *    (réduites par la vitesse de génération des cartes), 21 à 29 mayo
 *    (26 à 34 avec les souhaits 229/230), rareté 1.2, toujours protégée.
 *  - Recyclage : perk « Card Recycling: Card Spawn » (+10 % du minuteur des
 *    cartes par carte jetée, +25 % du minuteur Chonker par Chonker jeté) ;
 *    quirk « Card Recycling: Mayo » (+20 % de progression sur un type de mayo
 *    tiré au hasard parmi ceux de la carte jetée).
 *  - Page Rebirths : « Cards in your deck, accumulated bonuses and stored
 *    Mayo » sont conservés au Rebirth (rien n'est remis à zéro ici).
 *
 * Choix d'implémentation (le wiki ne précise pas la loi de probabilité) :
 * rareté tirée uniformément dans [min, 1.2] ; coût total en mayo entier
 * uniforme dans [min, max] ; nombre de types uniforme dans [1, min(6, M)],
 * chaque type choisi recevant au moins 1 mayo. Deck plein : le minuteur ne
 * stocke pas de cartes en attente (seule la fraction du cycle en cours est
 * conservée).
 *
 * NON implémenté (magnitude ou mécanique non exacte dans le wiki, ou système
 * absent) : cartes Foil (« ~1% », purement cosmétiques) ; carte End
 * (« ~1% » en Sadistic, pièces de THE END absentes) ; fruits de Mayo
 * d'Yggdrasil (coût « 10 Qa Energy or Magic » ambigu) ; sets Still-Beating
 * Heart (+1 % tag), Rainbow Heart (+10 % vitesse) et Blue Heart (Mayo
 * Infuser x2.2) : ces sets-cœurs n'existent pas dans IDLE_ADVENTURE_SETS ;
 * glisser-déposer libre remplacé par des déplacements haut/bas.
 */

const N = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const I = (v, d = 0) => Math.floor(N(v, d));

/* Page Cards, section « Card bonus formula » : constantes C1..C4 par type. */
export const IDLE_CARDS_TYPES_V1 = Object.freeze([
  Object.freeze({ id: "energyNgu", code: "E-NGU", nom: "Vitesse des NGU Énergie", c: Object.freeze([0.03, 0.1, 1.2, 1.03]) }),
  Object.freeze({ id: "magicNgu", code: "M-NGU", nom: "Vitesse des NGU Magie", c: Object.freeze([0.02, 0.1, 0.8, 1.08]) }),
  Object.freeze({ id: "wandoos", code: "WANDOOS", nom: "Vitesse de Wandoos", c: Object.freeze([0.02, 0.1, 0.8, 1.1]) }),
  Object.freeze({ id: "augments", code: "AUGS", nom: "Vitesse des Augmentations", c: Object.freeze([0.02, 0.1, 0.8, 1.1]) }),
  Object.freeze({ id: "timeMachine", code: "TM", nom: "Vitesse de la Time Machine", c: Object.freeze([0.02, 0.1, 0.8, 1.15]) }),
  Object.freeze({ id: "hacks", code: "HACKS", nom: "Vitesse des Hacks", c: Object.freeze([0.02, 0.1, 0.4, 1.05]) }),
  Object.freeze({ id: "wishes", code: "WISHES", nom: "Vitesse des Wishes", c: Object.freeze([0.02, 0.1, 0.5, 1.05]) }),
  Object.freeze({ id: "stats", code: "A/D", nom: "Attaque / Défense", c: Object.freeze([5, 1, 1.5, 2]) }),
  Object.freeze({ id: "adventure", code: "ADV", nom: "Stats d'Aventure", c: Object.freeze([0.05, 0.1, 0.4, 1.07]) }),
  Object.freeze({ id: "drop", code: "DROPS", nom: "Chance de Drop", c: Object.freeze([0.02, 0.1, 1, 1.15]) }),
  Object.freeze({ id: "gold", code: "GOLD", nom: "Or des monstres", c: Object.freeze([0.1, 0.5, 0.8, 1.15]) }),
  Object.freeze({ id: "daycare", code: "DAYCARE", nom: "Vitesse du Daycare", c: Object.freeze([0.005, 0.02, 0.4, 1.04]) }),
  Object.freeze({ id: "pp", code: "PP", nom: "Gain de PP", c: Object.freeze([0.01, 0.02, 0.6, 1.11]) }),
  Object.freeze({ id: "qp", code: "QP", nom: "Gain de QP", c: Object.freeze([0.01, 0.02, 0.6, 1.08]) })
]);
const TYPE_IDS = IDLE_CARDS_TYPES_V1.map((t) => t.id);
const TYPE_BY_ID = Object.fromEntries(IDLE_CARDS_TYPES_V1.map((t) => [t.id, t]));

/* Page Cards, section « Mayo » : « Angry, Sad, Moldy, Ayy Lmayo, Cinco de Mayo, and Pretty ». */
export const IDLE_CARDS_MAYO_TYPES_V1 = Object.freeze([
  Object.freeze({ id: "angry", nom: "Angry" }),
  Object.freeze({ id: "sad", nom: "Sad" }),
  Object.freeze({ id: "moldy", nom: "Moldy" }),
  Object.freeze({ id: "ayyLmayo", nom: "Ayy Lmayo" }),
  Object.freeze({ id: "cincoDeMayo", nom: "Cinco de Mayo" }),
  Object.freeze({ id: "pretty", nom: "Pretty" })
]);
const MAYO_IDS = IDLE_CARDS_MAYO_TYPES_V1.map((m) => m.id);

/* Page Cards, section « Rarity » (bornes hautes exclusives, sauf Hot Damn). */
export const IDLE_CARDS_RARITY_BANDS_V1 = Object.freeze([
  Object.freeze({ max: 0.90, nom: "Crappy" }),
  Object.freeze({ max: 1.00, nom: "Bad" }),
  Object.freeze({ max: 1.08, nom: "Meh" }),
  Object.freeze({ max: 1.14, nom: "Okay" }),
  Object.freeze({ max: 1.17, nom: "Good" }),
  Object.freeze({ max: 1.19, nom: "Great" }),
  Object.freeze({ max: Infinity, nom: "Hot Damn" })
]);

/* Valeurs de base, toutes citées de la page Cards (sauf mention). */
export const IDLE_CARDS_BASE_V1 = Object.freeze({
  cardSeconds: 3600, // « you will receive a card every hour »
  mayoSeconds: 3600, // « two hours (at base speed) ... from each generator » avec 2 générateurs
  chonkerSeconds: 72 * 3600, // « a "Big Chonker" card every 72 hours »
  deckSize: 10, // « You start with a deck size of 10 cards »
  generators: 1, // « You start with one Mayo Generator »
  tagSlots: 1, // « Extra tag slot » : 1 quirk + 1 wish + 1 shop, « Total: 4 »
  tagEffect: 0.10, // « The base tag effect is 10% »
  mayoMin: 1, // « mayo cost (1 to 9 mayo spread across 1 to 6 types) »
  mayoMax: 9,
  maxMayoTypes: 6,
  chonkerMayoMin: 21, // « Chonkers need between 21 and 29 mayo »
  chonkerMayoMax: 29,
  rarityMin: 0.80, // « between 0.80 and 1.20 »
  rarityMax: 1.20,
  blackPenTiers: 2, // « Regular Black Pens will give +2 tiers on the next 25 cards »
  recycleSpawnFraction: 0.10, // perk 216 : « advances your card spawn timer by 10% »
  recycleChonkerFraction: 0.25, // perk 216 : « the timer for your BIG CHONKER card will advance by 25% »
  recycleMayoProgress: 0.20, // quirk 156 : « 20% mayo progress »
  extraGeneratorMayoSpeed: 0.02, // « a 2% Mayo Speed bonus » par générateur supplémentaire (x1.10 pour 5)
  mayoInfuserFactor: 2 // Sellout Shop : « Doubles Mayo generation speed for 24 hours »
});

/*
 * Bonus de complétion des sets d'Aventure (IDLE_ADVENTURE_SETS, ids réels) :
 * Rock « +1 tier to ALL CARDS! », Rad « +5 Max Deck Size », Amalgamate
 * « +10 Max Deck size! », Disco « Less crappy cards! » (rareté min. 0.85,
 * page Cards), Duck « +6% Mayo and Card Speed! ».
 */
export const IDLE_CARDS_SETS_V1 = Object.freeze({
  rock: Object.freeze({ tierAll: 1 }),
  rad: Object.freeze({ deckSize: 5 }),
  amalgamate: Object.freeze({ deckSize: 10 }),
  disco: Object.freeze({ rarityMin: 0.85 }),
  duck: Object.freeze({ cardSpeed: 0.06, mayoSpeed: 0.06 })
});

/*
 * Troll Challenge Sadistic (page Challenges) : complétion 5 « +10% Card
 * Generation Speed », complétion 6 « +10% Mayo Generation Speed! ».
 * Basic Challenge Sadistic : « Awards 1 of each mayo for each completion,
 * 5 of each mayo for final completion » (5 complétions possibles).
 */
export const IDLE_CARDS_CHALLENGES_V1 = Object.freeze({
  trollCardSpeedCompletion: 5,
  trollCardSpeed: 0.10,
  trollMayoSpeedCompletion: 6,
  trollMayoSpeed: 0.10,
  basicMayoPerCompletion: 1,
  basicMayoFinal: 5,
  basicMax: 5
});

/*
 * Perks 161-216 (page Perk Points, colonnes Index/Name/Effect/Cost/Cap).
 * Clés `bonus` propres aux Cartes, agrégées uniquement par
 * idleCardsModifiersV1 (perkBonusesV1 les additionne sans les exposer).
 */
export const IDLE_CARDS_PERKS_V1 = Object.freeze([
  { id: 161, name: "Augment Card Tier Up I", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 150000, cap: 1, bonus: { cardTier_augments: 1 } },
  { id: 162, name: "Gold Drop Card Tier Up I", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 200000, cap: 1, bonus: { cardTier_gold: 1 } },
  { id: 163, name: "Wishes Card Tier Up I", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 300000, cap: 1, bonus: { cardTier_wishes: 1 } },
  { id: 164, name: "A/D Card Tier Up I", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 150000, cap: 1, bonus: { cardTier_stats: 1 } },
  { id: 165, name: "Magic NGU Card Tier Up I", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 600000, cap: 1, bonus: { cardTier_magicNgu: 1 } },
  { id: 166, name: "TM Card Tier Up I", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 500000, cap: 1, bonus: { cardTier_timeMachine: 1 } },
  { id: 167, name: "QP Card Tier Up I", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 800000, cap: 1, bonus: { cardTier_qp: 1 } },
  { id: 168, name: "Daycare Card Tier Up I", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 1000000, cap: 1, bonus: { cardTier_daycare: 1 } },
  { id: 169, name: "Energy NGU Card Tier Up I", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 2000000, cap: 1, bonus: { cardTier_energyNgu: 1 } },
  { id: 170, name: "Drop Chance Card Tier Up I", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 1500000, cap: 1, bonus: { cardTier_drop: 1 } },
  { id: 171, name: "Wandoos Card Tier Up I", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 1000000, cap: 1, bonus: { cardTier_wandoos: 1 } },
  { id: 172, name: "Adventure Stats Card Tier Up I", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 3000000, cap: 1, bonus: { cardTier_adventure: 1 } },
  { id: 173, name: "Hacks Card Tier Up I", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 2500000, cap: 1, bonus: { cardTier_hacks: 1 } },
  { id: 174, name: "Augment Card Tier Up II", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 1500000, cap: 1, bonus: { cardTier_augments: 1 } },
  { id: 175, name: "Gold Drop Card Tier Up II", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 2000000, cap: 1, bonus: { cardTier_gold: 1 } },
  { id: 176, name: "Wishes Card Tier Up II", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 3000000, cap: 1, bonus: { cardTier_wishes: 1 } },
  { id: 177, name: "A/D Card Tier Up II", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 1500000, cap: 1, bonus: { cardTier_stats: 1 } },
  { id: 178, name: "Magic NGU Card Tier Up II", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 6000000, cap: 1, bonus: { cardTier_magicNgu: 1 } },
  { id: 179, name: "TM Card Tier Up II", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 5000000, cap: 1, bonus: { cardTier_timeMachine: 1 } },
  { id: 180, name: "QP Card Tier Up II", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 8000000, cap: 1, bonus: { cardTier_qp: 1 } },
  { id: 181, name: "Daycare Card Tier Up II", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 10000000, cap: 1, bonus: { cardTier_daycare: 1 } },
  { id: 182, name: "Energy NGU Card Tier Up II", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 20000000, cap: 1, bonus: { cardTier_energyNgu: 1 } },
  { id: 183, name: "Drop Chance Card Tier Up II", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 15000000, cap: 1, bonus: { cardTier_drop: 1 } },
  { id: 184, name: "Wandoos Card Tier Up II", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 10000000, cap: 1, bonus: { cardTier_wandoos: 1 } },
  { id: 185, name: "Adventure Stats Card Tier Up II", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 30000000, cap: 1, bonus: { cardTier_adventure: 1 } },
  { id: 186, name: "Hacks Card Tier Up II", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 25000000, cap: 1, bonus: { cardTier_hacks: 1 } },
  { id: 187, name: "Augment Card Tier Up III", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 15000000, cap: 1, bonus: { cardTier_augments: 1 } },
  { id: 188, name: "Gold Drop Card Tier Up III", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 20000000, cap: 1, bonus: { cardTier_gold: 1 } },
  { id: 189, name: "Wishes Card Tier Up III", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 30000000, cap: 1, bonus: { cardTier_wishes: 1 } },
  { id: 190, name: "A/D Card Tier Up III", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 15000000, cap: 1, bonus: { cardTier_stats: 1 } },
  { id: 191, name: "Magic NGU Card Tier Up III", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 60000000, cap: 1, bonus: { cardTier_magicNgu: 1 } },
  { id: 192, name: "TM Card Tier Up III", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 50000000, cap: 1, bonus: { cardTier_timeMachine: 1 } },
  { id: 193, name: "QP Card Tier Up III", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 80000000, cap: 1, bonus: { cardTier_qp: 1 } },
  { id: 194, name: "Daycare Card Tier Up III", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 100000000, cap: 1, bonus: { cardTier_daycare: 1 } },
  { id: 195, name: "Energy NGU Card Tier Up III", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 200000000, cap: 1, bonus: { cardTier_energyNgu: 1 } },
  { id: 196, name: "Drop Chance Card Tier Up III", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 150000000, cap: 1, bonus: { cardTier_drop: 1 } },
  { id: 197, name: "Wandoos Card Tier Up III", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 100000000, cap: 1, bonus: { cardTier_wandoos: 1 } },
  { id: 198, name: "Adventure Stats Card Tier Up III", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 300000000, cap: 1, bonus: { cardTier_adventure: 1 } },
  { id: 199, name: "Hacks Card Tier Up III", effect: "This perk will raise the Tier of all cards with this bonus type by 1!", cost: 250000000, cap: 1, bonus: { cardTier_hacks: 1 } },
  { id: 200, name: "Faster Card Generation I", effect: "Increase Card Generation Speed by 0.5% for each level of this Perk!", cost: 200000, cap: 10, bonus: { cardSpeedPct: 0.005 } },
  { id: 201, name: "Faster Mayo Generation I", effect: "Increase Mayo Generation Speed by 0.5% for each level of this Perk!", cost: 200000, cap: 10, bonus: { mayoSpeedPct: 0.005 } },
  { id: 202, name: "Faster Card Generation II", effect: "Increase Card Generation Speed by 0.4% for each level of this Perk!", cost: 2000000, cap: 10, bonus: { cardSpeedPct: 0.004 } },
  { id: 203, name: "Faster Mayo Generation II", effect: "Increase Mayo Generation Speed by 0.4% for each level of this Perk!", cost: 2000000, cap: 10, bonus: { mayoSpeedPct: 0.004 } },
  { id: 204, name: "Faster Card Generation III", effect: "Increase Card Generation Speed by 0.3% for each level of this Perk!", cost: 20000000, cap: 10, bonus: { cardSpeedPct: 0.003 } },
  { id: 205, name: "Faster Mayo Generation III", effect: "Increase Mayo Generation Speed by 0.3% for each level of this Perk!", cost: 20000000, cap: 10, bonus: { mayoSpeedPct: 0.003 } },
  { id: 206, name: "Faster Card Generation IV", effect: "Increase Card Generation Speed by 0.3% for each level of this Perk!", cost: 200000000, cap: 10, bonus: { cardSpeedPct: 0.003 } },
  { id: 207, name: "Faster Mayo Generation IV", effect: "Increase Mayo Generation Speed by 0.3% for each level of this Perk!", cost: 200000000, cap: 10, bonus: { mayoSpeedPct: 0.003 } },
  { id: 208, name: "Bigger Deck Size I", effect: "This Perk increases your max Deck size by 1 per level!", cost: 500000, cap: 5, bonus: { cardDeckSize: 1 } },
  { id: 209, name: "Bigger Deck Size II", effect: "This Perk increases your max Deck size by an additional 1 per level!", cost: 5000000, cap: 5, bonus: { cardDeckSize: 1 } },
  { id: 210, name: "Bigger Deck Size III", effect: "This Perk increases your max Deck size by an additional 1 per level!", cost: 50000000, cap: 5, bonus: { cardDeckSize: 1 } },
  { id: 211, name: "Extra Mayo Generator!", effect: "This Perk grants an extra Mayo Generator Slot! There's also a 2% Mayo Speed bonus for no reason!", cost: 750000, cap: 1, bonus: { mayoGenerators: 1 } },
  { id: 212, name: "Better Tags I", effect: "This Perk improves the effects of tagging by 0.05% per level!", cost: 200000, cap: 10, bonus: { cardTagEffectPct: 0.0005 } },
  { id: 213, name: "Better Tags II", effect: "This Perk improves the effects of tagging by 0.04% per level!", cost: 1000000, cap: 10, bonus: { cardTagEffectPct: 0.0004 } },
  { id: 214, name: "Better Tags III", effect: "This Perk improves the effects of tagging by 0.04% per level!", cost: 5000000, cap: 10, bonus: { cardTagEffectPct: 0.0004 } },
  { id: 215, name: "Better Tags IV", effect: "This Perk improves the effects of tagging by 0.04% per level!", cost: 20000000, cap: 10, bonus: { cardTagEffectPct: 0.0004 } },
  { id: 216, name: "Card Recycling: Card Spawn", effect: "With this Card Recycling Perk, we'll chuck your yeeted cards into a Blendomatic 5000, which somehow advances your card spawn timer by 10%! If you recycle a BIG CHONKER, the timer for your BIG CHONKER card will advance by 25%!", cost: 3000000, cap: 1, bonus: { cardRecycleSpawn: 1 } }
].map(Object.freeze));

/* Quirks 99-169 (page Quirk Points, mêmes colonnes). */
export const IDLE_CARDS_QUIRKS_V1 = Object.freeze([
  { id: 99, name: "Magic NGU Speed Card Tier Up I", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 5000, cap: 1, bonus: { cardTier_magicNgu: 1 } },
  { id: 100, name: "TM Card Tier Up I", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 5000, cap: 1, bonus: { cardTier_timeMachine: 1 } },
  { id: 101, name: "Wishes Card Tier Up I", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 3000, cap: 1, bonus: { cardTier_wishes: 1 } },
  { id: 102, name: "Daycare Card Tier Up I", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 10000, cap: 1, bonus: { cardTier_daycare: 1 } },
  { id: 103, name: "Energy NGU Speed Tier Up I", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 8000, cap: 1, bonus: { cardTier_energyNgu: 1 } },
  { id: 104, name: "Drop Chance Card Tier Up I", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 7500, cap: 1, bonus: { cardTier_drop: 1 } },
  { id: 105, name: "Wandoos Card Tier Up I", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 6000, cap: 1, bonus: { cardTier_wandoos: 1 } },
  { id: 106, name: "Adventure Stats Card Tier Up I", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 13000, cap: 1, bonus: { cardTier_adventure: 1 } },
  { id: 107, name: "Hacks Card Tier Up I", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 15000, cap: 1, bonus: { cardTier_hacks: 1 } },
  { id: 108, name: "Augment Card Tier Up I", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 10000, cap: 1, bonus: { cardTier_augments: 1 } },
  { id: 109, name: "Gold Drop Card Tier Up I", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 11000, cap: 1, bonus: { cardTier_gold: 1 } },
  { id: 110, name: "PP Card Tier Up I", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 20000, cap: 1, bonus: { cardTier_pp: 1 } },
  { id: 111, name: "A/D Card Tier Up I", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 12000, cap: 1, bonus: { cardTier_stats: 1 } },
  { id: 112, name: "Magic NGU Speed Card Tier Up II", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 15000, cap: 1, bonus: { cardTier_magicNgu: 1 } },
  { id: 113, name: "TM Card Tier Up II", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 15000, cap: 1, bonus: { cardTier_timeMachine: 1 } },
  { id: 114, name: "Wishes Card Tier Up II", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 9000, cap: 1, bonus: { cardTier_wishes: 1 } },
  { id: 115, name: "Daycare Card Tier Up II", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 30000, cap: 1, bonus: { cardTier_daycare: 1 } },
  { id: 116, name: "Energy NGU Speed Card Tier Up II", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 24000, cap: 1, bonus: { cardTier_energyNgu: 1 } },
  { id: 117, name: "Drop Chance Card Tier Up II", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 22000, cap: 1, bonus: { cardTier_drop: 1 } },
  { id: 118, name: "Wandoos Card Tier Up II", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 18000, cap: 1, bonus: { cardTier_wandoos: 1 } },
  { id: 119, name: "Adventure Stats Card Tier Up II", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 39000, cap: 1, bonus: { cardTier_adventure: 1 } },
  { id: 120, name: "Hacks Card Tier Up II", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 45000, cap: 1, bonus: { cardTier_hacks: 1 } },
  { id: 121, name: "Augment Card Tier Up II", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 30000, cap: 1, bonus: { cardTier_augments: 1 } },
  { id: 122, name: "Gold Drop Card Tier Up II", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 33000, cap: 1, bonus: { cardTier_gold: 1 } },
  { id: 123, name: "PP Card Tier Up II", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 60000, cap: 1, bonus: { cardTier_pp: 1 } },
  { id: 124, name: "A/D Card Tier Up II", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 36000, cap: 1, bonus: { cardTier_stats: 1 } },
  { id: 125, name: "Magic NGU Speed Card Tier Up III", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 45000, cap: 1, bonus: { cardTier_magicNgu: 1 } },
  { id: 126, name: "TM Card Tier Up III", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 45000, cap: 1, bonus: { cardTier_timeMachine: 1 } },
  { id: 127, name: "Wishes Card Tier Up III", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 27000, cap: 1, bonus: { cardTier_wishes: 1 } },
  { id: 128, name: "Daycare Card Tier Up III", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 90000, cap: 1, bonus: { cardTier_daycare: 1 } },
  { id: 129, name: "Energy NGU Speed Card Tier Up III", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 72000, cap: 1, bonus: { cardTier_energyNgu: 1 } },
  { id: 130, name: "Drop Chance Card Tier Up III", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 66000, cap: 1, bonus: { cardTier_drop: 1 } },
  { id: 131, name: "Wandoos Card Tier Up III", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 54000, cap: 1, bonus: { cardTier_wandoos: 1 } },
  { id: 132, name: "Adventure Stats Card Tier Up III", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 117000, cap: 1, bonus: { cardTier_adventure: 1 } },
  { id: 133, name: "Hacks Card Tier Up III", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 135000, cap: 1, bonus: { cardTier_hacks: 1 } },
  { id: 134, name: "Augment Card Tier Up III", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 90000, cap: 1, bonus: { cardTier_augments: 1 } },
  { id: 135, name: "Gold Drop Card Tier Up III", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 99000, cap: 1, bonus: { cardTier_gold: 1 } },
  { id: 136, name: "PP Card Tier Up III", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 180000, cap: 1, bonus: { cardTier_pp: 1 } },
  { id: 137, name: "A/D Card Tier Up III", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 108000, cap: 1, bonus: { cardTier_stats: 1 } },
  { id: 138, name: "Faster Card Generation I", effect: "This Quirk will increase Card Generation Speed by 0.5% per level!", cost: 2000, cap: 10, bonus: { cardSpeedPct: 0.005 } },
  { id: 139, name: "Faster Mayo Generation I", effect: "This Quirk will increase Mayo Generation Speed by 0.5% per level!", cost: 2000, cap: 10, bonus: { mayoSpeedPct: 0.005 } },
  { id: 140, name: "Faster Card Generation II", effect: "This Quirk will increase Card Generation Speed by 0.4% per level!", cost: 6000, cap: 10, bonus: { cardSpeedPct: 0.004 } },
  { id: 141, name: "Faster Mayo Generation II", effect: "This Quirk will increase Mayo Generation Speed by 0.4% per level!", cost: 6000, cap: 10, bonus: { mayoSpeedPct: 0.004 } },
  { id: 142, name: "Faster Card Generation III", effect: "This Quirk will increase Card Generation Speed by 0.3% per level!", cost: 15000, cap: 10, bonus: { cardSpeedPct: 0.003 } },
  { id: 143, name: "Faster Mayo Generation III", effect: "This Quirk will increase Mayo Generation Speed by 0.3% per level!", cost: 15000, cap: 10, bonus: { mayoSpeedPct: 0.003 } },
  { id: 144, name: "Faster Card Generation IV", effect: "This Quirk will increase Card Generation Speed by 0.3% per level!", cost: 40000, cap: 10, bonus: { cardSpeedPct: 0.003 } },
  { id: 145, name: "Faster Mayo Generation IV", effect: "This Quirk will increase Mayo Generation Speed by 0.3% per level!", cost: 40000, cap: 10, bonus: { mayoSpeedPct: 0.003 } },
  { id: 146, name: "Bigger Deck I", effect: "The Beast saw this email advertising Deck growth pills and bought some pills for you to try! Each level of this Quirk will add +1 to your max Deck Size.", cost: 5000, cap: 5, bonus: { cardDeckSize: 1 } },
  { id: 147, name: "Bigger Deck II", effect: "Each level of this Quirk will add another +1 max Deck Size.", cost: 14000, cap: 5, bonus: { cardDeckSize: 1 } },
  { id: 148, name: "Bigger Deck III", effect: "Each level of this Quirk will add another +1 max Deck Size.", cost: 42000, cap: 5, bonus: { cardDeckSize: 1 } },
  { id: 149, name: "BIG CHONKER CARDS", effect: "Even The Beast is in awe at the size of these absolute units. Unlock BIG CHONKER cards with this Quirk", cost: 38888, cap: 1, bonus: { bigChonkers: 1 } },
  { id: 150, name: "Extra Mayo Generator!", effect: "With this Quirk you can run 1 more Mayo Generator at the same time! There's also a 2% Mayo Speed bonus for no reason!", cost: 25000, cap: 1, bonus: { mayoGenerators: 1 } },
  { id: 151, name: "Extra Tag Slot!", effect: "With this Quirk you can have one extra tag active at the same time! Tags help you get the type of cards you actually want!", cost: 20000, cap: 1, bonus: { cardTagSlots: 1 } },
  { id: 152, name: "Better Tags I", effect: "This Quirk improve the effects of tagging card bonuses by 0.05% per level!", cost: 4000, cap: 10, bonus: { cardTagEffectPct: 0.0005 } },
  { id: 153, name: "Better Tags II", effect: "This Quirk improve the effects of tagging card bonuses by 0.04% per level!", cost: 13000, cap: 10, bonus: { cardTagEffectPct: 0.0004 } },
  { id: 154, name: "Better Tags III", effect: "This Quirk improve the effects of tagging card bonuses by 0.04% per level!", cost: 40000, cap: 10, bonus: { cardTagEffectPct: 0.0004 } },
  { id: 155, name: "Better Tags IV", effect: "This Quirk improve the effects of tagging card bonuses by 0.04% per level!", cost: 125000, cap: 10, bonus: { cardTagEffectPct: 0.0004 } },
  { id: 156, name: "Card Recycling: Mayo", effect: "With this Card Recycling Quirk, you'll gain 20% mayo progress to a random selected Mayo type on the yeeted card!", cost: 40000, cap: 1, bonus: { cardRecycleMayo: 1 } },
  { id: 157, name: "Magic NGU Speed Card Tier Up IV", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 125000, cap: 2, bonus: { cardTier_magicNgu: 1 } },
  { id: 158, name: "TM Card Tier Up IV", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 125000, cap: 2, bonus: { cardTier_timeMachine: 1 } },
  { id: 159, name: "Wishes Card Tier Up IV", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 80000, cap: 2, bonus: { cardTier_wishes: 1 } },
  { id: 160, name: "Daycare Card Tier Up IV", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 250000, cap: 2, bonus: { cardTier_daycare: 1 } },
  { id: 161, name: "Energy NGU Speed Card Tier Up IV", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 200000, cap: 2, bonus: { cardTier_energyNgu: 1 } },
  { id: 162, name: "Drop Chance Card Tier Up IV", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 175000, cap: 2, bonus: { cardTier_drop: 1 } },
  { id: 163, name: "Wandoos Card Tier Up IV", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 150000, cap: 2, bonus: { cardTier_wandoos: 1 } },
  { id: 164, name: "Adventure Stats Card Tier Up IV", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 320000, cap: 2, bonus: { cardTier_adventure: 1 } },
  { id: 165, name: "Hacks Card Tier Up IV", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 350000, cap: 2, bonus: { cardTier_hacks: 1 } },
  { id: 166, name: "Augment Card Tier Up IV", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 225000, cap: 2, bonus: { cardTier_augments: 1 } },
  { id: 167, name: "Gold Drop Card Tier Up IV", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 250000, cap: 2, bonus: { cardTier_gold: 1 } },
  { id: 168, name: "PP Card Tier Up IV", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 500000, cap: 2, bonus: { cardTier_pp: 1 } },
  { id: 169, name: "A/D Card Tier Up IV", effect: "This Quirk will raise the Tier of all cards with this bonus type by 1!", cost: 300000, cap: 2, bonus: { cardTier_stats: 1 } }
].map(Object.freeze));

/*
 * Souhaits liés aux Cartes (page Wishes ; entrées déjà présentes dans
 * IDLE_WISHES_CATALOG_V1 avec `bonus:{}` — leur effet est câblé ici, par id,
 * pour ne pas dupliquer le catalogue). `levels` = colonne Levels du wiki,
 * vérifiée contre le catalogue par les tests. Souhait 160 : le wiki recopie
 * par erreur le texte « Card Spawn timer » alors que le nom est « I wish I
 * made Mayo Faster IV » ; la page Cards (« 6 wishes, totaling x1.2291 » pour
 * la vitesse de la mayo, 1.05 x 1.04 x 1.03^4) confirme un souhait de Mayo.
 * « reduce the Card Spawn timer by X% » est compté comme +X % de vitesse,
 * comme dans le total « x1.2291 » de la page Cards.
 */
export const IDLE_CARDS_WISH_EFFECTS_V1 = Object.freeze({
  115: Object.freeze({ levels: 1, name: "I wish my Energy NGU Card Tier was higher I", bonus: { cardTier_energyNgu: 1 } }),
  116: Object.freeze({ levels: 1, name: "I wish my Drop Chance Card Tier was higher I", bonus: { cardTier_drop: 1 } }),
  117: Object.freeze({ levels: 1, name: "I wish my Wandoos Card Tier was higher I", bonus: { cardTier_wandoos: 1 } }),
  118: Object.freeze({ levels: 1, name: "I wish my Adventure Stats Card Tier was higher I", bonus: { cardTier_adventure: 1 } }),
  119: Object.freeze({ levels: 1, name: "I wish my Hacks Card Tier was higher I", bonus: { cardTier_hacks: 1 } }),
  120: Object.freeze({ levels: 1, name: "I wish my Augment Card Tier was higher I", bonus: { cardTier_augments: 1 } }),
  121: Object.freeze({ levels: 1, name: "I wish my Gold Drop Card Tier was higher I", bonus: { cardTier_gold: 1 } }),
  122: Object.freeze({ levels: 1, name: "I wish my PP Card Tier was higher I", bonus: { cardTier_pp: 1 } }),
  123: Object.freeze({ levels: 1, name: "I wish my A/D Card Tier was higher I", bonus: { cardTier_stats: 1 } }),
  124: Object.freeze({ levels: 1, name: "I wish my Magic NGU Card Tier was higher I", bonus: { cardTier_magicNgu: 1 } }),
  125: Object.freeze({ levels: 1, name: "I wish my TM Speed Card Tier was higher I", bonus: { cardTier_timeMachine: 1 } }),
  126: Object.freeze({ levels: 1, name: "I wish my QP Card Tier was higher I", bonus: { cardTier_qp: 1 } }),
  127: Object.freeze({ levels: 1, name: "I wish my Daycare Card Tier was higher I", bonus: { cardTier_daycare: 1 } }),
  128: Object.freeze({ levels: 1, name: "I wish my Energy NGU Card Tier was higher II", bonus: { cardTier_energyNgu: 1 } }),
  129: Object.freeze({ levels: 1, name: "I wish my Drop Chance Card Tier was higher II", bonus: { cardTier_drop: 1 } }),
  130: Object.freeze({ levels: 1, name: "I wish my Wandoos Card Tier was higher II", bonus: { cardTier_wandoos: 1 } }),
  131: Object.freeze({ levels: 1, name: "I wish my Adventure Stats Card Tier was higher II", bonus: { cardTier_adventure: 1 } }),
  132: Object.freeze({ levels: 1, name: "I wish my Hacks Card Tier was higher II", bonus: { cardTier_hacks: 1 } }),
  133: Object.freeze({ levels: 1, name: "I wish my Augment Card Tier was higher II", bonus: { cardTier_augments: 1 } }),
  134: Object.freeze({ levels: 1, name: "I wish my Gold Drop Card Tier was higher II", bonus: { cardTier_gold: 1 } }),
  135: Object.freeze({ levels: 1, name: "I wish my PP Card Tier was higher II", bonus: { cardTier_pp: 1 } }),
  136: Object.freeze({ levels: 1, name: "I wish my A/D Card Tier was higher II", bonus: { cardTier_stats: 1 } }),
  137: Object.freeze({ levels: 1, name: "I wish my Magic NGU Card Tier was higher II", bonus: { cardTier_magicNgu: 1 } }),
  138: Object.freeze({ levels: 1, name: "I wish my TM Speed Card Tier was higher II", bonus: { cardTier_timeMachine: 1 } }),
  139: Object.freeze({ levels: 1, name: "I wish my QP Card Tier was higher II", bonus: { cardTier_qp: 1 } }),
  140: Object.freeze({ levels: 1, name: "I wish my Daycare Card Tier was higher II", bonus: { cardTier_daycare: 1 } }),
  141: Object.freeze({ levels: 1, name: "I wish my Energy NGU Card Tier was higher III", bonus: { cardTier_energyNgu: 1 } }),
  142: Object.freeze({ levels: 1, name: "I wish my Drop Chance Card Tier was higher III", bonus: { cardTier_drop: 1 } }),
  143: Object.freeze({ levels: 1, name: "I wish my Wandoos Card Tier was higher III", bonus: { cardTier_wandoos: 1 } }),
  144: Object.freeze({ levels: 1, name: "I wish my Adventure Stats Card Tier was higher III", bonus: { cardTier_adventure: 1 } }),
  145: Object.freeze({ levels: 1, name: "I wish my Hacks Card Tier was higher III", bonus: { cardTier_hacks: 1 } }),
  146: Object.freeze({ levels: 1, name: "I wish my Augment Card Tier was higher III", bonus: { cardTier_augments: 1 } }),
  147: Object.freeze({ levels: 1, name: "I wish my Gold Drop Card Tier was higher III", bonus: { cardTier_gold: 1 } }),
  148: Object.freeze({ levels: 2, name: "I wish my PP Card Tier was higher III", bonus: { cardTier_pp: 1 } }),
  149: Object.freeze({ levels: 1, name: "I wish my A/D Card Tier was higher III", bonus: { cardTier_stats: 1 } }),
  150: Object.freeze({ levels: 1, name: "I wish my Magic NGU Card Tier was higher III", bonus: { cardTier_magicNgu: 1 } }),
  151: Object.freeze({ levels: 1, name: "I wish my TM Speed Card Tier was higher III", bonus: { cardTier_timeMachine: 1 } }),
  152: Object.freeze({ levels: 2, name: "I wish my QP Card Tier was higher III", bonus: { cardTier_qp: 1 } }),
  153: Object.freeze({ levels: 1, name: "I wish my Daycare Card Tier was higher III", bonus: { cardTier_daycare: 1 } }),
  154: Object.freeze({ levels: 10, name: "I wish I made Mayo Faster I", bonus: { mayoSpeedPct: 0.005 } }),
  155: Object.freeze({ levels: 10, name: "I wish my Cards Spawned Faster I", bonus: { cardSpeedPct: 0.005 } }),
  156: Object.freeze({ levels: 10, name: "I wish I made Mayo Faster II", bonus: { mayoSpeedPct: 0.004 } }),
  157: Object.freeze({ levels: 10, name: "I wish my Cards Spawned Faster II", bonus: { cardSpeedPct: 0.004 } }),
  158: Object.freeze({ levels: 10, name: "I wish I made Mayo Faster III", bonus: { mayoSpeedPct: 0.003 } }),
  159: Object.freeze({ levels: 10, name: "I wish my Cards Spawned Faster III", bonus: { cardSpeedPct: 0.003 } }),
  160: Object.freeze({ levels: 10, name: "I wish I made Mayo Faster IV", bonus: { mayoSpeedPct: 0.003 } }),
  161: Object.freeze({ levels: 10, name: "I wish my Cards Spawned Faster IV", bonus: { cardSpeedPct: 0.003 } }),
  162: Object.freeze({ levels: 1, name: "I wish I had BEEFY Cards I", bonus: { cardMayoMax: 1 } }),
  163: Object.freeze({ levels: 1, name: "I wish I didn't have WIMPY Cards I", bonus: { cardMayoMin: 1 } }),
  164: Object.freeze({ levels: 5, name: "I wish I had a bigger Deck I", bonus: { cardDeckSize: 1 } }),
  165: Object.freeze({ levels: 5, name: "I wish I had a bigger Deck II", bonus: { cardDeckSize: 1 } }),
  166: Object.freeze({ levels: 5, name: "I wish I had a bigger Deck III", bonus: { cardDeckSize: 1 } }),
  167: Object.freeze({ levels: 1, name: "I wish I had another Mayo Generator", bonus: { mayoGenerators: 1 } }),
  168: Object.freeze({ levels: 1, name: "I wish I had another Bonus Tag", bonus: { cardTagSlots: 1 } }),
  169: Object.freeze({ levels: 10, name: "I wish Tags worked better I", bonus: { cardTagEffectPct: 0.0005 } }),
  170: Object.freeze({ levels: 10, name: "I wish Tags worked better II", bonus: { cardTagEffectPct: 0.0004 } }),
  171: Object.freeze({ levels: 10, name: "I wish Tags worked better III", bonus: { cardTagEffectPct: 0.0004 } }),
  172: Object.freeze({ levels: 10, name: "I wish Tags worked better IV", bonus: { cardTagEffectPct: 0.0004 } }),
  173: Object.freeze({ levels: 10, name: "I wish Tags worked better V", bonus: { cardTagEffectPct: 0.0004 } }),
  174: Object.freeze({ levels: 2, name: "I wish my Energy NGU Card Tier was higher IV", bonus: { cardTier_energyNgu: 1 } }),
  175: Object.freeze({ levels: 2, name: "I wish my Drop Chance Card Tier was higher IV", bonus: { cardTier_drop: 1 } }),
  176: Object.freeze({ levels: 2, name: "I wish my Wandoos Card Tier was higher IV", bonus: { cardTier_wandoos: 1 } }),
  177: Object.freeze({ levels: 2, name: "I wish my Adventure Stats Card Tier was higher IV", bonus: { cardTier_adventure: 1 } }),
  178: Object.freeze({ levels: 2, name: "I wish my Hacks Card Tier was higher IV", bonus: { cardTier_hacks: 1 } }),
  179: Object.freeze({ levels: 2, name: "I wish my Augment Card Tier was higher IV", bonus: { cardTier_augments: 1 } }),
  180: Object.freeze({ levels: 2, name: "I wish my Gold Drop Card Tier was higher IV", bonus: { cardTier_gold: 1 } }),
  181: Object.freeze({ levels: 2, name: "I wish my PP Card Tier was higher IV", bonus: { cardTier_pp: 1 } }),
  182: Object.freeze({ levels: 2, name: "I wish my A/D Card Tier was higher IV", bonus: { cardTier_stats: 1 } }),
  183: Object.freeze({ levels: 2, name: "I wish my Magic NGU Card Tier was higher IV", bonus: { cardTier_magicNgu: 1 } }),
  184: Object.freeze({ levels: 2, name: "I wish my TM Speed Card Tier was higher IV", bonus: { cardTier_timeMachine: 1 } }),
  185: Object.freeze({ levels: 2, name: "I wish my QP Card Tier was higher IV", bonus: { cardTier_qp: 1 } }),
  186: Object.freeze({ levels: 2, name: "I wish my Daycare Card Tier was higher IV", bonus: { cardTier_daycare: 1 } }),
  205: Object.freeze({ levels: 2, name: "I wish my Energy NGU Card Tier was Higher V", bonus: { cardTier_energyNgu: 1 } }),
  206: Object.freeze({ levels: 2, name: "I wish my Drop Chance Card Tier was Higher V", bonus: { cardTier_drop: 1 } }),
  207: Object.freeze({ levels: 2, name: "I wish my Wandoos Card Tier was Higher V", bonus: { cardTier_wandoos: 1 } }),
  208: Object.freeze({ levels: 2, name: "I wish my Adventure Stats Card Tier was Higher V", bonus: { cardTier_adventure: 1 } }),
  209: Object.freeze({ levels: 2, name: "I wish my Hacks Card Tier was Higher V", bonus: { cardTier_hacks: 1 } }),
  210: Object.freeze({ levels: 2, name: "I wish my Augment Card Tier was Higher V", bonus: { cardTier_augments: 1 } }),
  211: Object.freeze({ levels: 2, name: "I wish my Gold Drop Card Tier was Higher V", bonus: { cardTier_gold: 1 } }),
  212: Object.freeze({ levels: 2, name: "I wish my PP Card Tier was Higher V", bonus: { cardTier_pp: 1 } }),
  213: Object.freeze({ levels: 2, name: "I wish my A/D Card Tier was Higher V", bonus: { cardTier_stats: 1 } }),
  214: Object.freeze({ levels: 2, name: "I wish my Magic NGU Card Tier was Higher V", bonus: { cardTier_magicNgu: 1 } }),
  215: Object.freeze({ levels: 2, name: "I wish my TM Speed Tier was Higher V", bonus: { cardTier_timeMachine: 1 } }),
  216: Object.freeze({ levels: 2, name: "I wish my QP Card Tier was Higher V", bonus: { cardTier_qp: 1 } }),
  217: Object.freeze({ levels: 2, name: "I wish my Daycare Card Tier was Higher V", bonus: { cardTier_daycare: 1 } }),
  220: Object.freeze({ levels: 1, name: "I wish I had BEEFY cards II", bonus: { cardMayoMax: 1 } }),
  221: Object.freeze({ levels: 1, name: "I wish I didn't have WIMPY cards II", bonus: { cardMayoMin: 1 } }),
  222: Object.freeze({ levels: 10, name: "I wish I made Mayo faster V", bonus: { mayoSpeedPct: 0.003 } }),
  223: Object.freeze({ levels: 10, name: "I wish Cards Spawned Faster V", bonus: { cardSpeedPct: 0.003 } }),
  224: Object.freeze({ levels: 10, name: "I wish I made Mayo faster VI", bonus: { mayoSpeedPct: 0.003 } }),
  225: Object.freeze({ levels: 10, name: "I wish Cards Spawned Faster VI", bonus: { cardSpeedPct: 0.003 } }),
  227: Object.freeze({ levels: 2, name: "I wish I had BEEFY Cards III", bonus: { cardMayoMax: 1 } }),
  228: Object.freeze({ levels: 2, name: "I wish I didn't have WIMPY cards III", bonus: { cardMayoMin: 1 } }),
  229: Object.freeze({ levels: 5, name: "I wish my chonkers were CHONKIER", bonus: { chonkerMayoMax: 1 } }),
  230: Object.freeze({ levels: 5, name: "I wish my chonkers were LESS NOT CHONKIER", bonus: { chonkerMayoMin: 1 } })
});

/* Achats du 4G's Sellout Shop propres aux Cartes (page 4G's Sellout Shop, « Special 4 »). */
export const IDLE_CARDS_SELLOUT_V1 = Object.freeze({
  extraDeckSize: Object.freeze({ deckSize: 1, max: 50 }), // « +1 Max Deck Size, up to 50 »
  mayoGenerator: Object.freeze({ generators: 1, max: 2 }), // « +1 Mayo Generator, up to 2 » (+2 % de vitesse par slot)
  extraTagSlot: Object.freeze({ tagSlots: 1, max: 1 }) // « +1 Tag Slot »
});

/* ------------------------------------------------------------------ */
/* Formules                                                            */
/* ------------------------------------------------------------------ */

/* Bonus d'une carte en POUR-CENT : (C1 + C2 x R x T^C3 x C4^T) x M (page Cards). */
export function idleCardBonusPctV1(typeId, tier, rarity, mayo) {
  const def = TYPE_BY_ID[typeId];
  if (!def) return 0;
  const [c1, c2, c3, c4] = def.c;
  const t = Math.max(1, N(tier, 1));
  const r = N(rarity, 1);
  const m = Math.max(0, N(mayo, 0));
  return (c1 + c2 * r * Math.pow(t, c3) * Math.pow(c4, t)) * m;
}

export function idleCardRarityLabelV1(rarity) {
  const r = N(rarity, 1);
  return (IDLE_CARDS_RARITY_BANDS_V1.find((b) => r < b.max) || IDLE_CARDS_RARITY_BANDS_V1[IDLE_CARDS_RARITY_BANDS_V1.length - 1]).nom;
}

/* Chance de tirer chaque type (formule « Tags » de la page Cards). */
export function idleCardsTypeChancesV1(tags, tagEffect) {
  const tagged = Array.from(new Set((Array.isArray(tags) ? tags : []).filter((t) => TYPE_BY_ID[t])));
  const effect = Math.max(0, N(tagEffect, IDLE_CARDS_BASE_V1.tagEffect));
  const rest = Math.max(0, 1 - tagged.length * effect) / TYPE_IDS.length;
  return Object.fromEntries(TYPE_IDS.map((id) => [id, rest + (tagged.includes(id) ? effect : 0)]));
}

function levelsOf(obj) {
  return obj && typeof obj === "object" ? obj : {};
}

/* Somme niveau x valeur par clé ; les vitesses sont multiplicatives d'un palier à l'autre. */
function foldEntries(entries, levelOf, acc) {
  for (const e of entries) {
    const level = Math.max(0, Math.min(N(e.cap ?? e.levels, 0), I(levelOf(e.id), 0)));
    if (!level) continue;
    for (const [key, per] of Object.entries(e.bonus || {})) {
      if (key === "cardSpeedPct") acc.cardSpeed *= 1 + per * level;
      else if (key === "mayoSpeedPct") acc.mayoSpeed *= 1 + per * level;
      else if (key.startsWith("cardTier_")) acc.tiers[key.slice(9)] = (acc.tiers[key.slice(9)] || 0) + per * level;
      else acc.sums[key] = (acc.sums[key] || 0) + per * level;
    }
  }
}

/*
 * Tous les modificateurs du système, recalculés depuis l'état (jamais
 * stockés) : tiers par type, taille du deck, slots de tags, effet des tags,
 * générateurs, vitesses, bornes de coût en mayo, rareté minimale.
 */
export function idleCardsModifiersV1(state) {
  const acc = { cardSpeed: 1, mayoSpeed: 1, tiers: {}, sums: {} };
  const perkLevels = levelsOf(state?.systems?.perks?.data?.levels);
  const quirkLevels = levelsOf(state?.systems?.quirks?.data?.levels);
  const wishTracks = levelsOf(state?.systems?.wishes?.data?.tracks);
  foldEntries(IDLE_CARDS_PERKS_V1, (id) => perkLevels[id], acc);
  foldEntries(IDLE_CARDS_QUIRKS_V1, (id) => quirkLevels[id], acc);
  foldEntries(Object.entries(IDLE_CARDS_WISH_EFFECTS_V1).map(([id, w]) => ({ id, levels: w.levels, bonus: w.bonus })), (id) => wishTracks[String(id)]?.level, acc);

  const purchases = levelsOf(state?.selloutShop?.purchases);
  const bought = (id) => Math.max(0, Math.min(IDLE_CARDS_SELLOUT_V1[id].max, I(purchases[id], 0)));
  const sets = levelsOf(state?.adventure?.completedSets);
  const setOn = (id) => Boolean(sets[id]);
  const troll = Math.max(0, I(state?.challenge?.completionsTier?.extreme?.troll, 0));
  const C = IDLE_CARDS_CHALLENGES_V1;
  const B = IDLE_CARDS_BASE_V1;

  const extraGenerators = N(acc.sums.mayoGenerators, 0) + bought("mayoGenerator");
  const cardSpeed = acc.cardSpeed
    * (setOn("duck") ? 1 + IDLE_CARDS_SETS_V1.duck.cardSpeed : 1)
    * (troll >= C.trollCardSpeedCompletion ? 1 + C.trollCardSpeed : 1);
  const mayoSpeed = acc.mayoSpeed
    * (1 + B.extraGeneratorMayoSpeed * extraGenerators)
    * (setOn("duck") ? 1 + IDLE_CARDS_SETS_V1.duck.mayoSpeed : 1)
    * (troll >= C.trollMayoSpeedCompletion ? 1 + C.trollMayoSpeed : 1);
  const tierAll = setOn("rock") ? IDLE_CARDS_SETS_V1.rock.tierAll : 0;
  const tiers = Object.fromEntries(TYPE_IDS.map((id) => [id, 1 + N(acc.tiers[id], 0) + tierAll]));

  return {
    tiers,
    deckSize: B.deckSize + N(acc.sums.cardDeckSize, 0) + bought("extraDeckSize")
      + (setOn("rad") ? IDLE_CARDS_SETS_V1.rad.deckSize : 0)
      + (setOn("amalgamate") ? IDLE_CARDS_SETS_V1.amalgamate.deckSize : 0),
    tagSlots: B.tagSlots + N(acc.sums.cardTagSlots, 0) + bought("extraTagSlot"),
    tagEffect: B.tagEffect + N(acc.sums.cardTagEffectPct, 0),
    generators: B.generators + extraGenerators,
    cardSpeed,
    mayoSpeed,
    mayoMin: B.mayoMin + N(acc.sums.cardMayoMin, 0),
    mayoMax: B.mayoMax + N(acc.sums.cardMayoMax, 0),
    chonkerMayoMin: B.chonkerMayoMin + N(acc.sums.chonkerMayoMin, 0),
    chonkerMayoMax: B.chonkerMayoMax + N(acc.sums.chonkerMayoMax, 0),
    rarityMin: setOn("disco") ? IDLE_CARDS_SETS_V1.disco.rarityMin : B.rarityMin,
    chonkers: N(acc.sums.bigChonkers, 0) > 0,
    recycleSpawn: N(acc.sums.cardRecycleSpawn, 0) > 0,
    recycleMayo: N(acc.sums.cardRecycleMayo, 0) > 0
  };
}

/* ------------------------------------------------------------------ */
/* État                                                                */
/* ------------------------------------------------------------------ */

function zeroMayo() {
  return Object.fromEntries(MAYO_IDS.map((id) => [id, 0]));
}

export function createIdleCardsDataV1() {
  return {
    deck: [],
    nextId: 1,
    spawnProgress: 0,
    chonkerProgress: 0,
    mayo: zeroMayo(),
    mayoProgress: zeroMayo(),
    generators: [],
    tags: [],
    stats: { spawned: 0, cast: 0, yeeted: 0 }
  };
}

function normalizeCardV1(raw) {
  if (!raw || typeof raw !== "object" || !TYPE_BY_ID[raw.type]) return null;
  const mayo = {};
  let total = 0;
  for (const id of MAYO_IDS) {
    const v = Math.max(0, I(raw.mayo?.[id], 0));
    if (v > 0) { mayo[id] = v; total += v; }
  }
  if (total <= 0) return null;
  const tier = Math.max(1, I(raw.tier, 1));
  const rarity = Math.max(0.5, Math.min(1.2, N(raw.rarity, 1)));
  return {
    id: String(raw.id || ""),
    type: raw.type,
    tier,
    rarity,
    mayo,
    bonusPct: idleCardBonusPctV1(raw.type, tier, rarity, total),
    protected: Boolean(raw.protected),
    chonker: Boolean(raw.chonker)
  };
}

/*
 * Anciennes sauvegardes : le système ne poussait que des cartes factices
 * { type:"attack", quality:1 } (aucun type réel) et un `nextCardAt` absolu —
 * elles sont écartées, jamais converties en une vraie carte inventée.
 */
export function normalizeIdleCardsDataV1(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = createIdleCardsDataV1();
  const seen = new Set();
  for (const c of Array.isArray(src.deck) ? src.deck : []) {
    const card = normalizeCardV1(c);
    if (!card || !card.id || seen.has(card.id)) continue;
    seen.add(card.id);
    out.deck.push(card);
  }
  out.nextId = Math.max(1, I(src.nextId, 1));
  /* Pas de plafond à 1 : le recyclage (perk 216) peut avancer le minuteur de plus d'un cycle. */
  out.spawnProgress = Math.max(0, Math.min(1e6, N(src.spawnProgress, 0)));
  out.chonkerProgress = Math.max(0, Math.min(1e6, N(src.chonkerProgress, 0)));
  for (const id of MAYO_IDS) {
    out.mayo[id] = Math.max(0, I(src.mayo?.[id], 0));
    out.mayoProgress[id] = Math.max(0, Math.min(0.999999999, N(src.mayoProgress?.[id], 0)));
  }
  out.generators = Array.from(new Set((Array.isArray(src.generators) ? src.generators : []).filter((id) => MAYO_IDS.includes(id))));
  out.tags = Array.from(new Set((Array.isArray(src.tags) ? src.tags : []).filter((id) => TYPE_BY_ID[id])));
  out.stats = {
    spawned: Math.max(0, I(src.stats?.spawned, 0)),
    cast: Math.max(0, I(src.stats?.cast, 0)),
    yeeted: Math.max(0, I(src.stats?.yeeted, 0))
  };
  return out;
}

/* Bonus accumulés (en %) par type — state.bonuses.cards, permanent. */
export function createIdleCardBonusesV1() {
  return Object.fromEntries(TYPE_IDS.map((id) => [id, 0]));
}

export function normalizeIdleCardBonusesV1(raw) {
  const out = createIdleCardBonusesV1();
  for (const id of TYPE_IDS) out[id] = Math.max(0, N(raw?.[id], 0));
  return out;
}

function cardsData(state) {
  const s = state.systems.cards;
  if (!s.data || !Array.isArray(s.data.deck) || !s.data.mayo) s.data = normalizeIdleCardsDataV1(s.data);
  return s.data;
}

function syncMayoCurrency(state, data) {
  if (!state.currencies) return;
  state.currencies.mayo = MAYO_IDS.reduce((sum, id) => sum + Math.max(0, I(data.mayo[id], 0)), 0);
}

/* ------------------------------------------------------------------ */
/* Multiplicateurs appliqués au reste du jeu                           */
/* ------------------------------------------------------------------ */

export function idleCardsMultipliersV1(state) {
  const totals = normalizeIdleCardBonusesV1(state?.bonuses?.cards);
  return Object.fromEntries(TYPE_IDS.map((id) => [id, 1 + totals[id] / 100]));
}

export function idleCardsMultiplierV1(state, typeId) {
  const v = N(state?.bonuses?.cards?.[typeId], 0);
  return 1 + Math.max(0, v) / 100;
}

/*
 * Appliqué au résultat d'idleNguBonuses (un seul point d'entrée) :
 * A/D -> attaque et défense ; ADV -> stats d'aventure (mêmes trois champs que
 * les perks adventureStatsPct) ; DROPS ; GOLD ; PP ; DAYCARE ; HACKS ; WISHES
 * (affichage — advanceWishTrack applique sa propre copie). QP : exposé pour
 * Questing (cardsQpGainMultiplier), aucune source de QP de quête ici.
 */
export function idleCardsApplyToBonusesV1(state, bonuses) {
  const m = idleCardsMultipliersV1(state);
  const mul = (key, f) => { if (Number.isFinite(bonuses[key])) bonuses[key] *= f; };
  mul("attackMultiplier", m.stats);
  mul("defenseMultiplier", m.stats);
  mul("adventureMultiplier", m.adventure);
  mul("adventurePowerMultiplier", m.adventure);
  mul("adventureToughnessMultiplier", m.adventure);
  mul("dropMultiplier", m.drop);
  mul("adventureGoldMultiplier", m.gold);
  mul("ppMultiplier", m.pp);
  mul("daycareSpeedMultiplier", m.daycare);
  mul("hackSpeedMultiplier", m.hacks);
  mul("wishSpeedMultiplier", m.wishes);
  bonuses.cardsQpGainMultiplier = m.qp;
  bonuses.cardMultipliers = m;
  return bonuses;
}

/* ------------------------------------------------------------------ */
/* Génération                                                          */
/* ------------------------------------------------------------------ */

function randInt(rng, lo, hi) {
  const a = Math.ceil(Math.min(lo, hi));
  const b = Math.floor(Math.max(lo, hi));
  return Math.min(b, a + Math.floor(rng() * (b - a + 1)));
}

function pickType(rng, chances) {
  let r = rng();
  for (const id of TYPE_IDS) {
    if (r < chances[id]) return id;
    r -= chances[id];
  }
  return TYPE_IDS[TYPE_IDS.length - 1];
}

function spreadMayo(rng, total) {
  const kinds = randInt(rng, 1, Math.min(IDLE_CARDS_BASE_V1.maxMayoTypes, total));
  const pool = MAYO_IDS.slice();
  const chosen = [];
  for (let i = 0; i < kinds; i++) chosen.push(pool.splice(Math.floor(rng() * pool.length) % pool.length, 1)[0]);
  const mayo = Object.fromEntries(chosen.map((id) => [id, 1]));
  for (let left = total - kinds; left > 0; left--) {
    const id = chosen[Math.floor(rng() * chosen.length) % chosen.length];
    mayo[id] += 1;
  }
  return mayo;
}

/* Crée une carte (regular ou Big Chonker) selon les modificateurs actuels ; consomme un Regular Black Pen s'il en reste. */
export function idleCardsCreateCardV1(state, options = {}) {
  const rng = typeof options.rng === "function" ? options.rng : Math.random;
  const mods = options.mods || idleCardsModifiersV1(state);
  const data = cardsData(state);
  const chonker = Boolean(options.chonker);
  const type = pickType(rng, idleCardsTypeChancesV1(data.tags.slice(0, mods.tagSlots), mods.tagEffect));
  let tier = mods.tiers[type];
  const fx = state.selloutEffects;
  if (fx && I(fx.blackPens, 0) > 0) {
    tier += IDLE_CARDS_BASE_V1.blackPenTiers;
    fx.blackPens = I(fx.blackPens, 0) - 1;
  }
  const rarity = chonker ? IDLE_CARDS_BASE_V1.rarityMax : mods.rarityMin + rng() * (IDLE_CARDS_BASE_V1.rarityMax - mods.rarityMin);
  const total = chonker ? randInt(rng, mods.chonkerMayoMin, mods.chonkerMayoMax) : randInt(rng, mods.mayoMin, mods.mayoMax);
  const mayo = spreadMayo(rng, total);
  const card = {
    id: "carte-" + data.nextId,
    type,
    tier,
    rarity,
    mayo,
    bonusPct: idleCardBonusPctV1(type, tier, rarity, total),
    protected: chonker, // « Chonkers always spawn in protected status »
    chonker
  };
  data.nextId += 1;
  data.stats.spawned += 1;
  return card;
}

/*
 * Avance le système de `seconds` secondes : générateurs de mayo, minuteur des
 * cartes (et des Big Chonkers). Le Mayo Infuser (timer « mayoInfuser » des
 * effets Sellout, décompté ensuite par tickSelloutEffectsV1) double la
 * vitesse pendant sa durée restante seulement.
 */
export function advanceIdleCardsV1(state, seconds, rng = Math.random) {
  const s = state?.systems?.cards;
  const secs = Math.max(0, N(seconds, 0));
  if (!s || !s.unlocked) return;
  const data = cardsData(state);
  const mods = idleCardsModifiersV1(state);
  const B = IDLE_CARDS_BASE_V1;

  if (secs > 0) {
    const active = data.generators.slice(0, mods.generators);
    if (active.length) {
      const infused = Math.min(secs, Math.max(0, N(state.selloutEffects?.remaining?.mayoInfuser, 0)));
      const work = mods.mayoSpeed * (secs + infused * (B.mayoInfuserFactor - 1)) / B.mayoSeconds / active.length;
      for (const id of active) {
        const p = N(data.mayoProgress[id], 0) + work;
        const whole = Math.floor(p);
        data.mayo[id] = I(data.mayo[id], 0) + whole;
        data.mayoProgress[id] = p - whole;
      }
    }

    const spawnLoop = (key, period, chonker) => {
      if (data.deck.length >= mods.deckSize) return;
      data[key] = N(data[key], 0) + secs * mods.cardSpeed / period;
      while (data[key] >= 1 && data.deck.length < mods.deckSize) {
        data.deck.push(idleCardsCreateCardV1(state, { rng, mods, chonker }));
        data[key] -= 1;
      }
      if (data[key] >= 1) data[key] -= Math.floor(data[key]);
    };
    spawnLoop("spawnProgress", B.cardSeconds, false);
    if (mods.chonkers) spawnLoop("chonkerProgress", B.chonkerSeconds, true);
  }
  syncMayoCurrency(state, data);
}

/* Basic Challenge Sadistic : 1 mayo de chaque type par complétion, 5 à la dernière. */
export function idleCardsGrantChallengeMayoV1(state, completion) {
  const C = IDLE_CARDS_CHALLENGES_V1;
  const n = I(completion, 0);
  if (n < 1 || n > C.basicMax || !state?.systems?.cards) return 0;
  const amount = n === C.basicMax ? C.basicMayoFinal : C.basicMayoPerCompletion;
  const data = cardsData(state);
  for (const id of MAYO_IDS) data.mayo[id] = I(data.mayo[id], 0) + amount;
  syncMayoCurrency(state, data);
  return amount;
}

/* ------------------------------------------------------------------ */
/* Actions joueur                                                      */
/* ------------------------------------------------------------------ */

function findCard(data, cardId) {
  const index = data.deck.findIndex((c) => c.id === String(cardId || ""));
  if (index < 0) throw new Error("CARTE_INTROUVABLE");
  return index;
}

/*
 * payload.mode : cast | yeet | protect | move | toggleGenerator | toggleTag.
 * Cartes protégées : ni lancées ni jetées (page Cards).
 */
export function idleCardsActionV1(state, payload = {}, rng = Math.random) {
  const s = state?.systems?.cards;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const data = cardsData(state);
  const mods = idleCardsModifiersV1(state);
  const mode = String(payload.mode || "");

  if (mode === "cast") {
    const index = findCard(data, payload.cardId);
    const card = data.deck[index];
    if (card.protected) throw new Error("CARTE_PROTEGEE");
    for (const [id, n] of Object.entries(card.mayo)) {
      if (I(data.mayo[id], 0) < n) throw new Error("MAYO_INSUFFISANTE");
    }
    for (const [id, n] of Object.entries(card.mayo)) data.mayo[id] = I(data.mayo[id], 0) - n;
    data.deck.splice(index, 1);
    state.bonuses.cards = normalizeIdleCardBonusesV1(state.bonuses.cards);
    state.bonuses.cards[card.type] += card.bonusPct;
    data.stats.cast += 1;
    syncMayoCurrency(state, data);
    return { cast: card.id, type: card.type, bonusPct: card.bonusPct, totalPct: state.bonuses.cards[card.type] };
  }

  if (mode === "yeet") {
    const index = findCard(data, payload.cardId);
    const card = data.deck[index];
    if (card.protected) throw new Error("CARTE_PROTEGEE");
    data.deck.splice(index, 1);
    data.stats.yeeted += 1;
    const result = { yeeted: card.id, spawnAdvance: 0, mayoProgress: null };
    if (mods.recycleSpawn) {
      const key = card.chonker ? "chonkerProgress" : "spawnProgress";
      const f = card.chonker ? IDLE_CARDS_BASE_V1.recycleChonkerFraction : IDLE_CARDS_BASE_V1.recycleSpawnFraction;
      data[key] = N(data[key], 0) + f;
      result.spawnAdvance = f;
    }
    if (mods.recycleMayo) {
      const kinds = Object.keys(card.mayo);
      const id = kinds[Math.floor(rng() * kinds.length) % kinds.length];
      const p = N(data.mayoProgress[id], 0) + IDLE_CARDS_BASE_V1.recycleMayoProgress;
      const whole = Math.floor(p);
      data.mayo[id] = I(data.mayo[id], 0) + whole;
      data.mayoProgress[id] = p - whole;
      result.mayoProgress = id;
    }
    syncMayoCurrency(state, data);
    return result;
  }

  if (mode === "protect") {
    const card = data.deck[findCard(data, payload.cardId)];
    card.protected = payload.protected === undefined ? !card.protected : Boolean(payload.protected);
    return { cardId: card.id, protected: card.protected };
  }

  if (mode === "move") {
    const from = findCard(data, payload.cardId);
    const to = Math.max(0, Math.min(data.deck.length - 1, I(payload.index, from)));
    const [card] = data.deck.splice(from, 1);
    data.deck.splice(to, 0, card);
    return { cardId: card.id, index: to };
  }

  if (mode === "toggleGenerator") {
    const id = String(payload.mayo || "");
    if (!MAYO_IDS.includes(id)) throw new Error("MAYO_INVALIDE");
    const on = data.generators.includes(id);
    if (on) data.generators = data.generators.filter((x) => x !== id);
    else {
      if (data.generators.length >= mods.generators) throw new Error("GENERATEURS_PLEINS");
      data.generators.push(id);
    }
    return { mayo: id, active: !on };
  }

  if (mode === "toggleTag") {
    const id = String(payload.type || "");
    if (!TYPE_BY_ID[id]) throw new Error("TYPE_CARTE_INVALIDE");
    const on = data.tags.includes(id);
    if (on) data.tags = data.tags.filter((x) => x !== id);
    else {
      if (data.tags.length >= mods.tagSlots) throw new Error("TAGS_PLEINS");
      data.tags.push(id);
    }
    return { type: id, tagged: !on };
  }

  throw new Error("ACTION_CARTES_INVALIDE");
}

/* ------------------------------------------------------------------ */
/* Snapshot client                                                     */
/* ------------------------------------------------------------------ */

export function idleCardsSnapshotV1(state) {
  const s = state?.systems?.cards;
  const unlocked = Boolean(s?.unlocked);
  const data = normalizeIdleCardsDataV1(s?.data);
  const mods = idleCardsModifiersV1(state);
  const totals = normalizeIdleCardBonusesV1(state?.bonuses?.cards);
  const tags = data.tags.slice(0, mods.tagSlots);
  const chances = idleCardsTypeChancesV1(tags, mods.tagEffect);
  const active = data.generators.slice(0, mods.generators);
  const infuserSeconds = Math.max(0, N(state?.selloutEffects?.remaining?.mayoInfuser, 0));
  const deckFull = data.deck.length >= mods.deckSize;
  return {
    unlocked,
    deckSize: mods.deckSize,
    tagSlots: mods.tagSlots,
    tagEffectPct: mods.tagEffect * 100,
    generatorSlots: mods.generators,
    cardSpeed: mods.cardSpeed,
    mayoSpeed: mods.mayoSpeed,
    mayoCostRange: [mods.mayoMin, mods.mayoMax],
    chonkerMayoCostRange: [mods.chonkerMayoMin, mods.chonkerMayoMax],
    rarityMin: mods.rarityMin,
    chonkers: mods.chonkers,
    recycleSpawn: mods.recycleSpawn,
    recycleMayo: mods.recycleMayo,
    blackPens: Math.max(0, I(state?.selloutEffects?.blackPens, 0)),
    infuserSeconds,
    deckFull,
    spawnProgress: data.spawnProgress,
    secondsToNextCard: deckFull ? null : (1 - data.spawnProgress) * IDLE_CARDS_BASE_V1.cardSeconds / mods.cardSpeed,
    chonkerProgress: data.chonkerProgress,
    secondsToNextChonker: !mods.chonkers || deckFull ? null : (1 - data.chonkerProgress) * IDLE_CARDS_BASE_V1.chonkerSeconds / mods.cardSpeed,
    stats: data.stats,
    types: IDLE_CARDS_TYPES_V1.map((t) => ({
      id: t.id,
      code: t.code,
      nom: t.nom,
      tier: mods.tiers[t.id],
      tagged: tags.includes(t.id),
      chance: chances[t.id],
      totalPct: totals[t.id],
      multiplier: 1 + totals[t.id] / 100
    })),
    mayoTypes: IDLE_CARDS_MAYO_TYPES_V1.map((m) => ({
      id: m.id,
      nom: m.nom,
      stored: data.mayo[m.id],
      progress: data.mayoProgress[m.id],
      active: active.includes(m.id),
      secondsPerMayo: active.includes(m.id) ? IDLE_CARDS_BASE_V1.mayoSeconds * active.length / (mods.mayoSpeed * (infuserSeconds > 0 ? IDLE_CARDS_BASE_V1.mayoInfuserFactor : 1)) : null
    })),
    deck: data.deck.map((c) => ({
      ...c,
      code: TYPE_BY_ID[c.type].code,
      nom: TYPE_BY_ID[c.type].nom,
      mayoTotal: Object.values(c.mayo).reduce((a, b) => a + b, 0),
      rarityLabel: idleCardRarityLabelV1(c.rarity),
      canCast: !c.protected && Object.entries(c.mayo).every(([id, n]) => data.mayo[id] >= n)
    }))
  };
}
