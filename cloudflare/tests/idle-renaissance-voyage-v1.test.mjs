import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-07) : fenêtre de Renaissance « plus belle, texturée, magique » (horloge qui tourne à rebours, nombres lisibles, texte simple : plus fort, boss plus vite, ce qui repart de zéro, ce qui se referme, ce qu'on garde),
 * voyage dans le temps plein écran (l'horloge fonce vers l'écran SANS s'arrêter et se fond pendant que l'éclair blanc monte, puis l'éclair s'ouvre en cercle sur le Combat de boss) ;
 * Entraînement de base : textes sous les barres lisibles et « Cap » jamais traduit en « Plafond » ; son de néon de plus en plus impressionnant de barre en barre.
 */
const lire = (f) => fs.readFileSync(f, "utf8");
const index = lire("cloudflare/public/index.html");
const fen = lire("cloudflare/public/modules/renaissance-fenetre-v1.js");
const avt = lire("cloudflare/public/modules/ui-aventure-1-v1.js");
const ren = lire("cloudflare/public/modules/ui-renaissance-v1.js");

// la carte vit dans son module, chargé avant ui-aventure-1
assert.ok(index.indexOf("/modules/renaissance-fenetre-v1.js?v=") > 0 && index.indexOf("/modules/renaissance-fenetre-v1.js?v=") < index.indexOf("/modules/ui-aventure-1-v1.js?v="), "module de la fenêtre chargé avant ui-aventure-1");
assert.ok(avt.includes("__SOREAL_IDLE_RENAISSANCE_FENETRE_V1__") && !avt.includes("sorealIdleRenaissanceStyleV2"), "ui-aventure-1 délègue la carte au module");

// nombres lisibles (jamais d'écriture à rallonge), toujours en lettres du jeu
assert.ok(fen.includes("formatGrandNombreIdleV70_(rapport,2)") && !/idleEntier_\(gain\)/.test(avt), "rapport et nombres écrits avec les unités du jeu");
// horloge à rebours : petite aiguille 12 fois plus lente que la grande, sens inverse
assert.ok(/\.rn-aig-m\{animation:rnRecule 2s linear infinite\}\.rn-aig-h\{animation:rnRecule 24s linear infinite\}/.test(fen), "grande aiguille 2 s, petite 24 s (12 pour 1)");
assert.ok(/@keyframes rnRecule\{from\{transform:rotate\(0\)\}to\{transform:rotate\(-360deg\)\}/.test(fen), "rotation à rebours, boucle parfaite (un tour exact)");
// contenu de la fenêtre
for (const t of ["Plus rapide", "Tu repars de zéro", "Se referment pour l’instant", "Tu gardes le reste", "plus fort qu’aujourd’hui"]) assert.ok(fen.includes(t), "texte : " + t);
// anti-spoil : seuls les menus déjà possédés sont cités
assert.ok(avt.includes("data-menu-id-v1=\"'+m[0]+'\"") && avt.includes("document.querySelector('.soreal-idle-nav-button-v28"), "menus cités seulement s'ils sont déjà dans la navigation");
assert.ok(!/NGU|Perks|Quirks|Hacks|Wishes|MacGuffins/.test(fen), "aucun nom de système verrouillé dans la fenêtre");

// voyage dans le temps
assert.ok(/function voyageTempsRenaissanceIdleV1_\(/.test(ren), "voyage défini");
assert.ok(ren.includes("{opacity:1,offset:.5}") && /scale\('\+S\+'\)',opacity:0\}/.test(ren), "l'horloge continue de grossir jusqu'au bout et se fond (jamais d'arrêt sur image)");
assert.ok(ren.includes("fill:'forwards'});\n          anneaux") || ren.includes("anneaux.forEach"), "anneaux de fond");
assert.ok(/eclair\.animate\(\[\{opacity:0\},\{opacity:1\}\],\{duration:600,delay:T-600/.test(ren), "l'éclair blanc monte pendant les 600 dernières ms de l'approche");
assert.ok(ren.includes("'--vt-r':'0%'") && ren.includes("vt-ouvre"), "l'éclair s'ouvre en cercle depuis le centre");
assert.ok(ren.includes("matchMedia('(prefers-reduced-motion: reduce)')"), "mouvement réduit : aucune animation");
assert.ok(/const voyage=voyageTempsRenaissanceIdleV1_\(\);\s*fermerPopupRenaissanceIdleV63_\(\);/.test(ren), "le calque clone l'horloge AVANT la fermeture de la fenêtre");
assert.equal((ren.match(/voyage\.annuler\(\)/g) || []).length, 2, "échec ou refus : le calque est retiré");
assert.ok(ren.includes("voyage.fin(function(){"), "la Renaissance se joue sous l'éclair, le message flottant attend l'ouverture");

// Entraînement de base : « Cap » sous la barre, jamais traduit en « Plafond »
const ent = lire("cloudflare/public/modules/ui-entrainement-v1.js");
assert.ok(ent.includes("<span data-sans-traduction>Cap</span> :"), "« Cap » protégé du traducteur sous la barre");
const css = lire("cloudflare/public/soreal-idle-entrainement-puissance-v1.css");
assert.ok(/bt-meta-v120 span\{color:#f2f6ff;font-weight:700/.test(css), "textes sous les barres : blanc franc et gras");
const lis = lire("cloudflare/public/soreal-idle-lisibilite-v1.css");
assert.ok(!/!important/.test(lis.replace(/\/\*[\s\S]*?\*\//g, "")), "aucun !important dans la feuille de lisibilité (dette CSS)");
assert.ok(/<link rel="stylesheet" href="\/soreal-idle-lisibilite-v1\.css\?v=\d+">/.test(index), "feuille de lisibilité liée");
for (const sel of [".bm-etagere-lib", ".ygg-note", ".soreal-idle-note-v4", ".rb-leg span"]) assert.ok(lis.includes(sel), "texte rendu lisible : " + sel);

// son : même néon, rang 0 à 5, de plus en plus riche
const lum = lire("cloudflare/public/modules/bt-lumieres-v1.js");
assert.ok(/var RANG_PAR_BARRE=\{[^}]*ultime_soreal:5,ultime_logistique:5/s.test(lum), "rang 0 à 5 par barre, jumelles de défense comprises");
assert.ok(lum.includes("sonner('allume',rangPourBarre(idBarre))"), "une barre qui reçoit son premier point joue son rang");
const dict = JSON.parse(lire("cloudflare/public/modules/traduction-anglais-dict-v1.json"));
for (const t of ["Renaître ?", "Plus rapide", "Tu gardes le reste", "Si tu renais maintenant, tu seras"]) assert.ok(dict[t], "traduction anglaise : " + t);

// Time Machine : plus de « ding » à chaque niveau
assert.ok(lire("cloudflare/public/modules/machine-sons-v1.js").includes("var SON_NIVEAU=false;") && lire("cloudflare/public/modules/machine-sons-v1.js").includes("if(SON_NIVEAU&&joue)niveau();"), "son de niveau coupé");
console.log("idle-renaissance-voyage-v1: OK");
