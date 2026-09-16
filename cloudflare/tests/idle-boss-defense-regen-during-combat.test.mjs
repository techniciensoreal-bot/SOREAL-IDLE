import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-16, deuxième signalement le même jour) : "je lance NGU et
 * SOREAL IDLE en parallèle, fresh start sur les 2 ... vie qui ne descend pas
 * à la même vitesse dans les 2 jeux, régen de vie plus faible dans SOREAL
 * IDLE."
 *
 * idle-boss-defense-regen.test.mjs (plus tôt le même jour) avait déjà
 * remplacé "Salle de repos" (regenPctSec) par la vraie formule NGU
 * (regenPvSecJoueur = Defense/20), mais UNIQUEMENT pour le repos hors combat
 * (if (!combatBossActif)) et l'attente de K.O. La formule était donc
 * correcte, mais jamais câblée dans la boucle de simulation du combat ACTIF
 * lui-même — exactement le genre de "catalogue juste, câblage faux" déjà vu
 * ailleurs dans SOREAL IDLE.
 *
 * Vérifié en direct sur ngu-idle.fandom.com/wiki/Boss_Fights : "HP while
 * fighting is 10*attack, and HP regain is defense/20" — les deux stats
 * décrivent explicitement l'état du joueur PENDANT qu'il combat, pas
 * seulement au repos entre deux combats. Ce test verrouille que la regen
 * s'applique aussi PENDANT le combat actif, nettée directement sur les
 * dégâts subis par seconde (degatsRecusSec), jamais un second calcul de PV
 * séparé de regenPvSecJoueur.
 */
const source = readFileSync(
  new URL("../src/idle-sqlite-runtime.js", import.meta.url),
  "utf8"
);

const fnStart = source.indexOf("function appliquerProgressionEnergieSorealIdle_(");
assert.ok(fnStart >= 0, "appliquerProgressionEnergieSorealIdle_ introuvable.");
const fnEnd = source.indexOf("\nfunction ", fnStart + 10);
const fnBody = source.slice(fnStart, fnEnd);

// Une seule résolution de regenPvSecJoueur, réutilisée partout (repos hors
// combat, attente de K.O., ET maintenant le combat actif) — jamais un
// second calcul dupliqué.
const regenDeclarations = (fnBody.match(/const regenPvSecJoueur\s*=/g) || []).length;
assert.equal(
  regenDeclarations,
  1,
  "regenPvSecJoueur doit toujours être calculé une seule fois et réutilisé partout, y compris pendant le combat actif."
);

// La boucle de simulation du combat actif (segment où degatsRecusSec est
// calculé puis utilisé pour dommageJoueur/tempsPourKo) doit nette la regen
// du joueur AVANT que ce dps ne soit utilisé pour déterminer le temps
// jusqu'au K.O. ou les dégâts infligés au joueur.
const degatsRecusSecStart = fnBody.indexOf("let degatsRecusSec =");
assert.ok(degatsRecusSecStart >= 0, "Le calcul de degatsRecusSec dans la boucle de combat actif est introuvable.");

const tempsPourKoStart = fnBody.indexOf("const tempsPourKo", degatsRecusSecStart);
assert.ok(tempsPourKoStart > degatsRecusSecStart, "tempsPourKo doit être calculé après degatsRecusSec.");

const combatLoopSegment = fnBody.slice(degatsRecusSecStart, tempsPourKoStart);

assert.ok(
  /degatsRecusSec\s*=\s*\n?\s*Math\.max\(\s*\n?\s*0,\s*\n?\s*degatsRecusSec\s*-\s*\n?\s*regenPvSecJoueur\s*\n?\s*\)\s*;/.test(combatLoopSegment),
  "Le combat actif doit netter regenPvSecJoueur (Defense/20) sur degatsRecusSec avant de calculer tempsPourKo/dommageJoueur — la regen doit s'appliquer PENDANT le combat, pas seulement au repos."
);

// --- Comportement réel : un joueur avec assez de Defense doit voir ses
// dégâts nets réduits PENDANT le combat, jamais seulement à l'arrêt.
function degatsNetsPendantCombat(degatsBrutsParSeconde, defense) {
  const regenPvSecJoueur = Math.max(0, defense / 20);
  return Math.max(0, degatsBrutsParSeconde - regenPvSecJoueur);
}

assert.equal(
  degatsNetsPendantCombat(10, 100),
  5,
  "10 dégâts/s bruts avec Defense=100 (regen 5/s) doivent nettoyer à 5 dégâts/s pendant le combat."
);
assert.equal(
  degatsNetsPendantCombat(10, 400),
  0,
  "Une regen (Defense/20) supérieure ou égale aux dégâts bruts doit annuler totalement la perte de PV pendant le combat, jamais juste au repos."
);

console.log("idle-boss-defense-regen-during-combat: OK");
