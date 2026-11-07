#!/usr/bin/env node
/*
 * C1 du plan (design/PLAN-COMPLET-2026-11-06.md) : MATRICE opération x bloc d'état, sans aucun changement de jeu.
 * Pour chaque opération d'un scénario scripté (horloge gelée, hasard à graine), on compare la ligne du joueur AVANT et APRÈS : colonnes changées, et pour la colonne d'état (metaNgu) les blocs de premier niveau,
 * les blocs d'`adventure` et les systèmes (`systemes.systems[].id`) qui ont changé. Mesure par COMPARAISON de contenu (ce qui change vraiment), pas par lecture du code : une écriture qui remet la même valeur n'y
 * apparaît pas, ce qui est exactement ce dont le versionnement par bloc a besoin (version incrémentée seulement si le contenu change).
 *   node cloudflare/tools/matrice-ecritures-v1.mjs            -> affiche la matrice
 *   node cloudflare/tools/matrice-ecritures-v1.mjs --ecrire   -> écrit design/MATRICE-ECRITURES.json
 */
import fs from "node:fs";
import { creerMoteur, figerLeHasard, reglerHorloge, avancer } from "../tests/_partie-reference.mjs";

const COL_ETAT = 37;
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function blocs(ligne) {
  const sortie = {};
  ligne.forEach((v, i) => { if (i !== COL_ETAT) sortie["col" + i] = v; });
  let etat = {};
  try { etat = JSON.parse(ligne[COL_ETAT]).metaNgu || {}; } catch (e) { etat = {}; }
  for (const k of Object.keys(etat)) {
    if (k === "adventure" && etat[k] && typeof etat[k] === "object") for (const s of Object.keys(etat[k])) sortie["metaNgu.adventure." + s] = etat[k][s];
    else sortie["metaNgu." + k] = etat[k];
  }
  const sys = (JSON.parse(ligne[COL_ETAT] || "{}").systemes || {}).systems;
  if (Array.isArray(sys)) for (const s of sys) sortie["systemes." + s.id] = s;
  return sortie;
}
function changes(avant, apres) {
  const ids = new Set([...Object.keys(avant), ...Object.keys(apres)]);
  return [...ids].filter((k) => !egal(avant[k], apres[k])).sort();
}

export function matrice(ligne) {
  figerLeHasard();
  reglerHorloge(Date.parse(ligne[15]) + 60_000);
  const m = creerMoteur(ligne);
  const sortie = {};
  const essai = (nom, f) => {
    const a = blocs(m.ligne());
    try { f(); } catch (e) { sortie[nom] = { refus: String((e && e.message) || e).slice(0, 60), blocs: [] }; return; }
    const b = blocs(m.ligne());
    sortie[nom] = { blocs: changes(a, b) };
  };
  const agir = (p) => m.run("agirProgressionSorealIdle", p);
  const sync = () => m.run("synchroniserSorealIdle");
  essai("synchroniser (immédiat)", sync);
  avancer(2000); essai("synchroniser (+2 s)", sync);
  avancer(10_000); essai("synchroniser (+10 s)", sync);
  avancer(600_000); essai("synchroniser (+10 min)", sync);
  essai("lire l'état", () => m.run("obtenirEtatSorealIdle"));
  for (const [nom, p] of [
    ["allocate timeMachine énergie", { action: "allocate", system: "timeMachine", resource: "energy", value: 1.5e6 }],
    ["allocate timeMachine magie", { action: "allocate", system: "timeMachine", resource: "magic", value: 3e5 }],
    ["allocateAugment", { action: "allocateAugment", pair: "scissors", upgrade: false, value: 1e6 }],
    ["allocateAdvancedTraining", { action: "allocateAdvancedTraining", track: "power", value: 1e6 }],
    ["allocateNgu", { action: "allocateNgu", ngu: "augments", value: 1e6 }],
    ["allocateRitual", { action: "allocateRitual", ritual: "tack", value: 3e5 }]
  ]) { essai(nom, () => agir(p)); avancer(1000); }
  essai("adventure startZoneFight", () => agir({ action: "adventure", adventure: { action: "startZoneFight", restHp: sync().joueur.pvJoueur } }));
  avancer(1200);
  essai("adventure resolveZoneFight", () => agir({ action: "adventure", adventure: { action: "resolveZoneFight", titanId: "", titanStarted: false } }));
  return sortie;
}

if (import.meta.url === new URL(process.argv[1], "file://").href || process.argv[1].endsWith("matrice-ecritures-v1.mjs")) {
  const resultat = {};
  for (const nom of ["partie-reference-1", "partie-reference-2"]) {
    resultat[nom] = matrice(JSON.parse(fs.readFileSync("cloudflare/tests/references/" + nom + ".json", "utf8")));
  }
  const ops = Object.keys(resultat["partie-reference-1"]);
  const fusion = {};
  for (const op of ops) {
    const u = new Set();
    for (const nom of Object.keys(resultat)) for (const b of (resultat[nom][op] || { blocs: [] }).blocs) u.add(b);
    fusion[op] = [...u].sort();
  }
  if (process.argv.includes("--ecrire")) {
    fs.writeFileSync("design/MATRICE-ECRITURES.json", JSON.stringify(fusion, null, 1) + "\n");
    console.log("écrit : design/MATRICE-ECRITURES.json");
  }
  for (const op of ops) console.log(op.padEnd(34), fusion[op].length + " blocs : " + fusion[op].join(", "));
  const tous = new Set(Object.values(fusion).flat());
  console.log("--- " + tous.size + " blocs touchés au moins une fois");
}
