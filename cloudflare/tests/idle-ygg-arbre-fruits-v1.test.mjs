import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-29) : les images R2 des décors d'Yggdrasil sont des arbres ; plus de terre ; les fruits sont posés sur l'arbre (taille normale, un nouveau chaque heure) ; l'aura brille de plus en plus jusqu'au niveau 24.
 */
const src = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
assert.ok(!src.includes("ygg-ater") && !src.includes("ygg-terre") && !src.includes("echelleTerre_"), "aucune trace de la terre");
const css = src.slice(src.indexOf(".ygg-vitre.ygg-decor .ygg-fruit{"), src.indexOf(".ygg-vitre.ygg-decor .ygg-fruit{") + 400);
assert.ok(css.includes("left:var(--ygg-x)") && css.includes("top:var(--ygg-y)") && css.includes("scale(var(--ygg-k,1))"), "chaque fruit est placé et dimensionné par ses variables");
assert.ok(css.includes("width:15%"), "taille normale, identique pour tous les fruits mûrs");
assert.ok(src.includes(".ygg-vitre.ygg-aura::after") && src.includes("--ygg-aura-a"), "aura de la couleur du fruit");
assert.ok(src.includes("FRUITS_24_[id]===true&&v.tier>0&&intensiteAura_(v)>0?' ygg-aura':''"), "aura dès la première heure de pousse");
console.log("idle-ygg-arbre-fruits-v1: OK");
