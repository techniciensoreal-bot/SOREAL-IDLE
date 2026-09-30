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
 * baisse des PV visiblement saccadée en Combat de boss numéroté. Retiré de la FONCTION JS (jamais
 * de transition:none inline ici) : c'est désormais le CSS qui décide, par élément (voir plus bas :
 * lissé pour le Combat de boss, net pour l'Aventure, qui doit garder ses coups espacés de 700ms
 * sans lissage -- Norman, 2026-09-30, correction du correctif du 09-29).
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

/*
 * Norman (2026-09-30) : « tu as également changé le comportement de la barre de vie des mobs en
 * mode aventure. Les coups sont nets en aventure [...] pour fight boss, ça descend
 * progressivement. Répare ça et attention à ne plus reproduire cette régression. » Le Combat de
 * boss numéroté (classes .soreal-idle-bossbar-v7/.soreal-idle-playerbar-v15, SANS override d'id)
 * doit rester lissé par la transition de base ; l'Aventure (mêmes classes, mais avec les ids
 * #sorealIdleAdventureFightBarV1/#sorealIdleAdventureJoueurBarV1 -- voir adventure-scene-v79.js)
 * doit retrouver son saut net d'origine (un coup toutes les 700ms, IDLE_ADVENTURE_FIGHT_HIT_MS_V1),
 * jamais lissé comme le Combat de boss (dégâts appliqués en continu, dt par dt, sans notion de
 * "coup"). Une règle sur la CLASSE réappliquerait le bug des deux côtés à la fois : elle doit
 * rester sur les deux IDS Aventure spécifiquement, jamais sur .soreal-idle-bossbar-v7/
 * .soreal-idle-playerbar-v15 en général.
 */
const css = readFileSync(new URL("../public/soreal-idle-ui.css", import.meta.url), "utf8");
assert.match(css, /\.soreal-idle-bossbar-v7\{[^}]*transition:width \.35s linear/, "transition de base attendue sur la barre de vie du boss (Combat de boss numéroté, lissé)");
assert.match(css, /\.soreal-idle-playerbar-v15\{[^}]*transition:width \.28s linear/, "transition de base attendue sur la barre de vie du joueur (Combat de boss numéroté, lissé)");
assert.ok(!/\.soreal-idle-bossbar-v7\{\s*transition:none\s*!important/.test(css), "la CLASSE ne doit jamais forcer transition:none (affecterait aussi le Combat de boss numéroté)");
assert.ok(!/\.soreal-idle-playerbar-v15\{\s*transition:none\s*!important/.test(css), "la CLASSE ne doit jamais forcer transition:none (affecterait aussi le Combat de boss numéroté)");
assert.match(
  css,
  /#sorealIdleAdventureFightBarV1,\s*#sorealIdleAdventureJoueurBarV1\{\s*transition:none !important;\s*\}/,
  "l'Aventure doit garder des coups nets (transition:none), ciblée par ID, jamais par la classe partagée"
);

console.log("Fight Boss continuous drain parity: OK");
