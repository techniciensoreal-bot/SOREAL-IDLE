import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import fs from "node:fs";
const ui = lireUiComplet();
/* Norman (2026-10-15) : « dans l'inventaire les images se chargent au compte-gouttes ; avant elles étaient toutes affichées directement » : les images d'objets, de boosts et de cubes ne sont plus en chargement différé. */
const a = ui.indexOf("function iconeBaseObjetAdventureIdleV138_(item){"), b = ui.indexOf("}\n", ui.indexOf("emojiRepliObjetIdleV1_(iconeSlotAdventureIdleV138_(item.slot))", a));
const corps = ui.slice(a, b);
assert.ok(!corps.includes('loading="lazy"'), "pas de chargement différé des icônes d'objets");
assert.equal((corps.match(/loading="eager" decoding="async"/g) || []).length, 3, "trois icônes (boost, cube, objet) chargées tout de suite");
console.log("idle-inventaire-images-immediates-v1: OK");
