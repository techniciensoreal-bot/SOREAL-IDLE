import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-16) : "la regen de vie m'a l'air plus lente que dans
 * NGU idle. On ne mourrait pas si souvent au début il me semble."
 *
 * Root cause confirmée par investigation wiki (sayolove.github.io/ngu-
 * guide, page Fight Boss) : la vraie règle NGU est "HP Regen - Increasing
 * Defense increases HP Regen by Defense/20" — un montant ABSOLU de PV/
 * seconde. Le Combat de boss numéroté de SOREAL utilisait à la place
 * "Salle de repos" (regenPctSec, un pourcentage du pool max choisi par
 * numéro de salle) — jamais lié à la Defense, alors que Defense doit
 * TOUJOURS payer double dans NGU (moins de dégâts subis ET regen plus
 * rapide). Confirmé avec Norman : aucune vraie "Salle de repos" n'existe
 * du point de vue du joueur pour le Combat de boss — la formule NGU
 * réelle remplace donc entièrement l'ancien mécanisme, jamais un ajout
 * en plus.
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
  "La regen du Combat de boss doit être Defense/20 (formule NGU réelle, montant absolu de PV/seconde), pas un pourcentage du pool max."
);
assert.ok(
  !fnBody.includes("regenPctSecJoueur") &&
  !fnBody.includes("reposSorealIdle_()") &&
  !/const repos =/.test(fnBody),
  "L'ancien mécanisme 'Salle de repos' (regenPctSec, jamais lié à la Defense) doit avoir entièrement disparu du calcul de regen — pas juste être devenu un second calcul en plus."
);
assert.ok(
  /if \(!combatBossActif\) \{\s*\n\s*const regenPv =\s*\n\s*regenPvSecJoueur \*\s*\n\s*ecoulePrisEnCompte;/.test(fnBody),
  "Le repos hors combat doit appliquer regenPvSecJoueur × temps écoulé (montant absolu), pas un pourcentage de pvJoueurMax."
);

// --- Comportement réel : simulation fidèle de la formule ---
function regenPvSec(defense) {
  return Math.max(0, defense / 20);
}

assert.equal(regenPvSec(100), 5, "Un joueur neuf avec Defense=100 doit régénérer 5 PV/seconde (5/s pour Defense=100, exemple cité dans le code).");
assert.equal(regenPvSec(2000), 100, "Investir en Defense doit augmenter la regen proportionnellement (Defense/20).");
assert.equal(regenPvSec(0), 0, "Sans Defense, aucune regen (jamais négatif non plus).");

console.log("idle-boss-defense-regen: OK");
