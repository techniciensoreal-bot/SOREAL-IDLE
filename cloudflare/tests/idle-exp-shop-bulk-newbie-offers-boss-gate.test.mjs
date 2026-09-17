import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  rebirthIdleNguState,
  idleNguSnapshot,
  IDLE_NGU_RESOURCE_PURCHASES,
  IDLE_NGU_NEWBIE_OFFERS,
  IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1
} from "../src/idle-ngu-progression.js";

/*
 * Norman a envoyé une capture d'écran du vrai "Spend EXP" NGU (2026-09-17) :
 * - achats en lot (+1/+10/+100 EXP, montant personnalisé) au lieu d'un
 *   achat unitaire unique ;
 * - "Newbie Offers" : trois achats Energy Speed à usage unique (1 EXP->0.2,
 *   2 EXP->0.3, 3 EXP->0.4), qui disparaissent définitivement une fois
 *   achetés ;
 * - Power/Cap restent verrouillés ("REACH BOSS 17 FOR MORE PURCHASES
 *   HERE!") tant que le boss du run courant n'a pas atteint 17 — le même
 *   seuil déjà vérifié pour Augmentations (IDLE_NGU_SYSTEMS).
 *
 * Ce fichier verrouille ces trois mécaniques.
 */

function freshState(experience, context = {}, now = Date.now()) {
  const state = normalizeIdleNguState({}, context, now);
  state.currencies.experience = experience;
  state.systems.bloodMagic.unlocked = true;
  state.systems.hacks.unlocked = true;
  return state;
}

function roundTrip(state) {
  return JSON.parse(JSON.stringify(state));
}

// --- Achat en lot : coût/gain = quantité × unité, un seul contrôle EXP pour tout le lot. ---
{
  const unit = IDLE_NGU_RESOURCE_PURCHASES.energy.bars; // {cost:80, gain:1, hardCap:1e18}
  const state = freshState(10000, { bosses: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 });
  const before = state.currencies.experience;
  const statBefore = state.resources.energy.bars;

  const { state: next, result } = applyIdleNguAction(
    roundTrip(state),
    { action: "buyResource", resource: "energy", stat: "bars", quantity: 10 },
    { bosses: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 },
    Date.now()
  );

  assert.equal(result.quantity, 10, "Le résultat doit refléter la quantité achetée.");
  assert.equal(result.cost, unit.cost * 10, "Le coût total doit être quantité × coût unitaire.");
  assert.equal(result.gain, unit.gain * 10, "Le gain total doit être quantité × gain unitaire.");
  assert.equal(before - next.currencies.experience, unit.cost * 10, "L'EXP déduite doit correspondre exactement au lot de 10.");
  assert.equal(next.resources.energy.bars - statBefore, unit.gain * 10, "La stat doit augmenter du gain total du lot.");
}

// --- Achat en lot : jamais d'achat partiel si l'EXP ne couvre pas le lot entier. ---
{
  const unit = IDLE_NGU_RESOURCE_PURCHASES.energy.bars;
  const state = freshState(unit.cost * 5, { bosses: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 }); // paye pile 5, pas 10
  const stored = roundTrip(state);
  assert.throws(
    () => applyIdleNguAction(
      stored,
      { action: "buyResource", resource: "energy", stat: "bars", quantity: 10 },
      { bosses: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 },
      Date.now()
    ),
    /EXP_INSUFFISANTE/,
    "Un lot de 10 avec seulement de quoi en payer 5 doit être intégralement refusé, jamais partiellement exécuté."
  );
  // L'état stocké ne doit pas avoir bougé (aucune mutation partielle appliquée avant le throw).
  assert.equal(stored.currencies.experience, unit.cost * 5);
  assert.equal(stored.resources.energy.bars, state.resources.energy.bars);
}

// --- Achat en lot : le gain reste plafonné au hardCap, même en dépassant largement avec la quantité. ---
{
  const unit = IDLE_NGU_RESOURCE_PURCHASES.energy.speed; // hardCap 50
  const state = freshState(unit.cost * 100000, { bosses: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 });
  const { state: next } = applyIdleNguAction(
    roundTrip(state),
    { action: "buyResource", resource: "energy", stat: "speed", quantity: 100000 },
    { bosses: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 },
    Date.now()
  );
  assert.equal(next.resources.energy.speed, unit.hardCap, "Un lot énorme doit être plafonné exactement au hardCap, jamais dépassé.");
}

