import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-03) : NGU Énergie : « les nuages gris disparaissent beaucoup plus lentement, ça clignote une fois, toute la page a des nuages gris, ils ne se dégagent que sur la ligne où l'on a mis une ressource ; le gris part de la LIGNE COMPLÈTE ; si on alimente toutes les barres le ciel est entièrement dégagé ;
 * un seul soleil, en haut de la page (le haut se dégage aussi) ; pas de lignes droites de cadre ; les nuages ne doivent pas grandir, ils sont déjà en place ».
 * NGU Magie : « pareil avec les étoiles, uniquement sur la ligne où on en a placé ; plus la vitesse de remplissage est rapide, plus fort elles brilleront ».
 * Cause du clignotement (mesurée dans le navigateur) : au premier redessin après la mise d'énergie, le HTML neuf n'avait plus de .nl-gris : le morph le retirait d'un coup et posait soleil et nuages blancs sans fondu.
 */
const src = readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8").split(String.fromCharCode(13)).join("");
const sansCommentaires = src.replace(/\/\*[\s\S]*?\*\//g, "");

// --- énergie : le gris est un BANC DE CUMULUS DESSINÉ (SVG), un par ligne ; seule l'opacité s'anime (formes fixes, 16 s)
const breche = src.match(/\.nl-barre\[data-nl-res="energy"\]::after\{[^}]*\}/)[0];
assert.ok(breche.includes("transition:opacity 16s ease-in-out;"), "ouverture et fermeture : 16 s, ease-in-out, OPACITÉ seule");
assert.ok(!/transform|scale|mask|filter|blur|width\s*:|height\s*:/.test(breche), "le banc ne grandit pas et n'est ni masqué ni flouté : aucun transform, scale, masque, filtre, largeur ou hauteur");
assert.ok(breche.includes("opacity:1;"), "fermé (ligne non alimentée) : banc plein, déjà en place à sa forme finale");
assert.ok(src.includes('.nl-barre[data-nl-res="energy"].actif::after{opacity:0}'), "le banc s'efface seulement sur la ligne où une ressource est placée (classe actif posée par le HTML : survit au redessin)");
assert.ok(!breche.includes("display:none") && !breche.includes("animation:"), "jamais de display basculé ni d'animation qui serait annulée par un redessin");
assert.ok(breche.includes("left:-100%;right:-100%;top:-130px;bottom:-130px"), "calé sur la barre par des marges négatives : toute la largeur, hauteur réelle de la ligne (aucune hauteur en dur), débord de 130 px : les festons chevauchent ceux des lignes voisines");
assert.ok(breche.includes("background-image:var(--nl-banc,url(") && breche.includes("background-repeat:repeat-x;background-size:auto 100%"), "dessin SVG répété en largeur, jamais étiré");
// banc de cumulus : cercles de rayons différents, sans trou, festons haut et bas (jamais une droite)
const gen = new Function(src.slice(src.indexOf("function suiteNuage_("), src.indexOf("function bancUri_")) + "return {cerclesBanc_};")();
for (const graine of [3, 2]) {
  const c = gen.cerclesBanc_(graine);
  assert.ok(c.length <= 48, "léger : au plus 48 cercles par banc (doublons de raccord compris), " + c.length);
  const rayons = c.map((k) => k.r);
  assert.ok(Math.min(...rayons) >= 50 && Math.max(...rayons) >= 85 && new Set(rayons).size >= 20, "rayons très différents");
  let trous = 0, hMin = 999, hMax = -1, bMin = 999, bMax = -1;
  for (let x = 0; x < 960; x += 3) {
    let haut = 999, bas = -1;
    for (const k of c) { const d = k.r ** 2 - (k.x - x) ** 2; if (d > 0) { const h = Math.sqrt(d); haut = Math.min(haut, k.y - h); bas = Math.max(bas, k.y + h); } }
    hMin = Math.min(hMin, haut); hMax = Math.max(hMax, haut); bMin = Math.min(bMin, bas); bMax = Math.max(bMax, bas);
    for (let y = Math.ceil(haut) + 1; y < bas - 1; y += 3) if (!c.some((k) => (k.x - x) ** 2 + (k.y - y) ** 2 <= k.r ** 2)) trous++;
  }
  assert.equal(trous, 0, "aucun trou dans le banc (graine " + graine + ")");
  assert.ok(hMin >= 2 && bMax <= 418, "le banc ne touche pas le bord de la tuile : aucune coupure droite");
  assert.ok(hMax - hMin >= 50 && bMax - bMin >= 40, "festons profonds en haut (" + Math.round(hMax - hMin) + " px) et en bas (" + Math.round(bMax - bMin) + " px)");
}
assert.notDeepEqual(gen.cerclesBanc_(3), gen.cerclesBanc_(2), "deux tuiles différentes");
assert.ok(src.includes("encodeURIComponent(svg)") && !/filter|feGaussianBlur/.test(src.slice(src.indexOf("function bancUri_"), src.indexOf("var BANC_A="))), "SVG sans filtre ni flou");
assert.ok(src.includes(".nl-section .nl-barre[data-nl-res=\"energy\"]:nth-child(2n){--nl-banc:") && src.includes("--nl-dec:'+[0,190,410,660,830][k]+'px"), "deux tuiles alternées et cinq décalages : deux lignes voisines ne se ressemblent pas");
// un seul bleu pour tout le ciel (Norman : « le ciel doit avoir le même bleu partout »)
assert.ok(src.includes(".nl-v1{--nl-ciel:#58a6ee;"), "une variable unique --nl-ciel");
assert.ok(src.includes('.nl-v1[data-nl-onglet="energy"]{background-image:url("\'+BLANCS+\'");background-size:1100px 640px;background-repeat:repeat;background-color:var(--nl-ciel)}'), "ciel = fond uni + petits cumulus blancs fixes, aucun dégradé");
assert.ok(!/#8cc8ff|#4a97e0|#3d86d0|#6db0ef|#2f6fb8|#3a7fc8|#081b3b/.test(sansCommentaires), "plus aucun bleu de ciel en dégradé ni de nuance différente");
assert.ok(!/ellipse[^']*rgba\(70,76,90/.test(sansCommentaires), "plus aucune tache floue en dégradé radial dans le ciel");
// confinement : le ciel reste sous le menu et le HUD (z-index du menu 50 et du HUD 30 dans d'autres feuilles ; ici le conteneur isole et coupe)
const racineCss = src.match(/\.nl-v1\{--nl-ciel[^}]*\}/)[0];
assert.ok(/isolation:isolate/.test(racineCss) && /overflow:hidden/.test(racineCss) && !/z-index/.test(racineCss), "le conteneur de page NGU isole (isolation:isolate) et coupe (overflow:hidden) sans z-index : aucun calque du ciel ne peut passer par-dessus le menu ni le HUD");
assert.ok(!/position:fixed/.test(breche) && /z-index:-1/.test(breche) && /\.nl-v1>\.nl-gris\{[^}]*z-index:0/.test(src) && /\.nl-v1>\.nl-soleil\{[^}]*z-index:0/.test(src), "calques du ciel : jamais fixed, z-index négatif ou nul dans leur propre contexte");
assert.ok(!/overflow\s*:\s*hidden/.test(src.match(/\.nl-barre\{[^}]*\}/)[0]) && !/\.nl-(section|grille)\{[^}]*overflow:hidden/.test(src), "aucun overflow:hidden sur la ligne ni sur ses parents directs");
assert.ok(src.includes('.nl-barre[data-nl-res="energy"]::after,.nl-v1[data-nl-onglet="energy"] .nl-resume::before{transition:opacity .4s linear}') || /prefers-reduced-motion:reduce\)\{\.nl-v1>\.nl-gris,\.nl-barre\[data-nl-res="energy"\]::after,[^{]*\{transition:opacity \.4s linear\}/.test(src), "reduced-motion : fondu très court");
// recouvrement entre lignes : le débord (130 px) dépasse largement l'écart entre deux lignes
const ecart = Number(src.match(/\.nl-grille\{[^}]*gap:(\d+)px/)[1]);
assert.ok(130 > ecart + 100, "le débord de 130 px recouvre l'écart de " + ecart + " px entre deux lignes : aucune bande de ciel nue");
// banc du haut : un seul nœud, toujours dans le HTML de l'énergie, avec data-morph-vivant (hauteur posée par le module)
assert.ok(src.includes("var HTML_GRIS='<span class=\"nl-gris\" data-morph-vivant aria-hidden=\"true\"></span>';"), "un seul nœud gris (banc du haut), data-morph-vivant");
assert.ok(!/\.nl-gris-(sort|ent)/.test(sansCommentaires), "plus de classe de sortie du gris");
assert.ok(!/setTimeout\(retirer/.test(src), "plus de retrait différé");
assert.ok(src.includes('.nl-v1[data-nl-ouvert="1"]>.nl-gris{opacity:0}'), "le banc du haut s'efface dès qu'une ligne d'énergie est active");
// banc du bas (résumé) : s'efface seulement quand TOUTES les lignes sont alimentées
assert.ok(src.includes('.nl-v1[data-nl-tout="1"] .nl-resume::before{opacity:0}') && /\.nl-resume::before\{[^}]*transition:opacity 16s ease-in-out/.test(src), "banc du bas : s'efface (opacité, 16 s) quand toutes les lignes sont actives : plus aucun gris nulle part");
assert.ok(/data-nl-tout="'\+\(nbOuvertes_>0&&nbOuvertes_===nbEnergie_\?'1':'0'\)\+'"/.test(src), "data-nl-tout = toutes les lignes d'énergie ont une allocation (état du moteur)");

// --- magie : étoiles par ligne
assert.ok(src.includes('@property --nl-e{syntax:"<number>";inherits:true;initial-value:0}'), "--nl-e est lissée par le CSS");
assert.ok(src.includes('.nl-barre[data-nl-res="magic"]{transition:--nl-e 16s ease-in-out}'), "extinction et allumage de 16 s");
assert.ok(/style="--nl-c:'\+c\[0\]\+';--nl-t:'\+c\[1\]\+';--nl-e:'\+eclatLigne_\(n\)\+'"/.test(src), "l'éclat vient de l'état de la ligne (eclatLigne_), pas du DOM");
assert.ok(/nlLigneScintA\{0%,100%\{opacity:var\(--nl-e\)\}/.test(src) && /nlLigneScintB\{0%,100%\{opacity:calc\(var\(--nl-e\)\*var\(--nl-e\)\*var\(--nl-e\)\)\}/.test(src), "scintillement : boucle parfaite (mêmes valeurs à 0 % et 100 %)");
assert.ok(/prefers-reduced-motion:no-preference\)\{\.nl-barre\[data-nl-res="magic"\]::after\{animation:nlLigneScintA/.test(src), "scintillement coupé si reduced-motion");
assert.ok(/data-nl-onglet="magic"\]>\.nl-arc,\.nl-v1\[data-nl-onglet="magic"\] \.nl-etoiles\{display:none\}/.test(src), "plus de ciel étoilé ni d'aurore de bandeau sur toute la page");
assert.ok(!/\+ETOILES\+/.test(src), "les étoiles globales ne sont plus dans le HTML");
assert.ok(/::after\{opacity:var\(--nl-e\);background-image:[^;]*url\("'\+TUILE_LIGNE_A\+'"\)/.test(src), "étoiles en background répété (une image par couche)");

// --- fonction d'éclat : monotone, bornée, continue
const f = new Function("nombre_", src.slice(src.indexOf("function eclatLigne_(n){"), src.indexOf("var onglet='energy';")) + "return eclatLigne_;")((v) => Number(v) || 0);
const e = (spl, allocation = 5) => f({ allocation, secondsPerLevel: spl });
assert.equal(e(10, 0), 0, "rien de placé : aucune étoile");
assert.equal(f({ allocation: 0, secondsPerLevel: 0.01 }), 0, "rien de placé, même avec une vitesse");
assert.equal(e(null), 0.4, "placé mais vitesse inconnue : plancher");
assert.equal(e(1e12), 0.4, "très lent : plancher visible 0,4");
assert.equal(e(0.04), 1, "CAP (0,04 s par niveau) : plafond 1");
assert.equal(e(0.0001), 1, "plus rapide que le CAP : plafond 1");
let prec = -1;
for (const spl of [1e12, 1e10, 1e9, 1e7, 1e5, 1e4, 3600, 60, 1, 0.1, 0.04, 0.01]) {
  const v = e(spl);
  assert.ok(v >= prec, "monotone : plus la ligne est rapide, plus c'est brillant (" + spl + " s : " + v + ")");
  assert.ok(v >= 0.4 && v <= 1, "bornée");
  prec = v;
}
assert.ok(e(12000) > e(3.2e9) && e(1) > e(12000), "ordre des vitesses respecté");
for (const spl of [1e9, 1e5, 100, 1, 0.1]) assert.ok(Math.abs(e(spl) - e(spl * 1.01)) <= 0.02, "lissé : pas de saut pour un changement léger de vitesse (" + spl + ")");

// --- UN SEUL soleil, en haut de la page, révélé quand le banc du haut s'efface (dès qu'une ligne est active)
assert.ok(!/ffe066|fffbd0|ffb81f/.test(breche), "le banc d'une ligne ne dessine ni soleil ni halo solaire");
assert.equal((src.match(/class="nl-soleil"/g) || []).length, 1, "un seul nœud soleil défini");
assert.ok(/HTML_SOLEIL\+HTML_GRIS/.test(src), "le soleil est posé une fois, DERRIÈRE le banc du haut : il se révèle quand le banc s'efface");
assert.ok(!/\.nl-barre[^{]*soleil/.test(src), "aucun soleil rattaché à une barre");
const soleil = src.match(/\.nl-v1>\.nl-soleil\{[^}]*\}/)[0];
assert.ok(soleil.includes("opacity:var(--nl-sol)") && !/transform|scale|mask/.test(soleil), "l'éclat du soleil suit --nl-sol (lissé), forme fixe");
assert.ok(src.includes('.nl-v1[data-nl-onglet="energy"]{transition:--nl-sol 16s ease-in-out}'), "éclat du soleil lissé 16 s");
assert.ok(/data-nl-ouvert="'\+\(nbOuvertes_>0\?'1':'0'\)\+'"/.test(src) && /nbOuvertes_=liste\.filter\(function\(n\)\{return n\.resource==='energy'&&nombre_\(n\.allocation\)>0;\}\)\.length/.test(src), "le HTML pose data-nl-ouvert d'après les allocations de l'état");
assert.ok(/new ResizeObserver\(/.test(src) && !/setInterval\(/.test(src.slice(src.indexOf("function mesurerHaut_"), src.indexOf("function attacherMesure_") + 400)), "hauteur du banc du haut mesurée par ResizeObserver, sans minuterie");
const sol = new Function("return " + src.match(/function solDe_\(nbOuvertes\)\{[^\n]*\}/)[0].replace("function solDe_", "function"))();
assert.equal(sol(0), 0, "aucune ligne ouverte : pas de soleil");
assert.equal(sol(1), 0.7);
assert.ok(sol(2) > sol(1) && sol(3) > sol(2) && sol(4) === 1 && sol(9) === 1, "plus de lignes ouvertes : plus brillant, borné à 1");
assert.ok(src.includes('.nl-v1[data-nl-onglet="energy"]{transition:--nl-sol .4s linear}'), "reduced-motion : fondu court du soleil");
// aucune animation de nuage liée à l'ouverture : ni transform, ni scale, ni masque, ni flou sur le banc du haut, le banc de ligne, le banc du bas
for (const sel of [/\.nl-v1>\.nl-gris\{[^}]*\}/, /\.nl-barre\[data-nl-res="energy"\]::after\{[^}]*\}/, /\.nl-resume::before\{[^}]*\}/]) {
  assert.ok(!/(?:^|;)transform:|scale\(|mask|filter|blur/.test(src.match(sel)[0]), "pas de transform, scale, masque ni flou sur " + sel.source.slice(0, 30));
}
// --- TOUS les nuages sous TOUT le contenu (Norman : « ses nuages sont au-dessus des cadres au-dessus »)
assert.ok(src.includes(".nl-v1>.nl-section,.nl-v1>.nl-resume{z-index:auto}"), "la section des lignes et le résumé ne forment plus un contexte d'empilement : leurs bancs (z-index:-1) se peignent dans le contexte de la page, sous les cadres du haut");
assert.ok(src.indexOf(".nl-v1>.nl-section,.nl-v1>.nl-resume{z-index:auto}") > src.indexOf(".nl-v1>*:not(.nl-etoiles){position:relative;z-index:1}"), "la règle est APRÈS la règle générale z-index:1 (même spécificité : la dernière gagne)");
assert.ok(/z-index:-1/.test(breche) && /\.nl-resume::before\{[^}]*z-index:-1/.test(src), "bancs de ligne et du bas : z-index négatif, sous tout le contenu positionné");
assert.ok(/\.nl-v1>\.nl-gris\{[^}]*z-index:0/.test(src) && /\.nl-v1>\.nl-soleil\{[^}]*z-index:0/.test(src), "banc du haut et soleil : z-index 0, sous les éléments d'en-tête (z-index:1)");
assert.ok(/isolation:isolate/.test(src.match(/\.nl-v1\{--nl-ciel[^}]*\}/)[0]), "contexte d'empilement unique pour toute la page NGU");
console.log("idle-ngu-nuages-par-ligne-v1: OK");
