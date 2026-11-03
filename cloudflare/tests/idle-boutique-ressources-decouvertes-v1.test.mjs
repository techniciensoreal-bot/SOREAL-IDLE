import assert from "node:assert/strict";
import fs from "node:fs";
import { advanceIdleNguState, normalizeIdleNguState, applyIdleNguAction, rebirthIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Boutique, anti-spoil des types de ressources (Norman, 2026-11-03) : la magie et la ressource 3 ne sont jamais nommées avant d'être découvertes ; une fois découvertes elles le
 * restent après une Renaissance (la découverte repose sur records.highestBoss, un maximum du compte, jamais sur le compteur de boss du run). Le jeu, lui, reste fidèle au wiki :
 * Blood Magic se referme à la Renaissance et gouverne toujours la production.
 */
const roundTrip = (s) => JSON.parse(JSON.stringify(s));
const snap = (state, ctx, now) => idleNguSnapshot(roundTrip(state), ctx, now);

// 1. Joueur qui n'a jamais atteint la magie : rien dans les listes envoyées.
{
  const ctx = { bosses: 20 };
  const state = normalizeIdleNguState({}, ctx, 0);
  state.currencies.experience = 1e6;
  const s = snap(state, ctx, 1000);
  assert.deepEqual(Object.keys(s.ressourcesDecouvertes), ["energy"]);
  assert.deepEqual(Object.keys(s.resourcePurchases), ["energy"]);
  assert.deepEqual(Object.keys(s.resourcePurchaseUnlock), ["energy"]);
  assert.deepEqual(Object.keys(s.newbieOffers.catalog), ["energy"]);
  assert.ok(!/magic|"r3"|Magic Potion|Resource 3|pomegranate/i.test(JSON.stringify([s.resourcePurchases, s.resourcePurchaseUnlock, s.newbieOffers, s.expShop, s.selloutShop.catalog])), "aucune trace de magie / ressource 3");
  assert.throws(() => applyIdleNguAction(roundTrip(state), { action: "buyResource", resource: "magic", stat: "speed" }, ctx, 1000), /MAGIC_VERROUILLEE/);
  assert.ok(!s.expShop.some((it) => it.id === "syncWandoos"), "Synchro Wandoos cachée sans magie");
}

// 2. Magie atteinte puis Renaissance (le run repart à 0 boss) : la découverte reste, le drapeau de jeu se referme.
{
  const ctx = { bosses: 40 };
  let state = advanceIdleNguState(normalizeIdleNguState({}, ctx, 0), 1, ctx, 1000);
  state.systems.hacks.unlocked = true;
  state.currencies.experience = 1e9;
  assert.equal(state.systems.bloodMagic.unlocked, true, "magie débloquée au boss 37");
  const avant = snap(state, ctx, 1000);
  assert.deepEqual(Object.keys(avant.resourcePurchases).sort(), ["energy", "magic", "r3"]);
  assert.ok(Object.keys(avant.newbieOffers.catalog).every((k) => avant.ressourcesDecouvertes[k]));

  const ctx0 = { bosses: 0 };
  const reborn = rebirthIdleNguState(roundTrip(state), ctx, 4 * 60 * 1000);
  assert.equal(reborn.systems.bloodMagic.unlocked, false, "gameplay inchangé : Blood Magic se referme à la Renaissance");
  assert.ok(reborn.records.highestBoss >= 37, "record du compte conservé");
  const apres = snap(reborn, ctx0, 5 * 60 * 1000);
  assert.deepEqual(Object.keys(apres.ressourcesDecouvertes).sort(), ["energy", "magic", "r3"], "toujours découvertes après la Renaissance");
  assert.deepEqual(Object.keys(apres.resourcePurchases).sort(), ["energy", "magic", "r3"]);
  assert.ok(apres.expShop.length >= 0);
  const achat = applyIdleNguAction(roundTrip(reborn), { action: "buyResource", resource: "magic", stat: "speed" }, ctx0, 5 * 60 * 1000);
  assert.equal(achat.result.resource, "magic");
}

// 3. Client : les textes et rayons passent par la découverte permanente.
{
  const src = fs.readFileSync("cloudflare/public/modules/boutique-exp-page-v1.js", "utf8");
  assert.match(src, /if\(o\.id==='magic'\)return idleExpRessourceDecouverteIdleV1_\(j,m,'magic'\)/);
  assert.match(src, /if\(o\.id==='r3'\)return idleExpRessourceDecouverteIdleV1_\(j,m,'r3'\)/);
  assert.ok(!/menuAnimations:'[^']*(magie|ressource 3)/.test(src), "l'aide des menus animés ne cite plus la magie en dur");
  assert.match(src, /function idleExpAideIdleV1_/);
  const ap = fs.readFileSync("cloudflare/public/modules/ui-aventure-1-v1.js", "utf8");
  assert.match(ap, /ressourcesDecouvertes/);
}
console.log("idle-boutique-ressources-decouvertes-v1: OK");
