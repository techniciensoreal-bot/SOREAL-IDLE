import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";
import { instantaneJoueurV1, evenementsV1 } from "../src/idle-flux-v1.js";

/*
 * Norman (2026-10-28) : « dans En direct, quand quelqu'un tue un boss : Sébastien a battu Ent après 3 essais (le nombre de fois qu'il a cliqué sur Fight pour enfin le tuer dans sa partie) ».
 * Le moteur compte un essai à chaque combat de boss qui démarre ; le fil annonce ce compte à la première victoire sur ce boss ; la phrase dit « a battu … après N essais » (« du premier coup » pour un seul).
 */
const lireStats = (g) => {
  const ligne = JSON.parse(g.sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=2")[0].row_json);
  return JSON.parse(ligne.find((x) => typeof x === "string" && x.includes("combatBossActif")));
};

/* 1. Le moteur : un essai par combat qui démarre (Fight), pas par arrêt ni double clic. */
const g = creerJoueurExterneV1("essais@example.com");
g.op("obtenirEtatSorealIdle", "x");
g.op("definirPseudoSorealIdle", "x", "Essais");
assert.deepEqual({ ...(lireStats(g).fluxEssais || {}) }, {}, "aucun essai au départ");
g.op("definirCombatBossSorealIdle", "x", true, "manuel");
assert.deepEqual({ ...lireStats(g).fluxEssais }, { 1: 1 }, "un clic sur Fight : un essai sur le boss 1");
g.op("definirCombatBossSorealIdle", "x", true, "manuel");
assert.equal(lireStats(g).fluxEssais[1], 1, "un double clic sur Fight ne compte pas deux fois");
g.op("definirCombatBossSorealIdle", "x", false, "fuite");
g.op("definirCombatBossSorealIdle", "x", true, "manuel");
assert.equal(lireStats(g).fluxEssais[1], 2, "un nouveau clic après une fuite : deuxième essai");
g.op("definirCombatBossSorealIdle", "x", false, "fuite");
g.op("definirCombatBossSorealIdle", "x", true, "manuel");
assert.equal(lireStats(g).fluxEssais[1], 3, "troisième essai");

/* 2. Le fil : l'instantané porte les essais ; l'événement « boss » les annonce à la première victoire. */
const avant = instantaneJoueurV1({ bossVaincus: 0, stats: { fluxEssais: { 1: 3 } } });
assert.deepEqual({ ...avant.bossEssais }, { 1: 3 });
const apres = Object.assign({}, avant, { bossMax: 1 }); avant.bossMax = 0;
const ev = evenementsV1(avant, apres, { boss: () => "Ent" });
assert.equal(ev.length >= 1 && ev[0].type, "boss");
assert.equal(ev[0].donnees.essais, 3, "l'événement porte le nombre d'essais");
const sans = evenementsV1(Object.assign({}, avant, { bossMax: 0 }), Object.assign({}, avant, { bossMax: 2, bossEssais: {} }), {});
assert.ok(!("essais" in sans[0].donnees), "boss tué sans essais connus (NUKE) : pas d'essais annoncés");

/* 3. La phrase côté lecteur. */
const flux = readFileSync("cloudflare/public/modules/flux-v1.js", "utf8");
assert.ok(flux.includes("' après '+essais+' essais'") && flux.includes("' du premier coup'") && flux.includes("' a battu'") && flux.includes("' as battu'"), "phrase « a battu … après N essais »");
assert.ok(flux.includes("(nomBoss||'un boss')"), "anti-spoil : un boss que le lecteur n'a pas atteint reste « un boss »");
const moteur = readFileSync("cloudflare/src/idle-runtime-combat.js", "utf8");
assert.ok(moteur.includes("stats.fluxEssais=essais") && moteur.includes(".slice(6)"), "compteur par boss, six boss gardés");
console.log("idle-flux-essais-boss-v1: OK");
