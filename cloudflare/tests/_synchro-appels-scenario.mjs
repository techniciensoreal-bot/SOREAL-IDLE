/* Scénario partagé par idle-synchro-appels-v1 : rejoue obtenirEtat, agirProgression (allocate), synchroniser, battement sur les parties de référence (horloge gelée, hasard à graine) et mesure le nombre de synchros (spans). */
import fs from "node:fs";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { creerMoteur, figerLeHasard, reglerHorloge, avancer } from "./_partie-reference.mjs";
const { spansActiver, spansPrelever } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-spans-v1.js").href);
export const REFS = ["partie-reference-1", "partie-reference-2"];
/* colonne 15 : horodatage écrit par new Date() (non gelé par Date.now) : exclu du hachage. */
const h = (o) => crypto.createHash("sha256").update(JSON.stringify(o)).digest("hex").slice(0, 24);
export function scenario(nom) {
  const ligne = JSON.parse(fs.readFileSync("cloudflare/tests/references/" + nom + ".json", "utf8"));
  figerLeHasard();
  reglerHorloge(Date.parse(ligne[15]) + 60_000);
  const m = creerMoteur(ligne);
  const sortie = {};
  spansActiver(true);
  const etapes = [
    ["obtenirEtat", () => m.run("obtenirEtatSorealIdle")],
    ["agirProgression", () => m.run("agirProgressionSorealIdle", { action: "allocate", system: "timeMachine", resource: "energy", value: 1.5e6 })],
    ["synchroniser", () => m.run("synchroniserSorealIdle")],
    ["battement", () => m.run("battementSorealIdle", { actif: true, connecte: true, activite: "test" })]
  ];
  for (const [op, f] of etapes) {
    avancer(7000);
    spansPrelever();
    const t0 = performance.now();
    const r = f();
    const ms = performance.now() - t0;
    const sp = spansPrelever();
    sortie[op] = { synchros: (sp["sync:normaliser"] || { n: 0 }).n, ms: Math.round(ms * 10) / 10, reponse: h(r), ligne: h(m.ligne().map((x, i) => (i === 15 ? null : x))) };
  }
  spansActiver(false);
  return sortie;
}
