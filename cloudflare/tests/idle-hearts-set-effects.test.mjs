import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  advanceIdleNguState,
  applyIdleNguAction,
  idleNguBonuses
} from "../src/idle-ngu-progression.js";
import { applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";
import { idleSelloutPotionFactorV1 } from "../src/idle-sellout-shop-v1.js";
import { idleQuestRewardV1 } from "../src/idle-questing-v1.js";
import { macguffinZoneKillsRequiredV1, macguffinItopodKillsRequiredV1 } from "../src/idle-macguffins-v1.js";
import { idleCardsModifiersV1 } from "../src/idle-cards-v1.js";

/*
 * Bonus de complétion des cœurs ("When this heart reaches 100, ...", section
 * Items du 4G's Sellout Shop ; pages "<X> Heart (set)"). Chaque test compare un
 * état témoin (cœur niveau 99) et un état au niveau 100.
 */
const near = (a, b, msg, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${msg} (obtenu ${a}, attendu ${b})`);
const ajouter = (s, definitionId, level = 100, now = 1) =>
  applyIdleNguAction(s, { action: "adventure", adventure: { action: "addItem", definitionId, level } }, {}, now).state;
const avecCoeur = (id, level = 100) => ajouter(normalizeIdleNguState({}, {}, 0), id, level);

// Tous les sets complétés au niveau 100, jamais au niveau 99.
for (const id of ["heartRed", "heartYellow", "heartBrown", "heartGreen", "heartBlue", "heartPurple", "heartOrange", "heartGrey", "heartPink", "heartRainbow"]) {
  assert.equal(avecCoeur(id, 99).adventure.completedSets[id], undefined, `${id} niveau 99 : pas de set`);
  assert.equal(avecCoeur(id, 100).adventure.completedSets[id], true, `${id} niveau 100 : set complété`);
}

// ---------- Red : "+10% EXP" même non équipé ; équipé seul : 2,5 % (Base value) ; jamais cumulés ----------
{
  const temoin = idleNguBonuses(avecCoeur("heartRed", 99)).xpMultiplier;
  const set = avecCoeur("heartRed", 100);
  near(idleNguBonuses(set).xpMultiplier / temoin, 1.10, "Red Heart (set) : EXP x1,10");
  const equipe = avecCoeur("heartRed", 0);
  const coeur = equipe.adventure.inventory.find((x) => x.definitionId === "heartRed");
  equipe.adventure = applyIdleAdventureActionV47(equipe.adventure, { action: "equip", id: coeur.id, slot: "accessory" }, {}).state;
  near(idleNguBonuses(equipe).xpMultiplier / temoin, 1.025, "Red Heart équipé niveau 0 : EXP +2,5 %");
  const lesDeux = avecCoeur("heartRed", 100);
  const c2 = lesDeux.adventure.inventory.find((x) => x.definitionId === "heartRed");
  lesDeux.adventure = applyIdleAdventureActionV47(lesDeux.adventure, { action: "equip", id: c2.id, slot: "accessory" }, {}).state;
  near(idleNguBonuses(lesDeux).xpMultiplier / temoin, 1.10, "équipé + set : le max (10 %), pas la somme");
}

// ---------- Yellow : "+20% AP" (ex. 30 000 AP du Flubber (set) -> 36 000) ----------
{
  const apFlubber = (s) => {
    const avant = s.currencies.ap;
    s = ajouter(s, "tripleFlubber", 100);
    assert.equal(s.adventure.completedSets.flubber, true);
    return s.currencies.ap - avant;
  };
  assert.equal(apFlubber(normalizeIdleNguState({}, {}, 0)), 30000, "Flubber (set) : 30 000 AP");
  near(apFlubber(avecCoeur("heartYellow", 100)), 36000, "avec Yellow Heart (set) : x1,20");
}

// ---------- Green : "+20% PP progress in the ITOPOD" ----------
{
  const tourUnKill = (s, pills = 0) => {
    s.difficulty = "normal";
    s.systems.tower = { unlocked: true, active: true, data: { floor: 0, killProgress: 0, kills: 0, ppProgress: 0 } };
    s.selloutEffects = Object.assign({}, s.selloutEffects, { bluePills: pills });
    return advanceIdleNguState(s, 6, { adventurePower: 1e6, adventureToughness: 1e6, bosses: 30 }, Date.now()).systems.tower.data.ppProgress;
  };
  const temoin = tourUnKill(avecCoeur("heartGreen", 99));
  assert.ok(temoin > 0);
  near(tourUnKill(avecCoeur("heartGreen", 100)) / temoin, 1.2, "Green Heart (set) : PP x1,20");

  // ---------- Blue : Little Blue Pill x2 -> x2,2 ----------
  const pilule = tourUnKill(avecCoeur("heartBlue", 99), 1000);
  near(pilule / temoin, 2, "Little Blue Pill : x2");
  near(tourUnKill(avecCoeur("heartBlue", 100), 1000) / temoin, 2.2, "Blue Heart (set) : pilule x2,2");
}

// ---------- Blue : potions, Lucky Charm, Beast Butter x1,1 ----------
{
  const fx = { remaining: { energyPower: 60, luck: 60, r3Power: 60 }, beta: { energyPower: true }, bluePills: 0 };
  const temoin = Object.assign(avecCoeur("heartBlue", 99), { selloutEffects: fx });
  const blue = Object.assign(avecCoeur("heartBlue", 100), { selloutEffects: fx });
  assert.equal(idleSelloutPotionFactorV1(temoin, "energyPower"), 4, "α x2 et β x2");
  near(idleSelloutPotionFactorV1(blue, "energyPower"), 2.2 * 2.2, "α x2,2 et β x2,2");
  near(idleSelloutPotionFactorV1(blue, "luck"), 2.2, "Lucky Charm x2,2");
  near(idleSelloutPotionFactorV1(blue, "r3Power"), 3.3, "Resource 3 Potion α x3,3");
  const beurre = (s) => idleQuestRewardV1(s, {}, { major: true, usedIdle: true, butter: true }).qp;
  assert.equal(beurre(temoin), 100, "Major idle : 50 QP x2 (Beast Butter)");
  assert.equal(beurre(blue), 110, "x2,2 avec le Blue Heart (set)");
}

// ---------- Purple : MacGuffins -20 % de kills (1 000 -> 800 en zone, 5 000 -> 4 000 à l'ITOPOD) ----------
{
  assert.equal(macguffinZoneKillsRequiredV1(avecCoeur("heartPurple", 99)), 1000);
  assert.equal(macguffinZoneKillsRequiredV1(avecCoeur("heartPurple", 100)), 800);
  assert.equal(macguffinItopodKillsRequiredV1(avecCoeur("heartPurple", 100)), 4000);
}

// ---------- Orange : "Quests give 20% more QP!" ----------
{
  const qp = (s) => idleQuestRewardV1(s, {}, { major: true, usedIdle: true, butter: false }).qp;
  assert.equal(qp(avecCoeur("heartOrange", 99)), 50);
  assert.equal(qp(avecCoeur("heartOrange", 100)), 60, "50 x 1,2");
}

// ---------- Grey : "25% Faster Hacks!" ----------
{
  const temoin = idleNguBonuses(avecCoeur("heartGrey", 99)).hackSpeedMultiplier;
  near(idleNguBonuses(avecCoeur("heartGrey", 100)).hackSpeedMultiplier / temoin, 1.25, "Grey Heart (set) : Hacks x1,25");
}

// ---------- Rainbow : "+10% Mayo and Card Generation Speed!" ----------
{
  const a = idleCardsModifiersV1(avecCoeur("heartRainbow", 99));
  const b = idleCardsModifiersV1(avecCoeur("heartRainbow", 100));
  near(b.cardSpeed / a.cardSpeed, 1.1, "cartes x1,10");
  near(b.mayoSpeed / a.mayoSpeed, 1.1, "mayo x1,10");
}

// ---------- Brown / Pink : sets complétés, aucun effet inventé (pas de Poop ni de slot de souhait) ----------
{
  for (const id of ["heartBrown", "heartPink"]) {
    const a = avecCoeur(id, 99).adventure.setRewards;
    const b = avecCoeur(id, 100).adventure.setRewards;
    assert.deepEqual(b, a, `${id} : setRewards inchangés`);
  }
}

console.log("idle-hearts-set-effects: OK");
