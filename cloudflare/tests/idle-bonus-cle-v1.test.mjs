import assert from "node:assert/strict";
import fs from "node:fs";
import { idleNguBonuses, idleNguCleBonusesV1, idleNguMemoNouvelleRequeteV1 } from "../src/idle-ngu-bonus.js";

/*
 * Plan design/ARCHITECTURE-CIBLE.md, étape 1 (Norman, 2026-11-05) : la clé du mémo des bonus remplace le sac, le coffre, la liste d'objets, les réglages d'inventaire, les emplacements, la zone, la corbeille et le dernier butin d'Aventure par la clé réduite de
 * l'équipement. PREUVE PAR MUTATION : chaque champ (feuille) de ces blocs est modifié un par un (nombre +1 et x2, texte allongé, booléen inversé, champ retiré) ; si la clé ne change pas, les bonus (recalculés SANS mémo) ne doivent pas changer.
 */
const calcul = (state) => { idleNguMemoNouvelleRequeteV1(); return JSON.stringify(idleNguBonuses(state)); };
const feuilles = (o, c, sortie) => { if (o && typeof o === "object") for (const k of Object.keys(o)) feuilles(o[k], c.concat([k]), sortie); else sortie.push(c); return sortie; };
const lire = (o, c) => c.reduce((x, k) => x[k], o);
const BLOCS = ["inventory", "coffre", "itemList", "inventoryAuto", "inventorySlots", "zone", "trash", "dernierButinAutoKill"];
let mutations = 0, clesChangees = 0, resultatsChanges = 0;
for (const nom of ["partie-reference-1", "partie-reference-2"]) {
  const brut = JSON.parse(fs.readFileSync("cloudflare/tests/references/" + nom + ".json", "utf8"));
  const ligne = Object.keys(brut).sort((a, b) => a - b).map((k) => brut[k]);
  const state = JSON.parse(ligne[37]).metaNgu;
  const cle0 = idleNguCleBonusesV1(state), res0 = calcul(state);
  assert.ok(cle0.length < 90000, nom + " : clé plus courte que l'état (" + cle0.length + ")");
  for (const bloc of BLOCS) {
    if (state.adventure[bloc] === undefined) continue;
    for (const rel of feuilles(state.adventure[bloc], [], [])) {
      const chemin = ["adventure", bloc, ...rel];
      const par = chemin.slice(0, -1).reduce((x, k) => x[k], state), k = chemin[chemin.length - 1];
      if (!chemin.length || rel.length === 0) continue;
      const original = par[k];
      const variantes = typeof original === "number" ? [original + 1, original * 2 + 3] : typeof original === "string" ? [original + "x"] : typeof original === "boolean" ? [!original] : [1];
      for (const w of variantes) {
        par[k] = w;
        const cle = idleNguCleBonusesV1(state), res = calcul(state);
        mutations += 1; if (cle !== cle0) clesChangees += 1; if (res !== res0) resultatsChanges += 1;
        assert.ok(cle !== cle0 || res === res0, nom + " : le champ « " + chemin.join(".") + " » change les bonus (" + JSON.stringify(original) + " -> " + JSON.stringify(w) + ") mais PAS la clé du mémo");
      }
      par[k] = original;
      if (!Array.isArray(par)) {
        delete par[k];
        const cle = idleNguCleBonusesV1(state), res = calcul(state);
        mutations += 1; if (cle !== cle0) clesChangees += 1; if (res !== res0) resultatsChanges += 1;
        assert.ok(cle !== cle0 || res === res0, nom + " : retirer « " + chemin.join(".") + " » change les bonus mais PAS la clé");
        par[k] = original;
      }
    }
  }
  assert.equal(calcul(state), res0, nom + " : état restauré");
}
assert.ok(mutations > 2000, "beaucoup de mutations : " + mutations);
console.log("idle-bonus-cle-v1: OK (" + mutations + " mutations, " + clesChangees + " changent la clé, " + resultatsChanges + " changent les bonus)");
