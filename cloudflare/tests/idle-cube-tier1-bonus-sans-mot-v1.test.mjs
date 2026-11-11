import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-13) : au palier 1 du cube, plus de mot « cube » dans les statistiques d'Aventure. Refonte 2026-11-11 : la ligne n'affiche plus que le total ; le Cube est une ligne à part dans le détail (« i »), avec sa couleur mauve. */
const scene = readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");
assert.ok(scene.includes("var cubePalierN=Math.floor(number_(a&&a.cubeTier&&a.cubeTier.tier));"), "le palier du cube est toujours lu sur l'état d'Aventure");
assert.ok(scene.includes("ligne('Cube','+'+format_(det.cube,prec),'sd-cube')"), "le Cube est une ligne du détail de provenance, en mauve");
assert.ok(!scene.includes("' (+'+cubeTexte+"), "plus de « (+x) » mauve dans la ligne de statistique");
console.log("idle-cube-tier1-bonus-sans-mot-v1: OK");