// --- Quantité invalide : 0, négatif ou non-entier doivent être rejetés. ---
{
  const state = freshState(1000, { bosses: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 });
  for (const bad of [0, -1, -10]) {
    assert.throws(
      () => applyIdleNguAction(
        roundTrip(state),
        { action: "buyResource", resource: "energy", stat: "bars", quantity: bad },
        { bosses: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 },
        Date.now()
      ),
      /QUANTITE_INVALIDE/,
      `Une quantité ${bad} doit être rejetée.`
    );
  }
}

// --- Newbie Offer : achat unique réussi, puis refus définitif du même id. ---
{
  const offer = IDLE_NGU_NEWBIE_OFFERS.energy.speed[0]; // energySpeedNewbie1 : 1 EXP -> +0.2
  let state = freshState(100, {});
  const statBefore = state.resources.energy.speed;

  const first = applyIdleNguAction(
    roundTrip(state),
    { action: "buyNewbieOffer", resource: "energy", stat: "speed", offerId: offer.id },
    {},
    Date.now()
  );
  assert.equal(first.result.cost, offer.cost);
  assert.equal(first.result.gain, offer.gain);
  assert.ok(
    Math.abs((first.state.resources.energy.speed - statBefore) - offer.gain) < 1e-9,
    "Le gain de l'offre doit être appliqué."
  );
  assert.equal(100 - first.state.currencies.experience, offer.cost, "Le coût de l'offre doit être déduit.");
  assert.ok(first.state.records.newbieOffersUsed.includes(offer.id), "L'offre doit être marquée comme utilisée dans records.");

  // Rejoué exactement comme la production : round-trip JSON entre deux requêtes.
  const stored = roundTrip(first.state);
  assert.throws(
    () => applyIdleNguAction(
      stored,
      { action: "buyNewbieOffer", resource: "energy", stat: "speed", offerId: offer.id },
      {},
      Date.now()
    ),
    /OFFRE_DEJA_UTILISEE/,
    "Racheter la même Newbie Offer après un round-trip JSON doit être refusé, jamais accordé une deuxième fois."
  );
}

// --- Newbie Offer : id inconnu ou inexistant pour ce couple ressource/stat. ---
{
  const state = freshState(100, {});
  assert.throws(
    () => applyIdleNguAction(
      roundTrip(state),
      { action: "buyNewbieOffer", resource: "energy", stat: "speed", offerId: "cetOffreNexistePas" },
      {},
      Date.now()
    ),
    /OFFRE_INTROUVABLE/
  );
  // Magic n'a jamais de Newbie Offer (vérifié absent de IDLE_NGU_NEWBIE_OFFERS) : toute tentative doit échouer proprement.
  assert.equal(IDLE_NGU_NEWBIE_OFFERS.magic, undefined, "Magic ne doit avoir aucune Newbie Offer (absente du vrai shop/wiki).");
  assert.equal(IDLE_NGU_NEWBIE_OFFERS.r3, undefined, "R3 ne doit avoir aucune Newbie Offer (absente du vrai shop/wiki).");
  const magicState = freshState(100, {});
  magicState.systems.bloodMagic.unlocked = true;
  assert.throws(
    () => applyIdleNguAction(
      roundTrip(magicState),
      { action: "buyNewbieOffer", resource: "magic", stat: "speed", offerId: "energySpeedNewbie1" },
      {},
      Date.now()
    ),
    /OFFRE_INTROUVABLE/
  );
}

// --- Newbie Offer : survit à une Renaissance (bonus de démarrage permanent, jamais refarmable). ---
{
  const context = { bosses: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 };
  const offer = IDLE_NGU_NEWBIE_OFFERS.energy.speed[0];
  let state = freshState(100, context, 0);
  state.runStartedAt = 0;

  const bought = applyIdleNguAction(
    roundTrip(state),
    { action: "buyNewbieOffer", resource: "energy", stat: "speed", offerId: offer.id },
    context,
    0
  );
  assert.ok(bought.state.records.newbieOffersUsed.includes(offer.id));

  const reborn = rebirthIdleNguState(roundTrip(bought.state), context, 4 * 60 * 1000);
  assert.ok(
    reborn.records.newbieOffersUsed.includes(offer.id),
    "newbieOffersUsed doit survivre à la Renaissance, exactement comme highestBoss/totalRebirths."
  );

  assert.throws(
    () => applyIdleNguAction(
      roundTrip(reborn),
      { action: "buyNewbieOffer", resource: "energy", stat: "speed", offerId: offer.id },
      context,
      1
    ),
    /OFFRE_DEJA_UTILISEE/,
    "Une Newbie Offer déjà utilisée avant Renaissance doit rester bloquée après."
  );
}

