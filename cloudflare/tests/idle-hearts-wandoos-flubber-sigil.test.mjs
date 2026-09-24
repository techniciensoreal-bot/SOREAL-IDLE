import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_SPECIALS,
  IDLE_ADVENTURE_WIKI_ITEM_IDS_V1,
  IDLE_ADVENTURE_ITEM_SETS_V1,
  IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2,
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47
} from "../src/idle-adventure-v47.js";
import { normalizeIdleNguState, advanceIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { idleQuestDropMultiplierV1 } from "../src/idle-questing-v1.js";
import { idleCardsModifiersV1 } from "../src/idle-cards-v1.js";

/*
 * Wandoos XL, The Triple Flubber, Heroic Sigil et A Still-Beating Heart
 * (miroir NGU-Wiki : fiches des objets, pages "Wandoos", "Walderp",
 * "Badly Drawn World", "Boring-Ass Earth", "The Beast", "The Exile", sets
 * "Wandoos XL (set)", "Flubber (set)", "Heroic Sigil (set)", "Still-Beating
 * Heart (set)").
 */
const near = (a, b, msg, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${msg} (obtenu ${a}, attendu ${b})`);
const S = IDLE_ADVENTURE_SPECIALS;
const ajouter = (s, definitionId, level, now = 1) =>
  applyIdleNguAction(s, { action: "adventure", adventure: { action: "addItem", definitionId, level } }, {}, now).state;

// ---------- Définitions ----------
assert.deepEqual(
  ["wandoosXl", "tripleFlubber", "heroicSigil", "stillBeatingHeart"].map((id) => IDLE_ADVENTURE_WIKI_ITEM_IDS_V1[id]),
  [163, 121, 292, 391]
);
assert.deepEqual([S.tripleFlubber.sType, S.tripleFlubber.sBase, S.tripleFlubber.sMax], ["respawnReductionPct", 2, 4], "Respawn 2/4/8 %");
assert.deepEqual(IDLE_ADVENTURE_ITEM_SETS_V1.flubber.reward, { ap: 30000 });
assert.deepEqual(IDLE_ADVENTURE_ITEM_SETS_V1.wandoosXl.reward, { wandoosBootReductionPct: 0.1 });
assert.deepEqual(IDLE_ADVENTURE_ITEM_SETS_V1.heroicSigil.reward, { questDropsSetPct: 0.1 });
assert.deepEqual(IDLE_ADVENTURE_ITEM_SETS_V1.stillBeatingHeart.reward, { cardTagEffect: 0.01 });

// Butin : Badly Drawn World lvl 3 (0,005 %, max 1 %), Boring-Ass Earth lvl 8 (0,003 %, max 1 %).
{
  const P = IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2;
  const ligne = (zone) => P[zone].boss.specials.find((d) => d.id === "wandoosXl");
  assert.deepEqual(ligne("badly"), { id: "wandoosXl", chance: 0.00005, cap: 0.01, level: 3 });
  assert.deepEqual(ligne("boring"), { id: "wandoosXl", chance: 0.00003, cap: 0.01, level: 8 });
}

// Titans : Walderp (Wandoos XL lvl 20, 0,5 %), The Beast (Heroic Sigil lvl 4, garanti), The Exile (A Still-Beating Heart lvl 4, garanti).
function titan(id, aleatoire, difficulty = "easy") {
  const s = normalizeIdleAdventureStateV47({});
  s.bonusSlots = { inventory: 100 };
  s.titans[id] = id === "t5" ? { kills: 4, nextAt: 0, hiddenPanel: "" } : { kills: 1, nextAt: 0 };
  s.unlockFlags.ringOfApathyMaxed = true;
  const original = Math.random;
  Math.random = () => aleatoire;
  try {
    return applyIdleAdventureActionV47(s, { action: "titan", titan: id, difficulty }, { bosses: 400, difficulty: "extreme", stats: { power: 1e60, toughness: 1e60 } }, 1000).result.drops;
  } finally {
    Math.random = original;
  }
}
{
  const xl = titan("t5", 0).find((d) => d.definitionId === "wandoosXl");
  assert.ok(xl && xl.level === 20, "Walderp : Wandoos XL lvl 20");
  assert.ok(!titan("t5", 0.99).some((d) => d.definitionId === "wandoosXl"), "Walderp : 0,5 % seulement");
  const sigil = titan("t6", 0.99).find((d) => d.definitionId === "heroicSigil");
  assert.ok(sigil && sigil.level === 4, "The Beast : Heroic Sigil lvl 4 garanti");
  const coeur = titan("t7", 0.99).find((d) => d.definitionId === "stillBeatingHeart");
  assert.ok(coeur && coeur.level === 4, "The Exile : A Still-Beating Heart lvl 4 garanti");
}

// ---------- The Lonely Flubber niveau 100 -> The Triple Flubber ; Flubber (set) : 30 000 AP ----------
{
  let a = normalizeIdleAdventureStateV47({});
  a = applyIdleAdventureActionV47(a, { action: "addItem", definitionId: "flubber", level: 99 }, {}).state;
  const f99 = a.inventory.find((x) => x.definitionId === "flubber");
  assert.throws(() => applyIdleAdventureActionV47(a, { action: "transformAdventureItem", id: f99.id }, {}), /OBJET_NON_MAXE/);

  let s = normalizeIdleNguState({}, {}, 0);
  s = ajouter(s, "flubber", 100);
  const f = s.adventure.inventory.find((x) => x.definitionId === "flubber");
  s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "transformAdventureItem", id: f.id } }, {}, 2).state;
  assert.ok(!s.adventure.inventory.some((x) => x.definitionId === "flubber"), "la Lonely Flubber est consommée");
  const triple = s.adventure.inventory.find((x) => x.definitionId === "tripleFlubber");
  assert.ok(triple && triple.level === 0 && triple.special === 2, "Triple Flubber niveau 0, Respawn 2 %");
  const ap = s.currencies.ap;
  s = ajouter(s, "tripleFlubber", 100, 3);
  assert.equal(s.adventure.completedSets.flubber, true);
  assert.equal(s.currencies.ap - ap, 30000, "Flubber (set) : 30 000 AP");
}

// ---------- Heroic Sigil (set) : Quest Drops x1,1 ; Still-Beating Heart (set) : +1 % d'effet de tag ----------
{
  let s = normalizeIdleNguState({}, {}, 0);
  s = ajouter(s, "heroicSigil", 100);
  assert.equal(s.adventure.completedSets.heroicSigil, true);
  near(s.adventure.setRewards.questDropsSetPct, 0.1, "setRewards");
  near(idleQuestDropMultiplierV1({ questDropsPct: 0 }, { gearQuestDropsPct: 0, questDropsSetPct: 0.1 }), 1.1, "Quest Drops x1,1");
  let c = normalizeIdleNguState({}, {}, 0);
  const avant = idleCardsModifiersV1(c).tagEffect;
  c = ajouter(c, "stillBeatingHeart", 100);
  near(idleCardsModifiersV1(c).tagEffect - avant, 0.01, "Tag Effect +1 %");
}

// ---------- Wandoos : copies consommées -> niveaux d'OS ; déblocage et set de Wandoos XL ----------
{
  const context = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };
  const now = 100_000_000;
  let s = normalizeIdleNguState({}, context, now);
  s.adventure.unlockFlags.wandoos = true;
  s = normalizeIdleNguState(s, context, now);
  assert.equal(s.systems.wandoos.unlocked, true);

  // Wandoos 98 : "Upgrading costs a number of levels equal to the new Wandoos OS Level".
  s = ajouter(s, "wandoos98", 5, now);
  const copie = () => s.adventure.inventory.find((x) => x.definitionId === "wandoos98");
  const consommer = (id) => applyIdleNguAction(s, { action: "consumeWandoosCopy", itemId: id }, context, now);
  let r = consommer(copie().id);
  s = r.state;
  assert.equal(s.systems.wandoos.data.osLevels.consumed98, 1);
  assert.equal(copie().level, 4, "niveau 0 -> 1 : coûte 1 niveau, la copie garde le surplus");
  s = consommer(copie().id).state;
  assert.equal(s.systems.wandoos.data.osLevels.consumed98, 2);
  assert.equal(copie().level, 2, "niveau 1 -> 2 : coûte 2");
  assert.throws(() => consommer(copie().id), /NIVEAU_COPIE_INSUFFISANT/, "niveau 2 -> 3 : il faut une copie niveau 3+");

  // Wandoos XL : verrouillé tant qu'aucune copie n'a été consommée.
  assert.throws(() => applyIdleNguAction(s, { action: "selectWandoosOs", os: "xl" }, context, now), /OS_VERROUILLE/);
  s = ajouter(s, "wandoosXl", 20, now);
  const xl = () => s.adventure.inventory.find((x) => x.definitionId === "wandoosXl");
  s = consommer(xl().id).state;
  assert.equal(s.adventure.unlockFlags.wandoosXl, true, "1re copie : Wandoos XL débloqué");
  assert.equal(xl(), undefined, "la copie de déblocage est détruite");
  assert.equal(s.systems.wandoos.data.osLevels.consumedXl, 0);
  s = applyIdleNguAction(s, { action: "selectWandoosOs", os: "xl" }, context, now).state;
  assert.equal(s.systems.wandoos.data.os, "xl");
  s = ajouter(s, "wandoosXl", 20, now);
  s = consommer(xl().id).state;
  assert.equal(s.systems.wandoos.data.osLevels.consumedXl, 1, "copies suivantes : niveaux d'OS XL");
  assert.equal(xl().level, 19);
}

// ---------- Wandoos XL (set) : boot 10 % plus rapide (60 min -> 54 min) ----------
{
  const context = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };
  const now = 100_000_000;
  const dump = (avecSet) => {
    let s = normalizeIdleNguState({}, context, now);
    s.adventure.unlockFlags.wandoos = true;
    s = normalizeIdleNguState(s, context, now);
    if (avecSet) {
      s = ajouter(s, "wandoosXl", 100, now);
      assert.equal(s.adventure.completedSets.wandoosXl, true);
    }
    s.runStartedAt = now - 27 * 60 * 1000; // 27 min écoulées
    s.resources.energy.cap = 1e9;
    s.resources.energy.current = 1e9;
    s = applyIdleNguAction(s, { action: "allocate", system: "wandoos", resource: "energy", value: 1e9 }, context, now).state;
    return advanceIdleNguState(s, 1, context, now + 1).systems.wandoos.data;
  };
  const sans = dump(false);
  const avec = dump(true);
  // Plein régime = 50 niveaux/s ; 27 min : 27/60 du boot sans le set, 27/54 avec.
  // 2026-09-24 : la vitesse est la MOYENNE de la rampe linéaire sur la fenêtre simulée (1 s se terminant 1 ms
  // après 27 min de run), donc (27 min + 0,001 s - 0,5 s) / durée du boot, et non plus la vitesse de la fin de fenêtre.
  near(sans.dumpEnergyLevel + sans.dumpEnergyProgress, 50 * (27 * 60 + 0.001 - 0.5) / 3600, "boot sans set (60 min)", 1e-6);
  near(avec.dumpEnergyLevel + avec.dumpEnergyProgress, 50 * (27 * 60 + 0.001 - 0.5) / 3240, "boot avec set (54 min)", 1e-6);
}

console.log("idle-hearts-wandoos-flubber-sigil: OK");
