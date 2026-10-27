import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-27) : « dans Yggdrasil, quand un fruit commence à pousser, une petite aura dépasse du tas de terre, de couleur différente selon le fruit (dorée pour l'or, rougeâtre pour la puissance…), seulement sur le dessus de la terre, pas en dessous. »
 */
const src = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
const css = src.slice(src.indexOf(".ygg-vitre.ygg-ater::before{"), src.indexOf(".ygg-vitre.ygg-ater::before{") + 700);
assert.ok(css.includes("bottom:1.2%") && css.includes("at 50% 100%"), "le calque s'arrête à la ligne du sol et la lueur est centrée sur le sol : rien en dessous");
assert.ok(css.includes("z-index:0") && css.includes("var(--ygg-ac)"), "derrière la terre, de la couleur du fruit");
assert.ok(!/animation/.test(css), "image fixe, aucune animation");
assert.ok(src.includes("FRUITS_24_[id]===true&&v.tier>0&&v.active?' ygg-ater':''"), "seulement quand le fruit pousse (actif)");
assert.ok(src.includes("(v.tier>0&&v.active?';--ygg-ac:'+(AURAS_[id]||'#ffd34a'):'')"), "couleur propre à chaque fruit");
assert.match(src, /gold:'#ffb21f'/, "l'or est doré");
assert.match(src, /powerAlpha:'#ff4a2a'/, "la puissance est rougeâtre");
const couleurs = src.match(/var AURAS_=\{([^}]*)\}/)[1].match(/'#[0-9a-f]{6}'/gi);
assert.ok(new Set(couleurs).size >= 15, "des couleurs différentes selon le fruit");
console.log("idle-ygg-aura-terre-v1: OK");
