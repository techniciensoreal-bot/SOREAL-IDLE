/*
 * SOREAL IDLE — Quirks (Beast Quirks, QP currency).
 *
 * Source: NGU Idle wiki (https://ngu-idle.fandom.com/wiki/Quirk_Points),
 * "Quirks" table. Wiki indices kept as `id` for direct traceability back
 * to the table: 0-13, 19-21, 25-26, 30-31, 35-40 (27 Normal-accessible
 * entries).
 *
 * Extension (2026-09-18, Norman : "il faut tout faire" -- Evil/Sadistic
 * fidélité, même correction que idle-perks-v1.js). Le déni précédent
 * ("index gated to Evil/Sadistic difficulty, exclu jusqu'à ce qu'elles
 * existent") reposait sur une lecture erronée : la colonne "Note" du
 * tableau ("Evil only"/"Sadistic only"/"No"/etc.) est un conseil
 * stratégique communautaire sur l'ordre d'achat, jamais une restriction
 * imposée par le jeu (mêmes valeurs de conseil déjà présentes sur les
 * indices 0-40 ci-dessous, jamais traitées comme un verrou). Chaque
 * quirk reste achetable dès que son coût en QP est payé.
 *
 * 39 quirks ajoutées (indices 41-182), toutes câblées sur des clés bonus
 * déjà agrégées par quirkBonusesV1 ci-dessous (energyPowerPct, statPct,
 * adventureStatsPct, boostPowerPct, seedYieldPct) -- paliers II-IV/Final
 * des quirks génériques Energy/Magic déjà présents en indices 35-40,
 * paliers II-VI des Rich Quirks déjà présents en indices 7-8, paliers
 * II-IV de Beasted Boosts déjà présent en indice 11, et "Even Better
 * Yggdrasil Yields" qui réutilise exactement la clé seedYieldPct de "The
 * Beast's Seed ;)" (indice 12). "A PROBLEM HAS BEEN DETECTED" (176) est
 * une quirk-blague sans AUCUN effet mécanique réel (texte : "YOUR PC RAN
 * INTO A PROBLEM") -- `bonus:{}` est la valeur réelle, même statut que
 * "ERROR" côté Perks.
 *
 * Extension (2026-09-18, suite) : 15-16 ("Energy/Magic Wandoos BEAST-a",
 * +2%/niveau chacun) ajoutées après la reconstruction complète de Wandoos
 * (idle-ngu-progression.js, IDLE_WANDOOS_OS_V1/advanceWandoos) -- câblées
 * via les nouvelles clés wandoosEnergySpeedPct/wandoosMagicSpeedPct.
 *
 * Volontairement exclus (système absent de SOREAL, ou multiplicateur déjà
 * calculé mais jamais branché ailleurs dans ce fichier -- gap préexistant
 * hors périmètre de cette passe, jamais approximé) : NGU Evil/Sadistic
 * (les NGU réels existent depuis 2026-09-23 : quirks 14, 89, 93-98 ajoutés),
 * Daycare Slot (MacGuffin Slot 19/50 : câblés le 2026-09-23), Hack Milestones
 * (57-60,174-175), Wishes (54,56), Automerge Slot (55), Cards/Mayo/Tags/
 * Deck (99-169 quasi intégralement), Resource 3 (47-49,67-69,86-88,183-
 * 185 -- pas de 3e ressource entraînable), Quêtes/Idle Questing (71),
 * Better
 * Blood Magic (91 -- production de sang non exposée comme taux
 * modifiable dans ce round), Even More Inventory Space (90 -- le
 * pipeline inventorySlotsFromPerks/FromChallenges n'a pas d'équivalent
 * FromQuirks câblé, hors périmètre).
 *
 * Previously "Quirks" was buyTree(state, "quirks", "qp", 50) — a single
 * generic counter (one shared level, exponential 1.55^level cost) reused
 * from the old placeholder tree-purchase model, with no per-item identity
 * or real effect, live and reachable via the "buyQuirk" action. Each entry
 * below is a real, individually purchasable quirk with its own flat
 * per-level cost and cap, exactly as the wiki lists it.
 *
 * Some quirks (10: Beast's Special Beard Tonic — a leveling-SPEED bonus for
 * Beards, not a magnitude bonus; 13: Beast's Fertilizer — a flat seconds
 * reduction to Yggdrasil fruit growth time; 19/50: MacGuffin Slot! — since
 * 2026-09-23 read by id in idle-macguffins-v1.js, no aggregated key) have no
 * `bonus` entry — there is no existing mechanical hook in SOREAL IDLE to
 * wire their real effect into. They are still real, purchasable,
 * correctly-costed catalog entries; only their mechanical payoff is
 * pending a future pass on those systems. Never silently drop or fake data
 * to avoid an empty bonus object — an honest gap beats an invented one.
 */

