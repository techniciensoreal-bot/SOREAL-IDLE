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
  /* Lu dans le jeu (EnergyPurchases::maxEnergy10K/100k/1M, 2026-11-17 ; décision de Norman) : on ne peut pas acheter de plafond d'énergie avant les 100 000 gagnés aux Rebirths. */
  assert.throws(() => applyIdleNguAction(s, { action: "buyResource", resource: "energy", stat: "cap", quantity: 10 }, context, T0), /ACHAT_VERROUILLE_BOSS/);
  s.resources.energy.cap = 100000; s.resources.energy.capNaturel = 100000;   // 100 000 déjà gagnés aux Rebirths
  s = applyIdleNguAction(s, { action: "buyResource", resource: "energy", stat: "cap", quantity: 10 }, context, T0).state;
  assert.equal(s.resources.energy.cap, 100000 + 100000, "10 achats de +10 000");
  assert.equal(s.resources.energy.capNaturel, 100000, "les achats ne comptent pas dans la croissance naturelle");
  s.resources.energy.generatedThisRun = 2000;
  s.resources.energy.generatedTotal = 2000;
  const r = rebirthIdleNguState(s, context, T0 + 3_600_000);
  assert.equal(r.resources.energy.cap, 200000, "les achats restent après le Rebirth");
  assert.equal(r.resources.energy.capNaturel, 100000);
}

// Le plafond naturel de 100 000 reste valable, achats en plus.
{
  let s = normalizeIdleNguState({}, context, T0);
  s.currencies.experience = 1e6;
  s.resources.energy.cap = 100000; s.resources.energy.capNaturel = 99_995;
  s = applyIdleNguAction(s, { action: "buyResource", resource: "energy", stat: "cap", quantity: 5 }, context, T0).state;
  s.resources.energy.generatedThisRun = 1e6;
  s.resources.energy.generatedTotal = 3e6;   // énergie obtenue au total : le cap naturel au Rebirth en dépend (lu dans le jeu, Rebirth::resetEnergy)
  const r = rebirthIdleNguState(s, context, T0 + 3_600_000);
  assert.equal(r.resources.energy.capNaturel, 100_000);
  assert.equal(r.resources.energy.cap, 100000 + 50000 + 5, "seuls les 5 derniers points naturels sont ajoutés");
}

// Ancienne sauvegarde sans capNaturel : tout le cap existant est compté comme naturel (aucune perte, comportement d'avant).
{
  const s = normalizeIdleNguState({ resources: { energy: { cap: 5000 } } }, context, T0);
  assert.equal(s.resources.energy.capNaturel, 5000);
}
console.log("idle-energy-cap-achete-hors-plafond-naturel-v1: OK");
