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

/*
 * Régression V220 — à 15 Hz sur un écran 60 Hz, une animation linéaire
 * 0 -> 100 % de 66,7 ms est souvent échantillonnée visuellement à
 * 0/25/50/75 %, puis reboucle avant qu'un frame ne montre 100 %.
 * Les extrémités doivent donc disposer d'une vraie fenêtre d'affichage
 * sans changer la durée totale du tick.
 */
assert.match(
  ui,
  /data-idle-aug-bar-v215=/,
  "Les barres Augmentations doivent être reliées à l'animateur temps réel."
);
assert.match(
  ui,
  /\{transform:'scaleX\(0\)',offset:0\}[\s\S]{0,180}\{transform:'scaleX\(0\)',offset:\.08\}[\s\S]{0,180}\{transform:'scaleX\(1\)',offset:\.72\}[\s\S]{0,180}\{transform:'scaleX\(1\)',offset:\.98\}[\s\S]{0,180}\{transform:'scaleX\(0\)',offset:1\}/,
  "Un tick doit rendre visibles 0 % et 100 % avant le reset."
);
assert.match(
  ui,
  /duration=Math\.max\(20,seconds\*1000\)/,
  "La durée du cycle doit rester exactement liée à la durée réelle du niveau, plafonnée à 50 Hz."
);
assert.ok(
  index.includes("/soreal-idle-ui.js?v=288"),
  "Le shell doit forcer le chargement d'une révision cache-bustée après V213."
);

console.log("idle augmentation visible full tick V220: OK");
