import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  normalizeIdleNguState,
  advanceIdleNguState,
  applyIdleNguAction
} from "../src/idle-ngu-progression.js";
import { defiNiveaux100SnapshotV1 } from "../src/idle-ngu-snapshot.js";

/*
 * Défi des 100 niveaux (Norman, 2026-11-03) : le moteur expose le budget restant (systemes.defiNiveaux100) et chaque projection locale du client (Wandoos, Augmentations,
 * Machine temporelle, Blood Magic) puise dans le MÊME budget : jamais un niveau affiché que le moteur refuserait.
 */

/* ---------- Moteur ---------- */
const fresh = (context = {}, now = 1_000_000) => normalizeIdleNguState({}, context, now);
{
  const hors = fresh({ bosses: 100 }, 0);
  assert.deepEqual(defiNiveaux100SnapshotV1(hors), { actif: false }, "hors défi : rien d'autre (aucun spoil)");

  let state = fresh({ bosses: 100 }, 0);
  state.systems.ngu.data.ngus.normal.powerAlpha.level = 10;
  state = applyIdleNguAction(state, { action: "challenge", mode: "start", challenge: "hundredLevels" }, { bosses: 100 }, 10_000).state;
  assert.deepEqual(defiNiveaux100SnapshotV1(state), { actif: true, restants: 100 });
  state.challenge.hundredLevelsGained = 0;
  assert.deepEqual(defiNiveaux100SnapshotV1(state), { actif: true, restants: 100 });

  state.systems.augmentations.unlocked = true;
  state.systems.augmentations.data.trainUpgrade = false;
  state.resources.energy.power = 1e12;
  state.resources.energy.bars = 1e12;
  state.currencies.gold = 1e30;
  state = applyIdleNguAction(state, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 1e9 }, { bosses: 17 }, 20_000).state;
  const apres = advanceIdleNguState(state, 60, { bosses: 17 }, 20_000);
  const s = defiNiveaux100SnapshotV1(apres);
  assert.ok(apres.challenge.hundredLevelsGained > 0 && s.restants < 100, "le pool décroît quand on gagne des niveaux");
  assert.equal(s.restants, Math.max(0, 100 - apres.challenge.hundredLevelsGained));
  assert.ok(s.restants >= 0);
  apres.challenge.hundredLevelsGained = 100;
  assert.deepEqual(defiNiveaux100SnapshotV1(apres), { actif: true, restants: 0 }, "épuisé : 0");
  apres.challenge.hundredLevelsGained = 250;
  assert.equal(defiNiveaux100SnapshotV1(apres).restants, 0, "jamais négatif");
}
const snap = readFileSync(new URL("../src/idle-ngu-snapshot.js", import.meta.url), "latin1");
assert.ok(snap.includes("defiNiveaux100: defiNiveaux100SnapshotV1(state)"), "la pièce est envoyée dans l'état");

/* ---------- Client : utilitaire partagé ---------- */
function charger(piece) {
  const fen = { __SOREAL_IDLE_META_HOST_V130__: { getIdleEtat: () => ({ systemes: { defiNiveaux100: piece.v } }) } };
  vm.runInNewContext(readFileSync(new URL("../public/modules/defi-niveaux-100-v1.js", import.meta.url), "utf8"), { window: fen });
  return fen.__SOREAL_IDLE_DEFI100_V1__;
}
{
  const piece = { v: { actif: false } };
  const D = charger(piece);
  assert.equal(D.actif(), false);
  assert.equal(D.reste(), Infinity, "hors défi : aucun plafond");
  const h = {};
  assert.equal(D.plafond(h, "a"), Infinity);
  assert.equal(D.noter(h, "a", 500), 500);
  assert.equal(D.accorder(7), 7, "hors défi : tout est accordé");
}
{
  const piece = { v: { actif: true, restants: 0 } };
  const D = charger(piece);
  const h = {};
  assert.equal(D.reste(), 0);
  assert.equal(D.plafond(h, "wd:energy"), 0, "pool 0 : aucun niveau de plus (Wandoos)");
  assert.equal(D.plafond(h, "aug"), 0, "pool 0 : aucun niveau de plus (Augmentations)");
  assert.equal(D.plafond(h, "tm:speed"), 0, "pool 0 : aucun niveau de plus (Machine temporelle)");
  assert.equal(D.accorder(5), 0, "pool 0 : aucun rituel de plus (Blood Magic)");
}
{
  /* Pool 3 : au plus 3 niveaux affichés en tout, tous systèmes confondus. */
  const piece = { v: { actif: true, restants: 3 } };
  const D = charger(piece);
  const wd = {}, aug = {}, tm = {};
  let total = 0;
  const lieu = (h, cle, demande) => { const g = Math.min(demande, D.plafond(h, cle)); D.noter(h, cle, g); return g; };
  total += lieu(wd, "wd:energy", 2);
  total += lieu(aug, "scissors:main", 5) - 0;
  assert.equal(total, 3, "Wandoos 2 + Augmentations 1 = 3");
  assert.equal(lieu(tm, "tm:speed", 4), 0, "la Machine temporelle ne reçoit rien");
  assert.equal(D.accorder(2), 0, "Blood Magic non plus");
  assert.equal(D.reste(), 0);
  /* La même piste qui redemande plus ne dépasse pas ce qu'elle a déjà. */
  assert.equal(lieu(wd, "wd:energy", 9), 2);
  /* Nouveau repère (rebase) : le budget déjà puisé reste puisé. */
  D.nouveauRepere(aug, "scissors:main");
  assert.equal(D.plafond(aug, "scissors:main"), 0);
  /* Synchro suivante (pièce neuve, 1 restant) : compteurs remis à zéro, budget neuf. */
  piece.v = { actif: true, restants: 1 };
  assert.equal(D.reste(), 1);
  assert.equal(D.plafond(wd, "wd:energy"), 1);
  assert.equal(D.accorder(4), 1);
  assert.equal(D.reste(), 0);
}

