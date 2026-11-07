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
assert.equal(g.etapes[0].scene, "arrivee");
assert.ok(g.etapes[0].texte.startsWith("Oh... un nouvel arrivant. Salut, moi c'est Lhu, pour faire court."));
assert.ok(g.etapes[0].texte.endsWith("Pète-lui la gueule !"));
assert.equal(g.etapes[1].scene, "pose");
assert.equal(g.etapes[1].texte, "Appuie sur le gros bouton rouge.");
assert.equal(g.etapes[1].avanceAuClic, true, "il faut cliquer sur Fight");
assert.equal(g.etapes[1].surbrillance, false, "aucun cadre autour du bouton");
assert.equal(normaliserGuideV1({ ...IDLE_TUTORIEL_LHU_V1, etapes: [{ ...IDLE_TUTORIEL_LHU_V1.etapes[0], scene: "n'importe quoi" }] }).etapes[0].scene, "", "scène inconnue ignorée");

const sc = fs.readFileSync("cloudflare/public/modules/cthulhu-scene-v1.js", "utf8");
assert.ok(/function tourner\(expr\)\{visage\(expr\);return Promise\.resolve\(\);\}/.test(sc), "demi-tour en une seule image");
assert.ok(/attendre\(1000\)/.test(sc), "une seconde d'attente après le demi-tour");
assert.ok(/el\.id==='sorealIdleBossNukeV1'/.test(sc) && /posable\(selecteur\)\?'normal':'vole'/.test(sc), "il ne se pose que sur le bouton Nuke");
assert.ok(!/partir\(\)/.test(fs.readFileSync("cloudflare/public/modules/tutoriel-v1.js", "utf8")), "il ne part pas à la fin du guide");
assert.ok(/data-morph-garder/.test(sc), "règle n°4 : le morph le laisse en place");
const tu = fs.readFileSync("cloudflare/public/modules/tutoriel-v1.js", "utf8");
assert.ok(tu.includes("etape.surbrillance!==false&&!etape.scene"), "pas de cadre pendant une scène");
assert.ok(tu.includes("'#'+ID+'.tu-bulle{"), "bulle de dialogue");
console.log("idle-cthulhu-scene-v1: OK");
