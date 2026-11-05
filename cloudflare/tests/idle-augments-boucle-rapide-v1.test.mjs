import assert from "node:assert/strict";
import { lireSrc } from "./_src-sources.mjs";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-05) : « simule énormément de Or et des sommes qui font aller très vite les barres ». 14 barres d'Augments à 1e8 d'Énergie chacune faisaient 12 à 20 s de calcul PAR appel
 * (les bonus étaient recalculés à chaque niveau, jusqu'à 10 000 fois par barre) : le serveur dépassait son temps de calcul et la partie devenait injouable. Les bonus sont calculés une fois par barre.
 */
const T0 = 1_800_000_000_000;
const ctx = { bosses: 140, basicTrainingEnergyAllocation: 0 };
let s = normalizeIdleNguState({}, ctx, T0);
s.currencies.gold = 1e30;
s.resources.energy.cap = 2e9; s.resources.energy.capNaturel = 2e9; s.resources.energy.power = 5e5; s.resources.energy.current = 2e9;
s.systems.augmentations.unlocked = true;
for (const p of Object.values(s.systems.augmentations.data.pairs)) { p.energy = 1e8; p.upgradeEnergy = 1e8; }
s.updatedAt = T0;
const t = Date.now();
/* 1 h hors ligne à toute vitesse : au plus 50 niveaux par seconde (wiki NGU Idle, page Energy, section Ticks ; Norman, 2026-11-05), soit 180 000 niveaux, bien au-delà de l'ancien plafond de 10 000 niveaux par appel */
s = advanceIdleNguState(s, 3600, ctx, T0 + 3600000);
const ms = Date.now() - t;
assert.ok(ms < 3000, "1 h de jeu à toute vitesse en moins de 3 s de calcul (mesuré : " + ms + " ms)");
const scissors = s.systems.augmentations.data.pairs.scissors;
assert.ok(scissors.level > 100000 && scissors.level <= 3600 * 50 + 1, "plus de plafond de 10 000 niveaux par appel (2026-10-24 : formules fermées, hors ligne compris) ET jamais plus de 50 niveaux par seconde : " + scissors.level);
assert.ok(s.currencies.gold < 1e30 && s.currencies.gold > 0, "l'Or est bien débité");

// Verrou orphelin : repris au bout de 20 s (voir idle-sqlite-runtime.js).
const src = lireSrc("idle-sqlite-runtime.js");
assert.ok(src.includes("Date.now()-__idleScriptLockDepuisV1>20000") && src.includes("__idleVerrouPerimeV1_();"));
console.log("idle-augments-boucle-rapide-v1: OK");

// Time Machine : même défaut (bonus recalculés à chaque niveau, 70 s de calcul pour 60 s de jeu).
{
  let m = normalizeIdleNguState({}, ctx, T0);
  m.currencies.gold = 1e30;
  for (const r of ["energy", "magic"]) { m.resources[r].cap = 2e9; m.resources[r].capNaturel = 2e9; m.resources[r].power = 5e5; m.resources[r].current = 2e9; }
  m.systems.timeMachine.unlocked = true; m.systems.timeMachine.allocation.energy = 1e9; m.systems.timeMachine.allocation.magic = 1e9;
  m.systems.bloodMagic.unlocked = true; m.updatedAt = T0;
  const t2 = Date.now();
  m = advanceIdleNguState(m, 60, ctx, T0 + 60000);
  assert.ok(Date.now() - t2 < 3000, "Time Machine à toute vitesse : calcul rapide");
  assert.ok(m.systems.timeMachine.data.speedLevel > 1000);
}
