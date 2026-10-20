import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-20) : « le bug de la sangsue est toujours là après un rebirth, obligé de partir et revenir ; la table a le même bug pour le rituel du bol : elle est transparente tant qu'on ne rafraîchit pas ».
 * Cause (reproduite : avec la première scène cachée, la planche des autres disparaissait) : la table (planche), le fond de la bibliothèque et le clip de l'œil de la sangsue définissaient leurs dégradés et leurs clips DANS chaque scène, avec les MÊMES
 * identifiants ; le navigateur n'en retient qu'un (le premier de la page) : s'il est caché ou retiré (nouveau rituel, renaissance), les autres perdent leur remplissage. Ces définitions sont désormais dans le dessin partagé (defs()), une seule fois.
 */
const src = readFileSync(new URL("../public/modules/sang-rituel-decor-v1.js", import.meta.url), "utf8");
const debutDefs = src.indexOf("function defs(){");
assert.ok(debutDefs > 0);
const finDefs = src.indexOf("</defs></svg>", debutDefs);
const partagees = src.slice(debutDefs, finDefs);
const horsDefs = src.slice(0, debutDefs) + src.slice(finDefs);
for (const id of ["bm-g-planche", "bm-g-planche-bout", "bm-clip-planche", "bm-f-flou", "bm-g-lueur-bib", "bm-g-cristal", "bm-g-fond-bib", "bm-oeil-clip"]) {
  assert.equal((partagees.match(new RegExp('id="' + id + '"', "g")) || []).length, 1, id + " défini une fois dans les définitions partagées");
  assert.ok(!new RegExp('id="' + id + '"').test(horsDefs), id + " plus défini dans une scène");
}
// Une scène ne porte plus aucune définition d'identifiant partagé (hors symboles et clips propres au bac, uniques dans la page).
const scenes = horsDefs.replace(/<symbol[\s\S]*?<\/symbol>/g, "");
assert.ok(!/<defs>/.test(scenes.replace(/SG_MASQUE[\s\S]*$/m, "")), "aucun <defs> dans une scène");
console.log("idle-sang-defs-partagees-v1: OK");
