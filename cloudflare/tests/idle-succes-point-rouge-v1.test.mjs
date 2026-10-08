import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-08) : « tu peux supprimer le point rouge lié à un nouveau succès ». (Ce test gardait l'ancien point rouge du 2026-10-04 : il garde maintenant son absence.)
 * Plus de point rouge ni de trophée « nouveau » : la page des succès n'a aucun repère, le menu du haut n'est plus animé pour un succès non vu.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

assert.ok(ui.includes("window.__SOREAL_IDLE_SUCCES_NOUVEAUX_V1__=function(){return [];};"), "la liste des trophées nouveaux reste vide");
assert.ok(!ui.includes("return succesNonVusIdleV1_(j,idleMenuActifV28)"), "le menu du haut ne regarde plus les succès non vus");
console.log("idle-succes-point-rouge-v1: OK");
