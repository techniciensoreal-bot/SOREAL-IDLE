import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « En aventure, je voudrais quelque chose de plus chouette pour indiquer que c'est le
 * Boss de zone. Et si possible sur une ligne. » L'ancien suffixe texte " (BOSS)" (moins compact, concurrence le
 * nom pour la largeur disponible avant que uneLigneIdleV1_ ne rétrécisse la police) est remplacé par une petite
 * couronne dorée devant le nom, dans le même bloc de texte (donc toujours sur une ligne).
 */
const src = readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");

// --- Le vieux suffixe est bien retiré. ---
assert.ok(!src.includes("' (BOSS)'"), "l'ancien suffixe texte ' (BOSS)' doit être retiré");

// --- La couronne n'apparaît que pour un boss, échappe le nom (jamais d'injection HTML), et reste sur la même ligne. ---
const i = src.indexOf("nomMonstre.innerHTML=");
assert.ok(i > 0, "affectation du nom introuvable");
const ligne = src.slice(i, src.indexOf(";", i));
assert.match(ligne, /fight\.boss\?'<span class="soreal-idle-v79-boss-crown-v1"[^>]*>👑<\/span>':''/, "couronne seulement si fight.boss");
assert.match(ligne, /html_\(fight\.mobName\|\|'Ennemi'\)/, "le nom passe par l'échappeur HTML du module (jamais une injection directe)");
assert.ok(src.indexOf("uneLigneIdleV1_(nomMonstre);", i) > i, "uneLigneIdleV1_ s'applique toujours après (couronne + nom = un seul bloc à faire tenir sur une ligne)");

// --- Le style existe (couronne visible, un peu d'éclat -- « plus chouette » que du texte plat). ---
assert.match(src, /\.soreal-idle-v79-boss-crown-v1\{[^}]*filter:drop-shadow\([^)]+\)[^}]*animation:sorealIdleBossCrownPulseV1/);
assert.match(src, /@keyframes sorealIdleBossCrownPulseV1\{/);

console.log("idle-adventure-boss-crown-v1: OK");
