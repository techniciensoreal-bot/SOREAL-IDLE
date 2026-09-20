import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

const start=ui.indexOf("V177 — une réponse de sauvegarde Basic Training");
assert.ok(start>=0,"V177 Basic Training recovery guard missing");

const fnStart=ui.lastIndexOf(
  "function appliquerEtatBasicTrainingIdleV120_",
  start
);
const fnEnd=ui.indexOf(
  "function envoyerAllocationsBasicTrainingIdleV120_",
  start
);
assert.ok(fnStart>=0&&fnEnd>start);

const fn=ui.slice(fnStart,fnEnd);
const guardEnd=fn.indexOf("return;",fn.indexOf("V177"))+7;
const guard=fn.slice(fn.indexOf("V177"),guardEnd);

assert.match(
  guard,
  /idleCombatEnPauseApresDefaiteV1[\s\S]{0,120}!idleEtat\.combatBossActif/
);

assert.doesNotMatch(guard,/joueur\.defense/);
assert.doesNotMatch(guard,/joueur\.endurance/);
assert.doesNotMatch(guard,/joueur\.basicTraining/);
assert.doesNotMatch(guard,/joueur\.pvJoueurMax/);

assert.match(guard,/rafraichirBasicTrainingIdleV120_\(\)/);
assert.match(guard,/pousserEtatVersRuntimePartageIdleV1_\(\)/);

console.log("Fight Boss Basic Training recovery isolation V177: OK");
