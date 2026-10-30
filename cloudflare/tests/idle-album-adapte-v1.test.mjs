// Norman (2026-10-30) : le classeur des chroniques s'adapte à la fenêtre (même petit) et se zoome avec + et − ; les cartes rangées s'écrivent comme la carte sortie ; la carte rentre par le haut de sa pochette ; les boutons de la fiche d'objet ne sont plus coupés. PC et téléphone.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const js = lire("cloudflare/public/modules/album-cartes-v1.js");
const css = lire("cloudflare/public/soreal-idle-album.css");

// --- adaptation à la fenêtre et zoom
assert.ok(js.includes('<div class="alb-adapt">\'+zoomHtml()+\'<div class="alb-cadre"><div class="alb-echelle"><div class="alb-classeur'), "le classeur est posé dans un cadre mis à l'échelle, avec la barre de zoom");
for (const v of ["--alb-s", "--alb-w", "--alb-h", "--alb-nw", "--alb-k", "--alb-ref"]) assert.ok(js.includes("setProperty('" + v + "'"), "variable " + v + " posée sur <html> (jamais en attribut de la page : un redessin ne l'efface pas)");
assert.ok(js.includes("Math.min(1,dispo/nw,haut/nh)"), "tient en largeur ET en hauteur dans la fenêtre");
assert.ok(js.includes("zoomer:zoomer,adapter:adapter") && js.includes("Math.max(.5,Math.min(2,"), "zoom de 50 % à 200 %");
assert.ok(js.includes("window.addEventListener('resize',function(){\n  clearTimeout(tailleVue);\n  adapter();") || js.includes("clearTimeout(tailleVue);\n  adapter();"), "recalcul à chaque changement de taille de la fenêtre");
assert.ok(js.includes("localStorage.setItem(CLE_ZOOM") && js.includes("soreal_idle_album_zoom_v1"), "zoom mémorisé (préférence liée au compte)");
assert.ok(css.includes("transform:scale(var(--alb-s,1))") && css.includes("width:var(--alb-nw,980px)"), "classeur à taille de référence fixe, mis à l'échelle");
assert.ok(css.includes("width:var(--alb-ref,400px);height:calc(var(--alb-ref,400px) * 1.68)") && css.includes("transform:scale(var(--alb-k,.315))"), "cartes des pochettes dessinées à la largeur de la carte sortie, puis réduites (noms jamais tronqués davantage)");
assert.ok(css.includes("translateX(var(--alb-ref,400px)) rotateY(180deg)"), "dos des cartes : même mise à l'échelle");
assert.ok(!/\.alb-echelle[^{]*\{[^}]*!important/.test(css), "aucune règle forcée de plus");

// --- la carte rentre par le haut de sa pochette : tout au-dessus, puis elle glisse vers le bas
const debut = js.indexOf("function mouvementCarte(r0,r1,haut){"), fin = js.indexOf("function retourPochette", debut);
const mouvement = vm.runInNewContext("(" + js.slice(debut, fin).replace("function mouvementCarte", "function") + ")");
const m = mouvement({ left: 100, top: 400, width: 120, height: 200 }, { left: 300, top: 100, width: 460, height: 772 });
assert.ok(/translate\(-200\.0px,94\.0px\)/.test(m.dessus), "au-dessus de la pochette (relatif à la grande carte : 400 - 100 - 200 de haut - 6 = 94) : " + m.dessus);
assert.ok(!/rotate/.test(m.dessus), "elle descend droite");
const retour = js.slice(js.indexOf("function retourPochette"), js.indexOf("function ouvrir(n,el)"));
assert.ok(retour.includes("{transform:m.dessus,offset:.5") && retour.includes("{transform:m.petite}") && !retour.includes("m.sortie"), "retour : grande carte, puis tout au-dessus de la pochette, puis glissement vers le bas");

// --- fiche d'objet : les boutons ne sont plus coupés
const itopod = lire("cloudflare/public/soreal-idle-itopod.css");
const regle = itopod.split("\n").find((l) => l.includes(".soreal-idle-item-popup-actions-v165 .idle-fiche-bouton-v1{width:100%"));
assert.ok(regle && !regle.includes("nowrap") && !regle.includes("ellipsis") && regle.includes("white-space:normal"), "le texte du bouton passe à la ligne au lieu d'être coupé");
assert.ok(itopod.includes(".idle-fiche-bouton-large-v1{grid-column:1/-1}") && lire("cloudflare/public/modules/ui-aventure-2-v1.js").includes('class="idle-fiche-bouton-v1 idle-fiche-bouton-large-v1" onclick="window.__actionMetaIdleV130__({action:\\\'consumeGiantSeed\\\''), "le bouton au libellé long prend toute la largeur");
console.log("idle-album-adapte-v1 : OK");
