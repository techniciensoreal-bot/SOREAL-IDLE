// Norman (2026-10-29) : Chroniques de boss = album de collection : pochettes en plastique, pages de 12 (3 x 4), PC : deux pages (gauche = dos des cartes de la page précédente), téléphone : page de droite ; la petite carte = la grande ;
// la feuille tourne autour des anneaux ; carte gagnée au premier boss VAINCU seulement ; annonce « N nouvelles cartes » puis rangement.
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const m = lire("cloudflare/public/modules/album-cartes-v1.js"), c = lire("cloudflare/public/soreal-idle-album.css"), u = lire("cloudflare/public/modules/ui-chroniques-v1.js"), i = lire("cloudflare/public/index.html"), k = lire("cloudflare/public/modules/carte-boss-magic-v1.js"), kc = lire("cloudflare/public/soreal-idle-carte-boss.css");
// pages
assert.ok(m.includes("var PAR_PAGE=12,COLS=3;") && c.includes(".alb-feuille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))"), "12 pochettes par page : 3 colonnes x 4 rangées");
assert.ok(m.includes("(min-width:900px)") && c.includes(".alb-page-g{display:none}") && c.includes(".alb-double .alb-page-g{display:block}"), "PC : deux pages ; téléphone : la page de droite seule");
assert.ok(m.includes("function gaucheHtml(p)") && m.includes("dosHtml(p-1)") && m.includes("dosSeul()"), "à gauche, le dos des cartes de la page précédente");
// la petite carte est la grande
assert.ok(m.includes("C.html({numero:n") && m.includes("sansFleches:true") && kc.includes(".alb-carte-mtg") && k.includes("dosSeul:dosSeul"), "miniature = la vraie carte (mêmes règles de style)");
assert.ok(k.includes("if(cible.closest('.alb-carte-mtg'))return;"), "la miniature ne se retourne pas au clic");
// la feuille qui tourne
assert.ok(m.includes("alb-face-avant") && m.includes("alb-face-arriere") && m.includes("rotateY(-90deg)") && m.includes("rotateY(-180deg)") && m.includes("transform-origin") === false || c.includes("transform-origin:0 50%"), "feuille à deux faces qui pivote autour des anneaux");
assert.ok(m.includes("basculer(true)") && m.includes("basculer(false)") && m.includes("alb-ombre-sol"), "bascule de face à mi-course, ombres sur les pages");
assert.ok(m.includes("onclick=\"window.__SOREAL_IDLE_ALBUM_V1__.page(-1)\"") && m.includes("addEventListener('touchend'") && m.includes("prefers-reduced-motion"), "boutons, glissement du doigt, mouvement réduit");
assert.ok(m.includes("'Page'") || m.includes("<span>Page</span>"), "numéro de page");
assert.ok(!/boss découverts|\/ ?301/.test(m), "aucun total de boss (règle n°2)");
// seuls les boss vaincus ont leur carte
assert.ok(m.includes("e&&e.vaincu&&Math.floor(Number(e.numero))>0"), "carte = boss vaincu");
assert.ok(u.includes("albumIdle.rendre(entrees)") && u.includes("e.decouvert&&e.vaincu"), "la Collection passe par l'album, compteur = cartes gagnées");
const col = lire("cloudflare/src/idle-runtime-collection.js");
assert.ok(col.includes("vaincu:\n          Boolean(index < bossVaincus)"), "le moteur envoie « vaincu » (jamais pour un boss seulement rencontré)");
// annonce et rangement
assert.ok(m.includes("nouvelles cartes débloquées !") && m.includes("nouvelle carte débloquée !") && m.includes("Ranger dans l’album") && m.includes("function ranger()") && m.includes("soreal_idle_album_vus_v1"), "annonce puis rangement, mémorisé par compte");
assert.ok(m.includes("enAttente[e.numero]=true") && c.includes(".alb-pochette.alb-attente .alb-carte{visibility:hidden}"), "la pochette d'une nouvelle carte reste vide jusqu'à l'arrivée de la carte");
// fichiers chargés
assert.ok(/soreal-idle-album\.css\?v=\d+/.test(i) && /album-cartes-v1\.js\?v=\d+/.test(i), "fichiers chargés");
assert.ok(lire("cloudflare/public/soreal-idle-carte-boss.css").includes("touch-action:pan-y"), "défilement vertical du texte conservé (rotation de la grande carte)");
// anti-spoil : aucune pochette pour un boss non vaincu
assert.ok(u.includes("entrees=entrees.filter(function(e){return e&&e.decouvert;})"), "liste déjà filtrée");
console.log("idle-album-cartes-v1 : OK");
