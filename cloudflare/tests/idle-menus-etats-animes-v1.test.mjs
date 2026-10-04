import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-03) : Aventure animée quand on farme (pas en zone sûre), Renaissance quand le prochain NUMBER dépasse celui du dernier Rebirth, Défis quand un défi est actif, Titans quand un titan est prêt, Succès non vus,
 * Shop / Classement / Collection / Chat / Réglages tant qu'on les consulte. Et sur TV : tous les menus de gauche visibles sans défiler.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");

const debut = ui.indexOf("const IDLE_MENUS_ETATS_V1=");
const fin = ui.indexOf("function actualiserNavAlimenteIdleV1_");
assert.ok(debut > 0 && fin > debut);
const idleNombre_ = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
let menuActif = "combat";
const stockage = {};
globalThis.localStorage = { getItem: (k) => (k in stockage ? stockage[k] : null), setItem: (k, v) => { stockage[k] = String(v); } };
const aventureMetaIdleV47_ = (j) => (j && j.systemes && j.systemes.adventure) || null;
const heureServeurIdleV1_ = () => 1_000_000;
const fabrique = new Function("idleNombre_", "aventureMetaIdleV47_", "heureServeurIdleV1_", "IDLE_SYSTEME_PAR_MENU_V1", "lireMenu",
  "let idleMenuActifV28;\nObject.defineProperty(this,'x',{});\n" + ui.slice(debut, fin).replace(/idleMenuActifV28/g, "lireMenu()") + "\nreturn idleMenuAlimenteV1_;");
const animeBrut = fabrique.call({}, idleNombre_, aventureMetaIdleV47_, heureServeurIdleV1_, {}, () => menuActif);
/* Depuis 2026-10-04 : animations seulement avec l'achat « Menus animés » (j.menusAnimes), supposé acheté ci-dessous. */
const anime = (menu, j) => animeBrut(menu, Object.assign({ menusAnimes: true }, j));
assert.equal(animeBrut("aventure", { systemes: { adventure: { selectedZone: "forest" } } }), false, "sans l'achat : aucune animation");

// Aventure : on farme dans une zone (pas en zone sûre).
assert.equal(anime("aventure", { systemes: { adventure: { selectedZone: "forest" } } }), true);
assert.equal(anime("aventure", { systemes: { adventure: { selectedZone: "safe" } } }), false, "zone sûre : pas de farm");
// Renaissance : le prochain NUMBER dépasse celui du dernier Rebirth.
assert.equal(anime("renaissance", { systemes: { rebirth: { number: 100, nextNumber: 250 } } }), true);
assert.equal(anime("renaissance", { systemes: { rebirth: { number: 100, nextNumber: 100 } } }), false);
assert.equal(anime("renaissance", { systemes: { rebirth: { number: 100, nextNumber: 40 } } }), false);
// Défis : un défi actif.
assert.equal(anime("challenges", { systemes: { challenge: { active: "basic" } } }), true);
assert.equal(anime("challenges", { systemes: { challenge: { active: "" } } }), false);
// Titans : un titan prêt (débloqué, pas caché, délai écoulé).
const titans = (liste) => ({ systemes: { adventure: { titans: liste } } });
assert.equal(anime("titans", titans([{ id: "t1", progressionUnlocked: true, state: { nextAt: 0 } }])), true);
assert.equal(anime("titans", titans([{ id: "t1", progressionUnlocked: true, state: { nextAt: 2_000_000 } }])), false, "réapparition pas encore passée");
assert.equal(anime("titans", titans([{ id: "t1", progressionUnlocked: true, state: { nextAt: 0, hiddenPanel: true } }])), false, "titan caché");
assert.equal(anime("titans", titans([{ id: "t1", progressionUnlocked: false, state: {} }])), false, "pas débloqué : rien (anti-spoil)");
// Succès non vus : la première visite considère l'existant comme vu ; un nouveau succès anime le menu jusqu'à l'ouverture du menu.
const succes = (ids) => ({ systemes: { achievements: { list: ids.map((id) => ({ id, unlocked: true })) } } });
assert.equal(anime("succes", succes(["a", "b"])), false, "première visite : tout est vu");
assert.equal(anime("succes", succes(["a", "b"])), false);
assert.equal(anime("succes", succes(["a", "b", "c"])), true, "nouveau succès non vu");
menuActif = "succes";
assert.equal(anime("succes", succes(["a", "b", "c"])), false, "on regarde le menu Succès : vus");
menuActif = "combat";
assert.equal(anime("succes", succes(["a", "b", "c"])), false, "et ils le restent");
// Menus consultés : animés seulement quand ils sont ouverts.
for (const id of ["shop", "classement", "bestiaire", "chat", "parametres"]) {
  menuActif = "combat";
  assert.equal(anime(id, {}), false, id + " fermé");
  menuActif = id;
  assert.equal(anime(id, {}), true, id + " ouvert");
}

// CSS : un effet propre à chacun de ces menus.
for (const id of ["aventure", "renaissance", "challenges", "titans", "succes", "shop", "classement", "bestiaire", "chat", "parametres"]) {
  assert.ok(css.includes(`.alimente-v1[data-effet-v1="${id}"]`), "effet de " + id);
}
// TV : au moins 1800 x 1000, deux colonnes de cartes compactes, aucun défilement.
const tv = css.slice(css.indexOf("@media (min-width:1800px) and (min-height:1000px){"));
assert.ok(tv.includes("grid-template-rows:repeat(var(--nav-lignes,17),auto);grid-template-columns:repeat(2,minmax(0,1fr))"));
assert.ok(tv.includes("overflow:visible!important;max-height:none!important"), "plus de menu déroulant");
assert.ok(tv.includes("grid-auto-flow:column"), "lecture de haut en bas");
console.log("idle-menus-etats-animes-v1: OK");
