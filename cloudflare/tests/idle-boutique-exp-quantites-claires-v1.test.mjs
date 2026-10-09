import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-09) : « les panneaux de quantités de la boutique doivent être plus clairs : 0,1 de vitesse pour 3 EXP ; 1 niveau de vitesse pour 30 EXP. Dans quantité personnalisée, 1 = 30 EXP, 0,1 = 3 EXP. »
 */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

// Lignes de prix : « +gain Nom ➜ coût », avec le nom de la statistique.
assert.ok(meta.includes("'<u>'+l.nom+'</u><s>➜</s><b>'+l.cout+' '+(unite||'EXP')+'</b>"), "ligne « +gain Nom ➜ coût »");
assert.ok(meta.includes("nom:statDef?statDef.icone+' '+statDef.nom:''"), "le nom de la statistique est passé aux lignes de prix et aux offres");
assert.ok(meta.includes("idleExpShopBoutonsLotIdleV1_(res.id,stat.id,achat,stat)") && meta.includes("idleExpShopLotPersonnaliseIdleV1_(res.id,stat.id,achat,stat)"));

// Saisie personnalisée : en unités de la statistique (saisie ÷ gain par achat).
const debut = meta.indexOf("function idleExpAchatsDepuisSaisieIdleV1_");
const fn = new Function(meta.slice(debut, meta.indexOf("function idleExpShopLotPersonnaliseIdleV1_")) + "\nreturn idleExpAchatsDepuisSaisieIdleV1_;")();
assert.equal(fn("0.1", 0.1), 1, "0,1 de vitesse = 1 achat = 3 EXP");
assert.equal(fn("0,1", 0.1), 1, "virgule acceptée");
assert.equal(fn("1", 0.1), 10, "1 de vitesse = 10 achats = 30 EXP");
assert.equal(fn("0.3", 0.1), 3, "pas d'erreur d'arrondi flottant");
assert.equal(fn("5", 1), 5, "statistique à gain 1 : la saisie est le nombre d'achats");
assert.equal(fn("", 0.1), 1);
assert.equal(fn("abc", 0.1), 1);
assert.equal(fn("-4", 1), 1);
assert.ok(!meta.includes("Quantité personnalisée ·"), "plus de libellé de traitement de texte");
console.log("idle-boutique-exp-quantites-claires-v1: OK");
