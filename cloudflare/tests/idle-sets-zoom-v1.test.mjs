import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-04) : « dans la vitrine de sets, je dois pouvoir cliquer sur un objet et il doit venir en grand (comme pour le daycare) et me mettre ses statistiques et bonus ».
 * Le clic sur une pièce de la vitrine ouvre la vue zoom (modules/sets-zoom-v1.js) avec la fiche d'objet unifiée du jeu.
 */
const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const page = lire("public/modules/page-chroniques-v1.js");
const zoom = lire("public/modules/sets-zoom-v1.js");
const html = lire("public/index.html");

assert.ok(page.includes("function fichePieceSet_(id,def,niveau,vert)") && page.includes("enregistrerObjetPopupIdleV1_(cle,{"), "chaque pièce enregistre sa fiche (niveau maximum atteint)");
assert.equal((page.match(/fichePieceSet_\(/g) || []).length, 3, "la fiche est posée sur les pièces des deux sortes de sets (déclaration + 2 appels)");
assert.ok(page.includes("window.__SOREAL_IDLE_SETS_ZOOM_V1__.ouvrir("), "le clic ouvre la vue zoom");
assert.ok(!/fichePieceSet_[\s\S]{0,900}data-popup-objet-v1/.test(page), "pas de survol qui ouvre la petite fiche en plus de la vue zoom");
assert.ok(zoom.includes("afficherPopupObjetUnifieIdleV1_") && zoom.includes("soreal-idle-v138-details-body"), "la fiche est celle du jeu (aucune valeur recalculée ici)");
assert.ok(zoom.includes("data-morph-garder") && zoom.includes('role="dialog"') || zoom.includes("setAttribute('role','dialog')"), "couche gardée par le morph, accessible");
assert.ok(zoom.includes("prefers-reduced-motion") && zoom.includes("ev.key==='Escape'"), "mouvement réduit et Échap");
assert.ok(!/animation:[^;']*infinite/.test(zoom), "aucune boucle : l'arrivée joue une fois");
assert.match(html, /<script defer src="\/modules\/sets-zoom-v1\.js\?v=\d+"><\/script>[\s\S]*page-chroniques-v1\.js/, "script chargé avant la page Chroniques");
console.log("idle-sets-zoom-v1: OK");
