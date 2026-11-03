// NGU (Norman, 2026-11-03) : « j'ai retiré toute la magie du NGU magie et pourtant les aurores boréales continuent ainsi que les étoiles ».
// Le ciel d'un onglet ne s'éclaire que par SES machines : onglet Magie = NGU de magie seulement, onglet Énergie = NGU d'énergie seulement (avant : moyenne de toutes les machines, l'énergie qui tourne gardait le ciel de la magie allumé).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8").split(String.fromCharCode(13)).join("");
assert.ok(src.includes("filter(function(n){return n.resource===onglet&&(n.resource!=='magic'||magieOk);}).map(partDe_)"), "rendu : la lumière de la page ne compte que les machines de l'onglet affiché");
assert.ok(src.includes("racine.querySelectorAll('.nl-section[data-nl-section=\"'+ongletCiel+'\"] [data-nl-ngu]')"), "tick : le niveau de lumière ne lit que les tuyaux de la section de l'onglet");
assert.ok(src.includes("var actif=Array.prototype.some.call(racine.querySelectorAll('.nl-section[data-nl-section=\"'+(racine.getAttribute('data-nl-onglet')||'energy')+'\"] [data-nl-ngu]')"), "tick : les étoiles ne scintillent que si un tuyau DE L'ONGLET reçoit quelque chose");
assert.ok(!/var parts=Array\.prototype\.map\.call\(racine\.querySelectorAll\('\[data-nl-ngu\]'\)/.test(src), "plus de moyenne sur toutes les machines");
// calcul : magie à 0, énergie qui tourne → ciel de la magie éteint (niveau 0)
const lueurDe = (parts) => (parts.length ? Math.max(0, Math.min(1, parts.reduce((a, b) => a + b, 0) / parts.length)) : 0);
assert.equal(lueurDe([]), 0);
assert.equal(lueurDe([0, 0, 0]), 0, "aucune magie placée : lumière 0");
assert.ok(lueurDe([0.5, 0, 0]) > 0, "un NGU de magie qui tourne : le ciel s'éclaire");
console.log("idle-ngu-ciel-par-onglet-v1 : OK");
