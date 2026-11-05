/*
 * Banc du FLUX Worker -> page (plan design/ARCHITECTURE-CIBLE.md, § 1 et 3 ; Norman, 2026-11-05 : fluidité). Mesure, sur la partie de référence avec horloge réelle, le coût de chaque étape d'une réponse :
 *   moteur : allègement (empreintes) ; transfert : structuredClone du message ; page : remise en place des pièces omises (restaurerCataloguesV1 du pont, extraite telle quelle).
 * Usage : node cloudflare/bench/bench-flux-v1.mjs
 */
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { creerMoteur, figerLeHasard, reglerHorloge, avancer } from "../tests/_partie-reference.mjs";
const { allegerCataloguesV1 } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-catalogues-v1.js").href);
const brut = JSON.parse(fs.readFileSync("cloudflare/tests/references/"+(process.argv[2]||"partie-reference-1")+".json", "utf8"));
const ligne = Object.keys(brut).sort((a, b) => a - b).map((k) => brut[k]);
figerLeHasard(); reglerHorloge(Date.parse(ligne[15]) + 60_000);
const m = creerMoteur(ligne);
const sync = () => m.run("synchroniserSorealIdle");

const pont = fs.readFileSync("cloudflare/public/standalone-bridge.js", "utf8");
const a = pont.indexOf("function lireCheminV1(") , b = pont.indexOf("async function callIdleV1(");
const cataloguesV1 = { dernier: {}, valeurs: {}, lignes: {} };
const restaurer = new Function("cataloguesV1", pont.slice(a, b) + "\nreturn {restaurerCataloguesV1,hashesCataloguesV1};")(cataloguesV1);
const kb = (o) => Math.round(JSON.stringify(o).length / 1024);
const ms = (f) => { const t = performance.now(); const r = f(); return [performance.now() - t, r]; };

const complete = sync();
console.log("réponse complète : " + kb(complete) + " Ko ; joueur " + kb(complete.joueur) + " Ko");
restaurer.restaurerCataloguesV1(allegerCataloguesV1(JSON.parse(JSON.stringify(complete)), undefined));   /* amorce la mémoire du pont */
const lignes = [];
for (let i = 0; i < 12; i += 1) {
  avancer(4000);
  const brute = sync();
  const [tAll, alleg] = ms(() => allegerCataloguesV1(brute, restaurer.hashesCataloguesV1()));
  const [tClone, clone] = ms(() => structuredClone(alleg));
  const [tRest] = ms(() => restaurer.restaurerCataloguesV1(clone));
  lignes.push({ envoye: kb(alleg), tAll, tClone, tRest });
}
const med = (k) => lignes.map((l) => l[k]).sort((x, y) => x - y)[Math.floor(lignes.length / 2)];
console.log("réponse allégée envoyée : " + med("envoye") + " Ko (médiane de 12)");
console.log("moteur  : allègement + empreintes ................ " + med("tAll").toFixed(1) + " ms");
console.log("transfert : structuredClone du message ........... " + med("tClone").toFixed(1) + " ms (thread principal à la réception)");
console.log("page    : remise en place des pièces omises ....... " + med("tRest").toFixed(1) + " ms (thread principal)");
