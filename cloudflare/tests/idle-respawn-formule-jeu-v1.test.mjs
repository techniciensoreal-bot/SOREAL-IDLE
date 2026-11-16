import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";

/*
 * Respawn des ennemis (audit hors ligne 2026-11-16 ; lu dans le jeu, AdventureController::respawnTime, méthode 140, build 1260) :
 * temps = 4 s x bonus NGU x max(0,2 ; 1 - bonus des objets) x 0,95 (set Horloge) x perk 93 x souhait 46 ; il n'existe AUCUNE constante 0,34 s (le wiki donnait un plancher) et le plafond des objets est
 * le facteur plancher 0,2 (80 %) quelle que soit la difficulté (le wiki donnait 48 / 58 / 78 %). Même formule pour l'ITOPOD hors ligne (kills = secs / (1 + respawnTime())).
 */
const T0 = 1_000_000;
const base = (difficulte) => normalizeIdleNguState({ difficulty: difficulte }, { bosses: 100 }, T0);
const red = (s) => idleNguBonuses(s).respawnReduction;

/* Facteurs multiplicatifs : set Horloge x 0,95, perk 93 (0,1 % par niveau), jamais additifs. */
{
  const s = base("extreme");
  s.adventure.setRewards.respawn = 0.05;
  s.systems.perks.data.levels[93] = 100;
  const attendu = 1 - 0.95 * 0.9;
  assert.ok(Math.abs(red(s) - attendu) < 1e-9, `0,95 x 0,9 : ${red(s)} au lieu de ${attendu}`);
}
/* Aucun plancher de 0,34 s : la réduction n'est plus bridée à 91,5 % (plafond du code, pas du moteur). */
{
  const src = readFileSync("cloudflare/src/idle-ngu-bonus.js", "utf8");
  assert.ok(!/0\.34/.test(src.slice(src.indexOf("function respawnReductionV1"), src.indexOf("export function unlockInfo"))), "pas de plancher 0,34 s");
  const ui = readFileSync("cloudflare/public/modules/ui-aventure-1-v1.js", "utf8");
  assert.ok(!ui.includes("0.915"), "le client ne bride plus la réduction à 91,5 %");
  for (const f of ["idle-ngu-systemes.js", "idle-ngu-snapshot.js"]) assert.ok(!/Math\.max\(0\.34, 4/.test(readFileSync("cloudflare/src/" + f, "utf8")), f + " : respawn sans plancher");
}
/* Plafond des objets identique dans les trois difficultés (80 %). */
{
  const src = readFileSync("cloudflare/src/idle-ngu-bonus.js", "utf8");
  const fn = src.slice(src.indexOf("function respawnReductionV1"), src.indexOf("export function unlockInfo"));
  assert.ok(fn.includes("const cap = 80;"));
  assert.ok(!/extreme[^\n]*78/.test(fn), "plus de plafond 48 / 58 / 78 selon la difficulté");
}
console.log("idle-respawn-formule-jeu-v1 : OK");
