import assert from "node:assert/strict";
import { PAGES_META } from "./_meta-pages.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";

/*
 * Garderie d'objets dans le COFFRE (Norman, 2026-10-30 : « je veux que le coffre ait des emplacements daycare, avec l'animation ; on doit bien voir que ce sont des cases à part »).
 * Le vrai module (modules/daycare-page-v1.js) est rendu à partir d'un vrai snapshot du moteur : verrou (règle n°2), récipients, hauteur du liquide = progression, bouton « Garderie » de la fiche.
 */
const pub = (f) => readFileSync("cloudflare/public/" + f, "utf8");
const numberFormat = { window: {} };
vm.runInNewContext(pub("modules/number-format-v1.js"), numberFormat);
const grand = numberFormat.window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.grandNombre;
const window = {
  __SOREAL_IDLE_REG__: { iconeObjetAdventureIdleV138_: (it) => "<img data-icone=\"" + it.definitionId + "\">" },
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat() { return null; },
    idleHtml_: (v) => String(v == null ? "" : v),
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
    formatGrandNombreIdleV70_: (v, d) => grand(v, d),
    entetePageIdleV28_: (t) => t,
    appelerProgressionIdleCloudflareV1_() {}
  },
  __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: (id) => String(id || "") },
  __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: (v) => String(v == null ? "" : v) },
  document: { getElementById() { return null; } }
};
{
  const bac = { window, document: window.document, SOREAL_SESSION: null };
  vm.runInNewContext(pub("modules/meta-progression-v130.js"), bac);
  for (const f of PAGES_META) vm.runInNewContext(pub("modules/" + f), bac);
}
const G = window.__SOREAL_IDLE_DAYCARE_PAGE_V1__;
assert.equal(typeof G.panneau, "function");
assert.equal(typeof window.__daycareIdleV1__, "function");

const ctx = { bosses: 100 };
const T0 = 1_000_000;
let state = normalizeIdleNguState({}, ctx, T0);
const joueur = (t) => ({ systemes: idleNguSnapshot(state, ctx, t) });

/* 1. Garderie verrouillée : rien du tout (ni cadre, ni texte, ni bouton). */
{
  const j = joueur(T0);
  assert.equal(G.disponible(j), false);
  assert.equal(G.panneau(j), "");
  assert.equal(G.boutonFiche(j, "i1", {}), "");
}

/* 2. Premier emplacement acheté, un objet au sac : un récipient vide, bouton « Garderie » sur la fiche. */
state.currencies.experience = 1000;
state = applyIdleNguAction(state, { action: "buyExpShop", item: "daycareSlot1" }, ctx, T0).state;
const ajout = applyIdleNguAction(state, { action: "adventure", adventure: { action: "addItem", definitionId: "forest:pendant", level: 2 } }, ctx, T0);
state = ajout.state;
const id = ajout.result.id;
{
  const j = joueur(T0);
  assert.equal(G.disponible(j), true);
  const html = G.panneau(j);
  assert.ok(html.includes("gd-cadre"), "cadre à part");
  assert.ok(html.includes("gd-vide"), "récipient vide");
  assert.ok(!/data-gd-id=/.test(html), "aucun objet en garderie");
  assert.ok(!/\/ ?1\b|\/ ?6\b/.test(html.replace(/<[^>]+>/g, " ")), "aucun total de type x / y");
  const bouton = G.boutonFiche(j, id, { locked: false });
  assert.ok(bouton.includes("Garderie") && bouton.includes("daycarePlace") && bouton.includes(id), "action envoyée : daycarePlace sur l'objet");
  assert.ok(bouton.includes("__fermerDetailsObjetAdventureIdleV1__"), "la fiche se ferme");
  assert.ok(!bouton.includes("disabled"), "bouton actif");
  assert.equal(G.boutonFiche(j, id, { locked: true }), "", "objet verrouillé : pas de bouton");
  assert.equal(G.boutonFiche(j, "inconnu", {}), "", "objet non plaçable (équipé, boost, taux inconnu...) : pas de bouton");
}

