import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-26) : « sur téléphone, quand on nettoie le Coffre ou la valise, ça swipe sur l'autre écran ; il faut désactiver ça pendant qu'on nettoie ». Frotter la flaque ne change jamais de page : un geste qui COMMENCE sur une flaque
 * n'est pas un swipe, et un geste de nettoyage récent (1,5 s) annule aussi le swipe en fin de geste.
 */
const menus = readFileSync("cloudflare/public/modules/ui-menus-v1.js", "utf8");
assert.ok(menus.includes("[data-no-swipe],.bg-flaque-v1,.vl-flaque-v1"), "départ du geste sur une flaque : jamais un swipe");
assert.ok(menus.includes("Date.now()<(window.__SOREAL_IDLE_NETTOYAGE_JUSQUA_V1__||0)"), "nettoyage récent : le swipe de fin de geste est ignoré");
const coffre = readFileSync("cloudflare/public/modules/coffre-accident-v1.js", "utf8");
const valise = readFileSync("cloudflare/public/modules/valise-accident-v1.js", "utf8");
for (const [nom, src] of [["Coffre", coffre], ["valise", valise]]) {
  assert.ok((src.match(/__SOREAL_IDLE_NETTOYAGE_JUSQUA_V1__=Date\.now\(\)\+1500/g) || []).length >= 2, nom + " : l'échéance est posée au toucher et à chaque frottée");
}
console.log("idle-nettoyage-sans-swipe-v1: OK");
