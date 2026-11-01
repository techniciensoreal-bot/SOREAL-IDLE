import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/*
 * Collection > Équipement, boosts en bas de page (Norman, 2026-11-01) : « toujours classés par ordre de chiffre 1 2 5 10 20 50 100, complétés ou non, et toujours dans l'ordre orange, bleu, jaune » (orange = puissance, bleu = endurance, jaune = spécial, couleurs de ui-aventure-2-v1.js).
 * On exécute le VRAI comparateur extrait du module.
 */
const ici = dirname(fileURLToPath(import.meta.url));
const code = readFileSync(join(ici, "..", "public", "modules", "ui-inventaire-v1.js"), "utf8").replace(/\r\n/g, "\n");
const debut = code.indexOf("const ORDRE_COULEUR_BOOST_V1=");
const fin = code.indexOf("const totalPagesEquipement=", debut);
assert.ok(debut > 0 && fin > debut, "bloc de tri trouvé");
const re = /^boost:([a-z]+):(\d+)$/;
const fabrique = new Function("IDLE_COLLECTION_BOOST_RE_V1", "itemList", code.slice(debut, fin) + "\nreturn idsBoosts;");
const forces = [100, 1, 50, 5, 20, 2, 10];
const types = ["special", "power", "toughness"];
const itemList = {};
for (const f of forces) for (const t of types) itemList[`boost:${t}:${f}`] = { maxLevel: Math.random() < .5 ? 100 : 3 };   /* complétés ou non, dans un ordre quelconque */
itemList["sword:head"] = { maxLevel: 4 };
const ids = fabrique(re, itemList);
const attendu = [];
for (const f of [1, 2, 5, 10, 20, 50, 100]) for (const t of ["power", "toughness", "special"]) attendu.push(`boost:${t}:${f}`);
assert.deepEqual(ids, attendu, "valeur croissante puis orange, bleu, jaune");
console.log("idle-collection-boosts-ordre-v1: OK");
