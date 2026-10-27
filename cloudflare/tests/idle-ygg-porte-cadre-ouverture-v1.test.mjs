import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-26) : « sur PC, les portes d'Yggdrasil qui s'ouvraient ne prenaient pas toute l'image : on voyait l'image sur leurs bords extérieurs ». Cause : à l'ouverture et à la fermeture, la porte retirait son fond ET ses liserés (box-shadow:none) :
 * le cadre (8 px) devenait transparent et l'image apparaissait tout autour des vantaux. Le cadre reste maintenant jusqu'au fondu final ; seul le fond devient transparent (pour voir l'image entre les vantaux).
 */
const src = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
for (const classe of [".ygg-porte.ouvre{animation", ".ygg-porte.referme{animation"]) {
  const i = src.indexOf(classe);
  assert.ok(i > 0, classe + " présent");
  const regle = src.slice(i, src.indexOf("}'", i));
  assert.ok(regle.includes("background:transparent"), classe + " : fond transparent (l'image se voit entre les vantaux)");
  assert.ok(!regle.includes("box-shadow:none"), classe + " : le cadre (liserés) reste pendant l'animation");
}
console.log("idle-ygg-porte-cadre-ouverture-v1: OK");
