import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

/*
 * Filet de sécurité du chantier de nettoyage (docs/CHANTIER-NETTOYAGE.md, lot 1a). Le 7 octobre 2026, en retouchant Blood Magic, trois fonctions exposées sur window
 * (__ajusterBloodMagicIdleV1__, __viderBloodMagicIdleV1__, __ajusterRituelBloodMagicIdleV1__) ont été perdues : plus aucun bouton ne répondait, et aucun test ne cassait.
 * Ce test lit TOUS les scripts publics et vérifie que chaque fonction appelée par un attribut on...= (onclick, onchange...) d'un HTML généré est bien définie quelque part.
 */
function analyser(textes) {
  const defs = new Set();
  const appels = new Map();
  for (const [fichier, t] of textes) {
    for (const m of t.matchAll(/window\.(__[A-Za-z0-9_$]+__)\s*=(?!=)/g)) defs.add(m[1]);
    for (const m of t.matchAll(/window\[['"](__[A-Za-z0-9_$]+__)['"]\]\s*=(?!=)/g)) defs.add(m[1]);
    for (const m of t.matchAll(/defineProperty\(\s*window\s*,\s*['"](__[A-Za-z0-9_$]+__)['"]/g)) defs.add(m[1]);
    for (const ligne of t.split("\n")) {
      if (!/on(click|change|input|blur|focus|submit|keydown|keyup|pointerdown|pointerup|mousedown|dblclick|contextmenu|dragstart|dragover|drop)=/.test(ligne)) continue;
      for (const m of ligne.matchAll(/window\.(__[A-Za-z0-9_$]+__)\(/g)) {
        if (!appels.has(m[1])) appels.set(m[1], new Set());
        appels.get(m[1]).add(fichier);
      }
    }
  }
  return { defs, appels, manquants: [...appels.keys()].filter((n) => !defs.has(n)) };
}

// 0. L'analyseur détecte bien la panne qu'il doit attraper (sans quoi le test ne protégerait de rien).
{
  const faux = [["a.js", "const h='<button onclick=\"window.__perdue__(1)\">x</button>'; window.__presente__=function(){};"], ["b.js", "const k='<button onclick=\"window.__presente__()\">y</button>';"]];
  const r = analyser(faux);
  assert.deepEqual(r.manquants, ["__perdue__"], "une fonction appelée mais jamais définie est signalée");
  assert.ok(r.defs.has("__presente__") && r.appels.has("__presente__"));
}

// 1. Le dépôt réel : aucun bouton n'appelle une fonction inexistante.
const dir = "cloudflare/public/";
const fichiers = [dir + "soreal-idle-ui.js", dir + "standalone-bridge.js", dir + "index.html", ...readdirSync(dir + "modules").filter((f) => f.endsWith(".js")).map((f) => dir + "modules/" + f)];
const reel = analyser(fichiers.map((f) => [f.split("/").pop(), readFileSync(f, "utf8")]));
assert.ok(reel.appels.size > 100, "assez de boutons analysés (" + reel.appels.size + ")");
assert.deepEqual(reel.manquants, [], "boutons appelant une fonction jamais définie : " + reel.manquants.map((n) => n + " (" + [...reel.appels.get(n)].join(", ") + ")").join(" ; "));
console.log("idle-handlers-boutons-v1: OK (" + reel.appels.size + " fonctions de boutons, toutes définies)");