/* 3. Objet placé, 1 h 30 plus tard : un niveau gagné, le liquide est à la moitié du bocal. */
state = applyIdleNguAction(state, { action: "daycarePlace", itemId: id }, ctx, T0).state;
{
  const j = joueur(T0 + 90 * 60 * 1000);
  const html = G.panneau(j);
  assert.ok(html.includes("data-gd-id=\"" + id + "\""), "récipient plein");
  assert.ok(html.includes("data-icone=\"forest:pendant\""), "l'image de l'objet est dans le bocal");
  assert.ok(html.includes("transform:translateY(50.00%)"), "liquide à 50 % (progression du moteur)");
  assert.ok(html.includes("data-gd-lv=\"3\"") && html.includes("<b class=\"gd-niv-n\">3</b>"), "niveau du moteur");
  assert.ok(html.includes("data-gd-r=\"" + 1 / 3600 + "\""), "vitesse du moteur : 1 niveau par heure");
  assert.ok(html.includes("daycareRemove") && html.includes("Reprendre"));
  assert.ok(!html.includes("gd-vide"), "plus de récipient libre");
  assert.equal(G.boutonFiche(j, "autre", {}), "");
  /* un autre objet au sac, plus aucun emplacement libre : bouton visible mais explicite */
  const autre = applyIdleNguAction(state, { action: "adventure", adventure: { action: "addItem", definitionId: "forest:boots", level: 0 } }, ctx, T0);
  state = autre.state;
  const pleine = G.boutonFiche(joueur(T0 + 90 * 60 * 1000), autre.result.id, { locked: false });
  assert.ok(pleine.includes("Garderie pleine") && pleine.includes("disabled") && pleine.includes("idle-fiche-bouton-large-v1"), "garderie pleine : bouton désactivé, pleine largeur");
  assert.ok(!pleine.includes("daycarePlace"));
}

