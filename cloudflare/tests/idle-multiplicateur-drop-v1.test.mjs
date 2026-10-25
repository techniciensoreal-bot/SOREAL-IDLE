import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-19) : « le 100 % de drop n'est pas logique, ça voudrait dire qu'on loote à chaque fois ». La ligne de la carte de stats est un MULTIPLICATEUR (×1 de base), jamais un pourcentage de chance. */
const s = readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");
assert.ok(s.includes('<span class="soreal-idle-v79-stat-label">Multiplicateur de drop</span>'), "libellé : multiplicateur de drop");
assert.ok(!s.includes('stat-label">Chance de drop</span>'), "plus de « Chance de drop » à 100 %");
assert.ok(s.includes("'×'+format_(dropBonus?dTotal:dBase,2)") && s.includes("soreal-idle-v79-stat-vert") && !s.includes("avec les bonus)'"), "2026-10-25 : avec un bonus, le total remplace la base, en vert, sans la phrase");
assert.ok(!s.includes("dBase=dc?Math.max(0,number_(dc.base))*100"), "plus de multiplication par 100");
console.log("idle-multiplicateur-drop-v1: OK");
