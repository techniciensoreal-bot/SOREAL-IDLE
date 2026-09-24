import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47, IDLE_ADVENTURE_SPECIALS } from "../src/idle-adventure-v47.js";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { idleYggGiantSeedSeedsV1 } from "../src/idle-yggdrasil-extra-v1.js";

/*
 * A Giant Seed et Seed (set), 2026-09-24. Sources (miroir NGU-Wiki) :
 *  - « Grand Corrupted Tree », Loot : « A Giant Seed lvl 0 (guaranteed) » ;
 *  - « A Giant Seed » : Id 92, Consumable ; « A Giant Seed of level L gives
 *    max(1, ⌊L + L²/100⌋) seeds. For example, at level 50 you will get 75 seeds
 *    and at level 100, 200 seeds. Also, the completion bonus grants 10 poop. » ;
 *  - « Seed (set) » : « 10 Premium samples of Icarus Proudbottom's Homemade Boom
 *    Boom Fertilizers! ».
 */

// ---------- Objet ----------
{
  const d = IDLE_ADVENTURE_SPECIALS.giantSeed;
  assert.ok(d, "A Giant Seed est un objet");
  assert.equal(d.name, "A Giant Seed");
  assert.equal(d.slot, "special");
  assert.equal(d.p, 0);
  assert.equal(d.t, 0);
}

// ---------- Drop garanti du Grand Corrupted Tree ----------
{
  const etat = normalizeIdleAdventureStateV47({});
  etat.unlockFlags.ngu = true;
  etat.titans.t1 = { kills: 24, nextAt: 0 };
  const avant = Math.random;
  Math.random = () => 0.999999; // aucun jet "base chance" ne réussit
  let r;
  try { r = applyIdleAdventureActionV47(etat, { action: "titan", titan: "t2" }, { bosses: 66, stats: { power: 5000, toughness: 4000 } }, 1000); }
  finally { Math.random = avant; }
  assert.deepEqual(r.result.drops.filter((x) => x.definitionId === "giantSeed").map((x) => x.level), [0], "A Giant Seed lvl 0 (guaranteed)");
  assert.equal(r.state.unlockItems.giantSeed, true, "le drapeau de déblocage d'Yggdrasil reste posé au premier kill");
}

// ---------- Graines rendues : exemples de la fiche ----------
assert.equal(idleYggGiantSeedSeedsV1(0), 1, "max(1, 0)");
assert.equal(idleYggGiantSeedSeedsV1(1), 1);
assert.equal(idleYggGiantSeedSeedsV1(50), 75);
assert.equal(idleYggGiantSeedSeedsV1(100), 200);
assert.equal(idleYggGiantSeedSeedsV1(15), 17, "⌊15 + 2,25⌋");

const ctx = { bosses: 100 };
const ajouter = (s, level) => applyIdleNguAction(s, { action: "adventure", adventure: { action: "addItem", definitionId: "giantSeed", level } }, ctx, 1).state;
const graine = (s) => s.adventure.inventory.find((o) => o.definitionId === "giantSeed");

// ---------- Seed (set) : 10 Poop, une seule fois ----------
{
  let s = normalizeIdleNguState({}, ctx, 0);
  s = ajouter(s, 99);
  assert.equal(s.adventure.completedSets.seed, undefined, "niveau 99 : set non complété");
  assert.equal(s.selloutEffects.poop, 0);
  s = ajouter(s, 100);
  assert.equal(s.adventure.completedSets.seed, true, "A Giant Seed niveau 100 -> Seed (set)");
  assert.equal(s.selloutEffects.poop, 10, "10 Poop");
  s = ajouter(s, 100);
  assert.equal(s.selloutEffects.poop, 10, "jamais accordées deux fois");
}

// ---------- Réutilisation : graines, objet retiré ----------
{
  let s = normalizeIdleNguState({}, ctx, 0);
  s = ajouter(s, 50);
  const id = graine(s).id;
  assert.throws(() => applyIdleNguAction(s, { action: "consumeGiantSeed", itemId: id }, ctx, 1), /SYSTEME_VERROUILLE/, "Yggdrasil doit être débloqué");
  s.systems.yggdrasil.unlocked = true;
  const avant = s.currencies.seeds;
  const rev = s.adventure.revision;
  const r = applyIdleNguAction(s, { action: "consumeGiantSeed", itemId: id }, ctx, 1);
  assert.equal(r.result.seeds, 75);
  assert.equal(r.state.currencies.seeds - avant, 75);
  assert.equal(graine(r.state), undefined, "objet consommé");
  assert.ok(r.state.adventure.revision > rev, "révision d'inventaire avancée");
  assert.throws(() => applyIdleNguAction(r.state, { action: "consumeGiantSeed", itemId: id }, ctx, 1), /GRAINE_GEANTE_INVALIDE/);
}

// ---------- Objet verrouillé ou autre objet : refusé ----------
{
  let s = normalizeIdleNguState({}, ctx, 0);
  s.systems.yggdrasil.unlocked = true;
  s = ajouter(s, 10);
  graine(s).locked = true;
  assert.throws(() => applyIdleNguAction(s, { action: "consumeGiantSeed", itemId: graine(s).id }, ctx, 1), /OBJET_VERROUILLE/);
  s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "addItem", definitionId: "aNumber", level: 10 } }, ctx, 1).state;
  const autre = s.adventure.inventory.find((o) => o.definitionId === "aNumber").id;
  assert.throws(() => applyIdleNguAction(s, { action: "consumeGiantSeed", itemId: autre }, ctx, 1), /GRAINE_GEANTE_INVALIDE/);
}

// ---------- Client : bouton dans la fiche d'objet ----------
{
  const ui = fs.readFileSync(new URL("../public/soreal-idle-ui.js", import.meta.url), "utf8");
  assert.ok(/definitionId==='giantSeed'/.test(ui) && /action:\\'consumeGiantSeed\\'/.test(ui), "bouton « Ajouter aux graines »");
}

console.log("idle-giant-seed-set: OK");
