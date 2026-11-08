import assert from "node:assert/strict";
import fs from "node:fs";
import { normaliserGuideV1, IDLE_TUTORIEL_LHU_V1 } from "../src/idle-tutoriel-v1.js";

/*
 * Norman (2026-11-07) : première scène de Lhu. Il arrive en volant par la droite, s'arrête avec des points d'interrogation, zoome, parle (bulle de dialogue), se retourne EN UNE IMAGE, attend 1 s, vole de dos jusqu'au
 * bouton Nuke, s'y POSE (seul endroit où il se pose), dit « Appuie sur le gros bouton rouge » ; aucun cadre autour de ce qu'il faut cliquer ; il ne part pas au clic sur Fight.
 */
const g = normaliserGuideV1(IDLE_TUTORIEL_LHU_V1);
assert.equal(g.mascotte, true);
assert.equal(g.declencheur.type, "debut");
/* Norman (2026-11-07) : « fais plus de bulles, pas autant de textes dans une » : chaque bulle dit une idée (100 caractères au plus) ; il se retourne AU DÉBUT de « Tu vois ce petit bout de peluche ? Pète-lui la gueule ! ». */
assert.ok(g.etapes.length >= 40);
for (const e of g.etapes) assert.ok(e.texte.length <= 100, "bulle courte : " + e.texte);
assert.equal(g.etapes[0].scene, "arrivee");
assert.equal(g.etapes[0].texte, "Oh... un nouvel arrivant.");
assert.equal(g.etapes[1].texte, "Salut, moi c'est Lhu, pour faire court.");
assert.equal(g.etapes[2].texte, "Mon vrai nom te demanderait de te mâcher la langue avant de l'avaler pour pouvoir le prononcer.");
const iPeluche = g.etapes.findIndex((e) => e.texte.startsWith("Tu vois ce petit bout de peluche"));
assert.ok(iPeluche > 0);
assert.equal(g.etapes[iPeluche].scene, "retourne", "retourné dès le début de la phrase");
assert.equal(g.etapes[iPeluche + 1].texte, "Pète-lui la gueule !");
assert.equal(g.etapes[iPeluche + 2].scene, "pose");
assert.equal(g.etapes[iPeluche + 2].texte, "Appuie sur le gros bouton rouge.");
assert.equal(g.etapes[iPeluche + 2].avanceAuClic, true, "il faut cliquer sur Fight");
assert.equal(g.etapes[iPeluche + 2].surbrillance, false, "aucun cadre autour du bouton");
assert.ok(g.etapes.some((e) => e.texte.includes("{input}")), "dit le nombre de la zone input");
assert.ok(g.etapes.some((e) => e.attendreVictoire === true), "attend la victoire sur le boss");
assert.equal(normaliserGuideV1({ ...IDLE_TUTORIEL_LHU_V1, etapes: [{ ...IDLE_TUTORIEL_LHU_V1.etapes[0], scene: "n'importe quoi" }] }).etapes[0].scene, "", "scène inconnue ignorée");

const sc = fs.readFileSync("cloudflare/public/modules/cthulhu-scene-v1.js", "utf8");
assert.ok(/function tourner\(expr\)\{visage\(expr\);return Promise\.resolve\(\);\}/.test(sc), "demi-tour en une seule image");
assert.ok(/attendre\(300\)/.test(sc), "courte attente après le demi-tour (Norman, 2026-11-08 : le tuto enchaîne plus vite)");
assert.ok(/el\.id==='sorealIdleBossNukeV1'/.test(sc) && /posable\(selecteur\)\?'normal':'vole'/.test(sc), "il ne se pose que sur le bouton Nuke");
assert.ok(/sc\.partir\(\)/.test(fs.readFileSync("cloudflare/public/modules/tutoriel-v1.js", "utf8")), "il s'envole à la fin du guide (pas au clic sur Fight)");
assert.ok(/data-morph-garder/.test(sc), "règle n°4 : le morph le laisse en place");
const tu = fs.readFileSync("cloudflare/public/modules/tutoriel-v1.js", "utf8");
assert.ok(tu.includes("etape.surbrillance!==false&&!etape.scene"), "pas de cadre pendant une scène");
assert.ok(tu.includes("'#'+ID+'.tu-bulle{"), "bulle de dialogue");
console.log("idle-cthulhu-scene-v1: OK");
