import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Titans fusionnés avec Adventure (Norman, 2026-10-08) : plus de bouton de menu « Titans » ; un bouton « Titans » au-dessus des zones, dans la page Adventure, ouvre
 * la page des titans (cartes avec image, stats, compte à rebours, Affronter), et le bouton « Aventure » ramène aux zones. Aucun titan débloqué = aucun bouton (anti-spoil).
 * Un ancien menu mémorisé « titans » ouvre Adventure.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const mod = readFileSync("cloudflare/public/modules/titans-v1.js", "utf8");

assert.ok(/if\(id==='titans'\)return false;/.test(ui), "le menu Titans n'est jamais disponible");
assert.ok(/IDLE_MENU_PAR_SYSTEME_V1\.titans='aventure'/.test(ui), "le système Titans mène à Adventure");
assert.ok(/ancien==='titans'\?'aventure'/.test(ui), "un menu mémorisé « titans » ouvre Adventure");
assert.ok(/__SOREAL_IDLE_TITANS_V1__\.section\(j\)/.test(ui), "la page Adventure affiche la page des titans dans sa vue Titans");
assert.ok(/const bascule=titans\.length\?/.test(ui), "bouton de bascule seulement s'il y a un titan débloqué");
assert.ok(ui.includes("window.__vueAventureIdleV1__=function(v)"), "changement de vue exposé");
assert.ok(ui.indexOf("const bascule=")<ui.indexOf("🗺️ Zones</div>"), "la bascule est au-dessus de Zones");
assert.ok(mod.includes("__vueAventureIdleV1__('zones')"), "Affronter ramène à la vue des zones pour voir le combat");

const section = mod.slice(mod.indexOf("function section(j){"), mod.indexOf("/* ---------- interactions"));
assert.ok(section.includes("progressionUnlocked!==false"), "seuls les titans débloqués");
assert.ok(section.includes("if(!titans.length)return '';"), "aucun titan débloqué : section vide");
assert.ok(!section.includes("entetePageIdleV28_"), "pas d'en-tête de page dans la section");
assert.ok(/window\.__SOREAL_IDLE_TITANS_V1__=\{page:page,section:section,/.test(mod), "section exportée");

// L'animation du menu Adventure reprend celle de l'ancien menu Titans (un titan prêt à affronter).
const anime = ui.slice(ui.indexOf("function idleMenuEtatAnimeIdleV1_"), ui.indexOf("if(id==='renaissance'", ui.indexOf("function idleMenuEtatAnimeIdleV1_")));
assert.ok(anime.includes("a.titans.some("), "Adventure s'anime quand un titan est prêt");
console.log("idle-titans-dans-aventure-v1: OK");
