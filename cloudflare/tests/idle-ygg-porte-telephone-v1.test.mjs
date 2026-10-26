import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-26) : « sur téléphone, les portes ne sont plus à la bonne taille par rapport aux images » (trop petites). Sur un petit portrait, le cadre de la porte (8 px) mangeait plus d'image que sur un grand : cadre réduit de moitié
 * sur les écrans étroits.
 */
const src = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
assert.ok(src.includes(".ygg-porte-g{margin:8px 0 8px 8px;"), "cadre normal inchangé sur grand écran");
const i = src.indexOf("@media (max-width:640px){.ygg-porte{");
assert.ok(i > 0, "règle pour écran étroit");
const bloc = src.slice(i, src.indexOf("}}'", i));
assert.ok(bloc.includes(".ygg-porte-g{margin:4px 0 4px 4px;}") && bloc.includes(".ygg-porte-d{margin:4px 4px 4px 0;}"), "marges réduites");
assert.ok(bloc.includes("inset 0 0 0 4px #17130f"), "liserés réduits");
console.log("idle-ygg-porte-telephone-v1: OK");
