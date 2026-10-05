import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : « quand un titan ou un ennemi nous freeze, il faut le voir sur les raccourcis d'attaque, parade etc. : tout grisé ou autre chose, mais visible, sinon on dirait un bug ».
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");

// Le bandeau existe dans la zone des raccourcis et reste caché hors paralysie.
assert.ok(ui.includes(`'<div class="soreal-idle-adventure-paralysie-v1" data-paralysie-v1 role="status" hidden></div>'+`));
// Le rafraîchissement lit la vraie paralysie du titan (la même que celle qui bloque l'usage d'une capacité) et grise tout.
const debut = ui.indexOf("      function rafraichirCommandesAdventureIdleV3_(maintenant){");
const fin = ui.indexOf("      function basculerIdleModeAdventureIdleV3_(){");
const bloc = ui.slice(debut, fin);
assert.ok(bloc.includes("const paralyse=titanJoueurParalyseIdleV1_(now);"));
assert.ok(bloc.includes("root.classList.toggle('paralyse-v1',paralyse);") && bloc.includes("toggle.classList.toggle('paralyse-v1',paralyse);") && bloc.includes("btn.classList.toggle('paralyse-v1',paralyse);"), "zone, Idle Mode et chaque raccourci");
assert.ok(bloc.includes("||desactivee||paralyse));"), "chaque raccourci est désactivé pendant la paralysie");
assert.ok(bloc.includes("posteIdleSiChangeV1_(cd,'textContent',paralyse?'⚡'"), "un éclair à la place du temps de recharge");
assert.ok(bloc.includes("Plus de capacités ni d’Idle pendant ") && bloc.includes("idleTitanEtatV1&&idleTitanEtatV1.paralyseJusqua"), "le bandeau dit la cause et le temps restant");
// Cohérence : c'est bien la même condition que celle qui ignore le clic.
const usage = ui.slice(ui.indexOf("      function utiliserCompetenceAdventureIdleV3_(id){"), ui.indexOf("      function utiliserCompetenceAdventureIdleV3_(id){") + 300);
assert.ok(usage.includes("if(titanJoueurParalyseIdleV1_(Date.now()))return;"));
// Style : raccourcis grisés, contour jaune, bandeau jaune qui pulse.
assert.ok(css.includes(".soreal-idle-adventure-manual-v3.paralyse-v1 .soreal-idle-adventure-skill-v3,") && css.includes("filter:grayscale(1)") && css.includes(".soreal-idle-adventure-paralysie-v1{"));
assert.ok(css.includes(".soreal-idle-adventure-paralysie-v1[hidden]{display:none}"), "bandeau caché hors paralysie");
console.log("idle-paralysie-raccourcis-visible-v1: OK");
