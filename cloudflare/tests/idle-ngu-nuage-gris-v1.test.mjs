import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-03) : onglet Énergie du NGU : toute la page est couverte de nuages gris ; seule la ligne où une ressource est placée se dégage (voir idle-ngu-nuages-par-ligne-v1).
 * Avant (2026-11-02) : un gros nuage gris en haut tant qu'aucune énergie n'était placée, retiré à la première énergie : le redessin du morph le supprimait d'un coup (clignotement).
 * Ici : la couche grise est TOUJOURS dans le HTML de l'onglet Énergie, jamais dans celui de la Magie ; le soleil et les nuages blancs de bandeau n'existent plus que la nuit (lune, chauves-souris).
 */
const src = readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8").split(String.fromCharCode(13)).join("");
const m = src.match(/function veutAstres_[\s\S]*?function cielSync_[\s\S]*?\n\}\n/);
assert.ok(m, "fonctions du ciel présentes");
const ctx = new Function(src.match(/function veutAstres_[^\n]*\n[^\n]*function veutGris_[^\n]*\n/)[0] + "return {a:veutAstres_,g:veutGris_};")();
for (const niv of ["0", "1", "4"]) {
  assert.equal(ctx.g("energy", niv), true, "énergie : le gris est là à tout niveau (c'est la brèche de la ligne qui s'ouvre, pas le gris qui disparaît)");
  assert.equal(ctx.a("energy", niv), false, "énergie : plus de soleil ni de nuages blancs de bandeau");
  assert.equal(ctx.a("magic", niv), true, "la nuit garde sa lune et ses chauves-souris à tout niveau");
  assert.equal(ctx.g("magic", niv), false, "la nuit n'a pas de nuage gris");
}
assert.ok(/function astresHtml_\(onglet,niv\)\{return '<span class="nl-arc"[^}]*veutAstres_\(onglet,niv\)\?HTML_ASTRE:''\)\+\(veutGris_\(onglet,niv\)\?HTML_SOLEIL\+HTML_GRIS:''\)/.test(src), "HTML du rendu conditionnel");
assert.ok(src.includes("astresHtml_(onglet,nivDe_(lueurPage_))+"), "le rendu utilise le ciel conditionnel");
assert.ok(src.includes("cielSync_(racine,true)") && src.includes("cielSync_(racine,false)"), "le tick et le changement d'onglet synchronisent le ciel");
// plus de fondu piloté par script : pas de retrait différé ni de classe de sortie (cause du clignotement)
const sync = src.match(/function cielSync_[\s\S]*?\n\}\n/)[0];
assert.ok(!/setTimeout|nl-gris-sort|nl-gris-ent/.test(sync), "aucune minuterie ni classe de sortie dans la synchro du ciel");
// CSS : gris statique pleine page
const css = src.match(/\.nl-v1>\.nl-gris\{[^}]*\}/)[0];
assert.ok(!/animation|filter|box-shadow|mask/.test(css), "banc du haut : ni animation, ni filtre, ni ombre, ni masque (le gris est un dessin de nuages)");
assert.ok(/top:-100px/.test(css) && /pointer-events:none/.test(css) && /z-index:0/.test(css) && /transition:opacity 16s ease-in-out/.test(css) && css.includes("background-image:url("), "banc du haut : débord au-dessus du cadre, sans clic, sous le contenu, fondu d'opacité de 16 s, dessin SVG");
assert.ok(!/mask/.test(css), "gris : pas de masque (aucun bord coupé : la page est grise de haut en bas)");
assert.ok(/data-nl-onglet="energy"\]>\.nl-arc\{display:none/.test(src), "arc-en-ciel de bandeau retiré (invisible sous le gris)");
console.log("idle-ngu-nuage-gris-v1: OK");
