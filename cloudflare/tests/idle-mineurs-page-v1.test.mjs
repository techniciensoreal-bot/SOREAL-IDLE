import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";
import { diggerBonuses, diggerViewV1 } from "../src/idle-ngu-systemes.js";
import { IDLE_NGU_DIGGERS } from "../src/idle-ngu-catalogues.js";

/*
 * Norman (2026-10-27) : « on va retravailler complètement le menu Mineurs d'or ; il faut que ce soit représentatif de ce que ça fait ; chaque dessin adapté à ce que ça fait, original ; les ouvriers ont des pelles, pas des pioches ;
 * il faut qu'ils aient l'air de travailler, pas juste la pelle. »
 */

// --- moteur : la vue donne EXACTEMENT les multiplicateurs que le moteur applique ---
{
  const state = normalizeIdleNguState({}, {}, 1_000_000);
  assert.equal(diggerViewV1(state), null, "anti-spoil : aucune vue tant que le système n'est pas découvert");
  state.systems.diggers.unlocked = true;
  const d = state.systems.diggers.data.diggers;
  d.drop.maxLevel = d.drop.runLevel = 40; d.drop.active = true;
  d.stats.maxLevel = d.stats.runLevel = 7; d.stats.active = true;
  d.adventure.maxLevel = d.adventure.runLevel = 9; // au repos
  const vue = diggerViewV1(state);
  const bonus = idleNguBonuses(state);
  const fait = diggerBonuses(state);
  assert.ok(Math.abs(vue.items.drop.multiplier - fait.drop) < 1e-9, "chance de drop : le même chiffre que le moteur");
  assert.ok(Math.abs(vue.items.stats.multiplier - fait.stats) < 1e-9, "stats : le même chiffre que le moteur");
  assert.ok(vue.items.adventure.multiplier > 1 && fait.adventure === 1, "un mineur au repos annonce ce qu'il donnerait, sans rien appliquer");
  assert.equal(vue.items.wandoos.multiplier, 1);
  assert.equal(Object.keys(vue.items).length, IDLE_NGU_DIGGERS.length);
  assert.ok(vue.items.drop.nextCost > 0 && vue.items.drop.drain > 0 && vue.slots >= 1 && vue.active === 2);
  assert.ok(vue.drain === bonus.diggerDrainGoldPerSecond, "le drain est celui du moteur");
}

// --- page : le vrai module dans un faux navigateur ---
const src = readFileSync("cloudflare/public/modules/mineurs-page-v1.js", "utf8");
const ctx = {
  console, Number, String, Math, Boolean, Array, Object, JSON, isFinite,
  document: { getElementById: () => ({}), head: { appendChild() {} }, documentElement: { appendChild() {} }, createElement: () => ({}) },
  window: {}
};
ctx.window.__SOREAL_IDLE_META_HOST_V130__ = {
  idleEntier_: (x) => Math.round(Number(x) || 0), idleHtml_: (x) => String(x), formatGrandNombreIdleV70_: (x) => String(x),
  entetePageIdleV28_: (t) => "<head>" + t + "</head>"
};
const donnees = (extra = {}) => ({ state: { unlocked: true, data: { slots: 2, diggers: Object.fromEntries(IDLE_NGU_DIGGERS.map((d) => [d.id, Object.assign({ maxLevel: 0, runLevel: 0, active: false }, extra[d.id] || {})])) } } });
let sys = donnees();
ctx.window.__SOREAL_IDLE_META_PARTAGE_V130__ = { systemeMetaParIdIdleV130_: (j, id) => (id === "diggers" ? sys : { state: { unlocked: true } }) };
vm.runInNewContext(src, ctx);
const M = ctx.window.__SOREAL_IDLE_MINEURS_PAGE_V1__;
const joueur = { systemes: { diggerDefinitions: IDLE_NGU_DIGGERS, currencies: { gold: 1e30 }, diggerView: { slots: 2, active: 0, globalPct: 0, grossGps: 10, drain: 0, items: Object.fromEntries(IDLE_NGU_DIGGERS.map((d) => [d.id, { multiplier: 1, drain: 0, nextCost: d.unlockCost, nextDrain: d.drain }])) } } };

