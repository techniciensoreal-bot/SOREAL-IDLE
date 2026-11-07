import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-07) : « avant le million, dans notre barre de vie et sur la borne d'arcade, je veux le format 1000 999.999 100.000 1M ». Nombres ENTIERS : tels quels jusqu'à 9999, puis un point tous les trois chiffres (10.000, 100.000, 999.999),
 * puis abrégés à partir du million sans zéros inutiles (1M, 1,5M ; sur la borne, dont la petite police n'a pas de virgule : 1.5M). Appliqué à la vie du joueur (bandeau, duel) et au texte de vie de la borne ; la vie du boss dans le duel garde son format.
 */
const src = fs.readFileSync("cloudflare/public/modules/ui-aventure-1-v1.js", "utf8");
const i = src.indexOf("function formaterPvEntierIdleV1_("), j = src.indexOf("function formaterDecimalesFixesIdleV1_(");
assert.ok(i > 0 && j > i, "formateur trouvé");
const f = new Function("idleNombre_", src.slice(i, j) + "\nreturn formaterPvEntierIdleV1_;")((v) => Number(v) || 0);
const attendu = [[0, "0"], [0.4, "0"], [183.35, "183"], [999, "999"], [1000, "1000"], [9999.9, "9999"], [10000, "10.000"], [100000, "100.000"], [999999.9, "999.999"], [1e6, "1,00M"], [1.5e6, "1,50M"], [2.9e6, "2,90M"], [1234567, "1,23M"], [999999999.9, "1,00B"], [12.5e12, "12,50T"], [-5, "0"]];
for (const [v, t] of attendu) assert.equal(f(v), t, "format de " + v);
assert.equal(f(1.5e6, true), "1.50M", "sur la borne : point décimal (pas de virgule dans la petite police)");
assert.equal(f(100000, true), "100.000");
/* branchement */
const amorce = fs.readFileSync("cloudflare/public/modules/ui-amorcage-v1.js", "utf8");
assert.ok(amorce.includes("window.__SOREAL_IDLE_TEXTE_PV_V2__=function(pv,max){return formaterPvEntierIdleV1_(pv)+' / '+formaterPvEntierIdleV1_(max);};"), "bandeau : vie du joueur en entiers");
assert.ok(amorce.includes("window.__SOREAL_IDLE_TEXTE_REGEN_PV_V2__=function(r){return r>0?'+'+formaterPvFixeIdleV1_(r)+'/s':'';};"), "la régénération garde son format");
const boucle = fs.readFileSync("cloudflare/public/modules/ui-boucle-v1.js", "utf8");
assert.ok(/formaterPvEntierIdleV1_\(REG\.idleEtat\.pvJoueur\)\+\s*' \/ '\+\s*formaterPvEntierIdleV1_\(REG\.idleEtat\.pvJoueurMax\)/.test(boucle), "duel : vie du joueur en entiers");
assert.ok(/formaterPvFixeIdleV1_\(REG\.idleEtat\.bossPv\)/.test(boucle), "duel : la vie du boss garde son format");
const borne = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8");
assert.ok(borne.includes("cur:String(fmtE(bp)),max:String(fmtE(bpm)),") && borne.includes("r.formaterPvEntierIdleV1_(v,true)"), "borne : texte de vie en entiers, point décimal");
console.log("idle-pv-joueur-format-entier-v1: OK");
