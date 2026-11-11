/*
 * Réglages « jeu vidéo » (Norman, 2026-11-11) : six catégories colorées (Audio et Affichage séparées), habillage des sections, plus de sections « développement ».
 */
import assert from "node:assert/strict";
import fs from "node:fs";
const ui = fs.readFileSync("cloudflare/public/modules/ui-reglages-v1.js", "utf8");
const design = fs.readFileSync("cloudflare/public/modules/reglages-design-v1.js", "utf8");
const css = fs.readFileSync("cloudflare/public/soreal-idle-reglages-v1.css", "utf8");
const html = fs.readFileSync("cloudflare/public/index.html", "utf8");
for (const id of ["jeu", "profil", "audio", "affichage", "partie", "infos"]) assert.ok(ui.includes("{id:'" + id + "',icone:'" + id + "'"), "catégorie " + id);
assert.ok(ui.includes("if(id==='son')id='audio';"), "l'ancienne catégorie « son » mène à Audio");
assert.ok(!ui.includes("htmlReglagesMusiqueTitanIdleV1_()") && !ui.includes("htmlReglagesOrageSortsIdleV1_()"), "plus de sections « développement » (musique de Titan, pentacles)");
assert.ok(ui.includes("D.habiller(corps,onglet.icone)") && ui.includes("rg2-pan"), "panneau habillé");
for (const nom of ["jeu", "profil", "audio", "affichage", "partie", "infos", "classement", "langue", "effets", "danger"]) assert.ok(design.includes("    " + nom + ":'<path"), "icône " + nom);
assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(design), "icônes dessinées, pas d'émojis");
assert.ok(css.includes(".rg2-ong-audio{") && css.includes("input[type=\"checkbox\"]") && css.includes("input[type=\"range\"]") && css.includes("@media (prefers-reduced-motion:reduce)"), "habillage, interrupteurs, curseurs, mouvement réduit");
assert.ok(!/animation\s*:/.test(css), "aucune animation en boucle (règle n°3)");
assert.ok(css.includes("text-shadow:none") && css.includes("-webkit-text-stroke:0"), "texte des boutons sans ombre ni contour (lisible)");
assert.ok(html.includes("soreal-idle-reglages-v1.css") && html.indexOf("reglages-design-v1.js") < html.indexOf("ui-reglages-v1.js"), "feuille et module chargés (le module avant la page)");
console.log("idle-reglages-design-v1: OK");
