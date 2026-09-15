/*
 * SOREAL IDLE — Quirks (Beast Quirks, QP currency), Normal-difficulty catalog.
 *
 * Source: NGU Idle wiki (https://ngu-idle.fandom.com/wiki/Quirk_Points),
 * "Quirks" table, Page 1 — only the rows carrying no "Evil only"/"Sadistic
 * only" note (Normal-accessible quirks). Wiki indices kept as `id` for
 * direct traceability back to the table: 0-13, 19-21, 25-26, 30-31, 35-40
 * (27 entries). Every other index on the page is explicitly gated to Evil
 * or Sadistic difficulty and is intentionally excluded until those
 * difficulties exist in SOREAL IDLE — same exclusion rule already applied
 * to the Perks catalog (idle-perks-v1.js) for its one Evil-only entry.
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
 * reduction to Yggdrasil fruit growth time; 19: MacGuffin Slot! — a slot
 * count SOREAL IDLE's MacGuffins system has no concept of yet) have no
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
  { id: 19, name: "MacGuffin Slot!", effect: "The Beast requires enough Quirk Points to make it vomit up a new MacGuffin Slot for you. Why does everything it give have to come in vomit form? Gross.", cost: 7500, cap: 1, bonus: {} },
  { id: 20, name: "Adv. Training Level Bank I", effect: "Each level in this Quirk saves an additional 0.5% of your levels gained in Advanced Training when you rebirth, saving it for the next rebirth!", cost: 100, cap: 10, bonus: { atBankPct: 0.005 } },
  { id: 21, name: "Adv. Training Level Bank II", effect: "Each level in this Quirk saves an additional 0.5% of your levels gained in Advanced Training when you rebirth, saving it for the next rebirth!", cost: 250, cap: 10, bonus: { atBankPct: 0.005 } },
  { id: 25, name: "Time Machine Level Bank I", effect: "Each level in this Quirk saves an additional 0.5% of your levels gained in your Time Machine when you rebirth, saving it for the next rebirth!", cost: 100, cap: 10, bonus: { tmBankPct: 0.005 } },
  { id: 26, name: "Time Machine Level Bank II", effect: "Each level in this Quirk saves an additional 0.5% of your levels gained in your Time Machine when you rebirth, saving it for the next rebirth!", cost: 250, cap: 10, bonus: { tmBankPct: 0.005 } },
  { id: 30, name: "Beard Temp Level Bank I", effect: "Each level in this Quirk saves an additional 0.5% of the temp Beard Levels you've gained when you rebirth, saving it for the next rebirth!", cost: 100, cap: 10, bonus: { beardBankPct: 0.005 } },
  { id: 31, name: "Beard Temp Level Bank II", effect: "Each level in this Quirk saves an additional 0.5% of the temp Beard Levels you've gained when you rebirth, saving it for the next rebirth!", cost: 250, cap: 10, bonus: { beardBankPct: 0.005 } },
  { id: 35, name: "Generic Energy Power Quirk I", effect: "Each level in this Quirk adds a 1% boost to your Energy Power!", cost: 75, cap: 50, bonus: { energyPowerPct: 0.01 } },
  { id: 36, name: "Generic Energy Cap Quirk I", effect: "Each level in this Quirk adds a 1% boost to your Energy Cap!", cost: 75, cap: 50, bonus: { energyCapPct: 0.01 } },
  { id: 37, name: "Generic Energy Bars Quirk I", effect: "Each level in this Quirk adds a 1% boost to your Energy Bars!", cost: 75, cap: 50, bonus: { energyBarsPct: 0.01 } },
  { id: 38, name: "Generic Magic Power Quirk I", effect: "Each level in this Quirk adds a 1% boost to your Magic Power!", cost: 75, cap: 50, bonus: { magicPowerPct: 0.01 } },
  { id: 39, name: "Generic Magic Cap Quirk I", effect: "Each level in this Quirk adds a 1% boost to your Magic Cap!", cost: 75, cap: 50, bonus: { magicCapPct: 0.01 } },
  { id: 40, name: "Generic Magic Bars Quirk I", effect: "Each level in this Quirk adds a 1% boost to your Magic Bars!", cost: 75, cap: 50, bonus: { magicBarsPct: 0.01 } }
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
  for (const quirk of IDLE_QUIRKS_CATALOG_V1) {
    const level = Math.max(0, Math.min(quirk.cap, Number(levels[quirk.id]) || 0));
    if (!level) continue;
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
    boostPowerMultiplier: 1 + (totals.boostPowerPct || 0),
    atBankMultiplier: 1 + (totals.atBankPct || 0),
    tmBankMultiplier: 1 + (totals.tmBankPct || 0),
    beardBankMultiplier: 1 + (totals.beardBankPct || 0)
  };
}