export const IDLE_QUIRKS_CATALOG_V1 = Object.freeze([
  { id: 0, name: "Baby's First Quirk: Energy Power", effect: "Improve your Energy Power by 10%!", cost: 100, cap: 1, bonus: { energyPowerPct: 0.10 } },
  { id: 1, name: "Baby's First Quirk: Energy Cap", effect: "Improve your Energy Cap by 10%!", cost: 100, cap: 1, bonus: { energyCapPct: 0.10 } },
  { id: 2, name: "Baby's First Quirk: Energy Bars", effect: "Improve your Energy Bars by 10%!", cost: 100, cap: 1, bonus: { energyBarsPct: 0.10 } },
  { id: 3, name: "Baby's First Quirk: Magic Power", effect: "Improve your Magic Power by 10%!", cost: 100, cap: 1, bonus: { magicPowerPct: 0.10 } },
  { id: 4, name: "Baby's First Quirk: Magic Cap", effect: "Improve your Magic Cap by 10%!", cost: 100, cap: 1, bonus: { magicCapPct: 0.10 } },
  { id: 5, name: "Baby's First Quirk: Magic Bars", effect: "Improve your Magic Bars by 10%!", cost: 100, cap: 1, bonus: { magicBarsPct: 0.10 } },
  { id: 6, name: "Baby's First Quirk: Adventure", effect: "Improve your Adventure stats by 25%!", cost: 300, cap: 1, bonus: { adventureStatsPct: 0.25 } },
  { id: 7, name: "Stat Boost For Rich Quirks I", effect: "Only for the richest of Quirks. Improve your Attack/Defense by 1% per level.", cost: 25, cap: 1000, bonus: { statPct: 0.01 } },
  { id: 8, name: "Adventure Boost For Rich Quirks I", effect: "Only for the richest of Quirks. Improve your Adventure stats by 0.1% per level!", cost: 25, cap: 1000, bonus: { adventureStatsPct: 0.001 } },
  { id: 9, name: "GOOOOOLLLLLLLLLLLD!", effect: "Boost your gold drops by 10% per level!", cost: 50, cap: 25, bonus: { adventureGoldPct: 0.10 } },
  { id: 10, name: "The Beast's Special Beard Tonic", effect: "Don't ask what it's made out of, but it boosts your Beard Speed by 1% per level!", cost: 50, cap: 50, bonus: {} },
  { id: 11, name: "Beasted Boosts I", effect: "The Beast said they'll squirt another random fluid onto boosts applied to equipment, and that'll make them boostier! Gain 1% better boosts per level of this Quirk!", cost: 40, cap: 50, bonus: { boostPowerPct: 0.01 } },
  { id: 12, name: "The Beast's Seed ;)", effect: "Receive The Beast's Seed, for +1% Seed yields in Yggdrasil per level!", cost: 35, cap: 25, bonus: { seedYieldPct: 0.01 } },
  { id: 13, name: "The Beast's Fertilizer", effect: "The Beast will make you a mix tape you can play to your fruits as they grow, consisting of the beast wailing at them in yggdrasil-speak to grow faster. Each tier will take 1 minute less to grow!", cost: 3000, cap: 3, bonus: {} },
  { id: 14, name: "The Beast NGU Quirk Ever", effect: "Using secret demonic (and EVIL) rituals known only to the beast, it can grant you the ability to gain 1 level in a normal NGU every time you gain a level in an Evil NGU!", cost: 15000, cap: 1, bonus: {} },
  { id: 15, name: "Energy Wandoos BEAST-a", effect: "+2% to Energy Wandoos Speed per level", cost: 32, cap: 50, bonus: { wandoosEnergySpeedPct: 0.02 } },
  { id: 16, name: "Magic Wandoos BEAST-a", effect: "+2% to Magic Wandoos Speed per level", cost: 37, cap: 50, bonus: { wandoosMagicSpeedPct: 0.02 } },
  { id: 17, name: "Super Advanced Beast Training!", effect: "The Beast claims it can scare your Basic Training Levels into rising higher. Buy this Quirk to gain +1 level every time the Basic Training bar fills!", cost: 4000, cap: 1, bonus: { basicTrainingExtraLevel: 1 } },
  { id: 18, name: "Accessory Slot!", effect: "The Beast requires enough Quirk Points to make it vomit up a new Accessory Slot for you.", cost: 20000, cap: 1, bonus: { accessorySlotBonus: 1 } },
  { id: 19, name: "MacGuffin Slot!", effect: "The Beast requires enough Quirk Points to make it vomit up a new MacGuffin Slot for you. Why does everything it give have to come in vomit form? Gross.", cost: 7500, cap: 1, bonus: {} },
  { id: 20, name: "Adv. Training Level Bank I", effect: "Each level in this Quirk saves an additional 0.5% of your levels gained in Advanced Training when you rebirth, saving it for the next rebirth!", cost: 100, cap: 10, bonus: { atBankPct: 0.005 } },
  { id: 21, name: "Adv. Training Level Bank II", effect: "Each level in this Quirk saves an additional 0.5% of your levels gained in Advanced Training when you rebirth, saving it for the next rebirth!", cost: 250, cap: 10, bonus: { atBankPct: 0.005 } },
  { id: 22, name: "Adv. Training Level Bank III", effect: "Each level in this Quirk saves an additional 0.5% of your levels gained in Advanced Training when you rebirth, saving it for the next rebirth!", cost: 500, cap: 10, bonus: { atBankPct: 0.005 } },
  { id: 23, name: "Adv. Training Level Bank IV", effect: "Each level in this Quirk saves an additional 0.5% of your levels gained in Advanced Training when you rebirth, saving it for the next rebirth!", cost: 1000, cap: 10, bonus: { atBankPct: 0.005 } },
  { id: 24, name: "Adv. Training Level Bank V", effect: "Each level in this Quirk saves an additional 0.5% of your levels gained in Advanced Training when you rebirth, saving it for the next rebirth!", cost: 2000, cap: 10, bonus: { atBankPct: 0.005 } },
  { id: 25, name: "Time Machine Level Bank I", effect: "Each level in this Quirk saves an additional 0.5% of your levels gained in your Time Machine when you rebirth, saving it for the next rebirth!", cost: 100, cap: 10, bonus: { tmBankPct: 0.005 } },
  { id: 26, name: "Time Machine Level Bank II", effect: "Each level in this Quirk saves an additional 0.5% of your levels gained in your Time Machine when you rebirth, saving it for the next rebirth!", cost: 250, cap: 10, bonus: { tmBankPct: 0.005 } },
  { id: 27, name: "Time Machine Level Bank III", effect: "Each level in this Quirk saves an additional 0.5% of your levels gained in your Time Machine when you rebirth, saving it for the next rebirth!", cost: 500, cap: 10, bonus: { tmBankPct: 0.005 } },
  { id: 28, name: "Time Machine Level Bank IV", effect: "Each level in this Quirk saves an additional 0.5% of your levels gained in your Time Machine when you rebirth, saving it for the next rebirth!", cost: 1000, cap: 10, bonus: { tmBankPct: 0.005 } },
  { id: 29, name: "Time Machine Level Bank V", effect: "Each level in this Quirk saves an additional 0.5% of your levels gained in your Time Machine when you rebirth, saving it for the next rebirth!", cost: 2000, cap: 10, bonus: { tmBankPct: 0.005 } },
  { id: 30, name: "Beard Temp Level Bank I", effect: "Each level in this Quirk saves an additional 0.5% of the temp Beard Levels you've gained when you rebirth, saving it for the next rebirth!", cost: 100, cap: 10, bonus: { beardBankPct: 0.005 } },
  { id: 31, name: "Beard Temp Level Bank II", effect: "Each level in this Quirk saves an additional 0.5% of the temp Beard Levels you've gained when you rebirth, saving it for the next rebirth!", cost: 250, cap: 10, bonus: { beardBankPct: 0.005 } },
  { id: 32, name: "Beard Temp Level Bank III", effect: "Each level in this Quirk saves an additional 0.5% of the temp Beard Levels you've gained when you rebirth, saving it for the next rebirth!", cost: 500, cap: 10, bonus: { beardBankPct: 0.005 } },
  { id: 33, name: "Beard Temp Level Bank IV", effect: "Each level in this Quirk saves an additional 0.5% of the temp Beard Levels you've gained when you rebirth, saving it for the next rebirth!", cost: 1000, cap: 10, bonus: { beardBankPct: 0.005 } },
  { id: 34, name: "Beard Temp Level Bank V", effect: "Each level in this Quirk saves an additional 0.5% of the temp Beard Levels you've gained when you rebirth, saving it for the next rebirth!", cost: 2000, cap: 10, bonus: { beardBankPct: 0.005 } },
  { id: 35, name: "Generic Energy Power Quirk I", effect: "Each level in this Quirk adds a 1% boost to your Energy Power!", cost: 75, cap: 50, bonus: { energyPowerPct: 0.01 } },
  { id: 36, name: "Generic Energy Cap Quirk I", effect: "Each level in this Quirk adds a 1% boost to your Energy Cap!", cost: 75, cap: 50, bonus: { energyCapPct: 0.01 } },
  { id: 37, name: "Generic Energy Bars Quirk I", effect: "Each level in this Quirk adds a 1% boost to your Energy Bars!", cost: 75, cap: 50, bonus: { energyBarsPct: 0.01 } },
  { id: 38, name: "Generic Magic Power Quirk I", effect: "Each level in this Quirk adds a 1% boost to your Magic Power!", cost: 75, cap: 50, bonus: { magicPowerPct: 0.01 } },
  { id: 39, name: "Generic Magic Cap Quirk I", effect: "Each level in this Quirk adds a 1% boost to your Magic Cap!", cost: 75, cap: 50, bonus: { magicCapPct: 0.01 } },
  { id: 40, name: "Generic Magic Bars Quirk I", effect: "Each level in this Quirk adds a 1% boost to your Magic Bars!", cost: 75, cap: 50, bonus: { magicBarsPct: 0.01 } },
  { id: 41, name: "Generic Energy Power Quirk II", effect: "Each level in this Quirk adds a 1% boost to your Energy Power!", cost: 300, cap: 50, bonus: { energyPowerPct: 0.01 } },
  { id: 42, name: "Generic Energy Cap Quirk II", effect: "Each level in this Quirk adds a 1% boost to your Energy Cap!", cost: 300, cap: 50, bonus: { energyCapPct: 0.01 } },
  { id: 43, name: "Generic Energy Bars Quirk II", effect: "Each level in this Quirk adds a 1% boost to your Energy Bars!", cost: 300, cap: 50, bonus: { energyBarsPct: 0.01 } },
  { id: 44, name: "Generic Magic Power Quirk II", effect: "Each level in this Quirk adds a 1% boost to your Magic Power!", cost: 300, cap: 50, bonus: { magicPowerPct: 0.01 } },
  { id: 45, name: "Generic Magic Cap Quirk II", effect: "Each level in this Quirk adds a 1% boost to your Magic Cap!", cost: 300, cap: 50, bonus: { magicCapPct: 0.01 } },
  { id: 46, name: "Generic Magic Bars Quirk II", effect: "Each level in this Quirk adds a 1% boost to your Magic Bars!", cost: 300, cap: 50, bonus: { magicBarsPct: 0.01 } },
  { id: 47, name: "Generic Resource 3 Power Quirk I", effect: "Each level in this Quirk adds a 1% boost to your Resource 3 Power!", cost: 300, cap: 50, bonus: { r3PowerPct: 0.01 } },
  { id: 48, name: "Generic Resource 3 Cap Quirk I", effect: "Each level in this Quirk adds a 1% boost to your Resource 3 Cap!", cost: 300, cap: 50, bonus: { r3CapPct: 0.01 } },
  { id: 49, name: "Generic Resource 3 Bars Quirk I", effect: "Each level in this Quirk adds a 1% boost to your Resource 3 Bars!", cost: 300, cap: 50, bonus: { r3BarsPct: 0.01 } },
  /* 2026-09-23 (page Quirk Points, ligne 50) : slot MacGuffin lu par id dans idle-macguffins-v1.js, comme le 19. */
  { id: 50, name: "Another MacGuffin Slot!", effect: "With this quirk you'll get... *checks notes* ... another MacGuffin Slot! Not surprising at this point, TBH.", cost: 20000, cap: 1, bonus: {} },
  { id: 51, name: "Stat Boost For Rich Quirks II", effect: "Improve your Attack/Defense by 2% per level!", cost: 125, cap: 1000, bonus: { statPct: 0.02 } },
  { id: 52, name: "Adventure Boost For Rich Quirks II", effect: "Improve your Adventure stats by 0.1% per level!", cost: 125, cap: 1000, bonus: { adventureStatsPct: 0.001 } },
  { id: 53, name: "Beasted Boosts II", effect: "Gain 2% better boosts per level of this quirk!", cost: 200, cap: 60, bonus: { boostPowerPct: 0.02 } },
  { id: 54, name: "Lower Minimum Wish Speed?", effect: "Using the powers of regurgitation, The Beast will reduce the minimum wish completion time by 24 seconds per level! This time is normally 4 hours.", cost: 400, cap: 50, bonus: { wishMinTimeSeconds: 24 } },
  { id: 57, name: "Atk/Def Hack Milestone Reducer I", effect: "Each level of this quirk reduces the number of hack levels required per milestone by 1! This means more milestone bonuses!", cost: 2000, cap: 2, bonus: { hackMilestoneAttackDefense: 1 } },
  { id: 58, name: "PP Hack Milestone Reducer I", effect: "Each level of this quirk reduces the number of hack levels required per milestone by 1! This means more milestone bonuses!", cost: 7000, cap: 3, bonus: { hackMilestonePp: 1 } },
  { id: 59, name: "EXP Hack Milestone Reducer I", effect: "Each level of this quirk reduces the number of hack levels required per milestone by 1! This means more milestone bonuses!", cost: 60000, cap: 5, bonus: { hackMilestoneExp: 1 } },
  { id: 60, name: "Wish Hack Milestone Reducer I", effect: "Each level of this quirk reduces the number of hack levels required per milestone by 1! This means more milestone bonuses!", cost: 25000, cap: 5, bonus: { hackMilestoneWish: 1 } },
  { id: 61, name: "Generic Energy Power Quirk III", effect: "Each level in this Quirk adds a 0.5% boost to your Energy Power!", cost: 1000, cap: 50, bonus: { energyPowerPct: 0.005 } },
  { id: 62, name: "Generic Energy Cap Quirk III", effect: "Each level in this Quirk adds a 0.2% boost to your Energy Cap!", cost: 1000, cap: 50, bonus: { energyCapPct: 0.002 } },
  { id: 63, name: "Generic Energy Bars Quirk III", effect: "Each level in this Quirk adds a 0.2% boost to your Energy Bars!", cost: 1000, cap: 50, bonus: { energyBarsPct: 0.002 } },
  { id: 64, name: "Generic Magic Power Quirk III", effect: "Each level in this Quirk adds a 0.5% boost to your Magic Power!", cost: 1000, cap: 50, bonus: { magicPowerPct: 0.005 } },
  { id: 65, name: "Generic Magic Cap Quirk III", effect: "Each level in this Quirk adds a 0.2% boost to your Magic Cap!", cost: 1000, cap: 50, bonus: { magicCapPct: 0.002 } },
  { id: 66, name: "Generic Magic Bars Quirk III", effect: "Each level in this Quirk adds a 0.2% boost to your Magic Bars!", cost: 1000, cap: 50, bonus: { magicBarsPct: 0.002 } },
  { id: 67, name: "Generic Resource 3 Power Quirk II", effect: "Each level in this Quirk adds a 1% boost to your Resource 3 Power!", cost: 1000, cap: 50, bonus: { r3PowerPct: 0.01 } },
  { id: 68, name: "Generic Resource 3 Cap Quirk II", effect: "Each level in this Quirk adds a 0.5% boost to your Resource 3 Cap!", cost: 1000, cap: 50, bonus: { r3CapPct: 0.005 } },
  { id: 69, name: "Generic Resource 3 Bars Quirk II", effect: "Each level in this Quirk adds a 0.5% boost to your Resource 3 Bars!", cost: 1000, cap: 50, bonus: { r3BarsPct: 0.005 } },
  { id: 70, name: "Improved Base ITOPOD PPP!", effect: "Need to afford those new Sadistic Perks? No better solution to a Sadistic Quirk! Each level adds +10 base PPP to ITOPOD rewards!", cost: 800, cap: 50, bonus: { itopodPppFlat: 10 } },
  { id: 72, name: "Beasted Boosts III", effect: "Gain 1% better boosts per level of this quirk!", cost: 600, cap: 50, bonus: { boostPowerPct: 0.01 } },
  { id: 73, name: "Beasted Boosts IV", effect: "Gain 0.5% better boosts per level of this quirk!", cost: 1800, cap: 50, bonus: { boostPowerPct: 0.005 } },
  { id: 74, name: "Improved Sadistic Boss Multiplier I", effect: "+0.001 to the Sadistic Boss Multiplier per level (base 1.20)", cost: 20000, cap: 10, bonus: { sadisticBossMultiplierBonus: 0.001 } },
  { id: 75, name: "Improved Sadistic Boss Multiplier II", effect: "Another +0.001 to the Sadistic Boss Multiplier per level (base 1.20)", cost: 100000, cap: 10, bonus: { sadisticBossMultiplierBonus: 0.001 } },
  { id: 76, name: "Stat Boost for Rich Quirks III", effect: "Improve your Attack/Defense by 1% per level!", cost: 400, cap: 1000, bonus: { statPct: 0.01 } },
  { id: 77, name: "Adventure Boost for Rich Quirks III", effect: "Improve your Adventure stats by 0.03% per level!", cost: 400, cap: 1000, bonus: { adventureStatsPct: 0.0003 } },
  { id: 78, name: "Stat Boost for Rich Quirks IV", effect: "Improve your Attack/Defense by 1% per level!", cost: 1300, cap: 1000, bonus: { statPct: 0.01 } },
  { id: 79, name: "Adventure Boost for Rich Quirks IV", effect: "Improve your Adventure stats by 0.03% per level!", cost: 1300, cap: 1000, bonus: { adventureStatsPct: 0.0003 } },
  { id: 80, name: "Generic Energy Power Quirk IV", effect: "Each level in this Quirk adds a 0.5% boost to your Energy Power!", cost: 3000, cap: 50, bonus: { energyPowerPct: 0.005 } },
  { id: 81, name: "Generic Energy Cap Quirk IV", effect: "Each level in this Quirk adds a 0.2% boost to your Energy Cap!", cost: 3000, cap: 50, bonus: { energyCapPct: 0.002 } },
  { id: 82, name: "Generic Energy Bars Quirk IV", effect: "Each level in this Quirk adds a 0.2% boost to your Energy Bars!", cost: 3000, cap: 50, bonus: { energyBarsPct: 0.002 } },
  { id: 83, name: "Generic Magic Power Quirk IV", effect: "Each level in this Quirk adds a 0.5% boost to your Magic Power!", cost: 3000, cap: 50, bonus: { magicPowerPct: 0.005 } },
  { id: 84, name: "Generic Magic Cap Quirk IV", effect: "Each level in this Quirk adds a 0.2% boost to your Magic Cap!", cost: 3000, cap: 50, bonus: { magicCapPct: 0.002 } },
  { id: 85, name: "Generic Magic Bars Quirk IV", effect: "Each level in this Quirk adds a 0.2% boost to your Magic Bars!", cost: 3000, cap: 50, bonus: { magicBarsPct: 0.002 } },
  { id: 86, name: "Generic Resource 3 Power Quirk III", effect: "Each level in this Quirk adds a 1% boost to your Resource 3 Power!", cost: 3000, cap: 50, bonus: { r3PowerPct: 0.01 } },
  { id: 87, name: "Generic Resource 3 Cap Quirk III", effect: "Each level in this Quirk adds a 0.5% boost to your Resource 3 Cap!", cost: 3000, cap: 50, bonus: { r3CapPct: 0.005 } },
  { id: 88, name: "Generic Resource 3 Bars Quirk III", effect: "Each level in this Quirk adds a 0.5% boost to your Resource 3 Bars!", cost: 3000, cap: 50, bonus: { r3BarsPct: 0.005 } },
  { id: 89, name: "An even Beast-er NGU Quirk", effect: "Using secret demonic (and SADISTIC) rituals known only to the Beast, it can grant you the ability to gain 1 level in an Evil NGU every time you gain a level in a Sadistic NGU!", cost: 100000, cap: 1, bonus: {} },
  { id: 90, name: "Even More Inventory Space?", effect: "The Beast promises it can stash up to 24 items for you, the only way it knows how... by eating them.", cost: 700, cap: 24, bonus: { inventorySlotBonus: 1 } },
  { id: 91, name: "Better Blood Magic I", effect: "The Beast knows a LOT about blood, and they can teach you how to produce more of it faster! (+1% per level)", cost: 2000, cap: 50, bonus: { bloodGainPct: 0.01 } },
  { id: 92, name: "Even Better Yggdrasil Yields", effect: "+0.1% Seed yield per level", cost: 2500, cap: 50, bonus: { seedYieldPct: 0.001 } },
  { id: 93, name: "Faster Energy NGU I", effect: "Get this Quirk and you can enjoy 0.4% Faster Energy NGUs!", cost: 1000, cap: 50, bonus: { nguSpeedEnergyPct: 0.004 } },
  { id: 94, name: "Faster Magic NGU I", effect: "Get this Quirk and you can enjoy 0.4% Faster Magic NGUs!", cost: 1000, cap: 50, bonus: { nguSpeedMagicPct: 0.004 } },
  { id: 95, name: "Faster Energy NGU II", effect: "This Quirk will improve Energy NGU speeds by 0.3% per level!", cost: 3000, cap: 50, bonus: { nguSpeedEnergyPct: 0.003 } },
  { id: 96, name: "Faster Magic NGU II", effect: "This Quirk will improve Magic NGU speeds by 0.3% per level!", cost: 3000, cap: 50, bonus: { nguSpeedMagicPct: 0.003 } },
  { id: 97, name: "Faster Energy NGU III", effect: "This Quirk will improve Energy NGU speeds by 0.3% per level!", cost: 10000, cap: 50, bonus: { nguSpeedEnergyPct: 0.003 } },
  { id: 98, name: "Faster Magic NGU III", effect: "This Quirk will improve Magic NGU speeds by 0.3% per level!", cost: 10000, cap: 50, bonus: { nguSpeedMagicPct: 0.003 } },
  { id: 170, name: "Stat Boost for Rich Quirks V", effect: "Improve your Attack/Defense by 1% per level!", cost: 2800, cap: 1000, bonus: { statPct: 0.01 } },
  { id: 171, name: "Adventure Boost for Rich Quirks V", effect: "Improve your Adventure stats by 0.03% per level!", cost: 2800, cap: 1000, bonus: { adventureStatsPct: 0.0003 } },
  { id: 172, name: "Stat Boost for Rich Quirks VI", effect: "Improve your Attack/Defense by 1% per level!", cost: 6000, cap: 1000, bonus: { statPct: 0.01 } },
  { id: 173, name: "Adventure Boost for Rich Quirks VI", effect: "Improve your Adventure stats by 0.03% per level!", cost: 6000, cap: 1000, bonus: { adventureStatsPct: 0.0003 } },
  { id: 174, name: "Energy NGU Hack Milestone reducer I", effect: "Each level of this quirk reduces the number of hack levels required per milestone by 1! This means more milestone bonuses!", cost: 80000, cap: 3, bonus: { hackMilestoneEnergyNguSpeed: 1 } },
  { id: 175, name: "TM Hack Milestone reducer I", effect: "Each level of this quirk reduces the number of hack levels required per milestone by 1! This means more milestone bonuses!", cost: 65000, cap: 5, bonus: { hackMilestoneTimeMachineSpeed: 1 } },
  { id: 176, name: "A PROBLEM HAS BEEN DETECTED", effect: "YOUR PC RAN INTO A PROBLEM", cost: 10000000, cap: 1, bonus: {} },
  { id: 177, name: "The Final Generic Energy Power Quirk", effect: "Add a 1% Boost to your Energy Power with this Quirk!", cost: 50000, cap: 50, bonus: { energyPowerPct: 0.01 } },
  { id: 178, name: "The Final Generic Energy Cap Quirk", effect: "Add a 1% Boost to your Energy Cap with this Quirk!", cost: 50000, cap: 50, bonus: { energyCapPct: 0.01 } },
  { id: 179, name: "The Final Generic Energy Bars Quirk", effect: "Add a 1% Boost to your Energy Bars with this Quirk!", cost: 50000, cap: 50, bonus: { energyBarsPct: 0.01 } },
  { id: 180, name: "The Final Generic Magic Power Quirk", effect: "Add a 1% Boost to your Magic Power with this Quirk!", cost: 50000, cap: 50, bonus: { magicPowerPct: 0.01 } },
  { id: 181, name: "The Final Generic Magic Cap Quirk", effect: "Add a 1% Boost to your Magic Cap with this Quirk!", cost: 50000, cap: 50, bonus: { magicCapPct: 0.01 } },
  { id: 182, name: "The Final Generic Magic Bars Quirk", effect: "Add a 1% Boost to your Magic Bars with this Quirk!", cost: 50000, cap: 50, bonus: { magicBarsPct: 0.01 } },
  { id: 183, name: "The Final Generic Resource 3 Power Quirk", effect: "Each level in this Quirk adds a 1% boost to your Resource 3 Power!", cost: 100000, cap: 50, bonus: { r3PowerPct: 0.01 } },
  { id: 184, name: "The Final Generic Resource 3 Cap Quirk", effect: "Each level in this Quirk adds a 1% boost to your Resource 3 Cap!", cost: 100000, cap: 50, bonus: { r3CapPct: 0.01 } },
  { id: 185, name: "The Final Generic Resource 3 Bars Quirk", effect: "Each level in this Quirk adds a 1% boost to your Resource 3 Bars!", cost: 100000, cap: 50, bonus: { r3BarsPct: 0.01 } },
]);

