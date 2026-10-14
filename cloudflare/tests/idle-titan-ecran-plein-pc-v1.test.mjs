import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-14) : « sur PC, quand on lance un combat de Titan, l'écran n'est pas plein écran : on voit l'interface au-dessus, il faut descendre 2 fois avec la molette ». Cause : sur PC le menu est une colonne de plus de
 * 1 000 px de haut ; l'ancien calcul la prenait pour une barre collante en haut de page et ne faisait pas remonter le bandeau Aventure / Titans. */
const m = readFileSync("cloudflare/public/modules/titans-combat-ecran-v1.js", "utf8");
const debut = m.indexOf("function poserHaut(premiere){");
const fonction = m.slice(debut, m.indexOf("function afficher(f){", debut));
assert.ok(fonction.includes("rn.top<=2&&rn.height<=220"), "seule une vraie barre collante en haut de page (petite) compte comme repère");
assert.ok(!/collant=nav&&getComputedStyle\(nav\)\.position==='sticky'\?nav\.getBoundingClientRect\(\)\.bottom:0/.test(fonction), "l'ancien calcul (toute colonne collante) a disparu");
assert.ok(fonction.includes("window.scrollBy({top:voulu,left:0,behavior:'instant'})"), "la page remonte tout de suite, sans défilement animé");
assert.ok(fonction.includes("ID+'Cale'") && m.includes("cale.parentNode.removeChild(cale)"), "une cale temporaire rallonge une page trop courte, retirée à la fin du combat");
console.log("Écran de combat de Titan plein écran sur PC: OK");
