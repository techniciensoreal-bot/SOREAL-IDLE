import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-09) : « le nouveau slot d'accessoire était sous mes bottes ; il doit être sous mes 2 accessoires, à côté du pantalon ; le 4e sous le 3e, à côté des bottes ».
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
const debut = ui.indexOf("      function rendreAccessoiresAdventureIdleV138_(equipment,itemById,capacite){");
const fin = ui.indexOf("      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-240 */", debut);
assert.ok(debut > 0 && fin > debut);
const rendre = new Function("idleEntier_", "rendreEmplacementAccessoireAdventureIdleV138_", ui.slice(debut, fin) + "\nreturn rendreAccessoiresAdventureIdleV138_;")(
  (v, d) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? n : (d || 0); },
  (item, classe) => `[${classe || "debord"}:${item ? item.id : "vide"}]`
);
const objets = new Map([["a", { id: "a" }], ["b", { id: "b" }], ["c", { id: "c" }], ["d", { id: "d" }], ["e", { id: "e" }]]);
// 2 accessoires de base : colonne de gauche, face au casque et au torse
let r = rendre({ accessories: ["a", "b"] }, objets, 2);
assert.equal(r.enGrille, "[soreal-idle-v138-slot-acc1:a][soreal-idle-v138-slot-acc2:b]");
assert.equal(r.debordement, "");
// 3e : sous les deux premiers (à côté du pantalon) ; 4e : à côté des bottes
r = rendre({ accessories: ["a", "b"] }, objets, 4);
assert.equal(r.enGrille, "[soreal-idle-v138-slot-acc1:a][soreal-idle-v138-slot-acc2:b][soreal-idle-v138-slot-acc3:vide][soreal-idle-v138-slot-acc4:vide]");
assert.equal(r.debordement, "");
r = rendre({ accessories: ["a", "b", "c", "d"] }, objets, 4);
assert.ok(r.enGrille.includes("slot-acc3:c") && r.enGrille.includes("slot-acc4:d"));
// 5e et suivants : sous le paperdoll, comme avant
r = rendre({ accessories: ["a", "b", "c", "d", "e"] }, objets, 5);
assert.ok(r.debordement.includes("[debord:e]") && !r.enGrille.includes(":e]"));
// Grille : acc3 à gauche du pantalon, acc4 à gauche des bottes
assert.match(css, /"acc3 legs\s+weapon2"\s*\n\s*"acc4 boots\s+\."/, "acc3 face au pantalon, acc4 face aux bottes");
assert.ok(css.includes(".soreal-idle-v138-slot-acc3{grid-area:acc3}") && css.includes(".soreal-idle-v138-slot-acc4{grid-area:acc4}"));
console.log("idle-accessoires-paperdoll-v1: OK");
