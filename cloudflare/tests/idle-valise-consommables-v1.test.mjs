import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-23) : « j'ai des Potions de magie, je ne sais pas où elles sont stockées ; un espace pour les consommables en haut du coffre, comme une valise à bouteilles ». */
const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const snap = lire("src/idle-ngu-snapshot.js");
assert.ok(snap.includes("consommables: consommablesSnapshotV1(state)"), "le moteur envoie les consommables");
const f = snap.slice(snap.indexOf("function consommablesSnapshotV1"), snap.indexOf("function consommablesSnapshotV1") + 900);
assert.ok(f.includes("if (v > 0) restant[k]") && f.includes("if (fx.beta && fx.beta[k]) beta[k] = true") && f.includes("if (v > 0) reserve[k] = v"), "seulement ce qui est en effet ou en réserve (anti-spoil)");

const ui = lire("public/modules/ui-aventure-2-v1.js");
assert.ok(ui.includes("function valiseConsommablesIdleV1_()") && ui.includes("valiseConsommablesIdleV1_()+\n") || ui.includes("valiseConsommablesIdleV1_()+"), "valise posée dans le cadre du Coffre");
assert.ok(ui.includes("if(restant<=0&&!beta&&stock<=0)return;") && ui.includes("if(!cases.length)return '';"), "aucun compartiment vide, aucune valise vide");
assert.ok(!/\d+\s*\/\s*\d+/.test(ui.slice(ui.indexOf("const VALISE_OBJETS_IDLE_V1"), ui.indexOf("function rendreCadreCoffreAdventureIdleV1_"))), "aucun total « x / y »");
assert.ok(lire("public/soreal-idle-itopod.css").includes(".vc-valise-v1{"), "style de la valise");
console.log("idle-valise-consommables-v1: OK");
