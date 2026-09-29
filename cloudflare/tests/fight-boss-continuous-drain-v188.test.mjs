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

/*
 * Norman (2026-09-29) : « La barre de vie des boss rame quand elle diminue. Avant elle était très
 * fluide. » Le forçage transition:none ci-dessous avait un sens à 60 Hz (fréquence native, avant
 * le plafonnement du tick lourd à 15 Hz, 2026-09-28, pour les freezes iPhone/Safari) : assez de
 * marches par seconde pour paraître fluide sans transition. À 15 Hz, ce même forçage rend la
 * baisse des PV visiblement saccadée. Retiré : la transition CSS de .soreal-idle-bossbar-v7/
 * .soreal-idle-playerbar-v15 (soreal-idle-ui.css) fait maintenant tout le lissage -- même principe
 * que la barre d'Énergie/Magie (Beta 6.7, idle-energy-adventure-hp-v200.test.mjs), qui pose déjà
 * la largeur directement depuis la valeur connue sans transition:none ni interpolation inventée.
 */
const largeurBarreVieCombat = ui.slice(
  ui.indexOf("function largeurBarreVieCombatIdleV163_("),
  ui.indexOf("function texteCombatIdleV121_(")
);
assert.ok(largeurBarreVieCombat.length > 0, "largeurBarreVieCombatIdleV163_ introuvable");
assert.doesNotMatch(
  largeurBarreVieCombat,
  /element\.style\.setProperty\('transition','none','important'\)/,
  "La barre Fight Boss/Aventure doit laisser la transition CSS lisser sa largeur, comme l'Énergie/Magie."
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

// La transition CSS de base (jamais coupée par un !important plus loin) fait le lissage visuel.
const css = readFileSync(new URL("../public/soreal-idle-ui.css", import.meta.url), "utf8");
assert.match(css, /\.soreal-idle-bossbar-v7\{[^}]*transition:width \.35s linear/, "transition de base attendue sur la barre de vie du boss");
assert.match(css, /\.soreal-idle-playerbar-v15\{[^}]*transition:width \.28s linear/, "transition de base attendue sur la barre de vie du joueur");
assert.ok(!/\.soreal-idle-bossbar-v7\{\s*transition:none\s*!important/.test(css), "plus de transition:none forcée sur la barre du boss");
assert.ok(!/\.soreal-idle-playerbar-v15\{\s*transition:none\s*!important/.test(css), "plus de transition:none forcée sur la barre du joueur");
assert.ok(!css.includes("#sorealIdleAdventureFightBarV1,\n          #sorealIdleAdventureJoueurBarV1{\n            transition:none !important;"), "plus de transition:none forcée sur les barres d'Aventure non plus");

console.log("Fight Boss continuous drain parity: OK");
