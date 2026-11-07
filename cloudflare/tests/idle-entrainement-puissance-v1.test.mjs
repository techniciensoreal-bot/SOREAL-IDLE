import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-07) : Entraînement de base « plus beau » : boutons de défense bleus ; montée en puissance sentie pour chaque barre (six paliers par côté, plaque, emblème, barre et intérieur de la barre de plus en plus travaillés) ;
 * plus d'émoji devant les noms (les dessins restent) ; noms sur une seule ligne ; niveau sur une ligne (le « K » ne passe pas à la ligne) ; barres jamais coupées aux extrémités ; quatre points aux quatre coins de CHAQUE plaque ;
 * barre d'outils compacte ; aucun reflet qui traverse les barres.
 */
const css = fs.readFileSync("cloudflare/public/soreal-idle-entrainement-puissance-v1.css", "utf8");
const index = fs.readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(/<link rel="stylesheet" href="\/soreal-idle-entrainement-puissance-v1\.css\?v=\d+">/.test(index), "feuille liée dans index.html");

// limité au menu « entrainement » (les classes soreal-idle-bt-* servent aussi ailleurs)
const regles = css.replace(/\/\*[\s\S]*?\*\//g, "").split("}").map((r) => r.split("{")[0]).filter((x) => /soreal/.test(x));
for (const sel of regles) if (!/^\s*@/.test(sel)) assert.ok(/data-menu="entrainement"/.test(sel), "règle limitée à l'Entraînement de base : " + sel.slice(-90));

// six paliers par côté
for (let t = 0; t <= 5; t++) for (const cote of ["attack", "defense"]) {
  assert.ok(css.includes(`.${cote} .soreal-idle-bt-row-v120[data-rang-v1="${t}"]:not(.verrouille){--t:${t}}`), `palier ${t} ${cote}`);
  assert.ok(css.includes(`.${cote} .soreal-idle-bt-row-v120[data-rang-v1="${t}"]:not(.verrouille){--remplissage:`), `remplissage palier ${t} ${cote}`);
  assert.ok(css.includes(`.${cote} .soreal-idle-bt-row-v120[data-rang-v1="${t}"]:not(.verrouille){--motif:`), `motif intérieur palier ${t} ${cote}`);
}
// la plaque grossit avec le palier
assert.ok(/--ig:calc\(42px \+ var\(--t\) \* 7px\)/.test(css) && /--hb:calc\(20px \+ var\(--t\) \* 3\.6px\)/.test(css), "emblème et barre grandissent avec le palier");
// une icône par compétence (les 12)
for (const id of ["attaque_passive", "attaque_reguliere", "attaque_renforcee", "contre_palette", "percee_quai", "ultime_soreal", "blocage", "defense_renforcee", "recuperation", "boost_offensif", "charge_logistique", "ultime_logistique"]) assert.ok(css.includes(`[data-basic-training-skill="${id}"]:not(.verrouille){--ico:url(`), "emblème : " + id);
// défense en bleu, attaque en rouge
assert.ok(/\.defense\{--pw1:#2a7bff;--pw2:#46c2ff/.test(css) && /\.attack\{--pw1:#ff3b2f;--pw2:#ff8a3c/.test(css), "couleurs des deux côtés");
assert.ok(/actions-v120 button\{[^}]*var\(--pw1\)/.test(css), "boutons + − Cap 0 aux couleurs du panneau (bleus côté défense)");
// quatre points aux quatre coins de chaque palier
for (let t = 0; t <= 5; t++) for (const cote of ["attack", "defense"]) {
  const m = new RegExp(`\\.${cote} \\.soreal-idle-bt-row-v120\\[data-rang-v1="${t}"\\]:not\\(\\.verrouille\\)::after\\{opacity:1;background:([^}]*)\\}`).exec(css);
  assert.ok(m, "fond du palier " + t + " " + cote);
  for (const pos of ["9px 9px", "calc(100% - 9px) 9px", "9px calc(100% - 9px)", "calc(100% - 9px) calc(100% - 9px)"]) assert.ok(m[1].includes("circle at " + pos), `point ${pos} palier ${t} ${cote}`);
}
// noms sur une ligne, niveau sur une ligne, barres non coupées, pas de reflet qui traverse
assert.ok(/soreal-idle-bt-name-v120\{[^}]*white-space:nowrap/.test(css), "noms sur une seule ligne");
assert.ok(/soreal-idle-bt-level-v120\{[^}]*display:block[^}]*white-space:nowrap/.test(css) && /\.nb-suf[^{]*\{display:inline/.test(css), "le niveau (et son K) sur une ligne");
assert.ok(/soreal-idle-bt-track-v120\{[^}]*clip-path:none/.test(css), "barre jamais coupée aux extrémités");
assert.ok(!/bt-reflet/.test(css) && !/skewX/.test(css), "aucun reflet qui traverse les barres");
assert.equal((css.match(/@keyframes/g) || []).length, 1, "une seule animation : la respiration du dernier palier");
// l'allumage néon de la première ouverture (bt-neon-v1.js) clignote sur TOUTES les lignes : la feuille ne coupe jamais l'animation de la ligne, et l'allumage ne dépend plus d'animations de rang
assert.ok(!/soreal-idle-bt-row-v120(?::not(.verrouille))?{[^}]*animation:none/.test(css) && !/soreal-idle-bt-row-v120.verrouille{[^}]*animation:none/.test(css), "la ligne garde son animation d'allumage néon");
const neon = fs.readFileSync("cloudflare/public/modules/bt-neon-v1.js", "utf8");
assert.ok(!neon.includes("rgSheenV1") && !neon.includes("rgBatV1"), "l'allumage néon joue seul sur les lignes de rang 4 et 5");
// dette CSS : peu de !important
assert.ok((css.match(/!important/g) || []).length <= 20, "peu de !important dans la feuille");
// plus d'émoji devant le nom des barres
const ui = fs.readFileSync("cloudflare/public/modules/ui-entrainement-v1.js", "utf8");
assert.ok(ui.includes("${idleHtml_(skill.name)}") && !ui.includes("ICONES_V1__.avec('basicTraining'"), "nom de la barre sans émoji");
console.log("idle-entrainement-puissance-v1: OK");
