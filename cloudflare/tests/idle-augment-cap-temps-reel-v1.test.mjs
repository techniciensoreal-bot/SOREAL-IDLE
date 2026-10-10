import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-10) : « quand les Ciseaux de sécurité sont cap, les niveaux ne se mettent pas à jour en temps réel ». Une barre CAP (50 niveaux par seconde au plus) rejoue elle aussi ses niveaux, son coût et l'Or en direct. */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const debut = meta.indexOf("function rejouerCyclesAugmentPlafonneIdleV1_(p){");
const fin = meta.indexOf("window.__rejouerCyclesAugmentPlafonneIdleV1__=");
assert.ok(debut > 0 && fin > debut, "fonction présente");
const rejouer = new Function(meta.slice(debut, fin) + "\nreturn rejouerCyclesAugmentPlafonneIdleV1_;")();

// 1 s de barre CAP : 50 niveaux (un par tick de 0,02 s), même si la durée « brute » est bien plus courte.
let r = rejouer({ niv0: 1000, sec0: 0.005, cout0: 100, expo: 1, reste0: 1, debites: 0, gold: 1e12 });
assert.equal(r.k, 50, "50 niveaux en 1 s");
assert.equal(r.bloque, false);
const coutAttendu = Array.from({ length: 50 }, (_, i) => 100 * (1001 + i) / 1001).reduce((a, b) => a + b, 0);
assert.ok(Math.abs(r.debit - coutAttendu) < 1e-6, "Or débité = somme des coûts des niveaux gagnés");
assert.equal(r.debites, 50);

// Faute d'Or : la barre s'arrête sur le dernier niveau payable et se dit bloquée.
r = rejouer({ niv0: 1000, sec0: 0.005, cout0: 100, expo: 1, reste0: 1, debites: 0, gold: 250 });
assert.equal(r.k, 2, "deux niveaux payables avec 250 Or (100 + 100,1)");
assert.equal(r.bloque, true);

// Les niveaux déjà débités lors d'un tick précédent ne le sont pas deux fois.
r = rejouer({ niv0: 1000, sec0: 0.005, cout0: 100, expo: 1, reste0: 2, debites: 50, gold: 1e12 });
assert.equal(r.k, 100);
assert.ok(Math.abs(r.debit - Array.from({ length: 50 }, (_, i) => 100 * (1051 + i) / 1001).reduce((a, b) => a + b, 0)) < 1e-6, "seuls les 50 nouveaux niveaux sont débités");

// Upgrade : coût en n².
r = rejouer({ niv0: 10, sec0: 0.001, cout0: 50, expo: 2, reste0: 0.1, debites: 0, gold: 1e12 });
assert.equal(r.k, 5);
assert.ok(Math.abs(r.debit - Array.from({ length: 5 }, (_, i) => 50 * Math.pow((11 + i) / 11, 2)).reduce((a, b) => a + b, 0)) < 1e-9);

// Le tick de l'interface appelle ce rejeu pour une barre CAP.
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("}else if(secondes0>0&&typeof window.__rejouerCyclesAugmentPlafonneIdleV1__==='function'){"), "le tick rejoue aussi les barres CAP");
console.log("idle-augment-cap-temps-reel-v1: OK");
