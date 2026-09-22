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

const fightStart=ui.indexOf("function mettreAJourJeuIdleLocalV7_");
const fightEnd=ui.indexOf("\n      function ",fightStart+20);
assert.ok(fightStart>=0&&fightEnd>fightStart,"Bloc Fight Boss local introuvable.");
const fight=ui.slice(fightStart,fightEnd);
assert.match(fight,/dps\s*\*\s*dt/,"Fight Boss doit appliquer le DPS au dt local.");
assert.match(fight,/recus-regenPvSecJoueurBossV1/,"La regen Defense\/20 doit être intégrée au débit net.");
assert.match(fight,/recusNet\s*\*\s*dt/,"Les dégâts reçus doivent être appliqués au dt local.");
assert.doesNotMatch(fight,/coupsDusIdleV116_|IDLE_HIT_(?:JOUEUR|BOSS)_MS_V116/,"Fight Boss ne doit plus attendre des impacts espacés.");

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