export function idleQuirkByIdV1(id) {
  return IDLE_QUIRKS_CATALOG_V1.find(q => q.id === id) || null;
}

/*
 * Real per-level flat cost (the wiki's "Cost" column is already the
 * per-level price, not a base for an exponential curve) — matches the
 * wiki exactly, unlike the previous generic 1.55^level model.
 */
export function idleQuirkNextCostV1(quirk, currentLevel) {
  if (!quirk) return Infinity;
  if (currentLevel >= quirk.cap) return Infinity;
  return Math.max(1, Math.floor(quirk.cost));
}

/*
 * Sums level x per-level bonus value across every purchased quirk into one
 * flat object, keyed the same way idle-ngu-progression.js's other bonus
 * sources (perkBonusesV1, challengePermanentBonuses, diggerBonuses) already
 * are — so idleNguBonuses() can fold this in with the same
 * "multiply into the existing total" pattern instead of a parallel one.
 */
export function quirkBonusesV1(levelsById) {
  const levels = levelsById && typeof levelsById === "object" ? levelsById : {};
  const totals = {};
  /* Page Boost : « Beasted Boosts I à IV, chacun multiplicatif avec les autres » (1,5 x 2,2 x 1,5 x 1,25 au maximum). */
  let boostPowerProduct = 1;
  for (const quirk of IDLE_QUIRKS_CATALOG_V1) {
    const level = Math.max(0, Math.min(quirk.cap, Number(levels[quirk.id]) || 0));
    if (!level) continue;
    if (quirk.bonus && quirk.bonus.boostPowerPct) boostPowerProduct *= 1 + quirk.bonus.boostPowerPct * level;
    for (const [key, perLevel] of Object.entries(quirk.bonus || {})) {
      totals[key] = (totals[key] || 0) + perLevel * level;
    }
  }
  return {
    energyPowerMultiplier: 1 + (totals.energyPowerPct || 0),
    energyCapMultiplier: 1 + (totals.energyCapPct || 0),
    energyBarsMultiplier: 1 + (totals.energyBarsPct || 0),
    magicPowerMultiplier: 1 + (totals.magicPowerPct || 0),
    magicCapMultiplier: 1 + (totals.magicCapPct || 0),
    magicBarsMultiplier: 1 + (totals.magicBarsPct || 0),
    adventureStatsMultiplier: 1 + (totals.adventureStatsPct || 0),
    statMultiplier: 1 + (totals.statPct || 0),
    adventureGoldMultiplier: 1 + (totals.adventureGoldPct || 0),
    seedYieldMultiplier: 1 + (totals.seedYieldPct || 0),
    boostPowerMultiplier: boostPowerProduct,
    atBankMultiplier: 1 + (totals.atBankPct || 0),
    tmBankMultiplier: 1 + (totals.tmBankPct || 0),
    beardBankMultiplier: 1 + (totals.beardBankPct || 0),
    sadisticBossMultiplierBonus: totals.sadisticBossMultiplierBonus || 0,
    accessorySlotBonus: totals.accessorySlotBonus || 0,
    inventorySlotBonus: totals.inventorySlotBonus || 0,
    wishMinTimeReductionSeconds: totals.wishMinTimeSeconds || 0,
    wandoosEnergySpeedPct: totals.wandoosEnergySpeedPct || 0,
    wandoosMagicSpeedPct: totals.wandoosMagicSpeedPct || 0,
    basicTrainingExtraLevels: totals.basicTrainingExtraLevel || 0,
    nguSpeedEnergyMultiplier: 1 + (totals.nguSpeedEnergyPct || 0),
    nguSpeedMagicMultiplier: 1 + (totals.nguSpeedMagicPct || 0),
    r3PowerMultiplier: 1 + (totals.r3PowerPct || 0),
    r3CapMultiplier: 1 + (totals.r3CapPct || 0),
    r3BarsMultiplier: 1 + (totals.r3BarsPct || 0),
    itopodPppFlat: totals.itopodPppFlat || 0,
    hackMilestoneReduction: {
      attackDefense: totals.hackMilestoneAttackDefense || 0,
      pp: totals.hackMilestonePp || 0,
      exp: totals.hackMilestoneExp || 0,
      wish: totals.hackMilestoneWish || 0,
      energyNguSpeed: totals.hackMilestoneEnergyNguSpeed || 0,
      timeMachineSpeed: totals.hackMilestoneTimeMachineSpeed || 0
    },
    bloodGainMultiplier: 1 + (totals.bloodGainPct || 0)
  };
}
