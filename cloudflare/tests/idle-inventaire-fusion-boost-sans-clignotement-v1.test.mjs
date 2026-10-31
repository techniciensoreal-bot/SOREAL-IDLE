import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-31, APK) : « l'inventaire clignote dès que je fusionne ou boost » ; « les premières pièces équipées passent AU-DESSUS des barres pendant le scroll ».
 * Mesuré dans le navigateur (MutationObserver sur le sac) : une fusion retirait puis réinsérait (déplaçait) TOUTES les cases suivantes (28 images ajoutées, 29 retirées) parce que les cases retirées restaient dans la grille pendant la mise en ordre.
 * Gardes : (1) les cases périmées sont retirées AVANT la mise en ordre ; (2) une case dont la version change garde son nœud et son <img> ; (3) l'équipement suit le même principe ; (4) le volet d'équipement reste sous le bandeau collant.
 */
const inv = readFileSync("cloudflare/public/modules/ui-inventaire-v1.js", "utf8").replace(/\r\n/g, "\n");
const debut = inv.indexOf("function patchGrilleSacInventaireIdleV160_");
const fin = inv.indexOf("function htmlEquipementInventaireIdleV160_");
const grille = inv.slice(debut, fin);
const iRetrait = grille.indexOf("if(!gardes.has(n))root.removeChild(n)");
const iPlace = grille.indexOf("if(root.children[i]!==node)root.insertBefore");
assert.ok(iRetrait > 0 && iPlace > iRetrait, "cases périmées retirées avant la mise en ordre");
assert.ok(!grille.includes("while(root.children.length>noeudsFinaux.length)"), "plus de retrait en fin de liste (il déplaçait toutes les cases suivantes)");
assert.ok(grille.includes("synchroniserCarteEnPlaceInventaireIdleV1_(courant,node)"), "une case modifiée est mise à jour en place");
assert.ok(inv.includes("function synchroniserCarteEnPlaceInventaireIdleV1_"), "la fonction existe");
const eq = inv.slice(inv.indexOf("function patchEquipementInventaireIdleV160_"), inv.indexOf("function trouverSectionParTitreInventaireIdleV160_"));
assert.ok(eq.includes("if(!gardesPaper.has(n))courantPaper.removeChild(n)"), "équipement : retrait avant mise en ordre");
assert.ok(!eq.includes("while(courantPaper.children.length>noeudsFinaux.length)"), "équipement : pas de retrait en fin de liste");

/* Comportement : même algorithme sur une liste de nœuds factices (comptage des déplacements). */
function creer(n) { return { id: n, parent: null }; }
class Parent {
  constructor(l) { this.children = l.slice(); this.children.forEach((c) => { c.parent = this; }); this.deplaces = 0; }
  insertBefore(n, ref) { const i = this.children.indexOf(n); if (i >= 0) { this.children.splice(i, 1); this.deplaces += 1; } const j = ref ? this.children.indexOf(ref) : this.children.length; this.children.splice(j, 0, n); }
  removeChild(n) { this.children.splice(this.children.indexOf(n), 1); }
}
const noeuds = Array.from({ length: 12 }, (_, i) => creer("c" + i));
const vide = creer("vide");
const racine = new Parent([...noeuds, vide]);
/* c3 absorbé par une fusion : sa place devient la case vide existante */
const finaux = [...noeuds.slice(0, 3), vide, ...noeuds.slice(4)];
const gardes = new Set(finaux);
racine.children.slice().forEach((n) => { if (!gardes.has(n)) racine.removeChild(n); });
finaux.forEach((n, i) => { if (racine.children[i] !== n) racine.insertBefore(n, racine.children[i] || null); });
assert.deepEqual(racine.children.map((c) => c.id), finaux.map((c) => c.id));
assert.ok(racine.deplaces <= 1, "au plus 1 déplacement (la case vide), mesuré : " + racine.deplaces);

const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
const m = /\.soreal-idle-v138-equipment-sticky\{\s*position:sticky;\s*top:62px;\s*z-index:(\d+);/.exec(css);
assert.ok(m, "règle du volet d'équipement trouvée");
const hud = readFileSync("cloudflare/public/modules/hud-haut-v2.js", "utf8");
const z = /soreal-idle-hud-v2\{[^']*?z-index:(\d+)\}/.exec(hud);
assert.ok(z, "z-index du bandeau trouvé");
assert.ok(Number(m[1]) < Number(z[1]), "pièces équipées (z " + m[1] + ") sous le bandeau (z " + z[1] + ")");
console.log("idle-inventaire-fusion-boost-sans-clignotement-v1: OK");
