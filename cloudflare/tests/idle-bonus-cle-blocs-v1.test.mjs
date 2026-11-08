import assert from "node:assert/strict";
import fs from "node:fs";
import { idleNguBonuses, idleNguCleBonusesV1, idleNguMemoNouvelleRequeteV1, avecProjectionSansMemoV1 } from "../src/idle-ngu-bonus.js";

/*
 * Plan C2 (design/PLAN-COMPLET-2026-11-06.md) : la clé du mémo des bonus ne contient plus le Puits d'argent, la Roue du jour, et ne garde des Souhaits que le niveau de chaque piste. PREUVE PAR MUTATION (modèle de idle-bonus-cle-v1) : chaque champ de
 * systems.moneyPit, systems.dailySpin et systems.wishes est modifié un par un (nombre +1 et x2, texte allongé, booléen inversé, champ retiré) ; si la clé ne change pas, les bonus calculés SANS mémo ne doivent pas changer non plus. Un champ qui change les bonus sans changer la clé
 * ferait réutiliser en silence des bonus périmés : le test échoue alors.
 */
const bonus = (state) => JSON.stringify(avecProjectionSansMemoV1(() => idleNguBonuses(state)));
const feuilles = (o, c, sortie) => { if (o && typeof o === "object") for (const k of Object.keys(o)) feuilles(o[k], c.concat([k]), sortie); else sortie.push(c); return sortie; };
let mutations = 0, cles = 0;
for (const nom of ["partie-reference-1", "partie-reference-2"]) {
  const brut = JSON.parse(fs.readFileSync("cloudflare/tests/references/" + nom + ".json", "utf8"));
  const ligne = Object.keys(brut).sort((a, b) => a - b).map((k) => brut[k]);
  const state = JSON.parse(ligne[37]).metaNgu;
  const cle0 = idleNguCleBonusesV1(state), res0 = bonus(state);
  for (const bloc of ["moneyPit", "dailySpin", "wishes"]) {
    if (state.systems[bloc] === undefined) continue;
    for (const rel of feuilles(state.systems[bloc], [], [])) {
      if (!rel.length) continue;
      const chemin = ["systems", bloc, ...rel];
      const par = chemin.slice(0, -1).reduce((x, k) => x[k], state), k = chemin[chemin.length - 1];
      const original = par[k];
      const variantes = typeof original === "number" ? [original + 1, original * 2 + 3] : typeof original === "string" ? [original + "x"] : typeof original === "boolean" ? [!original] : [1];
      for (const w of variantes) {
        par[k] = w;
        mutations += 1;
        const cle = idleNguCleBonusesV1(state);
        if (cle !== cle0) cles += 1;
        assert.ok(cle !== cle0 || bonus(state) === res0, nom + " : « " + chemin.join(".") + " » change les bonus mais PAS la clé");
      }
      par[k] = original;
      if (!Array.isArray(par)) {
        delete par[k];
        mutations += 1;
        const cle = idleNguCleBonusesV1(state);
        if (cle !== cle0) cles += 1;
        assert.ok(cle !== cle0 || bonus(state) === res0, nom + " : retirer « " + chemin.join(".") + " » change les bonus mais PAS la clé");
        par[k] = original;
      }
    }
  }
  assert.equal(idleNguCleBonusesV1(state), cle0, nom + " : état remis à l'identique");
  /* le niveau d'un souhait change bien la clé, et les bonus quand le souhait en donne */
  const pistes = state.systems.wishes && state.systems.wishes.data && state.systems.wishes.data.tracks;
  if (pistes) { const id = Object.keys(pistes)[0]; const avant = pistes[id].level; pistes[id].level = (Number(avant) || 0) + 1; assert.notEqual(idleNguCleBonusesV1(state), cle0, nom + " : le niveau d'un souhait change la clé"); pistes[id].level = avant; }
}
assert.ok(mutations > 150, "assez de mutations (" + mutations + ")");
assert.ok(cles > 0, "les niveaux de souhaits changent la clé");
idleNguMemoNouvelleRequeteV1();
console.log("idle-bonus-cle-blocs-v1: OK (" + mutations + " mutations, " + cles + " changent la clé)");
