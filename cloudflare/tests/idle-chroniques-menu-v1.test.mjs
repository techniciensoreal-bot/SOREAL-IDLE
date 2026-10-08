import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Chroniques (Norman, 2026-10-08) : Collection, Classement et Succès réunis dans UN menu, pour avoir le moins de menus possible.
 * Onglets seulement pour ce qui est débloqué (règle n°2), un onglet seul = pas de barre, l'habillage suit l'onglet, une seule animation, plus de point rouge.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const notes = readFileSync("cloudflare/public/modules/release-notes-v1.js", "utf8");

const bloc = ui.slice(ui.indexOf("const IDLE_MENUS_V1=["), ui.indexOf("];", ui.indexOf("const IDLE_MENUS_V1=[")));
const ids = [...bloc.matchAll(/\{id:'([A-Za-z]+)'/g)].map((m) => m[1]);
assert.ok(ids.includes("chroniques") && !ids.includes("bestiaire") && !ids.includes("classement") && !ids.includes("succes"), "un seul bouton de menu remplace les trois");
assert.ok(/if\(id==='bestiaire'\|\|id==='classement'\|\|id==='succes'\)return false;/.test(ui), "les anciens boutons ne sont plus jamais disponibles");
assert.ok(ui.includes("if(id==='chroniques')return chroniquesOngletsIdleV1_(j).length>0;"), "le menu n'existe que si un des trois est débloqué");

// Onglets : seulement ceux qui sont débloqués, et logique de déblocage inchangée.
const fn = ui.slice(ui.indexOf("function chroniquesOngletsIdleV1_(j){"), ui.indexOf("function chroniquesOngletActifIdleV1_(j){"));
assert.ok(fn.includes("j.bestiaire&&j.bestiaire.debloquee") && fn.includes("j.classement&&j.classement.debloque") && fn.includes("menuSuccesVisibleIdleV1_(j)"), "chaque onglet garde son verrou d'origine");
const onglets = new Function("menuSuccesVisibleIdleV1_", fn + "\nreturn chroniquesOngletsIdleV1_;")((j) => Boolean(j.succes));
assert.deepEqual(onglets({}).map((o) => o.id), [], "rien de débloqué : aucun onglet (anti-spoil)");
assert.deepEqual(onglets({ classement: { debloque: true } }).map((o) => o.id), ["classement"]);
assert.deepEqual(onglets({ bestiaire: { debloquee: true }, classement: { debloque: true }, succes: true }).map((o) => o.id), ["bestiaire", "classement", "succes"]);
assert.ok(ui.includes("onglets.length>1\n          ?'<div class=\"soreal-idle-chroniques-onglets-v1\""), "pas de barre d'onglets pour un seul onglet");

// L'habillage suit l'onglet affiché ; les anciens identifiants ouvrent Chroniques.
assert.ok(ui.includes('data-menu="${idleHtml_(menuStyleIdleV1_(j))}"'), "data-menu = onglet affiché");
assert.ok(ui.includes("if(menu==='bestiaire'||menu==='classement'||menu==='succes'){") && ui.includes("ancien==='bestiaire'||ancien==='classement'||ancien==='succes'?'chroniques'"), "anciens menus mémorisés ou ciblés = Chroniques");
assert.ok(ui.includes("IDLE_MENU_PAR_SYSTEME_V1.achievements='chroniques'") && ui.includes("menuCible:'chroniques'"), "popups de déblocage mènent à Chroniques");

// Une seule animation (celle de Chroniques) ; les trois anciennes ont disparu.
assert.ok(css.includes('.alimente-v1[data-effet-v1="chroniques"] .soreal-idle-nav-emoji-v2{animation:sorealAlChroniquesPageV1'), "animation de Chroniques");
for (const id of ["succes", "classement", "bestiaire"]) assert.ok(!css.includes(`.alimente-v1[data-effet-v1="${id}"]`), "plus d'animation pour " + id);

// Notes de version : un seul regroupement.
assert.ok(notes.includes("Moins de menus :") && notes.includes("« Chroniques »"), "note de version du compactage");
console.log("idle-chroniques-menu-v1: OK");
