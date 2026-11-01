import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Garderie, retours de validation de Norman (2026-11-01) : doré n°5, Halloween n°4 et n°5, Nyan n°2, Matrix (pilules rouge et bleue), Noël (chaussette, liquides par rang, bonhomme blanc,
 * boule aux couleurs qui glissent, globe à neige avec neige qui tombe). Complète idle-garderie-six-bocaux-v1.
 */
const pub = (f) => readFileSync("cloudflare/public/" + f, "utf8");
const SRC = ["garderie-bocaux-rangs-v1.js", "garderie-bocaux-formes-a-v1.js", "garderie-bocaux-formes-b-v1.js", "garderie-bocaux-formes-c-v1.js", "garderie-bocaux-effets-v1.js", "garderie-bocaux-formes-v1.js"];
const fakeDoc = { head: { appendChild() {} }, getElementById() { return null; }, createElement() { return { id: "", textContent: "" }; } };
const win = {};
const ctx = { window: win, document: fakeDoc, encodeURIComponent };
for (const f of SRC) vm.runInNewContext(pub("modules/" + f), ctx);
const F = win.__SOREAL_IDLE_GARDERIE_FORMES_V1__;
const RG = win.__SOREAL_IDLE_GARDERIE_RANGS_V1__;
const css = F.css();
const noms = (id) => Array.from(RG.skins[id].map((f) => f.nom));

