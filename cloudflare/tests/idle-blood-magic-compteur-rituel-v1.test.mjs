import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-05) : « dans Blood Magic, un compteur avec la magie allouée à chaque rituel, avec l'animation sur le chiffre comme dans les autres menus quand on ajoute ou retire de la magie ». */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const page = meta.slice(meta.indexOf("      function pageBloodMagicIdleV48_(j){"), meta.indexOf("        const sortsHtml="));
assert.ok(page.includes(`id="sorealIdleBloodRitualAllocV1_'+idHtml+'" data-idle-alloc-pop-v1="1">'+H.formatGrandNombreIdleV70_(active?allocMagicActuelle:0)`), "un compteur par rituel : le rituel actif porte l'allocation, les autres 0");
// Mise à jour sur place pour le rituel actif (aucun redessin) ; l'animation vient du crochet d'alloc-pop-v1.
const maj = meta.slice(meta.indexOf("      function rafraichirAllocationBloodMagicIdleV1_(value){"), meta.indexOf("      function recalculerBloodLocalIdleV1_"));
assert.ok(maj.includes("sorealIdleBloodRitualAllocV1_'+actif") && maj.includes("if(compteur&&compteur.textContent!==texte)"));
const pop = readFileSync("cloudflare/public/modules/alloc-pop-v1.js", "utf8");
assert.ok(pop.includes("[data-idle-alloc-pop-v1]") && pop.includes(".soreal-idle-bt-actions-v120 button"), "le crochet et les boutons des rituels déclenchent l'animation");
assert.ok(readFileSync("cloudflare/public/soreal-idle-jeu.css", "utf8").includes(".soreal-idle-blood-alloc-ligne-v1"));
console.log("idle-blood-magic-compteur-rituel-v1: OK");
