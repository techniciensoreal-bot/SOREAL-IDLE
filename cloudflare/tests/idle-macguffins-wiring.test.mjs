import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  advanceIdleNguState,
  applyIdleNguAction,
  rebirthIdleNguState,
  idleNguBonuses,
  idleNguSnapshot,
  idleNguEffectiveResourceStat
} from "../src/idle-ngu-progression.js";
import {
  macguffinSlotCountV1,
  macguffinDropLevelV1,
  macguffinOnZoneKillsV1,
  macguffinOnItopodKillsV1,
  macguffinOnTitanKillV1,
  macguffinRandomPoolV1
} from "../src/idle-macguffins-v1.js";
import { idleSelloutShopBuyV1, IDLE_SELLOUT_EFFECTS_V1 } from "../src/idle-sellout-shop-v1.js";

const T0 = 1_000_000_000;
const ctx = { bosses: 120 };
const proche = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg} (obtenu ${a}, attendu ${b})`);

function etatDebloque(extra) {
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, T0);
  s.adventure.unlockFlags.walderpFinalDefeated = true;
  s.systems.macguffins.unlocked = true;
  if (extra) extra(s);
  return s;
}
function fragment(s, type, level, equipped) {
  const d = s.systems.macguffins.data;
  const f = { uid: "mg" + d.serial++, type, level };
  (equipped ? d.equipped : d.inventory).push(f);
  return f;
}

/* --- Verrouillage : rien avant la forme finale de Walderp --- */
{
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, T0);
  assert.equal(macguffinSlotCountV1(s), 0);
  assert.deepEqual(macguffinOnZoneKillsV1(s, "sewers", 5000), [], "Aucun drop avant Walderp.");
  assert.throws(() => applyIdleNguAction(s, { action: "macguffin", op: "mergeAll", type: "energyPower" }, ctx, T0), /SYSTEME_VERROUILLE/);
}

/* --- Slots : 1 + EXP (2) + perks (3) + quirks (2) + Edgy + Troll Evil 2 + No Equipment Evil 5 + Sellout (11) = 22 --- */
{
  const s = etatDebloque();
  assert.equal(macguffinSlotCountV1(s), 1, "1 slot au déblocage.");
  s.bonuses.expShop = { macguffinSlot1: 1, macguffinSlot2: 1 };
  s.systems.perks.data.levels = { 66: 1, 67: 1, 88: 1 };
  s.systems.quirks.data = { levels: { 19: 1, 50: 1 } };
  s.adventure.completedSets.edgy = true;
  s.challenge.completionsTier.difficile.troll = 2;
  s.challenge.completionsTier.difficile.noEquipment = 5;
  s.selloutShop.purchases.macguffinSlot = 11;
  assert.equal(macguffinSlotCountV1(s), 22, "22 slots au maximum.");
  s.challenge.completionsTier.difficile.troll = 1;
  s.challenge.completionsTier.difficile.noEquipment = 4;
  assert.equal(macguffinSlotCountV1(s), 20, "Troll Evil : 2e complétion ; No Equipment Evil : 5e.");
}

/* --- EXP shop : 10 M puis 100 M EXP --- */
{
  let s = etatDebloque();
  s.currencies.experience = 110_000_000;
  s = applyIdleNguAction(s, { action: "buyExpShop", item: "macguffinSlot1" }, ctx, T0).state;
  assert.equal(s.currencies.experience, 100_000_000);
  s = applyIdleNguAction(s, { action: "buyExpShop", item: "macguffinSlot2" }, ctx, T0).state;
  assert.equal(s.currencies.experience, 0);
  assert.equal(macguffinSlotCountV1(s), 3);
}

/* --- Sellout : slot achetable, Muffin armé --- */
{
  assert.ok(IDLE_SELLOUT_EFFECTS_V1.macguffinSlot && IDLE_SELLOUT_EFFECTS_V1.macguffinMuffin);
  const s = etatDebloque();
  s.currencies.ap = 150_000;
  idleSelloutShopBuyV1(s, "macguffinSlot");
  assert.equal(s.currencies.ap, 50_000, "Premier slot : 100 000 AP.");
  assert.equal(macguffinSlotCountV1(s), 2);
  idleSelloutShopBuyV1(s, "macguffinMuffin");
  assert.equal(s.currencies.ap, 0, "Muffin : 50 000 AP.");
  assert.equal(s.selloutEffects.remaining.macguffinMuffin, 86400);
  assert.equal(s.selloutEffects.armed.macguffinMuffin, true);
}

/* --- Niveau de base des drops --- */
{
  const s = etatDebloque();
  assert.equal(macguffinDropLevelV1(s), 0);
  s.systems.perks.data.levels = { 65: 1 };
  s.systems.wishes.data.tracks["2"].level = 5;
  s.adventure.completedSets.greasynerd = true;
  assert.equal(macguffinDropLevelV1(s), 7, "Perk 65 + souhait 2 (5 niveaux) + Greasy Nerd set.");
  const drops = macguffinOnZoneKillsV1(s, "sewers", 1000);
  assert.equal(drops.length, 1);
  assert.equal(drops[0].level, 7);
}

/* --- Compteur de zone : 1 000 kills, remis à zéro en changeant de zone, Stat verrouillé sans Choco --- */
{
  const s = etatDebloque();
  assert.equal(macguffinOnZoneKillsV1(s, "sewers", 999).length, 0);
  const d = macguffinOnZoneKillsV1(s, "sewers", 1);
  assert.equal(d.length, 1);
  assert.equal(d[0].type, "energyPower");
  assert.equal(s.systems.macguffins.data.zoneCounter.kills, 0);
  macguffinOnZoneKillsV1(s, "sewers", 600);
  macguffinOnZoneKillsV1(s, "forest", 500);
  assert.deepEqual(s.systems.macguffins.data.zoneCounter, { zone: "forest", kills: 500 }, "Quitter la zone remet le compteur à zéro.");
  assert.equal(macguffinOnZoneKillsV1(s, "chocolate", 5000).length, 0, "Stat : Choco set requis.");
  s.adventure.completedSets.choco = true;
  const choco = macguffinOnZoneKillsV1(s, "chocolate", 1800);
  assert.equal(choco.length, 2, "Choco set : 900 kills par fragment.");
  assert.equal(choco[0].type, "stat");
  assert.equal(s.systems.macguffins.data.sourceDropped.stat, true);
  assert.equal(macguffinOnZoneKillsV1(s, "tutorial", 5000).length, 0, "Pas de fragment dans le Tutoriel.");
}

/* --- Bout en bout : un vrai kill de zone passe par applyIdleNguAction --- */
{
  let s = etatDebloque();
  s.adventure.selectedZone = "sewers";
  s.systems.macguffins.data.zoneCounter = { zone: "sewers", kills: 999 };
  const r = applyIdleNguAction(s, { action: "adventure", adventure: { action: "zoneKill" } }, ctx, T0);
  s = r.state;
  assert.equal(s.systems.macguffins.data.inventory.length, 1, "Le 1000e kill des Égouts donne le fragment Energy Power.");
  assert.equal(s.systems.macguffins.data.inventory[0].type, "energyPower");
  assert.equal(r.result.macguffinDrops.length, 1);
  s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "selectZone", zone: "forest" } }, ctx, T0).state;
  assert.deepEqual(s.systems.macguffins.data.zoneCounter, { zone: "forest", kills: 0 });
}

/* --- ITOPOD : perk 68, 5 000 kills, compteur persistant, pool aléatoire --- */
{
  const s = etatDebloque();
  assert.equal(macguffinOnItopodKillsV1(s, 10000).length, 0, "Sans la perk 68 : rien.");
  s.systems.perks.data.levels = { 68: 1 };
  const d = macguffinOnItopodKillsV1(s, 12000, () => 0);
  assert.equal(d.length, 2);
  assert.equal(s.systems.macguffins.data.itopodKills, 2000);
  assert.ok(d.every(f => macguffinRandomPoolV1(s).includes(f.type)));
  s.systems.perks.data.levels = { 68: 1, 69: 1, 70: 1, 71: 1 };
  assert.equal(macguffinOnItopodKillsV1(s, 250).length, 1, "2 000 + 250 = 2 250 kills avec les perks 69-71.");
}
/* ... et le tick de l'ITOPOD alimente bien ce compteur. */
{
  let s = etatDebloque();
  s.systems.perks.data.levels = { 68: 1 };
  s.systems.tower.unlocked = true;
  s.systems.tower.active = true;
  s.systems.tower.data = { kills: 0 };
  s.systems.macguffins.data.itopodKills = 4999;
  s = advanceIdleNguState(s, 3600, ctx, T0 + 3600 * 1000);
  const tuees = s.systems.tower.data.kills;
  assert.ok(tuees >= 1, "L'ITOPOD doit tuer au moins un ennemi en une heure.");
  assert.equal(s.systems.macguffins.data.inventory.length, 1, "Le 5000e kill ITOPOD donne un fragment.");
  assert.equal(s.systems.macguffins.data.itopodKills, 4999 + tuees - 5000);
}

/* --- Titans --- */
{
  const s = etatDebloque();
  assert.ok(!macguffinRandomPoolV1(s).includes("adventure"));
  const nerd = macguffinOnTitanKillV1(s, "nerd", "easy", 1, () => 0);
  assert.deepEqual(nerd.map(f => f.type), ["adventure", "energyCap"], "Greasy Nerd : Adventure + un aléatoire.");
  assert.ok(macguffinRandomPoolV1(s).includes("adventure"), "Adventure rejoint le tirage aléatoire une fois tombé.");
  const easy = macguffinOnTitanKillV1(s, "godmother", "easy", 1, () => 0);
  assert.deepEqual(easy.map(f => f.type), ["energyCap", "r3Power"]);
  const hard = macguffinOnTitanKillV1(s, "godmother", "hard", 1, () => 0);
  assert.deepEqual(hard.map(f => f.type), ["energyCap", "r3Power", "r3Cap", "r3Bar"]);
  const rate = macguffinOnTitanKillV1(s, "godmother", "brutal", 1, () => 0.999999);
  assert.equal(rate.length, 1, "Tirages R3 ratés : seul l'aléatoire garanti tombe.");
  assert.equal(macguffinOnTitanKillV1(s, "t6", "easy", 1, () => 0).length, 0, "The Beast ne donne pas de MacGuffin.");
  for (const id of ["t7", "hungers", "lobster", "amalgamate"]) assert.equal(macguffinOnTitanKillV1(s, id, "easy", 1, () => 0).length, 1, id);
}

/* --- Actions : équiper, un seul par type, slots, fusion, fusion totale --- */
{
  let s = etatDebloque();
  const a = fragment(s, "energyPower", 3, false);
  const b = fragment(s, "energyPower", 4, false);
  const c = fragment(s, "magicPower", 0, false);
  s = applyIdleNguAction(s, { action: "macguffin", op: "equip", uid: a.uid }, ctx, T0).state;
  assert.equal(s.systems.macguffins.data.equipped[0].uid, a.uid);
  assert.throws(() => applyIdleNguAction(s, { action: "macguffin", op: "equip", uid: c.uid }, ctx, T0), /MACGUFFIN_SLOTS_PLEINS/);
  s.systems.perks.data.levels = { 66: 1 };
  assert.throws(() => applyIdleNguAction(s, { action: "macguffin", op: "equip", uid: b.uid }, ctx, T0), /MACGUFFIN_TYPE_DEJA_EQUIPE/);
  s = applyIdleNguAction(s, { action: "macguffin", op: "merge", target: b.uid, source: a.uid }, ctx, T0).state;
  const eq = s.systems.macguffins.data.equipped;
  assert.equal(eq.length, 1);
  assert.equal(eq[0].uid, a.uid, "La fusion garde la copie équipée.");
  assert.equal(eq[0].level, 8, "3 + 4 + 1.");
  assert.throws(() => applyIdleNguAction(s, { action: "macguffin", op: "merge", target: a.uid, source: c.uid }, ctx, T0), /MACGUFFIN_TYPES_DIFFERENTS/);
  fragment(s, "energyPower", 0, false);
  fragment(s, "energyPower", 1, false);
  const r = applyIdleNguAction(s, { action: "macguffin", op: "mergeAll", type: "energyPower" }, ctx, T0);
  assert.equal(r.result.level, 8 + 0 + 1 + 1 + 1, "Fusion de toutes les copies dans l'équipée.");
  s = applyIdleNguAction(r.state, { action: "macguffin", op: "unequip", uid: a.uid }, ctx, T0).state;
  assert.equal(s.systems.macguffins.data.equipped.length, 0);
  assert.equal(s.systems.macguffins.data.inventory.length, 2);
}

/* --- Rebirth : bonus permanent, Muffin, Troll Sadistic 2 --- */
{
  let s = etatDebloque();
  fragment(s, "energyPower", 0, true);
  s.runStartedAt = T0;
  s = rebirthIdleNguState(s, ctx, T0 + 1800 * 1000);
  proche(s.systems.macguffins.data.permanent.energyPower, 0.001, 1e-12, "30 min, L=0 : +0,001 %");
  assert.equal(s.rebirth.macguffinGain.ratio, 1);
  /* Muffin acheté puis 25 h sans Rebirth : s'applique quand même une fois. */
  s.selloutEffects.armed = { macguffinMuffin: true };
  s = rebirthIdleNguState(s, ctx, T0 + 1800 * 1000 + 1800 * 1000);
  proche(s.systems.macguffins.data.permanent.energyPower, 0.003, 1e-12, "Muffin : gain doublé");
  assert.equal(Boolean(s.selloutEffects.armed.macguffinMuffin), false, "Muffin consommé.");
  s = rebirthIdleNguState(s, ctx, T0 + 3 * 1800 * 1000);
  proche(s.systems.macguffins.data.permanent.energyPower, 0.004, 1e-12, "Après consommation : gain normal");
  /* 2e Troll Challenge Sadistic : 24 h -> T = 48. */
  s.challenge.completionsTier.extreme.troll = 2;
  const avant = s.systems.macguffins.data.permanent.energyPower;
  s = rebirthIdleNguState(s, ctx, T0 + 3 * 1800 * 1000 + 86400 * 1000);
  proche(s.systems.macguffins.data.permanent.energyPower - avant, 0.048, 1e-9, "T = 48 à 24 h");
  /* Rien d'équipé : aucun gain. */
  s.systems.macguffins.data.equipped = [];
  const fige = s.systems.macguffins.data.permanent.energyPower;
  s = rebirthIdleNguState(s, ctx, T0 + 3 * 1800 * 1000 + 2 * 86400 * 1000);
  assert.equal(s.systems.macguffins.data.permanent.energyPower, fige);
}

/* --- Branchement dans idleNguBonuses et les autres consommateurs --- */
{
  const base = etatDebloque();
  const avec = etatDebloque(s => {
    s.systems.macguffins.data.permanent = {
      energyPower: 50, magicPower: 20, energyCap: 30, magicCap: 40, energyBar: 10, magicBar: 60,
      dropChance: 100, stat: 25, adventure: 400, r3Power: 5, r3Cap: 6, r3Bar: 7, golden: 999, sexy: 999, smart: 999
    };
  });
  const b0 = idleNguBonuses(base);
  const b1 = idleNguBonuses(avec);
  const ratio = k => b1[k] / b0[k];
  proche(ratio("energyPowerMultiplier"), 1.5, 1e-9, "Energy Power");
  proche(ratio("magicPowerMultiplier"), 1.2, 1e-9, "Magic Power");
  proche(ratio("energyCapMultiplier"), 1.3, 1e-9, "Energy Cap");
  proche(ratio("magicCapMultiplier"), 1.4, 1e-9, "Magic Cap");
  proche(ratio("energyBarsMultiplier"), 1.1, 1e-9, "Energy Bars");
  proche(ratio("magicBarsMultiplier"), 1.6, 1e-9, "Magic Bars");
  proche(ratio("dropMultiplier"), 2, 1e-9, "Drop Chance");
  proche(ratio("attackMultiplier"), 1.25, 1e-9, "Stat -> Attack");
  proche(ratio("defenseMultiplier"), 1.25, 1e-9, "Stat -> Defense");
  proche(ratio("adventureMultiplier"), 5, 1e-9, "Adventure");
  proche(ratio("adventurePowerMultiplier"), 5, 1e-9, "Adventure Power");
  proche(ratio("adventureToughnessMultiplier"), 5, 1e-9, "Adventure Toughness");
  proche(ratio("r3PowerMultiplier"), 1.05, 1e-9, "R3 Power");
  proche(ratio("r3CapMultiplier"), 1.06, 1e-9, "R3 Cap");
  proche(ratio("r3BarsMultiplier"), 1.07, 1e-9, "R3 Bars");
  proche(ratio("xpMultiplier"), 1, 1e-12, "Golden/SEXY/SMART : aucun autre effet");
  proche(ratio("adventureGoldMultiplier"), 1, 1e-12, "Golden non branché (cible non documentée)");
  /* Consommateur réel : la stat effective de ressource. */
  base.resources.energy.power = 10;
  avec.resources.energy.power = 10;
  proche(idleNguEffectiveResourceStat(avec, "energy", "power") / idleNguEffectiveResourceStat(base, "energy", "power"), 1.5, 1e-9, "Energy Power effective");
}

/* NUMBER : facteur du prochain NUMBER. */
{
  const s = etatDebloque(x => { x.systems.macguffins.data.permanent = { number: 300 }; });
  const r = applyIdleNguAction(s, { action: "toggle", system: "macguffins", active: false }, ctx, T0 + 1000).state;
  proche(r.rebirth.preview.macguffinNumberBonus, 4, 1e-9, "NUMBER +300 % -> x4");
}

/* NGU : vitesse Energy / Magic. */
{
  const avec = etatDebloque(x => { x.systems.macguffins.data.permanent = { energyNgu: 100, magicNgu: 50 }; });
  const sans = etatDebloque();
  const v1 = idleNguSnapshot(avec, ctx, T0).ngus.speedMultiplier;
  const v0 = idleNguSnapshot(sans, ctx, T0).ngus.speedMultiplier;
  proche(v1.energy / v0.energy, 2, 1e-9, "Energy NGU");
  proche(v1.magic / v0.magic, 1.5, 1e-9, "Magic NGU");
}

/* Augments : temps par niveau divisé. */
{
  const prep = x => {
    x.systems.augmentations.unlocked = true;
    x.systems.augmentations.data.pairs.scissors.energy = 1000;
  };
  const sans = etatDebloque(prep);
  const avec = etatDebloque(x => { prep(x); x.systems.macguffins.data.permanent = { augment: 100 }; });
  const t0 = idleNguSnapshot(sans, ctx, T0).augmentations[0].secondsPerLevel;
  const t1 = idleNguSnapshot(avec, ctx, T0).augmentations[0].secondsPerLevel;
  proche(t0 / t1, 2, 1e-9, "Augment Speed");
}

/* Wandoos : vitesse des Dumps Energy / Magic. */
{
  const prep = x => {
    x.runStartedAt = T0 - 10 * 3600 * 1000;
    x.systems.wandoos.unlocked = true;
    x.systems.wandoos.allocation.energy = 1e6;
    x.systems.wandoos.allocation.magic = 1e6;
  };
  const sans = advanceIdleNguState(etatDebloque(prep), 10, ctx, T0 + 10000);
  const avec = advanceIdleNguState(etatDebloque(x => { prep(x); x.systems.macguffins.data.permanent = { energyWandoos: 100, magicWandoos: 300 }; }), 10, ctx, T0 + 10000);
  const e = s => s.systems.wandoos.data.dumpEnergyLevel + s.systems.wandoos.data.dumpEnergyProgress;
  const m = s => s.systems.wandoos.data.dumpMagicLevel + s.systems.wandoos.data.dumpMagicProgress;
  assert.ok(e(sans) > 0);
  proche(e(avec) / e(sans), 2, 1e-9, "Energy Wandoos");
  proche(m(avec) / m(sans), 4, 1e-9, "Magic Wandoos");
}

/* Blood : gain des rituels. */
{
  const prep = x => {
    x.difficulty = "normal"; /* le calcul du sang dépend de la difficulté : ce test mesure le MacGuffin en Normal */
    x.systems.bloodMagic.unlocked = true;
    x.systems.bloodMagic.allocation.magic = 1e9;
    x.currencies.gold = 1e12;
  };
  const sans = advanceIdleNguState(etatDebloque(prep), 60, ctx, T0 + 60000);
  const avec = advanceIdleNguState(etatDebloque(x => { prep(x); x.systems.macguffins.data.permanent = { blood: 100 }; }), 60, ctx, T0 + 60000);
  assert.ok(sans.currencies.blood > 0);
  proche(avec.currencies.blood / sans.currencies.blood, 2, 1e-9, "Blood gain");
}

/* --- Sorts Blood MacGuffin α / β --- */
{
  let s = etatDebloque();
  const f1 = fragment(s, "energyPower", 0, true);
  s.systems.perks.data.levels = { 66: 1 };
  const f2 = fragment(s, "magicPower", 0, true);
  s.currencies.blood = 1e10;
  assert.throws(() => applyIdleNguAction(s, { action: "macguffin", op: "bloodAlpha" }, ctx, T0), /SORT_MACGUFFIN_VERROUILLE/);
  s.systems.perks.data.levels = { 66: 1, 72: 1, 73: 1 };
  s.systems.wishes.data.tracks["24"].level = 1;
  let r = applyIdleNguAction(s, { action: "macguffin", op: "bloodAlpha" }, ctx, T0);
  s = r.state;
  assert.equal(r.result.levels, 2, "1e10 Blood : +2 niveaux.");
  assert.equal(s.systems.macguffins.data.equipped[0].level, 2, "Souhait 24 : premier slot.");
  assert.equal(s.systems.macguffins.data.equipped[1].level, 0);
  assert.equal(s.currencies.blood, 0, "Tout le Blood est consommé.");
  s.currencies.blood = 1e10;
  assert.throws(() => applyIdleNguAction(s, { action: "macguffin", op: "bloodAlpha" }, ctx, T0 + 1000), /SORT_EN_RECHARGE/);
  s.currencies.blood = 4e8;
  r = applyIdleNguAction(s, { action: "macguffin", op: "bloodBeta" }, ctx, T0 + 1000);
  assert.equal(r.result.levels, 3, "4e8 Blood : +3 niveaux (β).");
  assert.deepEqual(r.state.systems.macguffins.data.equipped.map(f => f.level), [5, 3], "β : tous les slots.");
  assert.ok(f1 && f2);
}

/* --- Fruits of MacGuffin (Yggdrasil) --- */
{
  let s = etatDebloque();
  fragment(s, "energyPower", 0, true);
  s.systems.yggdrasil.unlocked = true;
  const fruit = s.systems.yggdrasil.data.fruits.macguffinAlpha;
  assert.ok(fruit, "Le Fruit of MacGuffin α existe dans Yggdrasil.");
  assert.ok(s.systems.yggdrasil.data.fruits.macguffinBeta, "Le Fruit of MacGuffin β existe dans Yggdrasil.");
  fruit.tier = 10;
  fruit.active = true;
  fruit.growthHours = 10;
  const r = applyIdleNguAction(s, { action: "useYggFruit", fruit: "macguffinAlpha", mode: "eat" }, ctx, T0);
  assert.equal(r.result.macguffinLevels, 16, "Tier 10 : ⌈32 x 0.5⌉ = 16 niveaux.");
  assert.equal(r.state.systems.macguffins.data.equipped[0].level, 16);
}

/* --- Snapshot client --- */
{
  const s = etatDebloque();
  fragment(s, "energyPower", 0, true);
  const snap = idleNguSnapshot(s, ctx, T0 + 1800 * 1000).macguffins;
  assert.equal(snap.unlocked, true);
  assert.equal(snap.slots, 1);
  assert.equal(snap.types.length, 22);
  assert.equal(snap.zoneCounter.required, 1000);
  assert.equal(snap.itopod.required, 5000);
  proche(snap.equipped[0].nextGainPct, 0.001, 1e-12, "Aperçu du gain au prochain Rebirth (30 min)");
}

console.log("idle-macguffins-wiring ok");
