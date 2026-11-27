import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Audit Fight Boss (2026-11-27), cas rares du moteur :
 * (1) le segment qui TUE le boss (ou le joueur) enleve exactement les PV restants : plus de reste flottant (boss vivant a « 0 % ») pour des PV > ~1e7 ;
 * (2) un boss ou un joueur vivant avec moins de 0,5 PV garde 1 PV a l'ecriture (plus arrondi a 0) ;
 * (3) boss et joueur a 0 PV dans le meme segment : victoire, pas de defaite comptee en plus.
 */
const src = fs.readFileSync("cloudflare/src/idle-runtime-progression.js", "utf8");
assert.ok(src.includes("segment === tempsPourBoss\n        ? bossPv"), "(1) le segment qui tue enleve exactement bossPv");
assert.ok(src.includes("segment === tempsPourDefaite\n        ? pvJoueur"), "(1) idem pour le joueur");
assert.ok(src.includes("setValue(pvEntierVivantSorealIdleV1_(bossPv))") && src.includes("setValue(pvEntierVivantSorealIdleV1_(pvJoueur))"), "(2) ecriture des PV par pvEntierVivant");
assert.ok(src.includes("joueurBattu = joueurBattu && combatBossActif;") && src.includes("if (joueurBattu) {"), "(3) victoire prioritaire sur la defaite du meme segment (le combat deja arrete par la victoire ne compte plus de defaite)");

/* Le calcul de (1), tel qu'il est ecrit, sur beaucoup de valeurs : l'ancienne formule laisse un reste, la nouvelle jamais. */
let resteAncien = 0, resteNouveau = 0;
for (let i = 0; i < 20000; i += 1) {
  const bossPv = (1 + (i * 0.6180339887) % 9) * 10 ** (23 + (i % 60));
  const dps = (1 + (i * 0.7548776662) % 9) * 10 ** (10 + (i % 40));
  const tempsPourBoss = bossPv / dps;
  const segment = Math.min(tempsPourBoss + 1, tempsPourBoss);
  const ancien = bossPv - Math.min(bossPv, segment * dps);
  const nouveau = bossPv - (segment === tempsPourBoss ? bossPv : Math.min(bossPv, segment * dps));
  if (ancien > 1e-9) resteAncien += 1;
  if (nouveau > 1e-9) resteNouveau += 1;
}
assert.ok(resteAncien > 0, "l'ancienne formule laissait un reste (" + resteAncien + " cas sur 20000)");
assert.equal(resteNouveau, 0, "la nouvelle formule ne laisse jamais de reste");

const m = src.match(/function pvEntierVivantSorealIdleV1_\(pv\) \{[\s\S]*?\n\}/);
const pvEntier = new Function(m[0] + "return pvEntierVivantSorealIdleV1_;")();
assert.equal(pvEntier(0.3), 1, "vivant a 0,3 PV : 1 PV");
assert.equal(pvEntier(0), 0);
assert.equal(pvEntier(-5), 0);
assert.equal(pvEntier(NaN), 0);
assert.equal(pvEntier(1234.6), 1235);
assert.equal(pvEntier(1e30), 1e30);
console.log("idle-combat-boss-residu-v1: OK");
