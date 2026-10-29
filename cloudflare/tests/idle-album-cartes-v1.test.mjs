// Norman (2026-10-29) : Chroniques de boss = farde noire à anneaux : livre FERMÉ à l'arrivée (couverture avec le logo dans une pochette), 9 pochettes par page (3 x 3), PC : deux pages (gauche = dos des cartes SOREAL), téléphone : page de droite seule ;
// première feuille = l'affiche verticale découpée en 9 cartes (une carte gagnée tous les ~34 boss vaincus) ; carte gagnée au premier boss VAINCU seulement ; annonce par page puis rangement en paquet, une carte à la fois, sans flou.
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const m = lire("cloudflare/public/modules/album-cartes-v1.js"), c = lire("cloudflare/public/soreal-idle-album.css"), u = lire("cloudflare/public/modules/ui-chroniques-v1.js"), i = lire("cloudflare/public/index.html"), k = lire("cloudflare/public/modules/carte-boss-magic-v1.js"), kc = lire("cloudflare/public/soreal-idle-carte-boss.css");
// 9 par page, trois colonnes
assert.ok(m.includes("var PAR_PAGE=9,COLS=3,PIECES=9,TOTAL_BOSS=301;") && c.includes(".alb-feuille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))"), "9 pochettes par page : 3 x 3");
// PC / téléphone
assert.ok(m.includes("(min-width:900px)") && c.includes(".alb-page-g{display:none}") && c.includes(".alb-double .alb-page-g{display:block}"), "PC : deux pages ; téléphone : la page de droite seule");
// le livre fermé d'abord, la couverture avec le logo
assert.ok(m.includes("if(maintenant-derniereVue>1500){ouvert=false;page=0;}") && m.includes("function ouvrirLivre(p)") && m.includes("function fermerLivre()") && m.includes("alb-couv-logo") && m.includes("IMG_LOGO"), "livre fermé à l'arrivée, couverture avec le logo, ouvrir / fermer");
assert.ok(c.includes(".alb-classeur:not(.alb-ouvert) .alb-page{visibility:hidden}") && c.includes(".alb-couv-pochette") && c.includes(".alb-cuir-noir"), "couverture de farde noire avec pochette en plastique");
assert.ok(m.includes("cliquerGauche") && m.includes("Fermer le classeur"), "le livre se referme (bouton, ou clic sur l'intérieur de la couverture)");
// plus de page vide devant : la première feuille est le dessin, le dos des cartes est à gauche ensuite
assert.ok(m.includes("function gaucheHtml(r){return r<=0?'':dosHtml(r-1);}") && m.includes("function nbDos(r){return r<=0?PIECES:") && m.includes("dosSeul()"), "à gauche : le dos des cartes SOREAL de la feuille d'avant");
assert.ok(!m.includes("alb-pochette-dos\" aria-hidden=\"true\"><div class=\"alb-carte alb-carte-mtg\"></div>"), "plus de page vide devant");
// le grand dessin
assert.ok(m.includes("function puzzleHtml()") && m.includes("Math.floor(cartes.length*PIECES/TOTAL_BOSS)") && c.includes("/chargement/affiche-600x900.webp") && c.includes("background-size:324cqw 486cqw"), "l'affiche découpée en 9 cartes, une par ~34 boss vaincus");
const mp = /function nbPieces\(\)\{return ([^}]*)\}/.exec(m); const pieces = new Function("cartes", "PIECES", "TOTAL_BOSS", "return " + mp[1].replace(/\bcartes\.length\b/g, "cartes"))(0, 9, 301);
const nb = (n) => Math.min(9, Math.floor(n * 9 / 301)); assert.equal(nb(33), 0); assert.equal(nb(34), 1); assert.equal(nb(67), 2); assert.equal(nb(110), 3); assert.equal(nb(301), 9);
// la petite carte est la grande
assert.ok(m.includes("C.html({numero:n") && m.includes("sansFleches:true") && kc.includes(".alb-carte-mtg") && k.includes("dosSeul:dosSeul"), "miniature = la vraie carte");
assert.ok(k.includes("if(cible.closest('.alb-carte-mtg'))return;"), "la miniature ne se retourne pas au clic");
// la feuille qui tourne
assert.ok(m.includes("alb-face-avant") && m.includes("alb-face-arriere") && m.includes("rotateY(-90deg)") && m.includes("rotateY(-180deg)") && c.includes("transform-origin:0 50%"), "feuille à deux faces qui pivote autour des anneaux");
assert.ok(m.includes("function basculer(") && m.includes("alb-ombre-sol"), "bascule de face à mi-course, ombres sur les pages");
assert.ok(m.includes("onclick=\"window.__SOREAL_IDLE_ALBUM_V1__.page(-1)\"") && m.includes("addEventListener('touchend'") && m.includes("prefers-reduced-motion"), "boutons, glissement du doigt, mouvement réduit");
assert.ok(!/boss découverts|\/ ?301/.test(m.replace("TOTAL_BOSS=301","")), "aucun total de boss affiché (règle n°2)");
// seuls les boss vaincus ont leur carte
assert.ok(m.includes("e&&e.vaincu&&Math.floor(Number(e.numero))>0"), "carte = boss vaincu");
assert.ok(u.includes("albumIdle.rendre(entrees)") && u.includes("e.decouvert&&e.vaincu"), "la Collection passe par l'album, compteur = cartes gagnées");
const col = lire("cloudflare/src/idle-runtime-collection.js");
assert.ok(col.includes("vaincu:\n          Boolean(index < bossVaincus)"), "le moteur envoie « vaincu » (jamais pour un boss seulement rencontré)");
// annonce par page, rangement : paquet puis une par une, sans flou
assert.ok(m.includes("nouvelles cartes débloquées !") && m.includes("nouvelle carte débloquée !") && m.includes("Ranger dans l’album") && m.includes("function ranger()") && m.includes("soreal_idle_album_vus_v1"), "annonce puis rangement, mémorisé par compte");
assert.ok(m.includes("function nouvellesDePage(r)") && m.includes("function premierePageNeuve()") && m.includes("setTimeout(verifierPage,450)") && m.includes("annoncer(nouvellesDePage(r),r)") && m.includes("annoncer(neuves,page)"), "annonce par page, validée à chaque tour de page");
assert.ok(m.includes("enAttente[e.numero]=true") && c.includes(".alb-pochette.alb-attente .alb-carte{visibility:hidden}"), "la pochette d'une nouvelle carte reste vide jusqu'à l'arrivée de la carte");
assert.ok(m.includes("se rejoignent en PAQUET") && m.includes("la suivante ne part que quand la précédente est rangée") && m.includes("suite=suite.then(function(){") && m.includes("alb-vol-carte"), "paquet, puis une carte à la fois (chaîne : la suivante attend la précédente)");
assert.ok(!c.includes("backdrop-filter") && !c.includes("blur("), "aucun flou (on voit les cartes entrer dans le classeur)");
assert.ok(m.includes("r1.height*.62") && m.includes("translateY(-62%)") && c.includes(".alb-pochette.alb-entre{z-index:4}"), "la carte arrive devant la fente puis se glisse sous le plastique");
// fichiers chargés
assert.ok(/soreal-idle-album\.css\?v=\d+/.test(i) && /album-cartes-v1\.js\?v=\d+/.test(i), "fichiers chargés");
assert.ok(kc.includes("touch-action:pan-y"), "défilement vertical du texte conservé (rotation de la grande carte)");
console.log("idle-album-cartes-v1 : OK");
