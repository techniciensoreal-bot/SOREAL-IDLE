import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-08) : « retravaille chacun des menus explicatifs pour qu'il parle à des gens pas du tout calés en maths : marrants, courts, clairs, qui expliquent vraiment ce que ça fait » ; « dans Entraînement avancé,
 * change la manière dont le titre est écrit, rends-le plus beau, traduis le menu pour la VF ».
 * Les faits ne changent pas (voir idle-system-popups-v1.test.mjs) ; ici : tout est traduit en anglais (le dictionnaire couvre chaque phrase), la page est en français, le titre est soigné.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const dico = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const ngu = readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8");

// 1. Chaque phrase des panneaux (systèmes, Bestiaire, Aventure AUTO, Renaissance, Money Pit) a sa traduction anglaise
const debut = ui.indexOf("const TEXTES_SYSTEMES_IDLE_V1={");
const fin = ui.indexOf("/*\n       * Texte d'explication d'un système « générique »", debut);
const T = new Function(ui.slice(debut, fin) + "\nreturn TEXTES_SYSTEMES_IDLE_V1;")();
let n = 0;
for (const [id, t] of Object.entries(T)) {
  for (const phrase of [t.intro].concat(t.bullets)) {
    assert.ok(typeof dico[phrase] === "string" && dico[phrase].length > 10, "traduction anglaise manquante (" + id + ") : " + phrase.slice(0, 60));
    assert.ok(!/[éèêàùçœ]/i.test(dico[phrase].replace(/Entraînement/g, "")), "la traduction de « " + phrase.slice(0, 40) + " » contient encore du français : " + dico[phrase].slice(0, 60));
    n += 1;
  }
}
assert.ok(n >= 80, "toutes les phrases des systèmes sont couvertes : " + n);
for (const morceau of ["Le Bestiaire est ton carnet de rencontres", "Tu peux automatiser les expéditions : le jeu se bat à ta place", "La Renaissance, c’est le bouton « on recommence, mais en mieux »", "Money Pit : avec au moins 100 000 Or"]) {
  assert.ok(Object.keys(dico).some((k) => k.startsWith(morceau)), "traduction manquante : " + morceau);
}

// 2. Du ton : des images parlantes, pas de jargon de maths (« racine carrée » n'apparaît que dans l'aide de l'Entraînement avancé, expliquée)
const tout = Object.values(T).map((t) => [t.intro].concat(t.bullets).join(" ")).join(" ");
for (const mot of ["exponentiel", "logarithm", "asymptot", "coefficient", "formule"]) assert.ok(!tout.includes(mot), "pas de jargon de maths : " + mot);
assert.match(T.ngu.intro, /entraîneur de l’Entraînement/, "les NGU sont présentés comme l'entraîneur de l'Entraînement");
assert.ok(Object.values(T).filter((t) => /[:;]/.test(t.intro)).length >= 15, "des introductions imagées, en une phrase");

// 3. Entraînement avancé : titre soigné, tout en français
const entete = meta.slice(meta.indexOf('<header class="soreal-idle-at-entete-v1">'), meta.indexOf("</header>", meta.indexOf('<header class="soreal-idle-at-entete-v1">')));
assert.ok(entete.includes("Entraînement avancé") && entete.includes("(C’est l’heure de muscler tes coups)") && !entete.includes("<h1>") && !entete.includes("Advanced Training"), "titre en français, sans h1 (le thème y pose contour et ombre noirs)");
assert.ok(meta.includes("-webkit-text-fill-color:transparent!important") && meta.includes("soreal-idle-at-ornement-v1"), "titre en dégradé avec un filet orné");
for (const anglais of [">Level<", ">Energy Allocated<", ">Target<", ">WTF do I do?<", "> Advance Energy<", "Adventure Power +", "Block Damage Reduction"]) assert.ok(!meta.includes(anglais), "plus d'anglais : " + anglais);
for (const [fr, en] of [["Entraînement avancé", "Advanced Training"], ["(C’est l’heure de muscler tes coups)", "(Time to improve your moves)"], ["Je fais quoi ?", "WTF do I do?"], ["Faire suivre l’énergie", "Advance Energy"], ["Énergie placée", "Energy Allocated"], ["Puissance d’Aventure +", "Adventure Power +"], ["Réduction de dégâts du Blocage", "Block Damage Reduction"]]) assert.equal(dico[fr], en, "dictionnaire : " + fr);

// 4. Page NGU en français
for (const anglais of ["Level <b", "Allocated", "<span>Target</span>", ">WTF do I do?<", "TO NGU", "Hey, that"]) assert.ok(!ngu.includes(anglais), "plus d'anglais dans la page NGU : " + anglais);
for (const [fr, en] of [["Vers les NGU de magie", "To NGU Magic"], ["Vers les NGU d’énergie", "To NGU Energy"], ["(Eh, c’est le nom de ce jeu !)", "(Hey, that’s the name of this game!)"], ["Faire suivre la magie", "Advance Magic"], ["Magie placée", "Magic Allocated"]]) assert.equal(dico[fr], en, "dictionnaire : " + fr);

// 5. Aides « Je fais quoi ? » : chaque morceau de texte (entre les balises) a sa traduction
for (const source of [meta.slice(meta.indexOf('id="sorealIdleAtAideV1"'), meta.indexOf("toolbar+", meta.indexOf('id="sorealIdleAtAideV1"'))), ngu.slice(ngu.indexOf('id="sorealIdleNguAideV1"'), ngu.indexOf("chips+", ngu.indexOf('id="sorealIdleNguAideV1"')))]) {
  const morceaux = [...source.matchAll(/'<(?:p|li)>(.*?)<\/(?:p|li)>'/g)].flatMap((m) => m[1].split(/<\/?b>/));
  assert.ok(morceaux.length >= 8);
  for (const m of morceaux.map((x) => x.trim()).filter((x) => x.length > 8 && !x.startsWith("'") && !x.includes("wandoosOk"))) assert.ok(typeof dico[m] === "string", "morceau d'aide sans traduction : " + m.slice(0, 60));
}
console.log("idle-textes-explicatifs-v1: OK");
