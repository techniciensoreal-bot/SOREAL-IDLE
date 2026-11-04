import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-22) : sous Wandoos, quand le temps restant avant le prochain niveau descend sous 1 s, on écrit la vitesse en N/s, jusqu'au cap de 50 niveaux par seconde.
 */
const src = readFileSync(new URL("../public/modules/wandoos-retro-v1.js", import.meta.url), "utf8");
const a = src.indexOf("function nivParS_(v)");
const b = src.indexOf("  function bloc_(");
assert.ok(a > 0 && b > a);
const f = new Function("nb_", "dureeTexte_", src.slice(a, b) + "\nreturn {texteTaux_,texteReste_};");
const T = f((v) => Number(v) || 0, (s) => Math.ceil(s) + " s");
assert.equal(T.texteReste_(0, 0), "RESTE : —");
assert.equal(T.texteReste_(0.5, 0), "RESTE : 2 s · 0,50 niv/s", "moins d'un niveau par seconde : le temps restant");
assert.equal(T.texteReste_(1, 0.5), "RESTE : 1 s · 1,00 niv/s", "exactement 1 niveau/s : encore un temps");
assert.equal(T.texteReste_(3.5, 0), "VITESSE : 3 niv/s", "au-dessus : des niveaux par seconde");
assert.equal(T.texteReste_(12.4, 0), "VITESSE : 12 niv/s");
assert.equal(T.texteReste_(20, 0), "VITESSE : 20 niv/s", "plus de « < 1 s »");
assert.equal(T.texteReste_(50, 0), "VITESSE : 50 niv/s");
assert.equal(T.texteReste_(5000, 0), "VITESSE : 50 niv/s", "plafonné au cap de 50 niveaux par seconde");
assert.ok(src.includes("var t=vit>1?texteTaux_(vit):"), "mis à jour en continu sous la barre aussi");
assert.ok(!src.includes("'RESTE : < 1 s'"), "ancien texte retiré");
console.log("idle-wandoos-reste-niveaux-par-seconde-v1: OK");
