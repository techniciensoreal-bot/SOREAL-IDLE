import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);
const runtime=readFileSync(
  new URL("../src/idle-sqlite-runtime.js",import.meta.url),
  "utf8"
);

const outgoingStart=ui.indexOf("Fight Boss suit le modèle NGU à drain continu");
const outgoingEnd=ui.indexOf("bossAvant>0 &&",outgoingStart);
assert.ok(outgoingStart>=0&&outgoingEnd>outgoingStart,"Bloc de drain continu joueur -> boss introuvable.");
const outgoing=ui.slice(outgoingStart,outgoingEnd);
assert.match(outgoing,/dps\s*\*\s*dt/,"Fight Boss doit appliquer le DPS au dt local.");
assert.doesNotMatch(outgoing,/coupsDusIdleV116_|IDLE_HIT_JOUEUR_MS_V116/,"Fight Boss ne doit plus attendre des impacts espacés.");

const incomingStart=ui.indexOf("Même règle côté joueur : Fight Boss est un drain continu");
const incomingEnd=ui.indexOf("idleEtat\.pvJoueur<=0",incomingStart);
assert.ok(incomingStart>=0&&incomingEnd>incomingStart,"Bloc de drain continu boss -> joueur introuvable.");
const incoming=ui.slice(incomingStart,incomingEnd);
assert.match(incoming,/recus-regenPvSecJoueurBossV1/,"La regen Defense/20 doit être intégrée au débit net.");
assert.match(incoming,/recusNet\s*\*\s*dt/,"Les dégâts reçus doivent être appliqués au dt local.");
assert.doesNotMatch(incoming,/coupsDusIdleV116_|IDLE_HIT_BOSS_MS_V116/,"Le boss ne doit plus frapper par paquets de 1 seconde.");

assert.match(
  ui,
  /element\.style\.setProperty\('transition','none','important'\)/,
  "La barre Fight Boss doit refléter les PV du frame courant sans interpolation retardée."
);
assert.match(
  ui,
  /requestAnimationFrame\(frameJeuV214_\)/,
  "Le rendu combat/ressources doit suivre les frames et ne plus être plafonné à 10 Hz."
);

assert.match(
  runtime,
  /const dommageBoss =[\s\S]{0,180}segment \*[\s\S]{0,80}dpsBossNet/,
  "Le serveur Fight Boss doit rester fondé sur un drain continu."
);

console.log("Fight Boss continuous drain parity: OK");
