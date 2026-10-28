import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-28) : « quand on clique sur un objet de la langue de la valise, on doit avoir une fenêtre popup comme les autres items qui nous dit ce que ça fait ».
 * Chaque objet de la langue (potions, effets en cours, réserves) ouvre sa fiche ; les textes sont ceux de la Boutique, rien n'est inventé.
 */
const v = readFileSync("cloudflare/public/modules/valise-v1.js", "utf8");
const boutique = readFileSync("cloudflare/public/modules/ui-boutique-v1.js", "utf8");

const ids = (nom) => [...v.slice(v.indexOf("var " + nom + "=[")).split("];")[0].matchAll(/\{id:'([A-Za-z0-9]+)'/g)].map((m) => m[1]);
const tous = [...ids("POTIONS"), ...ids("EFFETS"), ...ids("RESERVES")];
assert.ok(tous.length >= 20, "objets trouvés : " + tous.join(","));
const table = v.slice(v.indexOf("var EFFET_TEXTES={"), v.indexOf("function trouverObjet"));
for (const id of tous) assert.ok(table.includes("\n    " + id + ":'"), "texte de fiche pour " + id);

// Les potions, Bar Bar, porte-bonheur, poop, beurre, pilules et stylos reprennent mot pour mot le texte de la Boutique.
const effetBoutique = (cle) => { const m = boutique.match(new RegExp(cle + ":\{name:'[^']*',effect:'([^']*)'")); return m && m[1]; };
for (const [id, cle] of [["energyPotionAlpha", "energyPotionAlpha"], ["magicPotionDelta", "magicPotionDelta"], ["resource3PotionBeta", "resource3PotionBeta"], ["energyBars", "energyBarBar"], ["magicBars", "magicBarBar"], ["poop", "icarusFertilizer1"], ["beastButters", "beastButter1"], ["bluePills", "littleBluePill1000"]]) {
  const attendu = effetBoutique(cle);
  assert.ok(attendu, "texte de la Boutique pour " + cle);
  assert.ok(table.includes("'" + attendu + "'"), id + " : même texte que la Boutique (" + cle + ")");
}

// Marquage des objets et branchement du clic.
for (const g of ["potion", "actif", "reserve"]) assert.ok(v.includes("data-vl-genre=\"" + g + "\""), "objets marqués : " + g);
assert.ok(v.includes("var objet=t.closest('.vl-art[data-vl-art]');") && v.includes("ouvrirFiche(objet.getAttribute('data-vl-genre')"), "un objet de la langue ouvre sa fiche");
assert.ok(v.includes("data-vl-fiche-utiliser") && v.includes("action:'usePotion',itemId:idF"), "une potion peut être utilisée depuis sa fiche (même action que le bouton de la langue)");
assert.ok(v.includes("ev.key==='Escape'&&document.getElementById('soreal-idle-valise-fiche')"), "Échap ferme la fiche");
assert.ok(v.includes("clic hors de la fiche : elle se ferme"), "un clic à côté la ferme");
assert.ok(v.includes("z-index:100000") && v.includes("backdrop-filter:blur(6px)"), "au-dessus de l'interface, fond flouté comme la carte de boss");
console.log("idle-valise-fiche-objet-v1: OK");
