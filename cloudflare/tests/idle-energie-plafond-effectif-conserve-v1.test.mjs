import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

/*
 * Norman (2026-10-05) : « la génération d'énergie bloque, tourne en rond » : l'énergie libre restait bloquée à 500 000 alors que le plafond effectif était 562 118. Cause : chaque opération normalisait l'état et plafonnait l'énergie
 * au plafond de BASE enregistré, perdant tout ce que les bonus de plafond (atouts, manies, souhaits, équipement) autorisaient au-dessus. Le vrai plafond est le plafond effectif moins ce qui est alloué.
 */
const B = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-ngu-progression.js").href);
const ctx = { bosses: 60, basicTrainingEnergyAllocation: 0 };
const t0 = 1_800_000_000_000;
function etat(current, perkLevels) {
  const s = B.normalizeIdleNguState({}, ctx, t0);
  s.systems.perks.unlocked = true;
  s.systems.perks.data = { levels: { 8: perkLevels } };   // +1 % de Plafond d'Énergie par niveau
  s.resources.energy.cap = 500000;
  s.resources.energy.capNaturel = 500000;
  s.resources.energy.current = current;
  s.updatedAt = t0;
  return s;
}
// 1. Plafond effectif 550 000 : une énergie de 520 000 survit à la normalisation (chaque opération normalise l'état).
const s1 = etat(520000, 10);
assert.equal(B.idleNguEffectiveResourceStat(s1, "energy", "cap"), 550000);
const n = B.normalizeIdleNguState(JSON.parse(JSON.stringify(s1)), ctx, t0);
assert.equal(n.resources.energy.current, 520000, "l'énergie au-dessus du plafond de base n'est plus ramenée à 500 000");

// 2. Elle continue de se générer jusqu'au plafond effectif, sur plusieurs opérations de suite.
let s = JSON.parse(JSON.stringify(s1));
let depart = s.resources.energy.current;
for (let i = 0; i < 4; i += 1) s = B.advanceIdleNguState(JSON.parse(JSON.stringify(s)), 5, ctx, t0 + (i + 1) * 5000);
assert.ok(s.resources.energy.current > depart, "génération au-dessus du plafond de base : " + depart + " -> " + s.resources.energy.current);
assert.ok(s.resources.energy.current <= 550000 + 1e-6, "jamais au-delà du plafond effectif");

// 3. Une énergie au-dessus du plafond effectif (équipement retiré, perte de bonus) est ramenée à ce plafond à l'avancée du temps.
const s3 = etat(600000, 10);
const apres = B.advanceIdleNguState(JSON.parse(JSON.stringify(s3)), 1, ctx, t0 + 1000);
assert.ok(apres.resources.energy.current <= 550000 + 1e-6, "plafond effectif appliqué : " + apres.resources.energy.current);

// 4. Avec une énergie allouée ailleurs, le plafond de l'énergie libre diminue d'autant.
const ctxAlloc = { bosses: 60, basicTrainingEnergyAllocation: 47000 };
const s4 = etat(520000, 10);
const r4 = B.advanceIdleNguState(JSON.parse(JSON.stringify(s4)), 1, ctxAlloc, t0 + 1000);
assert.ok(r4.resources.energy.current <= 550000 - 47000 + 1e-6, "énergie libre plafonnée à (plafond effectif − alloué) : " + r4.resources.energy.current);
console.log("idle-energie-plafond-effectif-conserve-v1: OK");
