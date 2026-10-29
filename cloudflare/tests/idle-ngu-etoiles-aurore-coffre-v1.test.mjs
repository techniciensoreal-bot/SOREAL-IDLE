import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-29) : « les aurores boréales doivent ressembler à une vraie aurore ; elles sont trop rectilignes » ; « les étoiles doivent apparaître en fondu quand on met de la magie, et elles doivent scintiller » ;
 * « dans le coffre, les noms des équipements ne doivent pas être écrits : ils cachent l'image ; on clique sur l'objet pour connaître son nom ».
 */
const ngu = readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8");

// 1. étoiles : couches de niveau en fondu, scintillement
assert.ok(ngu.includes(".nl-etoiles u{position:absolute;inset:0;opacity:0;transition:opacity 2s ease;"), "chaque niveau de lumière apparaît en FONDU (opacité 0 → 1 en 2 s)");
assert.ok(ngu.includes(".nl-etoiles{position:absolute;inset:0;pointer-events:none;z-index:0;contain:strict;display:block;opacity:calc(.3 + var(--nl-lueur,0)*.7);transition:opacity 1.6s ease}"), "le ciel n'est plus allumé d'un coup (display:none retiré, opacité en transition)");
assert.ok(!/\.nl-etoiles b\{display:none/.test(ngu) && !/nl-etoiles b:nth-child\(-n\+8\)[^']*\{display:block/.test(ngu), "plus d'apparition brutale des étoiles individuelles");
assert.ok(ngu.includes("@keyframes nlScint{0%,100%{opacity:1}") && ngu.includes(".nl-etoiles u i{animation:nlScint var(--d,4s) ease-in-out infinite"), "les étoiles de la tuile fixe scintillent aussi (douze groupes, chacun à son rythme), en plus des quarante étoiles individuelles");
const html = ngu.slice(ngu.indexOf("function etoilesHtml_(){"), ngu.indexOf("var ETOILES=etoilesHtml_();"));
const sortie = vm.runInNewContext(html + "etoilesHtml_()");
assert.equal((sortie.match(/<u class="nl-niv n[1-4]">/g) || []).length, 4, "quatre couches de niveau");
assert.equal((sortie.match(/<i class="g[0-2]"/g) || []).length, 12, "trois groupes de scintillement par couche");
assert.equal((sortie.match(/<b /g) || []).length, 40, "quarante étoiles individuelles");
const durees = new Set((sortie.match(/--d:[0-9.]+s;animation-delay/g) || []));
assert.ok(durees.size >= 8, "rythmes de scintillement variés entre les groupes (" + durees.size + ")");

// 2. aurore : rideaux courbes
const fonction = ngu.slice(ngu.indexOf("function auroreUri_(graine, rubans) {"), ngu.indexOf("var AURORE_A = "));
assert.ok(fonction.includes("feGaussianBlur") && fonction.includes("'C'") && !fonction.includes("'<rect "), "rayons COURBES (Bézier) et flous, plus de rectangles droits");
const aurore = vm.runInNewContext(fonction + "auroreUri_", {})(11, [{ c: '#3dffa8', c2: '#1fb8d8', o: 0.85, k: 2, ph: 0.4, amp: 22, base: 58, dispersion: 26, hauteur: 190 }]);
const svg = decodeURIComponent(aurore.replace("data:image/svg+xml,", ""));
assert.ok((svg.match(/<path /g) || []).length > 60 && !/<rect /.test(svg), "des dizaines de rayons courbes, aucun rectangle");
assert.ok(/C-?\d/.test(svg.replace(/<path d="M[^"]*"/g, (m) => m)) && svg.includes("userSpaceOnUse") && svg.includes('width="1200"'), "tuile de 1200 px, dégradé commun à tous les rayons");
assert.equal(aurore, vm.runInNewContext(fonction + "auroreUri_", {})(11, [{ c: '#3dffa8', c2: '#1fb8d8', o: 0.85, k: 2, ph: 0.4, amp: 22, base: 58, dispersion: 26, hauteur: 190 }]), "toujours la même aurore (graine fixe)");

// 3. coffre : plus de nom écrit sur les cases
const coffre = readFileSync("cloudflare/public/modules/ui-aventure-2-v1.js", "utf8");
const carte = coffre.slice(coffre.indexOf("function carteCoffre(s){"), coffre.indexOf("const LIGNE_ARMURE="));
assert.ok(!carte.includes("collection-card-name-v1"), "aucun nom écrit sur les cases du coffre (ils cachaient l'image)");
assert.ok(carte.includes("aria-label=\"'+idleHtml_(s.name)+'\"") && carte.includes("window.__consulterObjetIdleV1__"), "case pleine : le clic ouvre la fiche (nom compris)");
assert.ok(carte.includes("data-nom-v1=") && carte.includes("messageFlottantIdleV32_(this.getAttribute("), "case vide : le clic affiche le nom");
console.log("idle-ngu-etoiles-aurore-coffre-v1: OK");
