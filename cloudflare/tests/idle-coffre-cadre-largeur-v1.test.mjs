import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Coffre (Norman, 2026-10-16) : le titre d'un cadre de zone ne l'élargit pas (« Grotte aux multiples choses », « Base haute sécurité » : cadre trop grand pour ses objets). */
const css = readFileSync("cloudflare/public/soreal-idle-barre-outils.css", "utf8");
assert.ok(css.includes(".soreal-idle-coffre-cadre-v1>.soreal-idle-coffre-cadre-titre-v1{width:0;min-width:100%"), "titre hors du calcul de largeur");
console.log("idle-coffre-cadre-largeur-v1: OK");
