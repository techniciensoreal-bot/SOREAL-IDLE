import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const runtime=readFileSync(
  new URL("../src/idle-sqlite-runtime.js",import.meta.url),
  "utf8"
);
const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);
const css=readFileSync(
  new URL("../public/soreal-idle-ui.css",import.meta.url),
  "utf8"
);

const progressionStart=runtime.indexOf("function appliquerProgressionEnergieSorealIdle_");
const progressionEnd=runtime.indexOf("\nfunction contexteMetaNguSorealIdle_",progressionStart);
const progression=runtime.slice(progressionStart,progressionEnd);

assert.match(
  progression,
  /!combatBossActif\s*&&\s*bossPv<=1e-9[\s\S]{0,120}bossPv=bossPvMax/,
  "Un 0 PV résiduel hors combat doit être réparé, jamais crédité comme victoire."
);

assert.doesNotMatch(
  progression,
  /combatBossActif\s*\|\|\s*bossPv\s*<=\s*0\.0001/,
  "La simulation ne doit jamais entrer uniquement parce que bossPv vaut 0."
);

const fightLoopAnchor=progression.indexOf("iterations < 2000");
assert.ok(fightLoopAnchor>=0,"Boucle Fight Boss absente.");
const whileHead=progression.slice(
  Math.max(0,fightLoopAnchor-180),
  fightLoopAnchor+360
);
assert.match(
  whileHead,
  /combatBossActif/,
  "La boucle de dégâts Fight Boss doit exiger un combat actif."
);

const startApi=runtime.indexOf("function definirCombatBossSorealIdle(");
const nukeApi=runtime.indexOf("function nukerBossSorealIdle(",startApi);
const startBody=runtime.slice(startApi,nukeApi);

assert.match(
  startBody,
  /Boolean\(actif\)[\s\S]{0,120}snapshotCombat[\s\S]{0,120}!snapshotMemeBoss[\s\S]{0,260}obsolete:true/,
  "Un Start ancien visant le boss précédent doit être ignoré."
);

const setActive=startBody.indexOf("stats.combatBossActif =");
const staleGuard=startBody.indexOf("obsolete:true");
assert.ok(
  staleGuard>=0&&setActive>staleGuard,
  "Le garde Start obsolète doit s'exécuter avant toute activation du combat."
);

const nukeClientStart=ui.indexOf("function nukerBossIdleV1_");
const nukeClientEnd=ui.indexOf("\n      window.__nukerBossIdleV1__",nukeClientStart);
const nukeClient=ui.slice(nukeClientStart,nukeClientEnd);
assert.match(
  nukeClient,
  /idleFastPendingV60\.combat=null;[\s\S]{0,220}idleEtat\.combatBossActif=false;/,
  "NUKE doit supprimer toute intention Fight/Fuite locale en attente."
);
assert.match(
  nukeClient,
  /idleEtat=\s*res\.joueur;[\s\S]{0,240}idleEtat\.combatBossActif=false;/,
  "Après NUKE, la réponse autoritaire doit rester explicitement hors combat."
);

const controls=ui.indexOf('<div class="soreal-idle-boss-controls-v39">');
const lore=ui.indexOf("${histoireBossMarkupIdleV142_(j)}",controls);
assert.ok(
  controls>=0&&lore>controls,
  "La chronique du boss doit rester sous les trois boutons."
);

assert.match(ui,/soreal-idle-boss-lore-title-v168">Chronique du boss/);
assert.match(ui,/soreal-idle-boss-lore-name-v184/);
assert.match(css,/color:#d8ad50/);
assert.match(css,/font-family:Georgia,"Palatino Linotype","Book Antiqua",Palatino,serif/);
assert.match(ui,/soreal-idle-boss-lore-ornament-v184">✦ ❦ ✦/);

console.log("Fight Boss no phantom kill + grimoire lore V184: OK");
