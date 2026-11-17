import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/* Norman (2026-11-17) : « interdit d'acheter [du plafond d'énergie] avant les 100K qu'on gagne avec les rebirth » ; lu dans le jeu : EnergyPurchases::maxEnergy10K / maxEnergy100k / maxEnergy1M
   refusent tant que capEnergy < 100 000 (« You need to hit a cap of 100K energy first! »). Règle n°2 : l'achat reste CACHÉ (resourcePurchaseUnlock.energy.cap.unlocked === false), sans le chiffre. */
const T0 = 1_000_000, ctx = { bosses: 60 };
const neuf = () => { const s = normalizeIdleNguState({}, ctx, T0); s.currencies.experience = 1e9; return s; };

for (const quantity of [1, 10, 100]) {
  const s = neuf();
  s.resources.energy.cap = 99_999;
  assert.throws(() => applyIdleNguAction(s, { action: "buyResource", resource: "energy", stat: "cap", quantity }, ctx, T0), /ACHAT_VERROUILLE_BOSS/, "plafond < 100 000 : achat refusé (x" + quantity + ")");
}
{
  const s = neuf();
  s.resources.energy.cap = 100_000;
  const r = applyIdleNguAction(s, { action: "buyResource", resource: "energy", stat: "cap", quantity: 1 }, ctx, T0);
  assert.equal(r.state.resources.energy.cap, 110_000, "plafond >= 100 000 : achat permis");
}
/* seul le PLAFOND d'énergie est concerné : vitesse, puissance et barres ne changent pas ; magie et ressource 3 non plus */
{
  const s = neuf();
  s.resources.energy.cap = 500;
  for (const stat of ["speed", "bars"]) applyIdleNguAction(s, { action: "buyResource", resource: "energy", stat }, ctx, T0);
}
/* anti-spoil : le snapshot annonce « verrouillé » sans aucun nombre ; une fois le plafond atteint, « débloqué » */
{
  const s = neuf();
  s.resources.energy.cap = 500;
  const snap = idleNguSnapshot(JSON.parse(JSON.stringify(s)), ctx, T0);
  assert.equal(snap.resourcePurchaseUnlock.energy.cap.unlocked, false);
  assert.ok(!JSON.stringify(snap.resourcePurchaseUnlock.energy.cap).includes("100000"), "aucun chiffre de condition");
  assert.equal(snap.resourcePurchases.energy.cap.unlockBoss, undefined);
  s.resources.energy.cap = 100_000;
  assert.equal(idleNguSnapshot(JSON.parse(JSON.stringify(s)), ctx, T0).resourcePurchaseUnlock.energy.cap.unlocked, true);
}
console.log("idle-cap-energie-100k-v1: OK");