/* ---------- Client : rejeu des Augmentations et câblage ---------- */
{
  const src = readFileSync(new URL("../public/modules/augmentations-page-v1.js", import.meta.url), "utf8");
  const a = src.indexOf("function rejouerCyclesAugmentIdleV1_(p){");
  const b = src.indexOf("window.__rejouerCyclesAugmentIdleV1__=");
  const c = src.indexOf("function rejouerCyclesAugmentPlafonneIdleV1_(p){");
  const d = src.indexOf("window.__rejouerCyclesAugmentPlafonneIdleV1__=");
  assert.ok(a > 0 && b > a && c > b && d > c);
  const R = new Function(src.slice(a, b) + "\n" + src.slice(c, d) + "\nreturn {f:rejouerCyclesAugmentIdleV1_,p:rejouerCyclesAugmentPlafonneIdleV1_};")();
  const base = { niv0: 0, sec0: 1, cout0: 1, expo: 1, reste0: 60, debites: 0, gold: 1e30 };
  const libre = R.f(base);
  assert.ok(libre.k > 5, "hors défi : plusieurs niveaux rejoués");
  assert.equal(R.f(Object.assign({}, base, { plafondK: Infinity })).k, libre.k, "plafond infini : inchangé");
  assert.equal(R.f(Object.assign({}, base, { plafondK: 0 })).k, 0, "pool 0 : aucun niveau");
  assert.equal(R.f(Object.assign({}, base, { plafondK: 3 })).k, 3, "pool 3 : 3 niveaux au plus");
  const lib2 = R.p(Object.assign({}, base, { sec0: 0.01 }));
  assert.ok(lib2.k > 5);
  assert.equal(R.p(Object.assign({}, base, { sec0: 0.01, plafondK: 0 })).k, 0, "barre CAP, pool 0 : aucun niveau");
  assert.equal(R.p(Object.assign({}, base, { sec0: 0.01, plafondK: 2 })).k, 2, "barre CAP, pool 2 : 2 niveaux");
}
{
  const lire = (f) => readFileSync(new URL("../public/" + f, import.meta.url), "utf8");
  const wd = lire("modules/wandoos-retro-v1.js");
  assert.ok(wd.includes("D100.plafond(b,cleD100)") && wd.includes("D100.noter(b,cleD100,gainD100)") && wd.includes("r.f=1"), "Wandoos puise dans le budget et reste plein");
  const tm = lire("modules/ui-machine-temporelle-v1.js");
  assert.ok(tm.includes("plafond:plafD100") && tm.includes("D100.noter(supportD100,cleD100,franchis)") && lire("modules/tm-projection-v1.js").includes("franchis>=plafond"), "Machine temporelle : budget partagé");
  const aug = lire("modules/augmentations-page-v1.js");
  assert.ok(aug.includes("if(franchis>=plafD100)") && aug.includes("plafondK:D100?D100.plafond(d,cleD100):Infinity"), "rebase des Augmentations et de la Machine temporelle : budget partagé");
  const bl = lire("modules/ui-boucle-v1.js");
  assert.ok(bl.includes("plafondK:plafondDefi") && bl.includes("__SOREAL_IDLE_DEFI100_V1__.accorder("), "tick des Augmentations et Blood Magic : budget partagé");
  const html = lire("index.html");
  assert.ok(html.includes("/modules/defi-niveaux-100-v1.js"), "module chargé");
}
console.log("idle-defi-100-niveaux-budget-v1: OK");
