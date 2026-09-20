import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);
const adventure=readFileSync(
  new URL("../src/idle-adventure-v47.js",import.meta.url),
  "utf8"
);

const regenStart=ui.indexOf("function regenReposAdventureIdleV3_");
const regenEnd=ui.indexOf("function facteurAleatoireDegatsAdventureIdleV2_",regenStart);
assert.ok(regenStart>=0&&regenEnd>regenStart,"Fonction de regen Adventure introuvable.");
const regenBlock=ui.slice(regenStart,regenEnd);

assert.match(
  regenBlock,
  /zoneCourante==='safe'[\s\S]*?safeZoneRegen10x\?10:5/,
  "La Safe Zone doit garder le multiplicateur x5/x10."
);
assert.match(
  regenBlock,
  /return total;\s*\}/,
  "Hors Safe Zone, la regen entre deux combats doit rester la regen normale."
);
assert.doesNotMatch(
  regenBlock,
  /return total\*2/,
  "Le multiplicateur SOREAL x2 hors combat ne doit jamais revenir."
);

const finishStart=ui.indexOf("function terminerCombatAdventureLocalV2_");
const finishEnd=ui.indexOf("function progresserZoneFightLocalIdleV1_",finishStart);
const finishBlock=ui.slice(finishStart,finishEnd);
assert.match(
  finishBlock,
  /idleEtat\.adventureRestPv=Math\.max\(0,idleNombre_\(fight\.playerHp\)\)/,
  "Après une victoire, les PV restants doivent partir des PV réellement conservés."
);

assert.match(
  ui,
  /action:'startZoneFight',[\s\S]{0,180}restHp:idleEtat&&idleEtat\.adventureRestPv/,
  "Le combat suivant doit recevoir les PV régénérés progressivement."
);
assert.match(
  adventure,
  /ctx\.restHp!=null\?C\(N\(ctx\.restHp\),0,playerHpMax\):playerHpMax/,
  "Le serveur doit démarrer le combat suivant avec restHp quand il est fourni."
);

console.log("Adventure post-kill progressive HP regen: OK");
