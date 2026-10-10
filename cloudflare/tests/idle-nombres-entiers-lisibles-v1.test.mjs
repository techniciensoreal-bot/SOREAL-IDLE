import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-10) : « partout dans le jeu, quand 1 million ne s'écrit pas 1M (la barre d'énergie, par exemple), écris-le 1.000.000 pour une meilleure lisibilité ».
 * Les chiffres écrits en entier (barres d'énergie, magie et 3e ressource, Basic Training, niveaux d'Augments) portent des points entre les milliers.
 */
const win = {};
vm.runInNewContext(readFileSync("cloudflare/public/modules/number-format-v1.js", "utf8"), { window: win });
const f = win.__SOREAL_IDLE_NUMBER_FORMAT_V1__.entierLisible;
assert.equal(f(1000000), "1.000.000");
assert.equal(f(10000000), "10.000.000");
assert.equal(f(999), "999");
assert.equal(f(1000), "1.000");
assert.equal(f(123456789), "123.456.789");
assert.equal(f(1234.9), "1.234", "partie entière");
assert.equal(f(0), "0");
assert.equal(f(-4500), "-4.500");
assert.equal(f("abc"), "0");
// Les mêmes chiffres, ailleurs, restent en notation courte (1M) : seul l'entier écrit en toutes lettres change.
assert.equal(win.__SOREAL_IDLE_NUMBER_FORMAT_V1__.grandNombre(1000000), "1M");

const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("function formatEnergieIdleV50_(v){\n        return formatEntierLisibleIdleV1_("), "énergie, magie, 3e ressource");
assert.ok(!ui.includes("idleEntier_(maxTotal)") && ui.includes("${formatEntierLisibleIdleV1_(j.energieMax)}"), "maximum de la barre d'énergie");
assert.ok(ui.includes("${formatEntierLisibleIdleV1_(skill.allocation)} ⚡") && ui.includes("${formatEntierLisibleIdleV1_(skill.cap)}"), "Basic Training");
assert.ok(ui.includes("ecrireSiChangeIdleV1_(nivEl,formatEntierLisibleIdleV1_(nivAffiche));"), "niveau d'Augment mis à jour en direct");
assert.ok(readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8").includes("entierLisible(level)"), "niveau d'Augment affiché à l'ouverture");
console.log("idle-nombres-entiers-lisibles-v1: OK");
