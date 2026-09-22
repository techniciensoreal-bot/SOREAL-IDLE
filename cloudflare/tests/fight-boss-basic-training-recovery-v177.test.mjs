import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

const fnStart=ui.indexOf(
  "function appliquerEtatBasicTrainingIdleV120_"
);
const fnEnd=ui.indexOf(
  "function envoyerAllocationsBasicTrainingIdleV120_",
  fnStart
);
assert.ok(fnStart>=0&&fnEnd>fnStart,"V177 Basic Training recovery guard missing");

const fn=ui.slice(fnStart,fnEnd);
const guardStart=fn.indexOf("idleCombatEnPauseApresDefaiteV1");
assert.ok(guardStart>=0,"V177 Basic Training recovery guard missing");
const guardEnd=fn.indexOf("return;",guardStart)+7;
const guard=fn.slice(guardStart,guardEnd);

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
