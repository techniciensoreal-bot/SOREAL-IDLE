import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);
const runtime=readFileSync(
  new URL("../public/modules/runtime.js",import.meta.url),
  "utf8"
);
const repair=readFileSync(
  new URL("../public/modules/interaction-repair-v79.js",import.meta.url),
  "utf8"
);

const defeatStart=ui.indexOf("idleEtat.pvJoueur<=0");
const defeatEnd=ui.indexOf("}else if(",defeatStart);
assert.ok(defeatStart>=0&&defeatEnd>defeatStart,"Fight Boss defeat branch missing");
const defeat=ui.slice(defeatStart,defeatEnd);

assert.match(defeat,/idleEtat\.pvJoueur=0;/);
assert.match(defeat,/idleEtat\.combatBossActif=false;/);
assert.match(defeat,/raison:'defaite'/);
assert.doesNotMatch(
  defeat,
  /synchroniserJeuIdleV7_\(true\)/,
  "Defeat must persist STOP before any forced reconciliation."
);

assert.match(
  ui,
  /!idleEtat\.combatBossActif[\s\S]{0,180}idleCombatEnPauseApresDefaiteV1[\s\S]{0,180}joueurServeur\.combatBossActif[\s\S]{0,180}memeBossServeurV167[\s\S]{0,120}return true;/,
  "A stale active-combat response must be ignored after local defeat."
);

assert.match(
  ui,
  /pvJoueurLocalReposV174[\s\S]{0,900}bossPvLocalReposV174[\s\S]{0,1800}pvJoueur:pvJoueurLocalReposV174[\s\S]{0,300}bossPv:bossPvLocalReposV174/,
  "Live out-of-combat HP must survive network reconciliation for both sides."
);

assert.match(ui,/const bossEnRegenV174=/);
assert.match(ui,/idleEtat\.regenBoss/);
assert.match(ui,/↗ \+/);

assert.match(
  runtime,
  /if\(!force&&state\)return Promise\.resolve\(state\);/,
  "Auxiliary runtime must reuse pushed live state instead of polling every 2 seconds."
);
assert.doesNotMatch(
  runtime,
  /!force&&state&&Date\.now\(\)-stateAt<CACHE_MS/,
  "The former 2-second polling gate must not return."
);
assert.match(runtime,/function invalidate_\(\)\{state=null;stateAt=0;\}/);

const repairStart=repair.indexOf("function repairBossButton_");
const repairEnd=repair.indexOf("\n  function render_",repairStart);
const repairBody=repair.slice(repairStart,repairEnd);
assert.ok(repairStart>=0&&repairEnd>repairStart);
assert.doesNotMatch(
  repairBody,
  /button\.disabled=false/,
  "Auxiliary interaction repair must never re-enable Fight."
);

console.log("Fight Boss live recovery V174: OK");
