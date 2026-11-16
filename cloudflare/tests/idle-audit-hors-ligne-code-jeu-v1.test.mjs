import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState, idleNguTimeMachineGoldPerSecond } from "../src/idle-ngu-progression.js";
import { barbesTempsPleinV1 } from "../src/idle-ngu-pistes.js";

/*
 * Audit du code du jeu (build 1260, 2026-11-16, design/audit-code-jeu/hors-ligne.md) : écarts E1 (Or en tête), E3 (barbes : secondes barre pleine), E5 (Entraînement avancé borné à la cible),
 * E6 (hack final à demi-vitesse : voir idle-the-end-v1), E4 (titans : voir idle-titan-autokill-offline).
 */
const ctx = { bosses: 100, basicTrainingComplete: true };

/* E1 : une absence longue crédite l'Or de la Time Machine EN TÊTE (niveaux d'avant l'absence), avant que les autres systèmes dépensent. */
{
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.timeMachine.unlocked = true;
  const d = s.systems.timeMachine.data;
  d.bestGoldThisRun = 1000;
  d.highestBossEver = 100;
  s.currencies.gold = 0;
  const gps = idleNguTimeMachineGoldPerSecond(s);
  assert.ok(gps > 0, "la Time Machine produit de l'Or");
  const r = advanceIdleNguState(structuredClone(s), 3600, ctx, 3_600_000);
  /* la production est créditée avec les niveaux d'AVANT l'absence (aucun niveau de vitesse n'était acheté) : exactement gps x secs en Or produit */
  assert.ok(Math.abs(r.systems.timeMachine.data.producedThisRun - gps * 3600) / (gps * 3600) < 1e-6, "Or produit = gps d'avant x secondes : " + r.systems.timeMachine.data.producedThisRun + " / " + gps * 3600);
}

/* E3 : secondes passées barre pleine = clamp(secs - ceil((cap - courante) / énergie par seconde), 0, secs). */
{
  const s = normalizeIdleNguState({}, ctx, 0);
  s.resources.energy.cap = 1000;
  s.resources.energy.current = 1000;
  assert.equal(barbesTempsPleinV1(s, 5000).energy, 5000, "déjà pleine : toute l'absence");
  s.resources.energy.current = 0;
  const tp = barbesTempsPleinV1(s, 5000).energy;
  assert.ok(tp > 0 && tp < 5000, "vide au départ : une partie seulement de l'absence (" + tp + ")");
  assert.equal(barbesTempsPleinV1(s, 5).energy, 0, "absence trop courte pour remplir : aucune seconde barre pleine");
}

/* E5 : Entraînement avancé hors ligne borné à la cible. */
{
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.advancedTraining.unlocked = true;
  s.resources.energy.cap = 1e12;
  s.resources.energy.current = 1e12;
  s.resources.energy.power = 1e12;
  const a = applyIdleNguAction(s, { action: "allocateAdvancedTraining", track: "power", value: 1e12 }, ctx, 1000).state;
  a.systems.advancedTraining.data.tracks.power.target = 5;
  const r = advanceIdleNguState(a, 24 * 3600, ctx, 1000 + 24 * 3600 * 1000);
  assert.ok(r.systems.advancedTraining.data.tracks.power.tempLevel <= 5, "niveau borné à la cible : " + r.systems.advancedTraining.data.tracks.power.tempLevel);
}

/* E2 : ITOPOD hors ligne avec « Filter Boosts into Infinity Cube! » : AUCUN objet de boost ; la puissance ET la robustesse du cube gagnent capAttack[boost du palier] x kills / 8 x bonus / (100 / diviseur x 2) (Character::adventureOfflineProgress). */
{
  const ctxI = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 100 };
  const faire = (filtre) => {
    let s = normalizeIdleNguState({}, ctxI, 1_000_000);
    s.systems.tower.unlocked = true;
    s.systems.tower.data.highestFloor = 120;
    s.adventure.inventory = s.adventure.inventory.filter((i) => i.kind !== "boost");
    if (filtre) { s.selloutShop = s.selloutShop || { purchases: {} }; s.selloutShop.purchases = s.selloutShop.purchases || {}; s.selloutShop.purchases.filterBoostsIntoCube = 1; }
    const p0 = s.adventure.cube.power, t0 = s.adventure.cube.toughness;
    s = advanceIdleNguState(s, 3600, ctxI, 1_000_000 + 3600 * 1000);
    return { s, p0, t0 };
  };
  const avec = faire(true), sans = faire(false);
  const d = avec.s.systems.tower.data;
  assert.ok(d.kills > 100, "des kills ont eu lieu : " + d.kills);
  assert.equal(avec.s.adventure.inventory.filter((i) => i.kind === "boost").length, 0, "aucun objet de boost hors ligne");
  assert.equal(sans.s.adventure.inventory.filter((i) => i.kind === "boost").length, 0, "sans filtre : aucun objet de boost non plus");
  assert.equal(sans.s.adventure.cube.power, sans.p0, "sans filtre : le cube ne change pas");
  const tier = Math.max(1, Math.floor(d.floor / 50) + 1);
  const force = tier <= 9 ? [1, 2, 5, 10, 20, 50, 100, 200, 500][tier - 1] : tier <= 14 ? 1000 : tier <= 17 ? 2000 : tier <= 23 ? 5000 : 10000;
  const attendu = (force * d.kills / 8) * 0.01 / 2;
  const gain = avec.s.adventure.cube.power - avec.p0;
  assert.ok(gain > 0 && Math.abs(gain - attendu) / attendu < 1e-6, "gain du cube " + gain + " attendu " + attendu);
  assert.equal(avec.s.adventure.cube.toughness - avec.t0, gain, "la robustesse gagne autant que la puissance");
}

