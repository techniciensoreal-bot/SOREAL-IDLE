/* Titre de « Combat de boss » en marquise de borne d'arcade : le bloc existe, vise data-menu="combat", porte les couleurs néon, n'ajoute aucun !important et reste avant la barre de défilement de l'inventaire. */
import assert from "node:assert/strict";
import fs from "node:fs";
const css = fs.readFileSync(new URL("../public/soreal-idle-itopod.css", import.meta.url), "utf8");
const debut = css.indexOf("Titre de « Combat de boss » en marquise de borne d'arcade");
assert.ok(debut > 0, "bloc arcade absent");
const fin = css.indexOf("Barre de défilement de l'inventaire sur téléphone", debut);
assert.ok(fin > debut, "le bloc doit précéder la barre de défilement de l'inventaire");
const bloc = css.slice(debut, fin);
assert.ok(bloc.includes('[data-menu="combat"] .soreal-idle-page-head-v28[data-entete-menu]'));
for (const c of ["#ff2d95", "#b43cff", "#3d6bff", "#19e3ff", "#ffb02e"]) assert.ok(bloc.includes(c), "couleur néon manquante " + c);
assert.ok(!/!important/.test(bloc), "aucun !important");
assert.ok(!/pointer-events\s*:\s*none/.test(bloc), "pas de pointer-events:none ici");
assert.ok(!/animations*:|@keyframes/.test(bloc), "bloc statique");
console.log("ok idle-entete-combat-arcade-v1");
