import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);
const index=readFileSync(
  new URL("../public/index.html",import.meta.url),
  "utf8"
);

const helperStart=ui.indexOf("function animerBarreBasicTrainingIdleV220_");
const helperEnd=ui.indexOf("function allocationsBasicTrainingIdleV120_",helperStart);
assert.ok(helperStart>=0&&helperEnd>helperStart,"L'animateur Basic Training V220 doit exister.");
const helper=ui.slice(helperStart,helperEnd);

assert.match(helper,/Math\.min\(\s*50,/,"La vitesse visuelle Basic Training doit rester plafonnée à 50 Hz.");
assert.match(helper,/1000\s*\/\s*speed/,"Un cycle visuel doit durer exactement 1000/vitesse ms.");
assert.match(
  helper,
  /\{transform:'scaleX\(0\)',offset:0\}[\s\S]*\{transform:'scaleX\(1\)',offset:\.72\}[\s\S]*\{transform:'scaleX\(1\)',offset:\.98\}[\s\S]*\{transform:'scaleX\(0\)',offset:1\}/,
  "Chaque tick Basic Training doit atteindre visiblement 100 % avant de repartir à 0."
);

const progressStart=ui.indexOf("function progresserBasicTrainingLocalIdleV120_");
const progressEnd=ui.indexOf("function actualiserDeblocagesBasicTrainingLocalIdleV120_",progressStart+50);
const progress=ui.slice(progressStart,progressEnd>progressStart?progressEnd:progressStart+18000);
assert.match(progress,/animerBarreBasicTrainingIdleV220_\(/,"Le ticker Basic Training doit utiliser l'animateur V220.");
assert.doesNotMatch(progress,/void bar\.offsetWidth/,"Le ticker ne doit plus forcer un reflow à chaque niveau.");
assert.doesNotMatch(
  progress,
  /largeurBarreCombatIdleV121_\(\s*bar,\s*skill\.progress\*100/,
  "La progression mécanique ne doit plus tronquer la barre au dernier frame avant 100 %."
);

assert.ok(index.includes("/soreal-idle-ui.js?v=283"),"Le shell doit charger une révision UI cache-bustée.");

console.log("idle Basic Training full visual ticks V220: OK");
