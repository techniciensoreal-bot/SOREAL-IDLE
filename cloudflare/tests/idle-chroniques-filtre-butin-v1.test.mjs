/*
 * Chroniques > Équipement : filtre de butin (Norman, 2026-11-11 : « on doit pouvoir filtrer les objets qui tombent en aventure via cette page ; les boosts doivent pouvoir être filtrés et vont dans le cube »).
 * Même bouton, même liste globale (lootItems) et même action que le Coffre ; seulement avec le filtre amélioré acheté ; pas sur les consommables ; les boosts aussi.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync("cloudflare/public/modules/ui-inventaire-v1.js", "utf8");
const i = src.indexOf("function rendreCollectionEquipementIdleV1_");
const fn = src.slice(i, src.indexOf("const IDLE_ADVENTURE_COMBAT_FIELDS_V1"));
assert.ok(fn.includes("iaFiltreCh.unlocked.lootFilterImproved") && fn.includes("if(!filtreAmelioreCh)return '';"), "le bouton n'existe qu'avec le filtre amélioré");
assert.ok(fn.includes("window.__filtrerObjetCoffreIdleV1__(") && fn.includes("String(id))+"), "même action que le Coffre (liste globale partagée)");
assert.ok(fn.includes("iaFiltreCh.lootFilter.items"), "l'état coché vient de la même liste que le Coffre");
assert.ok(fn.includes("boutonFiltreChroniquesV1_(id,true)"), "les boosts ont leur bouton");
assert.ok(fn.includes("def.consumable||def.slot==='consumable'?'':boutonFiltreChroniquesV1_(id,false)"), "pas de bouton sur les consommables (comme le Coffre)");
assert.ok(fn.includes("filterBoostsIntoCube") && fn.includes("Il part directement dans le Cube"), "l'info-bulle d'un boost dit où il va");
/* le moteur verse bien un boost filtré dans le Cube (déjà en place) */
const moteur = fs.readFileSync("cloudflare/src/idle-inventory-auto-v1.js", "utf8");
assert.ok(moteur.includes('o.kind === "boost" && env?.filterBoostsIntoCube && s.cube?.unlocked'), "boost filtré -> Cube");
console.log("idle-chroniques-filtre-butin-v1: OK");
