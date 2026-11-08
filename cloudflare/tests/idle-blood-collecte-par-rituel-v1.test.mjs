import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-11-08) : « le compteur de sang collecté sous le rituel et le sang disponible ne sont pas les mêmes » ; « lorsqu'on lance un sort, tous les compteurs reviennent à 0 Sang collecté en dessous de chaque rituel » ; « le sang monte en une fois (60K), pas progressivement ».
 * Chaque rituel garde le sang qu'il a VRAIMENT rapporté (bloodCollected), la somme égale le sang disponible, tout sang dépensé remet les compteurs à 0, et bloodGain donne le sang d'UNE complétion.
 */
const ctx = { bosses: 140 };
function depart() {
  const s = normalizeIdleNguState({}, ctx, 1000);
  s.systems.bloodMagic.unlocked = true;
  s.resources.magic.cap = 100000;
  s.resources.magic.current = 5000;
  s.currencies.gold = 1e18;
  return s;
}
const agir = (s, a, t = 2000) => applyIdleNguAction(s, a, ctx, t).state;
const somme = (s) => Object.values(s.systems.bloodMagic.data.rituals).reduce((x, r) => x + (r.bloodCollected || 0), 0);

// 1. la somme des compteurs par rituel égale le sang disponible
let s = depart();
s = agir(s, { action: "allocateRitual", ritual: "tack", value: 1000 });
s = agir(s, { action: "allocateRitual", ritual: "papercuts", value: 1000 });
s = advanceIdleNguState(s, 60000, ctx, 62000);
const r = s.systems.bloodMagic.data.rituals;
assert.ok(r.tack.completions >= 1 && r.papercuts.completions >= 1, "les deux rituels ont tourné");
assert.ok(s.currencies.blood > 0);
assert.ok(Math.abs(somme(s) - s.currencies.blood) < 1e-6 * Math.max(1, s.currencies.blood), "somme des « sang collecté » = sang disponible (" + somme(s) + " / " + s.currencies.blood + ")");
assert.ok(r.papercuts.bloodGain >= 50 && Math.abs(r.papercuts.bloodCollected - r.papercuts.completions * r.papercuts.bloodGain) < 1e-6 * r.papercuts.bloodCollected, "bloodGain = sang d'UNE complétion (avec les multiplicateurs), cumulé exactement");

// 2. un multiplicateur de sang se retrouve dans le compteur du rituel (plus « complétions x sang du catalogue »)
{
  let m = depart();
  m = agir(m, { action: "allocateRitual", ritual: "papercuts", value: 1000 });
  m.systems.bloodMagic.data.rituals.papercuts.bloodCollected = 0;
  m = advanceIdleNguState(m, 40000, ctx, 42000);
  const p = m.systems.bloodMagic.data.rituals.papercuts;
  assert.ok(Math.abs(p.bloodGain - 50) < 1e-9 || p.bloodGain > 50, "au moins le sang du catalogue");
  assert.ok(Math.abs(m.currencies.blood - p.bloodCollected) < 1e-6 * Math.max(1, m.currencies.blood), "le compteur du rituel suit le sang réellement ajouté");
}

// 3. lancer un sort remet TOUS les compteurs à 0 (comme le sang disponible)
{
  const apres = agir(s, { action: "castBloodSpell", spell: "numberBoost" }, 70000);
  assert.equal(apres.currencies.blood, 0);
  for (const [id, x] of Object.entries(apres.systems.bloodMagic.data.rituals)) assert.equal(x.bloodCollected, 0, "compteur remis à 0 : " + id);
  const encore = advanceIdleNguState(apres, 10000, ctx, 80000);
  assert.ok(Math.abs(somme(encore) - encore.currencies.blood) < 1e-6 * Math.max(1, encore.currencies.blood), "après le sort, les compteurs repartent de zéro et restent justes");
}

// 4. ancienne sauvegarde (compteurs absents) : le sang disponible est réparti, la somme reste juste
{
  const vieux = JSON.parse(JSON.stringify(s));
  for (const x of Object.values(vieux.systems.bloodMagic.data.rituals)) delete x.bloodCollected;
  const n = normalizeIdleNguState(vieux, ctx, 62000);
  const migre = advanceIdleNguState(n, 1, ctx, 62001);
  assert.ok(Math.abs(somme(migre) - migre.currencies.blood) < 1e-6 * Math.max(1, migre.currencies.blood), "migration : somme = sang disponible");
}
console.log("idle-blood-collecte-par-rituel-v1: OK");
