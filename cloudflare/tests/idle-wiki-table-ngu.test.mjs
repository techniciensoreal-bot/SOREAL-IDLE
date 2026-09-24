import assert from "node:assert/strict";
import { nguParamsV1, nguEffectPctV1, IDLE_NGU_CATALOG_V1 } from "../src/idle-ngu-catalog-v1.js";

/*
 * Wiki, page « NGU », 6 tableaux (Normal / Evil / Sadistic, Energy / Magic), 48 lignes (2026-09-24) : montant par niveau (L x x %),
 * soft cap, coût de base (secondes du niveau 0 -> 1) et valeur maximale au niveau 1e9. Valeurs recopiées du wiki (fixtures),
 * générées par design/wiki-ngu-table-check.mjs ; le moteur est lu via nguParamsV1 / nguEffectPctV1.
 * Ligne : [palier, id, pct par niveau, soft cap (null = aucun), coût de base, valeur max en % au niveau 1e9].
 * Le wiki arrondit les valeurs maximales (jusqu'à 4 chiffres significatifs, ex. 1.002e6 % pour NGU Number) : tolérance 5e-4 en relatif.
 */
const WIKI_ROWS = [
  ["normal","augments",1,null,200000000000,1000000000],
  ["normal","wandoos",0.1,null,200000000000,100000000],
  ["normal","respawn",0.05,400,200000000000,40],
  ["normal","gold",1,null,200000000000,1000000000],
  ["normal","adventureAlpha",0.1,1000,200000000000,100244.2],
  ["normal","powerAlpha",5,null,200000000000,5000000000],
  ["normal","dropChance",0.1,1000,20000000000000,100244.2],
  ["normal","magicNgu",0.1,1000,400000000000000,6309.95],
  ["normal","pp",0.05,1000,10000000000000000,3154.97],
  ["normal","yggdrasil",0.1,400,400000000000,5170.23],
  ["normal","exp",0.01,2000,1200000000000,3808.29],
  ["normal","powerBeta",1,null,4000000000000,1000000000],
  ["normal","number",1,1000,12000000000000,1002000],
  ["normal","timeMachine",0.2,1000,100000000000000,12619000],
  ["normal","energyNgu",0.1,1000,1000000000000000,6309.95],
  ["normal","adventureBeta",0.03,1000,10000000000000000,7539.75],
  ["evil","augments",0.5,null,200000000000000000000,500000000],
  ["evil","wandoos",0.1,1000,200000000000000000000,3163.56],
  ["evil","respawn",0.0005,10000,200000000000000000000,10],
  ["evil","gold",0.5,null,2e+21,500000000],
  ["evil","adventureAlpha",0.05,1000,2e+22,1581.78],
  ["evil","powerAlpha",2,null,2e+23,2000000000],
  ["evil","dropChance",0.05,1000,2e+24,3154.97],
  ["evil","magicNgu",0.05,1000,2e+25,3154.97],
  ["evil","pp",0.02,1000,2e+26,316.99],
  ["evil","yggdrasil",0.05,400,200000000000000000000,87.26],
  ["evil","exp",0.005,2000,2e+21,137.97],
  ["evil","powerBeta",0.5,null,2e+22,500000000],
  ["evil","number",0.5,1000,2e+23,31549.74],
  ["evil","timeMachine",0.1,1000,2e+24,6310000],
  ["evil","energyNgu",0.05,1000,2e+25,792.48],
  ["evil","adventureBeta",0.015,1000,2e+26,474.35],
  ["sadistic","augments",0.4,null,1e+40,400000000],
  ["sadistic","wandoos",0.06,1000,1e+40,476.59],
  ["sadistic","respawn",0.0005,10000,1e+40,10],
  ["sadistic","gold",0.5,1000,1e+40,500114.21],
  ["sadistic","adventureAlpha",0.04,1000,1e+41,633.96],
  ["sadistic","powerAlpha",1.6,null,1e+42,1600000000],
  ["sadistic","dropChance",0.04,1000,1e+43,633.99],
  ["sadistic","magicNgu",0.04,1000,1e+44,159.24],
  ["sadistic","pp",0.016,1000,1e+45,63.7],
  ["sadistic","yggdrasil",0.04,400,1e+40,52],
  ["sadistic","exp",0.005,2000,1e+40,71.59],
  ["sadistic","powerBeta",0.5,null,1e+41,500000000],
  ["sadistic","number",0.5,1000,1e+42,7924.82],
  ["sadistic","timeMachine",0.1,1000,1e+43,6309000],
  ["sadistic","energyNgu",0.05,1000,1e+44,397.17],
  ["sadistic","adventureBeta",0.015,1000,1e+45,78.72]
];

assert.equal(WIKI_ROWS.length, 48, "48 lignes : 3 paliers x (9 NGU Energy + 7 NGU Magic)");
assert.equal(IDLE_NGU_CATALOG_V1.length, 16);
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
for (const [tier, id, pct, softCap, baseCost, maxPct] of WIKI_ROWS) {
  const p = nguParamsV1(tier, id);
  assert.ok(p, tier + "/" + id + " absent du catalogue");
  assert.ok(rel(p.pct, pct) < 1e-9, tier + "/" + id + " montant par niveau : " + p.pct + " contre " + pct);
  assert.equal(p.softCap ?? null, softCap, tier + "/" + id + " soft cap");
  assert.ok(rel(p.baseCost, baseCost) < 1e-9, tier + "/" + id + " coût de base : " + p.baseCost + " contre " + baseCost);
  assert.ok(rel(nguEffectPctV1(tier, id, 1e9), maxPct) < 5e-4, tier + "/" + id + " valeur au niveau 1e9 : " + nguEffectPctV1(tier, id, 1e9) + " contre " + maxPct);
}

console.log("idle-wiki-table-ngu: OK");
