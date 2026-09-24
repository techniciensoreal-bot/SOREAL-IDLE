import assert from "node:assert/strict";
import {
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47
} from "../src/idle-adventure-v47.js";

/*
 * 2026-09-24 — audit des pages-guides. New Player Guide (Truth) : Wandoos 98 est « a guaranteed
 * drop from the first two Titans » ; pages GRB et Grand Corrupted Tree (infobox + Loot) :
 * « A busted copy of Wandoos 98 - guaranteed ». Avant : une seule copie (niveau 1) au tout
 * premier kill de GRB, jamais rien du Grand Corrupted Tree.
 */

function tirage(valeur, fn) {
  const avant = Math.random;
  Math.random = () => valeur;
  try { return fn(); } finally { Math.random = avant; }
}
const PLUS_RIEN = 0.999999;
const TOUT = 0;

function combat(etat, id, ctx, valeur, t = 1000) {
  return tirage(valeur, () => applyIdleAdventureActionV47(etat, { action: "titan", titan: id }, ctx, t));
}
const copies = (r) => r.result.drops.filter((d) => d.definitionId === "wandoos98");

// ---- GRB : une copie à chaque kill, niveau 1 (80 %) ou 2-4 (20 % base chance) ----
{
  const ctx = { bosses: 58, stats: { power: 1300, toughness: 1300 } };
  let etat = normalizeIdleAdventureStateV47({});
  const r1 = combat(etat, "t1", ctx, PLUS_RIEN);
  assert.equal(copies(r1).length, 1, "1er kill : exactement une copie (plus de doublon)");
  assert.equal(copies(r1)[0].level, 1, "jet des 20 % raté : niveau 1");
  assert.equal(r1.state.unlockItems.wandoos98, true, "le 1er kill débloque toujours Wandoos");

  const r2 = combat(r1.state, "t1", ctx, PLUS_RIEN, 1000 + 3600000);
  assert.equal(copies(r2).length, 1, "2e kill : encore une copie garantie");

  const r3 = combat(normalizeIdleAdventureStateV47({}), "t1", ctx, TOUT);
  assert.equal(copies(r3).length, 1);
  assert.equal(copies(r3)[0].level, 2, "jet des 20 % réussi : niveau 2-4 (tirage 0 -> 2)");
  const r4 = combat(normalizeIdleAdventureStateV47({}), "t1", ctx, 0.19);
  assert.ok(copies(r4)[0].level >= 2 && copies(r4)[0].level <= 4, "niveau dans 2-4");
}

// ---- Grand Corrupted Tree : une copie à chaque kill, niveau 3-7 ----
{
  const ctx = { bosses: 66, stats: { power: 6000, toughness: 5000 } };
  const etat = normalizeIdleAdventureStateV47({});
  etat.titans.t1 = { kills: 24, nextAt: 0 };
  etat.unlockFlags.ngu = true;
  const bas = combat(etat, "t2", ctx, TOUT);
  assert.equal(copies(bas).length, 1, "GCT : une copie garantie");
  assert.equal(copies(bas)[0].level, 3, "borne basse 3");
  const etat2 = normalizeIdleAdventureStateV47({});
  etat2.titans.t1 = { kills: 24, nextAt: 0 };
  etat2.unlockFlags.ngu = true;
  const haut = combat(etat2, "t2", ctx, PLUS_RIEN);
  assert.equal(copies(haut).length, 1);
  assert.equal(copies(haut)[0].level, 7, "borne haute 7");
}

console.log("idle-titan-wandoos98-guaranteed OK");
