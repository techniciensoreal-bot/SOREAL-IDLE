import assert from "node:assert/strict";
import { normalizeIdleNguState, idleNguSnapshot, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-07) : écran de boot, choix de l'OS, énergie et magie à placer. La vue de la page (systemes.wandoosView) donne l'OS, les vitesses de Dump et le vrai démarrage du wiki
 * (« 1-hour boot-up », linéaire 0 -> 100 %, -10 % avec le set XL, -10 % par défi 100 Levels en Evil, minimum 27 min). Anti-spoil : seuls les OS DÉJÀ débloqués sont listés.
 */
const context = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };
const now = 100_000_000;
function etat(secondesDepuisRebirth) {
  let state = normalizeIdleNguState({}, context, now);
  state.adventure.unlockFlags.wandoos = true;
  state = normalizeIdleNguState(state, context, now);
  state.runStartedAt = now - secondesDepuisRebirth * 1000;
  return state;
}
const vue = (state) => idleNguSnapshot(state, context, now).wandoosView;

// Verrouillé : aucune vue (le champ vaut null, il ne révèle rien).
const ferme = normalizeIdleNguState({}, context, now);
assert.equal(idleNguSnapshot(ferme, context, now).wandoosView, null, "Wandoos verrouillé : pas de vue");

// Débloqué : OS 98 seul, sans MEH ni XL dans la liste.
let s = etat(0);
let v = vue(s);
assert.equal(v.os, "98");
assert.deepEqual(v.osDisponibles, ["98"], "anti-spoil : seuls les OS débloqués sont listés");
assert.equal(v.exigence, 1e9, "Wandoos 98, difficulté normale : 1e9 (wiki)");

// Démarrage du wiki : 1 h, linéaire.
assert.equal(v.bootSecondes, 3600, "boot de 1 h");
assert.equal(v.bootFraction, 0, "juste après le Rebirth : 0 %");
v = vue(etat(1800));
assert.ok(Math.abs(v.bootFraction - 0.5) < 1e-9 && Math.abs(v.bootEcoule - 1800) < 1e-6, "à mi-parcours : 50 %");
v = vue(etat(7200));
assert.equal(v.bootFraction, 1, "au-delà d'une heure : 100 %");

// Sets / défis : le set XL réduit le boot de 10 % (3 240 s).
s = etat(0);
s.adventure.setRewards = Object.assign({}, s.adventure.setRewards, { wandoosBootReductionPct: 0.10 });
assert.ok(Math.abs(vue(s).bootSecondes - 3240) < 1e-6, "set XL : 60 min x 0,9 = 54 min");

// MEH et XL apparaissent seulement une fois débloqués.
s = etat(0);
s.adventure.setRewards = Object.assign({}, s.adventure.setRewards, { wandoosMeh: true });
assert.deepEqual(vue(s).osDisponibles, ["98", "meh"], "MEH débloqué par le set Jake");
s.adventure.unlockFlags.wandoosXl = true;
assert.deepEqual(vue(s).osDisponibles, ["98", "meh", "xl"], "XL débloqué");

// Vitesse : proportionnelle à l'allocation (50 niveaux/s à l'exigence), nulle sans allocation, jamais au-delà de 50.
s = etat(7200);
s.systems.wandoos.allocation.energy = 0;
assert.equal(vue(s).vitesseEnergie, 0, "rien de placé : vitesse nulle");
s.systems.wandoos.allocation.energy = 1e6;
const petite = vue(s).vitesseEnergie;
assert.ok(petite > 0 && petite < 50, "un peu d'énergie : vitesse positive, sous le plafond");
s.systems.wandoos.allocation.energy = 1e12;
assert.equal(vue(s).vitesseEnergie, 50, "plafond de 50 niveaux par seconde");

// L'allocation est ABSOLUE (pas un pourcentage) : la page peut placer plus de 100 points.
s = etat(7200);
s.resources.energy.current = 5000;
s.resources.energy.cap = Math.max(5000, s.resources.energy.cap || 0);
s = normalizeIdleNguState(s, context, now);
s.resources.energy.current = 5000;
s.resources.energy.cap = Math.max(5000, s.resources.energy.cap || 0);
const apres = applyIdleNguAction(s, { action: "allocate", system: "wandoos", resource: "energy", value: 4000 }, context, now).state;
assert.equal(apres.systems.wandoos.allocation.energy, 4000, "4000 points placés (pas borné à 100)");
console.log("idle-wandoos-vue-v1: OK");
