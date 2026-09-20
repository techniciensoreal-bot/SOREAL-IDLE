import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);
const runtime=readFileSync(
  new URL("../src/idle-sqlite-runtime.js",import.meta.url),
  "utf8"
);

assert.match(
  ui,
  /function snapshotCombatFightBossIdleV173_\(\)[\s\S]*pvJoueur:[\s\S]*bossPv:[\s\S]*bossSelection:/
);
assert.match(
  ui,
  /raison:'defaite',[\s\S]{0,180}snapshot:snapshotCombatFightBossIdleV173_\(\)/
);
assert.match(
  ui,
  /idleEtat\.combatBossActif=false;[\s\S]{0,500}rafraichirCommandesFightBossIdleV167_\(\);[\s\S]{0,500}raison:'defaite'/
);
assert.match(
  ui,
  /raison:actif\?'reprise':'fuite',[\s\S]{0,160}snapshot:snapshotCombatFightBossIdleV173_\(\)/
);
assert.match(
  ui,
  /runner\.definirCombatBossSorealIdle\([\s\S]{0,240}commandeCombat\.snapshot/
);
assert.match(ui,/const regenBossParSecV172=/);
assert.match(ui,/idleEtat\.regenBoss/);
assert.ok(
  ui.includes("idleEtat.bossPv<") &&
  ui.includes("idleEtat.bossPvMax"),
  "La regen du boss hors combat doit rester bornée à ses PV max."
);
assert.match(
  ui,
  /if\(!idleEtat\.combatBossActif\)\{[\s\S]{0,180}rafraichirCommandesFightBossIdleV167_\(\)/
);

assert.match(
  runtime,
  /function definirCombatBossSorealIdle\([\s\S]{0,120}snapshot/
);
assert.match(
  runtime,
  /Rejouer TOUJOURS le temps écoulé avant de changer l'état Fight Boss[\s\S]{0,250}appliquerProgressionEnergieSorealIdle_/
);
assert.match(
  runtime,
  /snapshotMemeBoss[\s\S]{0,1800}c\.PV_JOUEUR[\s\S]{0,2200}c\.BOSS_PV/
);
assert.match(
  runtime,
  /c\.DERNIERE_SYNCHRO[\s\S]{0,180}new Date\(\)/
);
assert.match(
  runtime,
  /if \(!combatBossActif\)[\s\S]{0,900}pvJoueur \+ regenPv[\s\S]{0,1200}regenBossSecondeSorealIdle_/
);

console.log("Fight Boss stop/restart continuity: ok");