/* 4. Le liquide (CSS) : arc-en-ciel, ondulation et reflet en boucle d'une période exacte, fondu des bulles, mouvement réduit. */
{
  const m = pub("modules/daycare-page-v1.js");
  for (const c of ["#ff3d3d", "#ffe135", "#4be07b", "#2fb5ff", "#b24bff"]) assert.ok(m.includes(c), "bandes de l'arc-en-ciel : " + c);
  assert.ok(m.includes("mask-size:60px 10px") && m.includes("to{-webkit-mask-position:60px 0"), "l'onde glisse d'exactement une tuile (60 px)");
  assert.ok(m.includes("background-size:90px 100%") && m.includes("to{background-position:90px 0}"), "le reflet glisse d'exactement une tuile (90 px)");
  assert.ok(/@keyframes gd-bulle\{0%\{opacity:0[^}]*\}15%\{opacity:\.8\}85%\{opacity:\.8\}100%\{opacity:0/.test(m), "bulles : fondu d'entrée et de sortie");
  assert.ok(m.includes("prefers-reduced-motion:reduce"), "mouvement réduit coupé");
  assert.ok(m.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__"), "règle n°4 : remise en état juste après un redessin");
  assert.ok(m.includes("requestAnimationFrame") && !/getAnimations|getComputedStyle/.test(m), "règle n°5 : montée calculée, rien lu dans le DOM");
}

/* 5. Câblage : la garderie vit dans le Coffre ouvert (cadre à part), plus de menu autonome. */
{
  const av2 = pub("modules/ui-aventure-2-v1.js");
  const i = av2.indexOf("(ouvert?'<div style=\"margin-top:10px\">'+");
  assert.ok(i > 0 && av2.slice(i, i + 400).includes("__SOREAL_IDLE_DAYCARE_PAGE_V1__.panneau(REG.idleEtat)"), "panneau dans le contenu du Coffre ouvert (jamais dans la partie fermée)");
  assert.ok(av2.includes("__SOREAL_IDLE_DAYCARE_PAGE_V1__.boutonFiche(REG.idleEtat,id,item)"), "bouton Garderie dans la fiche d'objet");
  const nav = pub("modules/ui-navigation-v1.js");
  assert.ok(nav.includes("if(id==='daycare')return false;"), "plus de bouton de menu");
  assert.ok(!pub("soreal-idle-ui.js").includes("daycare:1}"), "plus de menu vivant daycare");
  assert.ok(!pub("modules/ui-menus-v1.js").includes("case 'daycare'"));
  assert.ok(!pub("modules/meta-progression-v130.js").includes("pageDaycareIdleV1_"));
  assert.ok(pub("modules/ui-reglages-v1.js").includes("ids.daycare=true"), "groupe de notes visible seulement si la garderie est débloquée");
}

/* 6. Note de mise à jour : groupe réservé à ceux qui ont la garderie, sans parler du Coffre. */
{
  const notes = pub("modules/release-notes-v1.js");
  const bloc = /\{menu:'daycare'[\s\S]*?\]\},/.exec(notes);
  assert.ok(bloc, "groupe « Garderie » dans la note du jour");
  assert.ok(!/coffre|valise/i.test(bloc[0]), "la note ne nomme pas le Coffre");
  const dico = JSON.parse(pub("modules/traduction-anglais-dict-v1.json"));
  for (const t of ["Garderie", "Garderie pleine", "Emplacement libre", "Placer un objet"]) assert.ok(dico[t], "traduction : " + t);
}
/* 7. Règle du Coffre (moteur) : non maxé => accepté seulement avec un emplacement de garderie libre ; sinon refus lisible et rien ne bouge. */
{
  const coffre = (st, itemId) => applyIdleNguAction(st, { action: "adventure", adventure: { action: "coffreDeposer", id: itemId } }, ctx, T0);
  const ajouter = (st, definitionId, level = 0) => {
    const r = applyIdleNguAction(st, { action: "adventure", adventure: { action: "addItem", definitionId, level } }, ctx, T0);
    return { state: r.state, id: r.result.id };
  };
  /* garderie non débloquée : comportement d'avant (le Coffre ne range que les objets maxés) */
  let v = normalizeIdleNguState({}, ctx, T0);
  let a1 = ajouter(v, "forest:pendant", 3);
  assert.throws(() => coffre(a1.state, a1.id), /OBJET_NON_MAXE/, "garderie verrouillée : refus d'avant, aucune mention de garderie");
  /* une place libre : l'objet non maxé part dans un récipient de garderie */
  v = normalizeIdleNguState({}, ctx, T0);
  v.currencies.experience = 1000;
  v = applyIdleNguAction(v, { action: "buyExpShop", item: "daycareSlot1" }, ctx, T0).state;
  a1 = ajouter(v, "forest:pendant", 3);
  const ok = coffre(a1.state, a1.id);
  assert.equal(ok.state.systems.daycare.data.slots.length, 1, "l'objet est dans un emplacement de garderie");
  assert.equal(ok.state.systems.daycare.data.slots[0].item.id, a1.id);
  assert.ok(!ok.state.adventure.inventory.some((o) => o.id === a1.id), "il a quitté le sac");
  assert.ok(!ok.state.adventure.coffre["forest:pendant"], "pas rangé comme un objet maxé");
  /* plus de place : refus lisible, sac intact, garderie intacte */
  const a2 = ajouter(ok.state, "forest:boots", 0);
  const avant = JSON.stringify([a2.state.adventure.inventory, a2.state.systems.daycare.data]);
  assert.throws(() => coffre(a2.state, a2.id), /DAYCARE_PLEIN/, "garderie pleine : refus clair");
  assert.equal(JSON.stringify([a2.state.adventure.inventory, a2.state.systems.daycare.data]), avant, "rien n'a bougé");
  /* objet maxé : rangé dans le Coffre comme avant, même garderie pleine */
  const t = ajouter(a2.state, "tubaTime", 100);
  const tuba = t.state.adventure.inventory.find((o) => o.id === t.id);
  tuba.power = 1e9; tuba.toughness = 1e9; tuba.special = 1e9;
  const range = coffre(t.state, t.id);
  assert.ok(range.state.adventure.coffre.tubaTime, "objet maxé : rangé dans le Coffre, inchangé");
  assert.equal(range.state.systems.daycare.data.slots.length, 1, "la garderie n'a pas bougé");
}

/* 8. Client : geste « poser sur le Coffre » et phrases. */
{
  const m = pub("modules/daycare-page-v1.js");
  assert.ok(m.includes("function deposerNonMaxe(id)") && m.includes("parler('plein')") && m.includes("window.__jouerNonCoffreIdleV1__()"), "refus animé + phrase {P}");
  assert.ok(m.includes("parler(mode)") && m.includes("it.fullyMaxed?'daycare:max':'daycare'"), "phrase {D} / {M} au placement");
  assert.ok(m.includes("function apresDepotMaxe(){if(disponible("), "phrase {M} seulement si la garderie est débloquée");
  assert.ok(m.includes("if(!d)return false;"),"garderie verrouillée : comportement d'avant");
  const av2 = pub("modules/ui-aventure-2-v1.js");
  assert.ok(av2.includes("__SOREAL_IDLE_DAYCARE_PAGE_V1__.deposerNonMaxe(id)))jouerNonCoffreIdleV1_();"), "le dépôt non maxé passe par la garderie ; sinon refus d'avant");
  assert.ok(av2.includes("__SOREAL_IDLE_DAYCARE_PAGE_V1__.apresDepotMaxe()"));
}
console.log("idle-garderie-coffre-v1 ok");