/* Matrix : n°1 et n°2 sont des pilules (rouge, bleue), l'éprouvette a disparu ; les rangs 3 à 6 gardent leur forme et leur vert ; le moniteur est plus large et agrandi. */
assert.ok(F.formes.matrix.d.includes("Q76 4 76 30"), "Matrix n°1 : pilule");
assert.ok(!F.formes.matrix.deco.includes("M26 40H37"), "Matrix : plus de graduations d'éprouvette");
assert.deepEqual(noms("matrix"), ["Pilule bleue", "Cube de données", "Moniteur", "Cristal de code", "Cœur de la Matrice"]);
assert.ok(RG.skins.matrix[2].echelle >= 1.1 && /M8 34H92Q96 34/.test(RG.skins.matrix[2].d), "moniteur large et agrandi");
assert.ok(/data-rang="1"\]\{--gd-liq:linear-gradient\(180deg,#ff9a9a/.test(css) && /data-rang="2"\]\{--gd-liq:linear-gradient\(180deg,#9ad0ff/.test(css), "Matrix : liquide rouge n°1, bleu n°2");
assert.ok(!/data-skin="matrix"\] \.gd-pot\[data-rang="[3-6]"\]\{--gd-liq/.test(css), "Matrix n°3 à 6 : vert d'origine");

/* Nyan : vrai nuage (lobes, base plate), agrandi. */
const nuage = RG.skins.arcenciel[0];
assert.equal(nuage.nom, "Nuage");
assert.ok((nuage.d.match(/A\d+ \d+ 0 0 0/g) || []).length >= 7 && nuage.d.includes("H82"), "nuage : lobes arrondis et base plate");
assert.ok(nuage.echelle >= 1.2);
assert.ok(css.includes('.gd-etagere[data-skin="arcenciel"] .gd-pot[data-rang="2"]:not(.gdz-pot) .gd-bocal{transform:scale(1.3)'), "échelle du nuage");

/* Halloween : citrouille ni orange ni vert ; chauve-souris = silhouette complète. */
const cit = RG.skins.chauvesouris[2], bat = RG.skins.chauvesouris[3];
assert.equal(cit.nom, "Citrouille");
assert.ok(!/#ff[89ab][0-9a-f]00|#ffb03b|#2f8a45|#3d7a2a|#ff9a2e|#17[0-9a-f]{4}/i.test(cit.d + cit.deco + cit.fond + cit.trait), "citrouille : ni orange ni vert");
assert.ok(!/rgba\(255,1[0-9]{2},/.test(cit.fond));
assert.ok(/M40 10L45 24Q50 21 55 24L60 10/.test(bat.d) && bat.d.includes("98 50") && bat.d.includes("Q76 104 74 128") && !/H|V/.test(bat.d.replace(/[^A-Za-z]/g, "").replace(/Z$/, "")), "chauve-souris : oreilles, ailes, corps");

/* Doré : les bandes du coffre s'arrêtent avant le bord rond. */
const coffre = RG.skins.dore[3].deco;
assert.ok(!/y="14" width="9" height="140"/.test(coffre) && /y="56" width="9" height="98"/.test(coffre), "bandes du coffre sous le couvercle rond");

/* Noël : liquides par rang. */
const page = pub("modules/daycare-page-v1.js");
const base = /data-skin="noel"\]\{--gd-liq:([^}]*)\}/.exec(page)[1];
assert.ok(!/#17|#1f9|#0b5/i.test(base) && base.includes("#8a1018"), "base de Noël : rouge, sans vert");
assert.ok(/data-skin="noel"\] \.gd-pot\[data-rang="3"\]\{--gd-liq:linear-gradient\(180deg,#8ee08e/.test(css), "sapin : liquide vert");
for (const r of [1, 2, 4, 5, 6]) assert.ok(!new RegExp('data-skin="noel"\\] \\.gd-pot\\[data-rang="' + r + '"\\]\\{--gd-liq:[^}]*#(8ee08e|1f9a4a|0b5a2a)').test(css), "Noël n°" + r + " : liquide non vert");
assert.ok(/data-skin="noel"\] \.gd-pot\[data-rang="5"\]\{--gd-liq:linear-gradient\(180deg,#ffffff/.test(css), "bonhomme : liquide blanc");
const chs = RG.skins.noel[0];
assert.equal(chs.nom, "Chaussette de Noël");
assert.ok(chs.deco.includes("#f6ead6") && chs.deco.includes('rx="10"') && chs.deco.includes("#2f8a45") && chs.deco.includes("#d4202c"), "chaussette : revers, talon, bout, houx, baies");
const bonhomme = RG.skins.noel[3];
assert.ok(bonhomme.trait === "#6f88ad" && bonhomme.deco.includes("rgba(60,90,140,.45)"), "bonhomme : liseré et ombre de contraste");

/* Boule de Noël : cycle de teintes parfait. */
const C = RG.cycleNoel;
assert.equal(C.fonduS, 10);
assert.equal(C.cycleS, C.teintes.length * 10, "10 s par couleur");
assert.ok(C.teintes.length >= 4 && C.teintes.length <= 5);
for (const c of C.teintes) { const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); assert.ok(!(g > r && g > b), "teinte non verte " + c); }
const effets = RG.effets();
assert.ok(effets.includes("@keyframes gd-noel-teintes{from{background-position:0 0,0 0,0 0,0 0}to{background-position:0 0,0 0,0 0,0 106.6667%}}"), "une tuile exactement");
assert.ok(Math.abs(Number(C.fin) / 100 * (C.tuile - 100) - C.tuile) < 0.01, "106,6667 % de (1600 - 100) = 1600 %");
assert.ok(effets.includes("100% 1600%") && effets.includes("repeat-y") && /gd-noel-teintes 40s linear infinite/.test(effets) && !/alternate|reverse/.test(effets), "un seul sens, linéaire");
const degrade = /linear-gradient\(180deg,(#e0303a 0%[^)]*)\)/.exec(effets)[1].split(",");
assert.equal(degrade[0].split(" ")[0], degrade[degrade.length - 1].split(" ")[0], "première teinte = dernière");
assert.ok(effets.includes("animation-delay:0s,var(--gd-noel-d,0s)"), "départ fixé (pas de redémarrage au redessin)");
assert.ok(!/setInterval|setTimeout/.test(pub("modules/garderie-bocaux-effets-v1.js")), "aucune minuterie");
assert.ok(effets.includes('.gd-pot[data-rang="1"] .gd-liq{animation:none}'), "mouvement réduit : rouge fixe");
const zoom = pub("modules/garderie-zoom-v1.js");
assert.ok(zoom.includes("gd-noel-teintes") && zoom.includes("--gd-noel-d"), "la vue zoom reprend l'instant du cycle");

/* Globe à neige : flocons CSS purs, derrière le liquide, opacité 0 aux deux bouts, durées indépendantes, mouvement réduit = flocons fixes. */
const flocs = effets.match(/gd-fl-[abc] [0-9.]+s linear infinite/g) || [];
assert.equal(flocs.length, 4, "quatre flocons seulement");
assert.equal(new Set(flocs.map((s) => s.split(" ")[1])).size, 4, "durées toutes différentes");
for (const k of ["a", "b", "c"]) assert.ok(new RegExp("@keyframes gd-fl-" + k + "\\{0%\\{opacity:0;transform:[^}]*\\}15%\\{opacity:\\.95\\}80%\\{opacity:\\.8\\}100%\\{opacity:0;transform:").test(effets), "flocon " + k + " : opacité 0 aux deux bouts");
for (const m of effets.match(/@keyframes gd-fl-[abc]\{.*?\}\}/g)) assert.ok(!/(top|left|width|height):/.test(m), "transform + opacité seulement");
assert.ok(/data-rang="6"\]::before/.test(effets) && /data-rang="6"\] \.gd-bocal::after\{[^}]*z-index:-1/.test(effets), "flocons derrière le liquide");
assert.ok(/@media \(prefers-reduced-motion:reduce\)\{[^]*animation:none;opacity:\.85/.test(effets), "mouvement réduit : flocons fixes");
assert.ok(!/!important/.test(pub("modules/garderie-bocaux-effets-v1.js")), "aucun !important");
console.log("OK idle-garderie-six-bocaux-retours-v1");
