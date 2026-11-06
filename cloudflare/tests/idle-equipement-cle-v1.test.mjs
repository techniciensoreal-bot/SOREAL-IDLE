import assert from "node:assert/strict";
import fs from "node:fs";
import { idleAdventureCleEquipementV1, idleAdventureEquipmentStatsV47, idleAdventureMemoNouvelleRequeteV1 } from "../src/idle-adventure-v47.js";

/*
 * Plan design/ARCHITECTURE-CIBLE.md, étape 1 (Norman, 2026-11-05) : la clé du mémo d'équipement ne contient QUE les données lues par le calcul. PREUVE PAR MUTATION : sur l'état d'Aventure des parties de référence, CHAQUE champ (feuille) est
 * modifié un par un (nombre +1 et x2, texte allongé, booléen inversé, champ supprimé, élément de tableau retiré) ; si la clé ne change pas, le résultat du calcul (recalculé SANS mémo) ne doit pas changer non plus.
 * Un champ lu par le calcul mais absent de la clé ferait échouer ce test (le mémo renverrait un résultat périmé).
 */
const calcul = (adv) => { idleAdventureMemoNouvelleRequeteV1(); return JSON.stringify(idleAdventureEquipmentStatsV47(adv)); };
function feuilles(o, chemin, sortie) {
  if (o && typeof o === "object") for (const k of Object.keys(o)) feuilles(o[k], chemin.concat([k]), sortie);
  else sortie.push(chemin);
  return sortie;
}
const lire = (o, c) => c.reduce((x, k) => x[k], o);
const parent = (o, c) => c.slice(0, -1).reduce((x, k) => x[k], o);

let mutations = 0, clesChangees = 0, resultatsChanges = 0;
for (const nom of ["partie-reference-1", "partie-reference-2"]) {
  const brut = JSON.parse(fs.readFileSync("cloudflare/tests/references/" + nom + ".json", "utf8"));
  const ligne = Object.keys(brut).sort((a, b) => a - b).map((k) => brut[k]);
  const adv = JSON.parse(ligne[37]).metaNgu.adventure;
  const cle0 = idleAdventureCleEquipementV1(adv), res0 = calcul(adv);
  assert.ok(cle0.length < 20000, nom + " : la clé est courte (" + cle0.length + " caractères au lieu de ~60 000)");
  const toutes = feuilles(adv, [], []);
  const variantes = (v) => (typeof v === "number" ? [v + 1, v * 2 + 3] : typeof v === "string" ? [v + "x", ""] : typeof v === "boolean" ? [!v] : [1]);
  for (const c of toutes) {
    if (!c.length) continue;
    const original = lire(adv, c);
    const par = parent(adv, c), k = c[c.length - 1];
    for (const w of variantes(original)) {
      par[k] = w;
      const cle = idleAdventureCleEquipementV1(adv), res = calcul(adv);
      mutations += 1;
      if (cle !== cle0) clesChangees += 1;
      if (res !== res0) resultatsChanges += 1;
      assert.ok(cle !== cle0 || res === res0, nom + " : le champ « " + c.join(".") + " » change le résultat de l'équipement (" + JSON.stringify(original) + " -> " + JSON.stringify(w) + ") mais PAS la clé du mémo");
    }
    par[k] = original;
    /* champ supprimé */
    if (!Array.isArray(par)) {
      delete par[k];
      const cle = idleAdventureCleEquipementV1(adv), res = calcul(adv);
      mutations += 1; if (cle !== cle0) clesChangees += 1; if (res !== res0) resultatsChanges += 1;
      assert.ok(cle !== cle0 || res === res0, nom + " : retirer « " + c.join(".") + " » change le résultat mais PAS la clé");
      par[k] = original;
    }
  }
  /* éléments de tableau retirés (sac, coffre…) : un par un */
  const tableaux = [];
  (function chercher(o, c) { if (o && typeof o === "object") { if (Array.isArray(o) && o.length && c.length) tableaux.push(c); for (const k of Object.keys(o)) chercher(o[k], c.concat([k])); } })(adv, []);
  for (const c of tableaux) {
    const t = lire(adv, c);
    for (let i = 0; i < Math.min(t.length, 12); i += 1) {
      const [x] = t.splice(i, 1);
      const cle = idleAdventureCleEquipementV1(adv), res = calcul(adv);
      mutations += 1; if (cle !== cle0) clesChangees += 1; if (res !== res0) resultatsChanges += 1;
      assert.ok(cle !== cle0 || res === res0, nom + " : retirer l'élément " + i + " de « " + c.join(".") + " » change le résultat mais PAS la clé");
      t.splice(i, 0, x);
    }
  }
  /* (retirer puis remettre un champ change l'ordre des propriétés, donc le texte de la clé, pas son sens : seul le résultat est comparé) */
  assert.equal(calcul(adv), res0);
}
assert.ok(mutations > 3000, "beaucoup de mutations : " + mutations);
assert.ok(clesChangees > 20 && resultatsChanges > 5, "le test est sensible : " + clesChangees + " clés et " + resultatsChanges + " résultats changent");
console.log("idle-equipement-cle-v1: OK (" + mutations + " mutations, " + clesChangees + " changent la clé, " + resultatsChanges + " changent le résultat)");
