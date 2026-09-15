import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-14) : "Est-ce que tu as ajouté les bonus des sets
 * complets ? Un set complet donne un bonus... surement permanent. Il
 * faut que tu vérifies et que tu appliques dans SOREAL IDLE."
 *
 * Vérifié : checkSets() (idle-adventure-v47.js) calcule et stocke déjà
 * correctement TOUS les bonus de complétion (fidèle au wiki NGU, page
 * Inventory : "Set bonuses are permanent, even when you no longer have
 * the set") — experience/gold/energySpeedFlat/energyPowerFlat/
 * energyBarsFlat/magicPowerFlat/magicBarsFlat/magicCapFlat sont déjà
 * lus ailleurs (idleNguPermanentBonusesV1, ou diffés vers les vraies
 * monnaies pour experience/gold, juste au-dessus dans
 * applyIdleNguAction). Le SEUL oubli confirmé : l'AP de complétion
 * (ex. Badly Drawn Set : 5000 AP) restait dans adventure.permanent.ap
 * sans jamais être diffé vers state.currencies.ap, contrairement à
 * experience/gold (même mécanisme, juste jamais branché pour l'AP).
 */
let s = normalizeIdleNguState({}, {}, 0);
s.currencies.ap = 0;

// Les 5 pièces du Badly Drawn Set (reward: {experience:30000, ap:5000, boostEffectiveness:.2}), sans passer par le gate de zone (addItem ne le vérifie jamais).
const slots = ["head", "chest", "legs", "boots", "weapon"];
for (const slot of slots) {
  const r = applyIdleNguAction(
    s,
    { action: "adventure", adventure: { action: "addItem", definitionId: `badly:${slot}`, level: 100 } },
    {},
    1
  );
  s = r.state;
}

assert.equal(s.adventure.completedSets.badly, true, "Le Badly Drawn Set doit être marqué complété (5 pièces au niveau 100).");
assert.equal(s.adventure.permanent.ap, 5000, "adventure.permanent.ap doit contenir la récompense brute de complétion.");
assert.equal(
  s.currencies.ap,
  5000,
  "L'AP de complétion de set doit être créditée à la vraie monnaie (state.currencies.ap), exactement comme experience et gold le sont déjà."
);

console.log("idle-adventure-set-bonus-ap-credit: OK");