/* Longue absence (le jeu borne l'écart à 1 an, sans plafond de niveaux ni de victoires) : plus aucun plafond silencieux. */
{
  const AN = 365 * 24 * 3600;
  /* Titans : plus de plafond de 2 000 cycles ; la récompense par victoire est la même qu'en 10 jours. */
  const ctxT = { bosses: 300, adventurePower: 5000, adventureToughness: 5000, difficulty: "extreme" };
  const lancer = (secs) => {
    let s = normalizeIdleNguState(null, ctxT, 1000);
    s.difficulty = "extreme";
    return advanceIdleNguState(s, secs, ctxT, 1000 + secs * 1000);
  };
  const dix = lancer(10 * 24 * 3600), an = lancer(AN);
  assert.ok(an.adventure.titans.t1.kills > 8000 && an.adventure.titans.t1.kills <= 8761, "GRB : un kill par heure pendant un an : " + an.adventure.titans.t1.kills);
  const parKill = (x) => x.adventure.permanent.experience / x.adventure.titans.t1.kills;
  assert.ok(Math.abs(parKill(an) - parKill(dix)) / parKill(dix) < 1e-9, "même EXP par victoire en 10 jours et en 1 an");
  /* Time Machine, Blood Magic : pas de plafond de 100 000 niveaux / 1 000 000 rituels. */
  const ctxM = { bosses: 300, unlockFlags: {}, basicTrainingComplete: true };
  let m = normalizeIdleNguState({}, ctxM, 1000);
  m.resources.energy.cap = 1e15; m.resources.energy.current = 1e14; m.resources.energy.power = 1e9;
  m.resources.magic.cap = 1e15; m.resources.magic.current = 1e14; m.resources.magic.power = 1e9;
  m.currencies.gold = 1e60;
  m.systems.timeMachine.unlocked = true; m.systems.bloodMagic.unlocked = true;
  m = applyIdleNguAction(m, { action: "allocate", system: "timeMachine", resource: "energy", value: 1e9 }, ctxM, 2000).state;
  m = applyIdleNguAction(m, { action: "allocate", system: "bloodMagic", resource: "magic", value: 1e12 }, ctxM, 2001).state;
  const t0 = performance.now();
  const r = advanceIdleNguState(m, AN, ctxM, 3000 + AN * 1000);
  assert.ok(performance.now() - t0 < 5000, "un an d'absence se calcule en forme fermée (< 5 s)");
  assert.ok(r.systems.timeMachine.data.speedLevel > 1000000, "Time Machine : plus de plafond de 100 000 niveaux : " + r.systems.timeMachine.data.speedLevel);
  const rituels = Object.values(r.systems.bloodMagic.data.rituals).reduce((a, x) => a + x.completions, 0);
  assert.ok(rituels > 1000000, "Blood Magic : plus de plafond de 1 000 000 rituels : " + rituels);
}

/* Câblage (E1, E4) lisible dans les sources. */
{
  const sys = fs.readFileSync(new URL("../src/idle-ngu-systemes.js", import.meta.url), "utf8");
  assert.ok(sys.indexOf("crediterOrHorsLigneV1(state, secs)") < sys.indexOf("advanceGeneratedResources(state, secs, context)"), "l'Or est crédité avant toute autre passe");
  const zones = fs.readFileSync(new URL("../src/idle-adventure-zones.js", import.meta.url), "utf8");
  assert.ok(zones.includes("cooldown:7.5*H"), "Amalgamate : 27 000 s");
}

console.log("idle-audit-hors-ligne-code-jeu-v1: OK");
