import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

const start=ui.indexOf("if(id==='spendExp'){");
const end=ui.indexOf("if(id==='setsZones')",start);

assert.ok(start>=0&&end>start,"Branche de visibilité EXP Shop introuvable.");

const block=ui.slice(start,end);

assert.match(
  block,
  /j\.systemes&&[\s\S]*?j\.systemes\.records&&[\s\S]*?highestBoss[\s\S]*?>=1/,
  "EXP Shop doit dépendre du record permanent du premier boss vaincu."
);

assert.doesNotMatch(
  block,
  /currencies[\s\S]*?experience[\s\S]*?>0/,
  "EXP Shop ne doit jamais dépendre du solde EXP courant."
);

console.log("EXP Shop permanent unlock: OK");
