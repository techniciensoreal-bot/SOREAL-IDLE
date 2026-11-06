/*
 * Banc de la RÉPONSE du moteur (plan C4, 2026-11-06) : taille de ce que le Worker renvoie à la page après chaque synchro / action, APRÈS l'allègement existant (idle-catalogues-v1.js), et coût de la copie
 * (structuredClone, ce que fait postMessage). C'est ce travail qui s'exécute sur le fil principal de la page à chaque réponse (« retour » du rapport de mesure : jusqu'à 47 ms sur PC, 99 ms sur téléphone).
 *   node cloudflare/bench/bench-reponse-v1.mjs [partie-reference-2]
 */
import fs from "node:fs";
import { creerMoteur, figerLeHasard, reglerHorloge, avancer } from "../tests/_partie-reference.mjs";
import { allegerCataloguesV1 } from "../src/idle-catalogues-v1.js";

const nom = process.argv[2] || "partie-reference-2";
const brut = JSON.parse(fs.readFileSync(fs.existsSync(nom) ? nom : "cloudflare/tests/references/" + nom + ".json", "utf8"));
const ligne = Array.isArray(brut.cells) ? brut.cells : Object.keys(brut).sort((a, b) => a - b).map((k) => brut[k]);
figerLeHasard(); reglerHorloge(Date.parse(ligne[15]) + 60_000);
const m = creerMoteur(ligne);
let r = m.run("synchroniserSorealIdle"); r = m.run("synchroniserSorealIdle");

/* les empreintes du client = celles de la réponse précédente (le pont les renvoie à chaque appel) */
let hashes = {};
function suivante(f) {
  avancer(4000);
  const complet = f();
  const premiere = allegerCataloguesV1(complet, hashes);
  hashes = Object.assign({}, premiere.cataloguesHashes || {});
  return { complet, allegee: premiere };
}
suivante(() => m.run("synchroniserSorealIdle"));   /* amorce : le client connaît désormais ces pièces */

function taille(v) { return JSON.stringify(v).length; }
function top(objet, n = 14, prefixe = "") {
  return Object.entries(objet || {}).map(([k, v]) => [prefixe + k, v === undefined ? 0 : taille(v)]).sort((a, b) => b[1] - a[1]).slice(0, n);
}
function cout(libelle, f, tours = 40) {
  const t = [];
  for (let i = 0; i < tours; i += 1) { const a = performance.now(); f(); t.push(performance.now() - a); }
  t.sort((x, y) => x - y);
  console.log(libelle.padEnd(40) + " médiane " + t[t.length >> 1].toFixed(2).padStart(6) + " ms   p95 " + t[Math.floor(t.length * 0.95)].toFixed(2).padStart(6) + " ms");
}

const s = suivante(() => m.run("synchroniserSorealIdle"));
console.log("RÉPONSE de synchro, complète : " + taille(s.complet) + " octets ; allégée : " + taille(s.allegee) + " octets");
console.log("\nPlus gros blocs de la réponse allégée (niveau 1) :");
top(s.allegee).forEach(([k, t]) => console.log("  " + String(t).padStart(8) + "  " + k));
console.log("\nPlus gros blocs de reponse.joueur (allégée) :");
top(s.allegee.joueur, 16, "joueur.").forEach(([k, t]) => console.log("  " + String(t).padStart(8) + "  " + k));
const systemes = s.allegee.joueur && s.allegee.joueur.systemes;
if (systemes) { console.log("\nPlus gros blocs de joueur.systemes :"); top(systemes, 10, "systemes.").forEach(([k, t]) => console.log("  " + String(t).padStart(8) + "  " + k)); }
console.log("");
cout("structuredClone(réponse allégée)", () => structuredClone(s.allegee));
cout("structuredClone(réponse complète)", () => structuredClone(s.complet));
cout("JSON.stringify(réponse allégée)", () => JSON.stringify(s.allegee));
