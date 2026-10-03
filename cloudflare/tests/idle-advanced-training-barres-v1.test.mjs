import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-03) : « Notre Advanced Training n'a pas de barre... Il faut des barres comme dans le jeu d'origine, avec un style bien à elle. Les calculs doivent être bons. »
 * Les barres sont animées côté client avec les mêmes formules que le moteur : ce test rejoue le moteur et la simulation du client et exige exactement les mêmes niveaux et la même part du niveau suivant.
 */
const ctx = { bosses: 100, basicTrainingComplete: true };
const fresh = () => {
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.advancedTraining.unlocked = true;
  s.systems.wandoos.unlocked = true;
  s.resources.energy.cap = 5000;
  s.resources.energy.current = 5000;
  s.resources.energy.power = 100; // racine = 10
  return s;
};

// Extraction de la simulation du client (meta-progression-v130.js).
const src = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const debut = src.indexOf("function atNiveauxDepuisTravailIdleV1_");
const fin = src.indexOf("function atTickIdleV1_");
assert.ok(debut > 0 && fin > debut, "simulation présente");
const { atSimulerIdleV1_, atBonusTexteIdleV1_ } = new Function(src.slice(debut, fin) + "\nreturn { atSimulerIdleV1_, atBonusTexteIdleV1_ };")();

// 1. Le moteur expose le taux : travail par seconde = énergie × rateParEnergie (√Puissance / (10 000 s × 1000) ; 20 000 s pour Wandoos).
let s = fresh();
let snap = idleNguSnapshot(s, ctx, 0);
const vue = snap.advancedTrainingView;
assert.ok(vue && vue.pistes.power && vue.pistes.wandoosEnergy);
assert.ok(Math.abs(vue.pistes.power.rateParEnergie - 10 / (10000 * 1000)) < 1e-15);
assert.ok(Math.abs(vue.pistes.wandoosEnergy.rateParEnergie - 10 / (20000 * 1000)) < 1e-15);

// 2. Même résultat que le moteur pour plusieurs durées et allocations (niveaux et part du niveau suivant).
for (const [energie, secondes] of [[1000, 5000], [3000, 20000], [5000, 3600], [5000, 100000]]) {
  s = fresh();
  s = applyIdleNguAction(s, { action: "allocateAdvancedTraining", track: "power", value: energie }, ctx, 1000).state;
  const taux = idleNguSnapshot(s, ctx, 1000).advancedTrainingView.pistes.power.rateParEnergie;
  const apres = advanceIdleNguState(s, secondes, ctx, 1000 + secondes * 1000);
  const piste = apres.systems.advancedTraining.data.tracks.power;
  const sim = atSimulerIdleV1_(0, 0, secondes, energie, taux, false, 0);
  assert.equal(sim.n, piste.tempLevel, `niveaux (${energie} d'énergie, ${secondes} s)`);
  assert.ok(Math.abs(sim.p - piste.progress) < 1e-6, `part du niveau suivant (${energie}, ${secondes}) : ${sim.p} vs ${piste.progress}`);
}

// 3. Bonus affichés = formules du wiki (tableau de référence).
const bonus = (id, niveau) => atBonusTexteIdleV1_(id, niveau).replace(/ | /g, " ");
assert.equal(bonus("power", 100), "Bonus : +63,1 %");
assert.equal(bonus("toughness", 1000), "Bonus : +158,49 %");
assert.equal(bonus("power", 1000000), "Bonus : +2 511,89 %");
assert.equal(bonus("block", 1), "Réduction : 50,5 %");
assert.equal(bonus("block", 100), "Réduction : 75 %");
assert.equal(bonus("block", 1000), "Réduction : 95,45 %");
assert.equal(bonus("wandoosEnergy", 34), "Vitesse du dump : +34 %");

// 4. Target : la barre s'arrête au niveau voulu.
assert.equal(atSimulerIdleV1_(0, 0, 100000, 5000, 1e-3, false, 3).n, 3);
// 5. Souhait dédié : 50 niveaux par seconde sans énergie.
assert.equal(atSimulerIdleV1_(0, 0, 2, 0, 0, true, 0).n, 100);

// 6. Interface : barre dans la plaque du nom, style violet, minuteur.
assert.ok(src.includes("soreal-idle-at-barre-v1") && src.includes("soreal-idle-at-remplissage-v1") && src.includes("setInterval(atTickIdleV1_,150)"));
console.log("idle-advanced-training-barres-v1: OK");
