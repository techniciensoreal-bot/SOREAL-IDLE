import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleAdventureStateV47, idleAdventureSnapshotV47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-10-03) :
 *  - « si je tape magic, il ne me trouve rien ; si je tape forest, rien, mais foret oui » : la recherche du coffre doit aussi trouver les noms d'origine (anglais) et les statistiques ;
 *  - coffre en mannequins : chaque set posé comme équipé (tête, torse, jambes, bottes), les sets côte à côte ;
 *  - filtre de butin amélioré : se règle objet par objet dans le coffre.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// 1. Le serveur fournit, pour chaque case, le nom d'origine, celui du set et les types de statistiques.
{
  const s = normalizeIdleAdventureStateV47({});
  for (const d of ["forest:head", "forest:weapon", "tubaTime", "cheeseGrater"]) s.itemList[d] = { seen: true };
  const slots = idleAdventureSnapshotV47(s, 100).coffreSlots;
  const casque = slots.find((x) => x.definitionId === "forest:head");
  assert.equal(casque.nameEn, "Forest Helmet", "nom d'origine pour la recherche « forest »");
  assert.equal(casque.setNameEn, "Forest Set");
  assert.deepEqual(casque.statsTypes, ["energyPowerPct", "energySpeedPct"], "types de stats pour la recherche « power / speed »");
  const tuba = slots.find((x) => x.definitionId === "tubaTime");
  assert.equal(tuba.nameEn, "Tuba of Time");
  assert.ok(tuba.statsTypes.includes("energyPowerPct"));
  const rape = slots.find((x) => x.definitionId === "cheeseGrater");
  assert.ok(rape.statsTypes.includes("dropChancePct") && rape.statsTypes.includes("magicSpeedPct"), "stats supplémentaires incluses (« magic » trouve la râpe)");
}

// 2. La recherche du client regarde ces champs (noms français ET anglais, stats dans les deux langues).
assert.ok(ui.includes("[s.name,s.nameEn,s.setName,s.setNameEn,s.groupeNom].concat(intitulesTypesCoffreIdleV1_(s))"));
assert.ok(ui.includes("noms.push(en);") && ui.includes("noms.push(tr(en));"), "intitulés anglais et français");

// 3. Mannequins : colonne tête / torse / jambes / bottes, arme et accessoires à côté, sets à la suite.
assert.ok(ui.includes("const LIGNE_ARMURE={head:1,chest:2,legs:3,boots:4};"));
assert.ok(ui.includes("soreal-idle-coffre-mannequin-v1") && ui.includes("soreal-idle-coffre-mannequins-v1"));
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
assert.ok(css.includes(".soreal-idle-coffre-mannequin-v1{display:grid;grid-template-columns:repeat(2,56px)"), "cases de 56 px comme avant");
assert.ok(css.includes(".soreal-idle-coffre-mannequins-v1{display:flex!important;flex-wrap:wrap"), "sets côte à côte puis à la ligne");
// Anti-spoil : aucune case grisée pour une pièce non découverte (seules les pièces connues sont rendues).
assert.ok(ui.includes("slots=slots.filter(function(s){return s&&s.decouvert;});"));

// 4. Filtre amélioré : bouton sur chaque case du coffre, seulement une fois acheté.
assert.ok(ui.includes("unlocked.lootFilterImproved") && ui.includes("__filtrerObjetCoffreIdleV1__"));
assert.ok(ui.includes("if(!filtreAmeliore)return '';"), "pas de bouton avant l'achat (anti-spoil)");
const mod = readFileSync("cloudflare/public/modules/inventory-auto-v1.js", "utf8");
assert.ok(!mod.includes("<summary>Filtre amélioré"), "l'ancienne liste est remplacée par le bouton du coffre");
console.log("idle-coffre-mannequins-recherche-filtre-v1: OK");
