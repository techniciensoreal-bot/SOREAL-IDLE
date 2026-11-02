import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lireUiComplet } from "./_ui-sources.mjs";

/*
 * Audit de fluidité du 2026-11-02 (Augmentations, Machine temporelle) : chaque optimisation est figée ici.
 * 1) Augmentations : l'attribut data-cout de la somme du prochain niveau n'est plus réécrit à chaque image avec la même valeur (mesuré : ~840 écritures
 *    identiques par seconde, chacune notifiée à tous les MutationObserver de la page).
 * 2) Machine temporelle : la grande machine et le haut des tours (éléments SVG dont chaque image d'animation redessine l'arbre SVG) sont mis en pause hors écran,
 *    reprennent avant d'être revisibles, et seules les animations mises en pause par ce module sont reprises.
 */
const ui = typeof lireUiComplet === "function" ? lireUiComplet() : readFileSync("cloudflare/public/modules/ui-boucle-v1.js", "utf8");
assert.ok(ui.includes("if(coutEl.dataset.cout!==coutTexteIdleV1)coutEl.dataset.cout=coutTexteIdleV1;"), "data-cout n'est écrit que s'il change");
assert.ok(!/coutEl\.dataset\.cout=String\(coutAffiche\);/.test(ui), "plus d'écriture inconditionnelle de data-cout");

const m = readFileSync("cloudflare/public/modules/machine-dessin-v1.js", "utf8");
assert.ok(m.includes("new IntersectionObserver(") && m.includes("'.tmm-centre,.tmm-haut'"), "la machine et le haut des tours sont observés");
assert.ok(m.includes("rootMargin:'120px 0px'"), "marge : les animations repartent avant d'être revisibles");
assert.ok(m.includes("a.__tmmPause=true;a.pause();") && m.includes("else if(a.__tmmPause){a.__tmmPause=false;if(a.playState==='paused')a.play();}"), "seules les animations mises en pause par le module sont reprises");
assert.ok(m.includes("getAnimations({subtree:true})"), "CSS et Web Animations de la zone sont couvertes");
assert.ok(/suivreCentre\(racine\);/.test(m), "le suivi est (re)posé à chaque synchro (animations créées après un redessin)");
assert.ok(/if\(!racine\|\|!racine\.querySelectorAll\|\|typeof IntersectionObserver!=='function'\|\|calme\)return;/.test(m), "rien si IntersectionObserver absent ou mouvement réduit");
console.log("idle-fluidite-augmentations-v1: OK");
