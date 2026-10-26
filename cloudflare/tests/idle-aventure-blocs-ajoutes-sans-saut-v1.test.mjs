import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-26) : « quand on arrive sur la page Aventure et qu'on ouvre le Coffre, il y a un souci avec le cadre, seulement quand on vient d'un autre menu » et « un mini saut quand on va sur la page ».
 * Mesuré dans Chrome sur son compte : la bande des minuteurs (au-dessus du sac) et le bloc des options (sous le Coffre) sont ajoutés par inventory-auto-v1.js APRÈS le rendu, quand l'état asynchrone arrive : le contenu dessous
 * montait puis redescendait de 32 px (défilement -32 px puis +32 px, remis par le redessin). Ils sont maintenant remis dans la même tâche que le redessin (règle n°4), avec le dernier état connu.
 */
const src = readFileSync("cloudflare/public/modules/inventory-auto-v1.js", "utf8");
assert.ok(src.includes("function rendreSansAttendre()") && src.includes("if(!dernierEtat)return;"), "remise en place immédiate avec le dernier état connu");
assert.ok(src.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(rendreSansAttendre)"), "rejoué juste après chaque redessin de la page");
const f = src.slice(src.indexOf("function rafraichir(){"));
assert.ok(f.indexOf("rendreSansAttendre();") > 0 && f.indexOf("rendreSansAttendre();") < f.indexOf("getState()"), "à l'arrivée sur la page, avant l'attente de l'état frais");
assert.ok(src.includes("bande.setAttribute('data-morph-garder','1')") && src.includes("bloc.setAttribute('data-morph-garder','1')"), "blocs toujours gardés par le morph");

console.log("idle-aventure-blocs-ajoutes-sans-saut-v1: OK");
