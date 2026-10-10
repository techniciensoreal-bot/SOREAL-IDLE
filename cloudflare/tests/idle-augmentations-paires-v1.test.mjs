import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
/* Norman (2026-10-10) : Augmentations refait : paires marquées par la couleur (même teinte, nuance plus claire pour la seconde piste, sans texte « version normale / puissante »), icône propre à chaque version puissante, Advance Energy, barres en tubes de verre. */
const page = meta.slice(meta.indexOf("function pageAugmentationsIdleV48_(j)"), meta.indexOf("function pageTimeMachineIdleV48_(j)"));
for (const k of ["aug-badge-v2 puissant", "aug-badge-v2 normal", "aug-tube-v2", "aug-liquide-v2", "aug-reflet-v2", "aug-lien-v2", "aug-paire-v2", "aug-cible-v2", "aug-avance-v2", "Faire suivre l’énergie", "__cibleAugmentIdleV1__", "__avanceAugmentsIdleV1__"]) {
  assert.ok(page.includes(k), "page : " + k);
}
// les identifiants lus par le moteur d'affichage existant n'ont pas bougé
for (const k of ["data-idle-aug-bar-v215", "data-idle-aug-niv-v1", "data-idle-aug-cout-v1", "data-idle-aug-eta-v1", "sorealIdleAugAllocV1_"]) assert.ok(page.includes(k), "identifiant conservé : " + k);
// une icône différente pour chaque version puissante, comme pour chaque version normale
const m = meta.match(/IDLE_ICONES_UPGRADES_AUGMENTS_V1=\{([^}]*)\}/);
assert.ok(m, "table des icônes des versions puissantes");
const icones = [...m[1].matchAll(/:'([^']+)'/g)].map((x) => x[1]);
assert.ok(icones.length >= 7 && new Set(icones).size === icones.length, "7 icônes distinctes : " + icones.join(" "));
// actions envoyées au serveur
assert.ok(meta.includes("action:'setAugmentTarget'") && meta.includes("action:'setAugmentAdvance'"));
// style : tube de verre, reflet en boucle sans à-coup, version puissante en feu
assert.match(css, /@keyframes augReflet\{0%\{opacity:0;transform:translateX\(-120%\)\}.*100%\{opacity:0;transform:translateX\(300%\)\}\}/);
assert.ok(css.includes(".aug-piste-v2.upgrade{--pc:color-mix(in srgb,var(--ac) 58%,#fff)") && css.includes(".aug-badge-v2.puissant i"));
assert.ok(!page.includes("Version puissante") && !page.includes("Version normale"), "plus de libellé « version normale / puissante »");
assert.ok(readFileSync("cloudflare/public/modules/barres-actives-v1.js", "utf8").includes("ligne:'.aug-piste-v2',style:'etoile'"), "particules sur les nouvelles pistes");
console.log("idle-augmentations-paires-v1: OK");
