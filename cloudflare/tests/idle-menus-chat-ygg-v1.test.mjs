import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-22) : menu débloqué jamais relégué en bas, défilement pendant le glissement (PC), bouton émoji du chat (PC), fruits de Magic bleu-vert, lueurs des fruits qui poussent / au maximum. */
const lire = (p) => readFileSync(new URL("../public/modules/" + p, import.meta.url), "utf8");

const menus = lire("ui-menus-v1.js");
assert.ok(!menus.includes("return visibles.concat(autres);"), "les menus verrouillés ne sont plus ajoutés à la fin de l'ordre");
assert.ok(menus.includes("res.splice(pos,0,id);") && menus.includes("travail.forEach(function(id,i){"), "chacun reste après son prédécesseur");
assert.ok(menus.includes("soreal_idle_menu_ordre_reparee_v1") && menus.includes("reparerOrdreMenusIdleV1_(serveur,j)"), "réparation unique de l'ordre déjà enregistré");
assert.ok(menus.includes("function defilerPendantGlisse()") && menus.includes("cont.scrollTop+=dy") && menus.includes("window.scrollBy(0,dy)"), "défilement automatique pendant le glissement");

const chat = lire("chat-v1.js");
assert.ok(chat.includes('data-sic="emojis"') && chat.includes("(hover:hover) and (pointer:fine)") && chat.includes("function insererEmoji"), "bouton émoji, sur PC seulement");

const ygg = lire("yggdrasil-elfes-v1.js");
assert.ok(ygg.includes("(def.resource==='magic'?' magie':'')") && ygg.includes(".ygg-carte.magie .ygg-vitre::after") && ygg.includes("mix-blend-mode:hue"), "fruits de Magic bleu-vert");
assert.ok(ygg.includes("(v.active&&!v.pret&&v.tier>0?' pousse':'')") && ygg.includes("@keyframes yggLueur") && ygg.includes("@keyframes yggBrille"), "lueur qui pousse, plus forte au maximum");
assert.ok(/yggLueur\{0%,100%\{([^}]*)\}50%/.test(ygg) && /yggBrille\{0%,100%\{/.test(ygg), "boucles sans à-coup (mêmes valeurs à 0 % et 100 %)");
console.log("idle-menus-chat-ygg-v1: OK");
