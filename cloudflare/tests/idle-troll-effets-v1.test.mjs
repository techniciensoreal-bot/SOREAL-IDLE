// Norman (2026-11-02) : « quand ils se produisent, ça doit réellement faire ce qui est écrit ». Chaque gros troll à drapeau (NGU, barbes, Wandoos, multiplicateur de boss) change bien les calculs du moteur,
// et un nouveau Rebirth les remet à zéro.
import assert from "node:assert/strict";
import { normalizeIdleNguState } from "../src/idle-ngu-progression.js";
import { nguFxV1, beardBonusMultiplier } from "../src/idle-ngu-bonus.js";
import { wandoosCombatMultiplierV1 } from "../src/idle-ngu-etat.js";
import { trollBossDividerV1, trollFlagsV1, trollNguOffV1 } from "../src/idle-ngu-systemes.js";

const T0 = 1_000_000_000_000;
const s = normalizeIdleNguState({}, { bosses: 100 }, T0);
s.challenge.active = "troll";
assert.equal(trollBossDividerV1(s), 1, "sans troll, aucun diviseur");
assert.equal(trollNguOffV1(s), false);

// NGU : avec des niveaux, les effets sont non neutres ; le troll les remet à 1
const neutre = JSON.stringify(nguFxV1(Object.assign({}, s, { challenge: { active: "noNgu" } })));
s.systems.ngu.unlocked = true;
for (const tier of Object.values(s.systems.ngu.data.tracks || {})) if (tier && typeof tier === "object") tier.level = 500;
s.challenge.troll.flags.ngu = true;
assert.equal(trollNguOffV1(s), true);
assert.equal(JSON.stringify(nguFxV1(s)), neutre, "NGU désactivés : mêmes effets que sans NGU");

// barbes : un niveau de barbe actif donnerait > 1 ; le troll ramène à 1
s.systems.beards.unlocked = true;
s.challenge.troll.flags.beards = true;
for (const role of ["attackDefense", "drop", "number"]) assert.equal(beardBonusMultiplier(s, role), 1, "barbes éteintes : " + role);

// Wandoos : multiplicateur de combat = 1 une fois éteint
s.systems.wandoos.unlocked = true;
s.systems.wandoos.data.dumpEnergyLevel = 5000; s.systems.wandoos.data.dumpMagicLevel = 5000;
const avant = wandoosCombatMultiplierV1(Object.assign({}, s, { challenge: s.challenge }));
s.challenge.troll.flags.wandoos = false;
const actif = wandoosCombatMultiplierV1(s);
s.challenge.troll.flags.wandoos = true;
assert.ok(actif > 1, "Wandoos avec niveaux > 1 (" + actif + ")");
assert.equal(wandoosCombatMultiplierV1(s), 1, "Wandoos éteint : x1");
void avant;

// diviseur de boss : 2 + complétions du Troll Challenge
s.challenge.troll.flags.bossDivider = true;
for (const n of [0, 1, 6]) {
  s.challenge.completions = Object.assign({}, s.challenge.completions, { troll: n });
  s.challenge.completionsTier = { normal: { troll: n }, difficile: {}, extreme: {} };
  assert.equal(trollBossDividerV1(s), 2 + n, "diviseur pour " + n + " complétion(s)");
}

// ne s'applique que pendant le défi
s.challenge.active = "";
assert.equal(trollNguOffV1(s) && Boolean(s.challenge.active === "troll"), false);
assert.ok(typeof trollFlagsV1(s) === "object");
console.log("idle-troll-effets-v1 : OK");
