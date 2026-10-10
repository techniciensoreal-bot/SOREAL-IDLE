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

/* Norman (2026-10-10) : la chronique du boss est accrochée au mur derrière la borne (cadre cliquable), plus sous les trois boutons ; sans chronique, le bouton Admin garde l'ancienne place (sous les boutons). */
const controls=ui.indexOf('<div class="soreal-idle-boss-controls-v39">');
const mur=ui.indexOf("${chroniqueMur?chronique:''}");
const ancienne=ui.indexOf("${chroniqueMur?'':chronique}",controls);
assert.ok(
  mur>=0&&mur<controls&&ancienne>controls,
  "La chronique du boss est au mur, derrière la borne (et le repli Admin reste sous les boutons)."
);

/* Norman (2026-09-27) : le titre reste affiché, mais n'est plus prononcé par le narrateur (redondant avec le nom du boss juste après). */
assert.match(ui,/soreal-idle-boss-lore-title-v168" data-soreal-tts-ignore>Chronique du boss/);
assert.match(ui,/soreal-idle-boss-lore-name-v184/);
assert.match(css,/color:#d8ad50/);
assert.match(css,/font-family:Georgia,"Palatino Linotype","Book Antiqua",Palatino,serif/);
assert.match(ui,/soreal-idle-boss-lore-ornament-v184" data-soreal-tts-ignore>✦ ❦ ✦/);

console.log("Fight Boss no phantom kill + grimoire lore V184: OK");
