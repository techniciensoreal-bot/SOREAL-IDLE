import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";
import { diggerBonuses, diggerViewV1 } from "../src/idle-ngu-systemes.js";
import { IDLE_NGU_DIGGERS } from "../src/idle-ngu-catalogues.js";

/*
 * Norman (2026-11-08) : « remplace les mineurs par les labos dans le jeu ; change le menu Mineurs par Labos ; refais toute la page Labos ». Partie moteur (inchangée : ce sont toujours les Diggers) puis la page des labos.
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
const src = readFileSync("cloudflare/public/modules/labos-page-v1.js", "utf8");
const savants = readFileSync("cloudflare/public/modules/labos-savants-v1.js", "utf8");
const ctx = {
  console, Number, String, Math, Boolean, Array, Object, JSON, isFinite,
  document: { getElementById: () => null, head: { appendChild(el) { ctx.__style = (ctx.__style || "") + (el.textContent || ""); } }, documentElement: { appendChild() {} }, createElement: () => ({}) },
  window: {}
};
ctx.window.__SOREAL_IDLE_META_HOST_V130__ = {
  idleEntier_: (x) => Math.round(Number(x) || 0), idleHtml_: (x) => String(x), formatGrandNombreIdleV70_: (x) => String(x),
  entetePageIdleV28_: (t) => "<head>" + t + "</head>"
};
const donnees = (extra = {}) => ({ state: { unlocked: true, data: { slots: 2, diggers: Object.fromEntries(IDLE_NGU_DIGGERS.map((d) => [d.id, Object.assign({ maxLevel: 0, runLevel: 0, active: false }, extra[d.id] || {})])) } } });
let sys = donnees();
ctx.window.__SOREAL_IDLE_META_PARTAGE_V130__ = { systemeMetaParIdIdleV130_: (j, id) => (id === "diggers" ? sys : { state: { unlocked: true } }) };
vm.runInNewContext(savants, ctx);
vm.runInNewContext(src, ctx);
const M = ctx.window.__SOREAL_IDLE_LABOS_PAGE_V1__;
const joueur = { systemes: { diggerDefinitions: IDLE_NGU_DIGGERS, currencies: { gold: 1e30 }, diggerView: { slots: 2, active: 0, globalPct: 0, grossGps: 10, drain: 0, items: Object.fromEntries(IDLE_NGU_DIGGERS.map((d) => [d.id, { multiplier: 1, drain: 0, nextCost: d.unlockCost, nextDrain: d.drain }])) } } };

// anti-spoil : rien ouvert -> seul le premier étage (4 labos) apparaît, sans nom ni prix des suivants
let h = M.page(joueur);
assert.equal((h.match(/class="lp-labo /g) || []).length, 4, "premier étage seulement");
assert.ok(!/barbe|NGU|EXP|sang|étoiles|garderie/i.test(h.replace(/<svg[\s\S]*?<\/svg>/g, "")), "aucun nom de labo plus profond");
// anti-spoil : jamais l'ensemble des décors, ni les images des labos non affichés
for (const id of ["energyNgu", "magicNgu", "energyBeard", "magicBeard", "pp", "daycare", "blood", "experience"]) assert.ok(!h.includes("decor-" + id), "décor de " + id + " absent de la page");
for (const id of ["drop", "wandoos", "stats", "adventure"]) assert.ok(h.includes("decor-" + id + ".webp"), "décor de " + id + " présent");
assert.ok(!h.includes("decors.webp"), "plus de grand décor commun");
// un labo ouvert dans le premier étage ouvre le suivant
sys = donnees({ drop: { maxLevel: 3, runLevel: 3, active: true } });
h = M.page(joueur);
assert.equal((h.match(/class="lp-labo /g) || []).length, 6, "l'étage suivant apparaît quand le précédent a un labo ouvert");
assert.ok(h.includes("lp-labo on") && h.includes("lp-labo neuf"), "états : au travail / pas ouvert");
assert.ok(h.includes("Mettre au repos") && h.includes("Ouvrir le labo") && h.includes("Améliorer le labo"), "boutons selon l'état");
assert.ok(!h.includes("niveau actif 0 sur"), "pas de niveau 0 affiché pour un labo ouvert");
// seul le labo au travail porte lb-on (savant qui s'anime) ; au repos : pénombre et bras baissés
assert.equal((h.match(/<svg class="lb lb-on"/g) || []).length, 1, "un seul savant au travail");
assert.ok((h.match(/<svg class="lb"/g) || []).length === 5, "les autres sont au repos");
assert.ok(h.includes("<head>Labos</head>"), "le menu s'appelle Labos");
assert.ok(!/Mineur|mineur|pelle|pioche/.test(h.replace(/href="[^"]*"/g, "")), "plus aucun mot de mineur dans la page");

// douze scènes différentes, chacune avec son décor, son savant et sa potion
const ids = IDLE_NGU_DIGGERS.map((d) => d.id);
const svgs = ids.map((id) => M.scene(id, true));
assert.equal(new Set(svgs).size, 12, "douze scènes différentes");
ids.forEach((id, k) => { assert.ok(svgs[k].includes("decor-" + id + ".webp") && svgs[k].includes("lb-deplace"), id + " : son décor et un savant qui marche"); });
assert.equal(M.scene(ids[0], true), M.scene(ids[0], true), "la scène est identique d'un rendu à l'autre (le redessin périodique ne la remplace pas, règle n°4)");
assert.equal(JSON.stringify(M.etages.flatMap((g) => g.ids).sort()), JSON.stringify(ids.slice().sort()), "tous les labos du moteur sont rangés dans un étage");
// le style de la page embarque celui des savants
assert.ok((ctx.__style || "").includes("@keyframes") && (ctx.__style || "").includes(".lb-nuit"), "le style des savants est injecté avec celui de la page");
assert.ok(/prefers-reduced-motion/.test(ctx.__style || ""), "mouvement réduit respecté");
// cadre : toute la scène est le cadre du labo, nom et boutons posés par-dessus
assert.ok(src.includes(".lp-poste{position:absolute;inset:0}") && src.includes(".lp-hautb,.lp-basb{position:absolute;") && src.includes("aspect-ratio:316/268"), "le dessin remplit le cadre (316 : 268), nom et boutons par-dessus");
assert.ok(h.indexOf('class="lp-poste"') < h.indexOf('class="lp-hautb"') && h.indexOf('class="lp-hautb"') < h.indexOf('class="lp-basb"'), "décor dessous, nom en haut, boutons en bas");
assert.ok(src.includes("var P='html body.soreal-idle-active-v47.soreal-idle-active-v47 ';") && src.includes("Bangers"), "polices du jeu avec la spécificité de la page");
console.log("idle-labos-page-v1: OK");
