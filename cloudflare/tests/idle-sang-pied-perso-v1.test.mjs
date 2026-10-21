import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-21) : le pied de la sangsue décollé de la table (le redessin de la page réécrit le style de la scène : --sg-* perdues, clé de mesure inchangée) ; le personnage apparaît au lieu de glisser (image pas chargée / en échec). */
const s = readFileSync(new URL("../public/modules/sang-rituel-decor-v1.js", import.meta.url), "utf8");
assert.match(s, /__traceCle===cle&&[^;]*getPropertyValue\('--sg-socle-h'\)[^;]*getPropertyValue\('--sg-ox'\)\)return;/, "la mesure est reposée si les variables ont disparu");
assert.match(s, /APRES_REDESSIN_V1__\|\|\[\]\)\.push\(function\(\)\{var l=document\.querySelectorAll\('\.bm-scene\[data-source="sucon"\]'\)[^]*?sangTrace\(/, "les variables sont remises juste après un redessin");
assert.match(s, /horsVoulu=true;\}\s*\n\s*var etaitHors=/, "le personnage n'entre qu'une fois son image chargée");
assert.match(s, /__bmEssais[^]*?bm-perso|bm-perso[^]*?__bmEssais/, "image du personnage en échec redemandée");

/* Norman (2026-10-21, suite) : la boule repart tout de suite où elle était figée ; le personnage glisse aussi au premier affichage ; la succion, elle, attend le personnage. */
assert.ok(s.includes("sangsue(sc,sec>0?sec:(progresse?(secVue[id]||0):0),progresse);"), "la boule n'attend plus l'arrivée du personnage");
assert.ok(s.includes("SOURCES[opts.id]==='sucon'&&etatHors[opts.id]===undefined"), "premier affichage : scène hors champ");
assert.ok(s.includes("avantHors===undefined&&etaitHors&&src==='sucon'"), "premier affichage : échéance d'installation");
assert.ok(s.includes("!sc.classList.contains('bm-hors')&&sc.classList.contains('bm-installe');"), "la succion attend le personnage");
console.log("idle-sang-pied-perso-v1: OK");