// anti-spoil : rien engagé -> seule la première galerie (4 mineurs) apparaît, sans prix des suivantes
let h = M.page(joueur);
assert.equal((h.match(/class="mn-gal /g) || []).length, 4, "première galerie seulement");
assert.ok(!h.includes("barbe") && !h.includes("NGU") && !h.includes("EXP"), "aucun nom de mineur plus profond");
// un mineur engagé dans la galerie du haut ouvre la suivante
sys = donnees({ drop: { maxLevel: 3, runLevel: 3, active: true } });
h = M.page(joueur);
assert.equal((h.match(/class="mn-gal /g) || []).length, 6, "la galerie suivante apparaît quand la précédente a un mineur engagé");
assert.ok(h.includes("mn-gal on") && h.includes("mn-gal neuf"), "états : au travail / pas engagé");
assert.ok(h.includes("Mettre au repos") && h.includes("Engager"), "boutons selon l'état");
assert.ok(!h.includes("niveau actif 0 sur"), "pas de niveau 0 affiché pour un mineur engagé");

// dessins : douze ouvriers, chacun son décor, une pelle (jamais de pioche) et un geste
const ids = IDLE_NGU_DIGGERS.map((d) => d.id);
const svgs = ids.map((id) => M.scene(id));
assert.equal(new Set(svgs).size, 12, "douze dessins différents");
for (const [i, s] of svgs.entries()) {
  assert.ok(s.includes("dg-b") && s.includes("dg-t") && s.includes('class="dg-pelletee"'), ids[i] + " : un ouvrier qui se penche, balance la pelle et la charge");
  assert.ok(s.includes("dg-j1") && s.includes("dg-j2") && s.includes("dg-j3"), ids[i] + " : ce qu'il rapporte vole vers le tas");
  assert.ok(!/pioche/i.test(s), ids[i] + " : pas de pioche");
}
assert.ok(!/pioche/i.test(src.replace(/Norman[^\n]*\n/g, "").replace(/\/\*[\s\S]*?\*\//g, "")), "le code ne dessine aucune pioche");
// décors propres
const aSon = (id, motif) => assert.ok(M.scene(id).includes(motif), id + " : " + motif);
aSon("drop", "dg-couvercle"); aSon("wandoos", "dg-ecran"); aSon("stats", "dg-b1"); aSon("adventure", "dg-aiguille");
aSon("energyNgu", "dg-eclairs"); aSon("magicNgu", "dg-cristal"); aSon("energyBeard", "dg-barbe"); aSon("magicBeard", "dg-barbe");
aSon("pp", "dg-sac"); aSon("daycare", "dg-bebe"); aSon("blood", "dg-goutte"); aSon("experience", "dg-anneau");

// animations : seulement transform et opacité, une seule période, mouvement réduit coupé
const css = src.slice(src.indexOf("s.textContent=["));
assert.ok(!/(left|top|width|height|background-position)\s*:[^;']*;[^']*animation/.test(css), "pas d'animation de mise en page");
assert.ok(!/@keyframes[^{]+\{[^}]*\{[^}]*(left|top|width|height|background-position):/.test(css), "les keyframes ne touchent que transform et opacity");
assert.equal((css.match(/1\.8s/g) || []).length >= 20, true, "une seule période de 1,8 s");
assert.ok(css.includes("prefers-reduced-motion:reduce"), "mouvement réduit : tout est immobile");
assert.ok(src.includes("var P='html body.soreal-idle-active-v47.soreal-idle-active-v47 ';") && css.includes("Bangers"), "polices du jeu avec la spécificité de la page");
// cadre : toute la scène est le cadre du mineur, nom et boutons posés par-dessus le décor (Norman, 2026-10-27)
assert.ok(src.includes(".mn-poste{position:absolute;inset:0}") && src.includes(".mn-hautb,.mn-basb{position:absolute;"), "le dessin remplit le cadre, nom et boutons par-dessus");
assert.ok(h.indexOf('class="mn-hautb"') > 0 && h.indexOf('class="mn-hautb"') < h.indexOf('class="mn-basb"'), "nom et effet en haut, boutons en bas");
assert.ok(h.indexOf('class="mn-poste"') < h.indexOf('class="mn-hautb"'), "le décor est dessous");
console.log("idle-mineurs-page-v1: OK");
