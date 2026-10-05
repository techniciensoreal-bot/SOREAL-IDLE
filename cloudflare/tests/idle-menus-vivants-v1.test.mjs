import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-05) : « tout doit se passer en direct ». Constat en ligne (partie B) : sur la page NGU, le niveau restait à 0 pendant que le serveur en comptait 98 (page jamais redessinée tant qu'on
 * n'en sort pas). Les menus à l'ancienne se synchronisent maintenant toutes les 4 s et se redessinent à l'arrivée, sans toucher au défilement ni pendant une saisie.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("const IDLE_MENUS_VIVANTS_V1={ngu:1,wandoos:1,yggdrasil:1,diggers:1,beards:1,wishes:1,hacks:1,daycare:1};"));
assert.ok(ui.includes("IDLE_MENUS_VIVANTS_V1[idleMenuActifV28]&&PAGE_ACTIVE==='idle'&&Date.now()-idleMenuViveSyncV1>4000&&!champSaisieActifIdleV1_()"), "synchro toutes les 4 s tant que le menu est ouvert");
assert.ok(ui.includes("if(IDLE_MENUS_VIVANTS_V1[idleMenuActifV28]&&idleEtat&&!champSaisieActifIdleV1_()){\n              try{rafraichirMenuRacineIdleV28_();}"), "redessin à l'arrivée de la réponse");
// Les menus avec champs de saisie (ITOPOD : étages) ne sont pas redessinés sous les doigts du joueur.
assert.ok(!/IDLE_MENUS_VIVANTS_V1=\{[^}]*tower/.test(ui), "ITOPOD exclu : ses champs d'étage seraient remis à zéro");
console.log("idle-menus-vivants-v1: OK");
