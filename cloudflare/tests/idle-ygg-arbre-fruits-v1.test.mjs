import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-29) : les images R2 des décors d'Yggdrasil sont des arbres ; plus de terre ; les fruits sont posés sur l'arbre (taille normale, un nouveau chaque heure) ; l'aura brille de plus en plus jusqu'au niveau 24.
 */
const src = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
assert.ok(!src.includes("ygg-ater") && !src.includes("ygg-terre") && !src.includes("echelleTerre_"), "aucune trace de la terre");
const css = src.slice(src.indexOf(".ygg-vitre.ygg-decor .ygg-fruit{"), src.indexOf(".ygg-vitre.ygg-decor .ygg-fruit{") + 400);
assert.ok(css.includes("left:var(--ygg-x)") && css.includes("top:var(--ygg-y)") && css.includes("scale(var(--ygg-k,1))"), "chaque fruit est placé et dimensionné par ses variables");
assert.ok(css.includes("width:13%"), "taille normale, identique pour tous les fruits mûrs");
assert.ok(src.includes(".ygg-vitre.ygg-portrait.ygg-decor{aspect-ratio:1/1;width:100%;margin:0;}"), "cadre carré : l image entière de l arbre (Norman 2026-10-29)");
/* Norman (2026-10-29) : « retire les lueurs autour des cadres : trop fortes, et seulement quand un fruit a atteint son maximum (10/10, 11/11…), de la couleur du fruit ; une aura autour des fruits prêts à être récoltés sur l'arbre » */
assert.ok(!src.includes("ygg-vitre.ygg-aura") && !src.includes("@keyframes yggLueur{") && !src.includes("@keyframes yggBrille{") && !src.includes(".ygg-carte.pret{box-shadow"), "plus de lueur autour du cadre d'un fruit qui pousse ou qui est prêt");
assert.ok(src.includes("(v.tier>0&&v.tier>=d.maxTier?' ygg-max':'')") && src.includes("--lueur:'+rvb_(AURAS_[id])"), "lueur du cadre seulement au palier maximum, de la couleur du fruit");
const lueur = src.match(/@keyframes yggBrilleMax\{0%,100%\{[^}]*\}50%\{[^}]*\}\}/)[0];
assert.ok(/0 0 12px 3px rgba\(var\(--lueur\),\.52\)/.test(lueur) && !/\d{2}px \d{2}px/.test(lueur) && /yggBrilleMax\{0%,100%\{/.test(lueur), "lueur douce (12 px au plus fort ; l'ancienne montait à 96 px), boucle sans à-coup");
assert.ok(src.includes(".ygg-fruit.ygg-mur{filter:drop-shadow(0 0 3px var(--ygg-aura))") && src.includes("(f[2]===1?' ygg-mur':'')") && src.includes("--ygg-aura:'+(AURAS_[id]||'#ffd34a')"), "aura de la couleur du fruit sur chaque fruit mûr de l'arbre (jamais sur celui qui pousse)");
console.log("idle-ygg-arbre-fruits-v1: OK");