// --- Verrou boss 17 sur Power/Cap : bloqué en dessous, débloqué au seuil, jamais sur Speed/Bars. ---
{
  const state = freshState(1e9, {});

  assert.throws(
    () => applyIdleNguAction(
      roundTrip(state),
      { action: "buyResource", resource: "energy", stat: "power" },
      { bosses: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 - 1 },
      Date.now()
    ),
    /ACHAT_VERROUILLE_BOSS/,
    "Energy Power doit rester verrouillé juste avant le seuil boss 17."
  );

  assert.throws(
    () => applyIdleNguAction(
      roundTrip(state),
      { action: "buyResource", resource: "energy", stat: "cap" },
      { bosses: 0 },
      Date.now()
    ),
    /ACHAT_VERROUILLE_BOSS/,
    "Energy Cap doit rester verrouillé dès le début de partie (boss 0)."
  );

  const unlockedPower = applyIdleNguAction(
    roundTrip(state),
    { action: "buyResource", resource: "energy", stat: "power" },
    { bosses: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 },
    Date.now()
  );
  assert.ok(unlockedPower.result.gain > 0, "Energy Power doit être achetable dès le boss 17 atteint.");

  // Speed/Bars ne sont jamais gatées par le boss, dès le tout début de partie (boss 0).
  const speedOk = applyIdleNguAction(
    roundTrip(state),
    { action: "buyResource", resource: "energy", stat: "speed" },
    { bosses: 0 },
    Date.now()
  );
  assert.ok(speedOk.result.gain > 0, "Energy Speed doit rester achetable dès le début, sans verrou boss.");

  const barsOk = applyIdleNguAction(
    roundTrip(state),
    { action: "buyResource", resource: "energy", stat: "bars" },
    { bosses: 0 },
    Date.now()
  );
  assert.ok(barsOk.result.gain > 0, "Energy Bars doit rester achetable dès le début, sans verrou boss.");
}

// --- Le snapshot expose l'état de verrouillage et le catalogue Newbie Offers, sans recalcul côté client. ---
{
  const context = { bosses: 5 };
  const state = freshState(1e9, context);
  const snap = idleNguSnapshot(roundTrip(state), context, Date.now());

  assert.equal(snap.resourcePurchaseUnlock.energy.power.unlocked, false, "boss 5 < 17 : Power doit être annoncé verrouillé au client.");
  assert.equal(snap.resourcePurchaseUnlock.energy.power.neededBosses, IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1);
  assert.equal(snap.resourcePurchaseUnlock.energy.cap.unlocked, false);
  assert.equal(snap.resourcePurchaseUnlock.energy.speed.unlocked, true, "Speed n'est jamais verrouillé par le boss.");
  assert.equal(snap.resourcePurchaseUnlock.energy.bars.unlocked, true, "Bars n'est jamais verrouillé par le boss.");

  const snapUnlocked = idleNguSnapshot(roundTrip(state), { bosses: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 }, Date.now());
  assert.equal(snapUnlocked.resourcePurchaseUnlock.energy.power.unlocked, true, "boss 17 atteint : Power doit être annoncé débloqué.");
  assert.equal(snapUnlocked.resourcePurchaseUnlock.energy.cap.unlocked, true);

  assert.deepEqual(
    snap.newbieOffers.catalog.energy.speed.map(o => o.id),
    IDLE_NGU_NEWBIE_OFFERS.energy.speed.map(o => o.id),
    "Le catalogue Newbie Offers doit être exposé tel quel au client."
  );
  assert.deepEqual(snap.newbieOffers.used, [], "Aucune Newbie Offer utilisée sur une partie fraîche.");

  // bulkTiers exposés tels quels (source unique, jamais recalculés/dupliqués côté client).
  assert.deepEqual(snap.resourcePurchases.energy.speed.bulkTiers, [1, 10]);
  assert.deepEqual(snap.resourcePurchases.energy.bars.bulkTiers, [1, 10, 100]);
}

console.log("idle-exp-shop-bulk-newbie-offers-boss-gate: OK");
