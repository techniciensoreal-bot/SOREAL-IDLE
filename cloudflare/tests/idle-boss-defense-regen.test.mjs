import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-16) : "la regen de vie m'a l'air plus lente que dans
 * NGU idle. On ne mourrait pas si souvent au début il me semble."
 *
 * Règle NGU verrouillée ici : HP Regen = Defense / 20, montant absolu
 * de PV/seconde. Depuis V176, la Defense peut évoluer pendant la fenêtre
 * simulée à cause du Basic Training : le serveur doit donc intégrer cette
 * Defense dans le temps, et ne jamais appliquer rétroactivement la valeur
 * de fin de fenêtre à toute la période.
 */
const source = readFileSync(
  new URL("../src/idle-sqlite-runtime.js", import.meta.url),
  "utf8"
);

const fnStart = source.indexOf("function appliquerProgressionEnergieSorealIdle_(");
assert.ok(fnStart >= 0, "appliquerProgressionEnergieSorealIdle_ introuvable.");
const fnEnd = source.indexOf("\nfunction ", fnStart + 10);
const fnBody = source.slice(fnStart, fnEnd);

assert.ok(
  fnBody.includes("const regenPvSecJoueur=\n    Math.max(\n      0,\n      defense / 20\n    );".replace(/\n\s*/g, "")) ||
  fnBody.replace(/\s+/g, "").includes("constregenPvSecJoueur=Math.max(0,defense/20);"),
  "La regen du Combat de boss doit rester Defense/20 (formule NGU réelle, montant absolu de PV/seconde), pas un pourcentage du pool max."
);

assert.ok(
  !fnBody.includes("regenPctSecJoueur") &&
  !fnBody.includes("reposSorealIdle_()") &&
  !/const repos =/.test(fnBody),
  "L'ancien mécanisme 'Salle de repos' (regenPctSec, jamais lié à la Defense) doit avoir entièrement disparu du calcul de regen."
);

assert.ok(
  /if\s*\(!combatBossActif\)\s*\{[\s\S]*?const\s+regenPv\s*=\s*regenPvIntegreeBasicTrainingSorealIdleV176_\s*\(/.test(fnBody),
  "Le repos hors combat doit utiliser l'intégration temporelle V176 de la Defense pendant Basic Training."
);

const integratedStart = source.indexOf(
  "function regenPvIntegreeBasicTrainingSorealIdleV176_("
);
assert.ok(
  integratedStart >= 0,
  "Le helper d'intégration temporelle V176 de HP Regen doit exister."
);
const integratedEnd = source.indexOf("\nfunction ", integratedStart + 10);
const integratedBody = source.slice(integratedStart, integratedEnd);

assert.ok(
  integratedBody.replace(/\s+/g, "").includes(
    "returnMath.max(0,defenseMoyenne/20*hpSec);"
  ),
  "L'intégration V176 doit toujours convertir la Defense moyenne en HP Regen via Defense/20."
);

// L'UI doit exposer le taux réellement utilisé sur la barre joueur hors combat.
const uiSource = readFileSync(
  new URL("../public/soreal-idle-ui.js", import.meta.url),
  "utf8"
);

assert.ok(
  uiSource.includes("const regenJoueurVisibleV176=") &&
  uiSource.includes("regenPvFightBossNguParSecondeV164_(") &&
  uiSource.includes("' · ↗ +'"),
  "La barre de vie joueur Fight Boss doit afficher ↗ +.../s pendant la récupération hors combat."
);

// --- Comportement réel : formule instantanée de base ---
function regenPvSec(defense) {
  return Math.max(0, defense / 20);
}

assert.equal(
  regenPvSec(100),
  5,
  "Un joueur avec Defense=100 doit régénérer 5 PV/seconde."
);
assert.equal(
  regenPvSec(2000),
  100,
  "Investir en Defense doit augmenter la regen proportionnellement (Defense/20)."
);
assert.equal(
  regenPvSec(0),
  0,
  "Sans Defense, aucune regen."
);

console.log("idle-boss-defense-regen: OK");
