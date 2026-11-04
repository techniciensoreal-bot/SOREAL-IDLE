/* Cthulhu, la mascotte (Norman, 2026-11-04) + barres LED des Augmentations + galop + clown continu : gardes de cohérence. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { IDLE_TUTO_HUMEURS_V1, normaliserGuideV1 } from "../src/idle-tutoriel-v1.js";

const R = path.resolve(import.meta.dirname, "..");
const lire = (f) => fs.readFileSync(path.join(R, f), "utf8");

// 1. Invisible par défaut : un guide n'a pas de mascotte tant que l'administrateur ne la demande pas ; l'humeur inconnue est écartée
const base = { id: "t", titre: "T", declencheur: { type: "menu", menu: "ngu" }, etapes: [{ titre: "a", texte: "b" }] };
assert.equal(normaliserGuideV1(base).mascotte, false, "aucune mascotte par défaut");
assert.equal(normaliserGuideV1({ ...base, mascotte: true }).mascotte, true);
assert.equal(normaliserGuideV1(base).etapes[0].humeur, "", "humeur vide par défaut");
assert.equal(normaliserGuideV1({ ...base, etapes: [{ titre: "a", texte: "b", humeur: "nimportequoi" }] }).etapes[0].humeur, "", "humeur inconnue écartée");
for (const h of IDLE_TUTO_HUMEURS_V1) assert.equal(normaliserGuideV1({ ...base, etapes: [{ titre: "a", texte: "b", humeur: h }] }).etapes[0].humeur, h);

// 2. Les mêmes humeurs côté mascotte et côté éditeur
const mod = lire("public/modules/cthulhu-v1.js");
const liste = /var EXPRESSIONS=\[([^\]]*)\]/.exec(mod)[1].split(",").map((x) => x.replace(/'/g, "").trim());
assert.deepEqual([...liste].sort(), [...IDLE_TUTO_HUMEURS_V1].sort(), "humeurs : serveur et mascotte identiques");
const admin = lire("public/modules/admin-tutoriel-v1.js");
for (const h of IDLE_TUTO_HUMEURS_V1) if (h !== "normal") assert.ok(admin.includes("['" + h + "'"), "humeur proposée dans l'éditeur : " + h);

// 3. Toutes les pièces utilisées existent (fichier + position)
const pieces = JSON.parse(/=(\{.*\});\}\)\(\);/s.exec(lire("public/modules/cthulhu-pieces-v1.js"))[1]);
for (const m of mod.matchAll(/img\(P,'([a-z_0-9]+)'/g)) {
  assert.ok(pieces[m[1]], "pièce déclarée : " + m[1]);
  assert.ok(fs.existsSync(path.join(R, "public", "cthulhu", m[1] + ".webp")), "fichier présent : " + m[1]);
}

// 4. La mascotte ne s'affiche que si le guide la demande, et en grand elle reste dans l'écran
const tuto = lire("public/modules/tutoriel-v1.js");
assert.ok(tuto.includes("(s.guide.mascotte?mascotteHtml_(e):'')"), "Cthulhu seulement si le guide la demande");
assert.ok(tuto.includes("tu-cth-grand{position:fixed") && tuto.includes("tu-bas-cth"), "en grand : plein cadre, fenêtre en bas");

// 5. Barres LED : ajoutées après le rendu, gardées par le morph, relancées après redessin
const led = lire("public/modules/aug-led-barres-v1.js");
assert.ok(led.includes("data-morph-garder") && led.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__"), "barres LED : règle n°4");
assert.ok(lire("public/index.html").includes("/modules/aug-led-barres-v1.js"), "script chargé");

// 6. Galop : une seule fois par mort, coupé en animation réduite
const borne = lire("public/modules/borne-led-v1.js");
assert.ok(borne.includes("function galop()") && borne.includes("mortAGalop=true") && borne.includes("reduit())return;"), "galop après une défaite");

// 7. Clown : la course se règle sur la durée et l'issue prévues, la défaite enchaîne sans relancer la course
assert.ok(borne.includes("pp.issue==='defaite'&&du>=0") && borne.includes("p.suite=true") && borne.includes("cont=Boolean(pp.suite)"), "clown continu");

// 8. Wandoos : vitesse en niveaux entiers au-dessus d'un niveau par seconde ; tour de barre sur l'horloge du jeu
const wd = lire("public/modules/wandoos-retro-v1.js");
assert.ok(wd.includes("Math.floor(n+1e-9)+' niv/s'"), "vitesse entière");
assert.ok(wd.includes("var ph=((maintenant_()/1000)*3)%1;"), "tour de barre calé sur l'horloge, pas sur la synchro");

console.log("idle-cthulhu-mascotte-v1: OK");
