import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { defiTropTotV1 } from "../src/idle-ngu-snapshot.js";

/*
 * Norman (2026-10-28) : « Défis ne doit apparaître qu'après 3 minutes. Ça fait un rebirth et ça n'est pas autorisé avant 3 minutes. »
 * Lancer un défi fait renaître (wiki NGU, page Challenges) : le menu n'existe pas tant que le run n'a pas duré le minimum d'un Rebirth (180 s, moins le souhait 20), et le serveur refuse le lancement avant.
 */
const T0 = 1_000_000;
const frais = (secondes) => {
  const s = normalizeIdleNguState({}, { bosses: 100 }, T0);
  s.systems.challenges.unlocked = true;
  s.records.highestBoss = 100;
  for (const t of ["t2", "t3", "t4"]) s.adventure.titans[t] = Object.assign({}, s.adventure.titans[t], { kills: 1 });
  s.adventure.itemList = s.adventure.itemList || {};
  for (const slot of ["head", "chest", "legs", "boots", "weapon", "necklace", "meat"]) s.adventure.itemList["grb:" + slot] = { seen: true };
  s.challenge.bestMs = { basic: 1000 };
  s.runStartedAt = T0 - secondes * 1000;
  return s;
};

assert.equal(defiTropTotV1(frais(100), T0), true, "100 s de run : trop tôt");
assert.equal(defiTropTotV1(frais(179), T0), true, "179 s : trop tôt");
assert.equal(defiTropTotV1(frais(180), T0), false, "180 s : le menu apparaît");
assert.equal(defiTropTotV1(frais(600), T0), false);

/* le lancement refusé avant 3 minutes est vérifié dans idle-defi-lancement-rebirth-v1 (action du joueur) */
const ok = applyIdleNguAction(frais(200), { action: "challenge", mode: "start", challenge: "basic" }, { bosses: 100 }, T0).state;

/* un défi déjà en cours garde son menu (pour pouvoir l'arrêter), même juste après le lancement (run remis à zéro) */
assert.equal(defiTropTotV1(ok, T0 + 1000), false, "défi actif : menu conservé");
const arrete = applyIdleNguAction(ok, { action: "challenge", mode: "stop" }, { bosses: 100 }, T0 + 2000).state;
assert.equal(defiTropTotV1(arrete, T0 + 3000), true, "défi arrêté juste après le lancement : le run est neuf, le menu repart");

/* le menu n'est jamais annoncé tôt : nom, icône et pistes absents du snapshot (anti-spoil, règle n°2) */
const snap = readFileSync("cloudflare/src/idle-ngu-snapshot.js", "utf8");
assert.ok(readFileSync("cloudflare/src/idle-runtime-actions.js", "utf8").includes("code:'DEFI_TROP_TOT'"), "refus au lancement dans l'action du joueur");
assert.ok(snap.includes('const ferme = !state.systems[def.id]?.unlocked || (def.id === "challenges" && defiTropTotV1(state, now));'), "menu fermé côté client avant 3 minutes");
console.log("idle-defis-apres-3-minutes-v1: OK");
