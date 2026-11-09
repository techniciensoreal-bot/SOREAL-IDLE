import assert from "node:assert/strict";
import fs from "node:fs";

/* Norman (2026-11-09) : « sur téléphone, faire tourner les pages des chroniques vers la gauche redessine énormément de choses ; trouve un moyen moins coûteux pour le téléphone ». Sur téléphone (une seule page, pas de livre à deux pages) la feuille GLISSE à plat ; sur PC le pivot 3D reste. */
const s = fs.readFileSync("cloudflare/public/modules/album-cartes-v1.js", "utf8");
const f = s.slice(s.indexOf("function tournerUne("), s.indexOf("function page_("));
assert.ok(f.includes("if(!deux)D=Math.min(D,380);"), "téléphone : tour de 0,38 s au plus (le PC garde 1,15 s)");
assert.ok(f.includes(":[{transform:'translateX(0)',opacity:1},{transform:'translateX(-100%)',opacity:0}],") && f.includes(":[{transform:'translateX(-100%)',opacity:0},{transform:'translateX(0)',opacity:1}],"), "téléphone : glissement à plat, vers l'avant et vers l'arrière");
// plus aucun pivot 3D ni translateZ sur le chemin du téléphone (la branche « deux » le garde)
const phone = [...f.matchAll(/:\[\{transform:'translateX[^\]]*\]/g)].map((m) => m[0]).join("");
assert.ok(!/rotateY|translateZ/.test(phone), "le chemin du téléphone n'a ni rotateY ni translateZ");
assert.ok(f.includes("if(deux)basculer(facesAV,facesAR,true,D,E);") && f.includes("if(deux)basculer(facesAV,facesAR,false,D,E);"), "face arrière (basculer) seulement sur PC");
assert.equal((f.match(/if\(deux\)\[ombresFace\[0\],ombresFace\[1\]\]/g) || []).length, 2, "ombres des faces animées seulement sur PC");
assert.equal((f.match(/if\(deux\)ombreD\.animate\(/g) || []).length, 2, "ombre du sol animée seulement sur PC");
assert.ok(f.includes("rotateY(-90deg)") && f.includes("translateZ(70px)"), "le PC garde le pivot 3D");
console.log("idle-album-tour-telephone-leger-v1: OK");
