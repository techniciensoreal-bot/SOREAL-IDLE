import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-22) : audit de visibilité sur téléphone : petits textes à 12 px au minimum (hors tuiles du haut et écran de Wandoos, proportionnels), Yggdrasil : le bouton « Poop » désactivé reste lisible. */
const css = readFileSync(new URL("../public/soreal-idle-itopod.css", import.meta.url), "utf8");
const debut = css.indexOf("/* Audit de visibilité sur téléphone");
assert.ok(debut > 0, "bloc téléphone présent");
const bloc = css.slice(debut);
assert.ok(bloc.includes("@media (max-width:700px){"), "réservé aux téléphones");
assert.ok(/:is\(small,[^)]*\.souche,[^)]*\)\{font-size:12px\}/.test(bloc), "petits textes à 12 px");
assert.ok(bloc.includes('[data-menu="ngu"] :is(span,b,p):not([class]){font-size:12px}') && bloc.includes('[data-menu="challenges"] i{font-size:12px}'), "NGU et Défis à 12 px");
assert.ok(!/!important/.test(bloc), "aucune surcharge forcée de plus");
assert.ok(css.includes(".cal-v1 .cal-jour-v1{font-size:12px}") && css.includes(".cal-v1 .cal-ap-v1{font-size:12px}"), "calendrier à 12 px");
const ygg = readFileSync(new URL("../public/modules/yggdrasil-elfes-v1.js", import.meta.url), "utf8");
assert.ok(ygg.includes(".ygg-poop:disabled{opacity:.78;") && ygg.includes(".ygg-auto button{font-size:clamp(12px,2.1cqw,13px)!important}"), "Yggdrasil : Poop désactivé lisible, activation auto à 12 px");
console.log("idle-tel-lisibilite-v1: OK");
