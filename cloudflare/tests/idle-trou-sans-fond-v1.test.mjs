import assert from "node:assert/strict";
import fs from "node:fs";
const lire = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const page = lire("public/modules/money-pit-page-v1.js");
const meta = lire("public/modules/meta-progression-v130.js");
const css = lire("public/soreal-idle-itopod.css");
const dico = JSON.parse(lire("public/modules/traduction-anglais-dict-v1.json"));

/*
 * Trou sans fond (Norman, 2026-10-31) : image refaite (fichier statique du dépôt, donc hors ligne), titre et phrase au-dessus en français + anglais,
 * yeux qui brillent, puanteur sobre, pièces d'or SEULEMENT quand on jette son or.
 */
// Image statique légère, référencée par la page ; plus d'appel à l'ancienne image
assert.ok(fs.existsSync(new URL("../public/trou/trou-sans-fond-v1.webp", import.meta.url)), "image du trou dans le dépôt");
assert.ok(fs.statSync(new URL("../public/trou/trou-sans-fond-v1.webp", import.meta.url)).size < 150000, "image légère (< 150 Ko)");
assert.ok(page.includes('src="/trou/trou-sans-fond-v1.webp"'), "la page référence trou-sans-fond-v1.webp");
assert.ok(!page.includes('src="/api/idle/media/banner?name=Money_Pit.jpg"'), "plus l'ancienne image dans la page");

// Titre et phrase, français + dictionnaire anglais, police du jeu
assert.ok(page.includes("Trou sans fond\u200b") && page.includes("(Lance tout l’or gagné à la sueur de ton front dedans !)"), "titre et phrase en français");
assert.equal(dico["Trou sans fond​"], "Bottomless Pit");
assert.equal(dico["(Lance tout l’or gagné à la sueur de ton front dedans !)"], "(Just throw all your hard earned gold into it.)");
assert.equal(dico["Trou sans fond"], "Money Pit", "le nom du menu reste Money Pit");
assert.ok(/\.mp3-titre\{[^}]*color:#000;--f-texte:"Russo One"[^}]*font-family:"Russo One"/.test(css), "titre noir, police du jeu");
assert.ok(/\.mp3-titre-phrase\{[^}]*text-transform:uppercase/.test(css), "phrase en capitales (français et anglais)");

// Yeux : 3 paires de 2 points, luminosité 25 % à 100 %, boucle parfaite
assert.equal((page.match(/\[\d+\.\d+,\d+\.\d+,\d\.\d,-?[\d.]+\]/g) || []).length, 3, "3 paires d'yeux");
assert.ok(page.includes('<i></i><i></i></span>'), "deux points par paire");
assert.ok(css.includes("animation:mp3Yeux .2s cubic-bezier(.2,.9,.3,1.25) 1 both") && !css.includes("mp3Yeux var(--p"), "yeux : apparition rapide une seule fois, puis fixes");

// Puanteur : 5 volutes, fondu d'entrée et de sortie, un seul sens
assert.equal((page.match(/\[\d+(\.\d)?,'#[0-9a-f]{6}',[\d.]+,-?[\d.]+,[\d.]+\]/g) || []).length, 5, "5 volutes");
const monte = /@keyframes mp3Monte\{0%\{opacity:0;transform:translateY\(8cqw\)[^}]*\}15%\{opacity:\.8\}70%\{opacity:\.7\}100%\{opacity:0;transform:translateY\(-12cqw\)/.exec(css);
assert.ok(monte, "volute : opacité 0 à 0 % et 100 %, toujours vers le haut");

// Salve : seulement par __jeterOrSalveV1__, appelée après la réponse du moteur à moneyPit
assert.ok(page.includes("window.__jeterOrSalveV1__=function(n)"), "salve exposée");
assert.equal((page.match(/mp3-chute/g) || []).length, 1, "pièces fabriquées uniquement dans pieceDeOrIdleV1_ (une génération, une règle CSS ou une classe)");
assert.ok(!/mp3-pieces/.test(page.split("calquesTrouSansFondIdleV1_(){")[1].split("let compteurPiecesIdleV1_")[0]), "aucune pièce dans le rendu de la page");
const iHook = meta.indexOf("if(payload&&payload.action==='moneyPit'){");
assert.ok(iHook > 0 && meta.indexOf("window.__jeterOrSalveV1__(", iHook) > iHook && meta.indexOf("window.__jeterOrSalveV1__(", iHook) < meta.indexOf("loginCalendar", iHook), "hook réel dans le bloc moneyPit");
assert.equal((meta.match(/__jeterOrSalveV1__\(/g) || []).length, 1, "un seul appelant");

// Règle n°4 : le bloc ajouté par le module porte data-morph-garder
assert.ok(/c\.setAttribute\('data-morph-garder',''\)/.test(page), "salve data-morph-garder");

assert.ok(css.includes("@media (prefers-reduced-motion:reduce){.mp3-yeux{animation:none;opacity:1}.mp3-volute,.mp3-volute svg{animation:none}.mp3-volute{display:none}.mp3-pieces{display:none}}"), "mouvement réduit coupé");
// Réalisme de la chute (Norman, 2026-10-31) : le bord inférieur du trou est au premier plan
assert.ok(css.includes("pointer-events:none;clip-path:inset(0 0 34% 0)}"), "calque coupé au bord inférieur du trou");
assert.ok(css.includes(".mp3-dehors .mp3-echelle{animation-name:mp3ChuteD}") && page.includes("mp3-dehors"), "pièces qui passent le bord : sans fondu ni rétrécissement");
assert.ok(css.includes("100%{opacity:0;transform:scale(.08)}}"), "pièces dans le trou : rétrécissent et s'effacent");
console.log("idle-trou-sans-fond-v1: OK");
