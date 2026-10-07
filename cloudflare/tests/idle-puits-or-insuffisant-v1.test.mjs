import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Money Pit avec moins que le minimum (Norman, 2026-10-08, capture du vrai jeu) : le puits prend tout l'or, aucune récompense, message « You feel a lot poorer... but nothing happened :c. Maybe you need to throw more gold? ».
 */
const ctx = { bosses: 140 };
function depart(or) {
  const s = normalizeIdleNguState({}, ctx, 1000);
  s.systems.moneyPit.unlocked = true;
  s.currencies.gold = or;
  return s;
}
// Moins de 100 000 : l'or part, aucune récompense, mais le délai du puits est consommé comme pour un vrai jet
{
  const s = depart(40000);
  const histAvant = JSON.stringify(s.systems.moneyPit.data.history);
  const totalAvant = s.systems.moneyPit.data.totalGoldTossed;
  const { state, result } = applyIdleNguAction(s, { action: "moneyPit" }, ctx, 5000);
  assert.equal(state.currencies.gold, 0, "le puits prend l'or");
  assert.equal(result.rien, true);
  assert.equal(result.orPerdu, 40000);
  assert.ok(!result.reward, "aucune récompense");
  const d = state.systems.moneyPit.data;
  assert.equal(d.nextAt, 5000 + 2 * 3600000, "le délai du puits est utilisé (2 h après le premier jet)");
  assert.equal(d.tossesThisRun, 1);
  assert.equal(JSON.stringify(d.history), histAvant, "rien dans l'historique des lots");
  assert.equal(d.totalGoldTossed, totalAvant, "pas compté dans le total d'or jeté");
  // un nouveau jet est refusé tant que le délai court
  state.currencies.gold = 100000;
  assert.throws(() => applyIdleNguAction(state, { action: "moneyPit" }, ctx, 5001), /PUITS_EN_RECHARGE/);
  // après le délai, le jet suivant attend 3 h (k + 1 heures après le k-ième jet)
  const suite = applyIdleNguAction(state, { action: "moneyPit" }, ctx, d.nextAt + 1);
  assert.ok(suite.result.reward, "un vrai jet reste possible une fois le délai écoulé");
  assert.equal(suite.state.systems.moneyPit.data.nextAt, d.nextAt + 1 + 3 * 3600000);
}
// Zéro or : rien à jeter
assert.throws(() => applyIdleNguAction(depart(0), { action: "moneyPit" }, ctx, 5000), /OR_INSUFFISANT/);
// Un vrai jet (100 000 et plus) n'est pas touché
{
  const { state, result } = applyIdleNguAction(depart(100000), { action: "moneyPit" }, ctx, 5000);
  assert.ok(result.reward && !result.rien);
  assert.ok(state.systems.moneyPit.data.nextAt > 5000, "délai lancé");
}
// Client : bouton actif sous 100 000 Or, message FR et EN
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(!meta.includes("100 000 Or requis"), "le bouton n'est plus bloqué sous 100 000 Or");
assert.ok(meta.includes("res.resultat.rien") && meta.includes("Tu te sens bien plus pauvre… mais rien ne s’est passé :c. Peut-être qu’il faut jeter plus d’or ?"), "message FR");
const dict = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
assert.equal(dict["Tu te sens bien plus pauvre… mais rien ne s’est passé :c. Peut-être qu’il faut jeter plus d’or ?"], "You feel a lot poorer... but nothing happened :c. Maybe you need to throw more gold?", "message EN identique au jeu");
console.log("idle-puits-or-insuffisant-v1: OK");
