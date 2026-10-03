import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, rebirthIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-03) : « Quand on achète [du cap] avant que notre énergie ne soit montée à 100K grâce aux rebirth, ce qu'on a acheté n'a pas compté ? Il n'est pas en surplus des
 * 100K. » Le cap acheté en EXP s'ajoutait au même total que la croissance naturelle et consommait sa marge (« jusqu'à 100 000 ») : acheter 100 000 de cap supprimait tout gain naturel.
 * La croissance naturelle est maintenant suivie à part (capNaturel) : les achats s'ajoutent par-dessus.
 */
const context = { bosses: 60 };
const T0 = 1_000_000;

{
  let s = normalizeIdleNguState({}, context, T0);
  s.currencies.experience = 1e6;
  s = applyIdleNguAction(s, { action: "buyResource", resource: "energy", stat: "cap", quantity: 10 }, context, T0).state;
  assert.equal(s.resources.energy.cap, 500 + 100000, "10 achats de +10 000");
  assert.equal(s.resources.energy.capNaturel, 500, "les achats ne comptent pas dans la croissance naturelle");
  s.resources.energy.generatedThisRun = 2000;
  const r = rebirthIdleNguState(s, context, T0 + 3_600_000);
  const gain = r.rebirth.resourceGrowth.energyCapGain;
  assert.ok(gain >= 100, "la croissance naturelle n'est plus bloquée par les achats");
  assert.equal(r.resources.energy.cap, 500 + 100000 + gain, "elle s'ajoute après les achats");
  assert.equal(r.resources.energy.capNaturel, 500 + gain);
}

// Le plafond naturel de 100 000 reste valable, achats en plus.
{
  let s = normalizeIdleNguState({}, context, T0);
  s.currencies.experience = 1e6;
  s = applyIdleNguAction(s, { action: "buyResource", resource: "energy", stat: "cap", quantity: 5 }, context, T0).state;
  s.resources.energy.capNaturel = 99_995;
  s.resources.energy.cap += 99_995 - 500;
  s.resources.energy.generatedThisRun = 1e6;
  const r = rebirthIdleNguState(s, context, T0 + 3_600_000);
  assert.equal(r.resources.energy.capNaturel, 100_000);
  assert.equal(r.resources.energy.cap, 500 + 50000 + (99_995 - 500) + 5, "seuls les 5 derniers points naturels sont ajoutés");
}

// Ancienne sauvegarde sans capNaturel : tout le cap existant est compté comme naturel (aucune perte, comportement d'avant).
{
  const s = normalizeIdleNguState({ resources: { energy: { cap: 5000 } } }, context, T0);
  assert.equal(s.resources.energy.capNaturel, 5000);
}
console.log("idle-energy-cap-achete-hors-plafond-naturel-v1: OK");
