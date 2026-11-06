import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/*
 * Audit d'architecture (2026-10-16) : les scripts, feuilles de style et le dictionnaire sont servis « immutable » (cloudflare/public/_headers). Un fichier modifié
 * doit donc changer de ?v=N : cloudflare/tools/maj-pins.mjs le fait (empreinte de chaque fichier dans cloudflare/tools/pins-assets.json) ; ce test échoue si on l'oublie.
 */
try {
  execFileSync("node", ["cloudflare/tools/maj-pins.mjs", "--verifier"], { stdio: "pipe" });
} catch (e) {
  assert.fail("numéros ?v=N pas à jour : lancer `node cloudflare/tools/maj-pins.mjs`\n" + String(e.stderr || e.message));
}
const headers = readFileSync("cloudflare/public/_headers", "utf8");
for (const chemin of ["/modules/*", "/soreal-idle-*.js", "/soreal-idle-*.css", "/standalone-bridge.js"]) {
  const i = headers.indexOf("\n" + chemin + "\n");
  assert.ok(i >= 0 && /immutable/.test(headers.slice(i, i + 160)), chemin + " : cache long immuable");
}
/* index.html lui-même ne doit PAS être immuable (il porte les numéros) */
/* (une règle pour / ou /index.html est admise tant qu'elle ne touche PAS au cache : l'en-tête Document-Policy du profileur de la mesure de référence en est une) */
const lignes = headers.split(String.fromCharCode(10));
lignes.forEach((l, k) => { if (l === "/" || l === "/index.html") { for (let m = k + 1; m < lignes.length && lignes[m].startsWith("  "); m += 1) assert.ok(lignes[m].toLowerCase().indexOf("cache-control") < 0, "index.html reste revalidé à chaque chargement : aucune règle de cache pour " + l); } });
console.log("idle-pins-assets-v1: OK");
