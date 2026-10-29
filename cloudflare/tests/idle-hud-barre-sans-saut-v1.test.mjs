import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-26) : « quand je dépense toute ma magie ou toute mon énergie, les barres disparaissent et ça fait bouger la page où je me trouve ».
 * Norman (2026-10-28) : « ça fait encore bouger le menu dans lequel on se trouve ; ça doit vraiment être 2 choses indépendantes ». L'ancienne compensation (report sur le défilement) ne jouait que page défilée : en haut de page le contenu suivait la barre.
 * Maintenant une réserve (bloc vide juste sous le bandeau) absorbe exactement chaque variation de hauteur du bandeau, image après image (ResizeObserver, avant l'affichage) : le contenu ne bouge ni en haut de page ni défilé.
 * Mesuré dans Chrome : la position du contenu reste identique à chaque image pendant le fondu d'une barre (départ ET retour).
 */
const hud = readFileSync("cloudflare/public/modules/hud-haut-v2.js", "utf8");
assert.ok(hud.includes("new ResizeObserver(") && hud.includes("hudObs.observe(h)"), "le bandeau est surveillé image après image");
assert.ok(hud.includes("sorealIdleHudReserveV2") && hud.includes("data-morph-garder"), "réserve sous le bandeau, épargnée par le redessin de la page");
assert.ok(hud.includes("hauteurRef-h") && hud.includes("function hauteurHud()") && !hud.includes("positionSous"), "la réserve se déduit de la hauteur du bandeau (jamais de la position du contenu : elle absorbait des écarts étrangers et laissait un grand vide, Norman 2026-10-28)");
assert.ok(hud.includes("poserReserve(hauteurRef-h)") && hud.includes("hauteurRef=Math.max(h,hauteurPrec+occupe)"), "la réserve vaut exactement ce que les barres ont perdu, jamais plus");
assert.ok(hud.includes("reserve.style.display='none'") && hud.includes("ecartParent()"), "au repos la réserve n existe pas dans la mise en page (sinon le gap de la page s ajoute : grand vide, Norman 2026-10-28) ; en service sa marge annule un gap");
assert.ok(hud.includes("function fermerReserveSiStable") && hud.includes("STABLE_MS=1500") && hud.includes("fermerReserveSiStable();"), "bandeau stable depuis 1,5 s : la réserve n'est retirée que sans effet visible");
/* Norman (2026-10-29) : « assure-toi que JAMAIS ça ne fasse bouger la page en fond » : plus de glissement du contenu ; en haut de page la réserve reste, défilée au-delà d'elle elle est retirée ET le défilement reculé de la même hauteur dans la même tâche (partie entière seulement) */
const fermer = hud.slice(hud.indexOf("function fermerReserveSiStable"), hud.indexOf("function surveillerHud"));
assert.ok(!hud.includes("FERMETURE_MS") && !fermer.includes("transition") && !fermer.includes("setTimeout"), "aucune animation de fermeture : le contenu ne glisse jamais");
assert.ok(fermer.includes("haut<occupe+1") && fermer.includes("window.scrollTo(0,haut-entier)") && fermer.includes("poserReserve(reste)"), "en haut de page la réserve reste ; défilé, retrait + défilement reculé de la même hauteur entière");
assert.ok(fermer.includes("doc.scrollHeight-occupe-2"), "jamais près du bas de la page (défilement borné par le navigateur)");
/* PC : grille à deux colonnes (menu sur 60 rangées) et zoom .86 sous le menu */
assert.ok(!hud.includes("grid-column:1/-1") && hud.includes("getComputedStyle(hudEl).gridColumn"), "la réserve prend la colonne du bandeau (sur « 1 / -1 » la grille la repoussait sous le menu : la page descendait de ~700 px, mesuré le 2026-10-29)");
assert.ok(hud.includes("function zoomPage()") && hud.includes("reserveH/zoomPage()"), "la hauteur de la réserve est divisée par le zoom de la page (.86 sur PC : sinon 14 % de moins compensés)");
assert.ok(hud.includes("tcv-actif"), "le bandeau caché pendant un combat de Titan n'est pas compensé");
assert.ok(hud.includes("remettreReserve") && hud.includes("window.addEventListener('resize'"), "réserve remise à zéro au changement de menu et de taille de fenêtre");
assert.ok(hud.includes("surveillerHud();"), "le bandeau (parfois recréé) est ré-attaché régulièrement");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.ok(css.includes("soreal-idle-page-root-v28{overflow-anchor:none}"), "l'ancrage natif reste coupé (page redessinée en continu) : c'est la réserve qui compense");

assert.ok(hud.includes("GRACE_MS=5000") && hud.includes("Date.now()<graceJusqua"), "page qui vient de s afficher : rien n est absorbé pendant 5 s (sinon un grand vide entre la barre de vie et la page, Norman 2026-10-28 : dans tous les menus)");
console.log("idle-hud-barre-sans-saut-v1: OK");
