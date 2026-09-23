import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  syncIdleNguState,
  idleNguBonuses,
  idleNguSnapshot,
  rebirthIdleNguState,
  IDLE_NGU_EXP_SHOP_V1
} from "../src/idle-ngu-progression.js";

/*
 * Item Daycare branché sur le moteur méta : slots (EXP, défis, perk), placement/retrait dans
 * l'inventaire d'Aventure, progression hors ligne, et chaque bonus Daycare déjà calculé
 * ailleurs (perks, souhait, Sellout, équipement, Digger, Hack, défis Blind).
 */
const near = (a, b, msg, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${msg} (obtenu ${a}, attendu ${b})`);
const ctx = { bosses: 100 };
const T0 = 1_000_000;
const H = 3600 * 1000;
const act = (s, payload, t = T0) => applyIdleNguAction(s, payload, ctx, t);
const addItem = (s, definitionId, level = 0) => {
  const r = act(s, { action: "adventure", adventure: { action: "addItem", definitionId, level } });
  return { state: r.state, id: r.result.id };
};
const fresh = (exp = 0) => {
  const s = normalizeIdleNguState({}, ctx, T0);
  s.currencies.experience = exp;
  return s;
};

// --- Boutique EXP : les trois slots (page Experience, Adventure Special) ---
{
  assert.equal(IDLE_NGU_EXP_SHOP_V1.daycareSlot1.cost(0), 250);
  assert.equal(IDLE_NGU_EXP_SHOP_V1.daycareSlot2.cost(0), 25000);
  assert.equal(IDLE_NGU_EXP_SHOP_V1.daycareSlot3.cost(0), 500000);
  const s0 = fresh(1000);
  assert.equal(s0.systems.daycare.unlocked, false, "Aucun slot : garderie verrouillée.");
  assert.throws(() => act(s0, { action: "daycarePlace", itemId: "i1" }), /SYSTEME_VERROUILLE/);
  const s1 = act(s0, { action: "buyExpShop", item: "daycareSlot1" }).state;
  assert.equal(s1.currencies.experience, 750);
  const s2 = normalizeIdleNguState(s1, ctx, T0);
  assert.equal(s2.systems.daycare.unlocked, true, "Le bouton apparaît dès le premier slot acheté.");
  assert.equal(idleNguBonuses(s2).daycareSlots, 1);
}

// --- Placement, refus et retrait ---
const withSlot = (slots = 1) => {
  let s = fresh(1_000_000);
  for (const id of ["daycareSlot1", "daycareSlot2", "daycareSlot3"].slice(0, slots)) s = act(s, { action: "buyExpShop", item: id }).state;
  return normalizeIdleNguState(s, ctx, T0);
};
{
  let s = withSlot(1);
  let a = addItem(s, "forest:pendant", 3); s = a.state; const pendant = a.id;
  a = addItem(s, "creepyDoll", 0); s = a.state; const doll = a.id;
  const boost = s.adventure.inventory.find((o) => o.kind === "boost");
  if (boost) assert.throws(() => act(s, { action: "daycarePlace", itemId: boost.id }), /OBJET_NON_ELIGIBLE_DAYCARE/);
  assert.throws(() => act(s, { action: "daycarePlace", itemId: doll }), /TAUX_DAYCARE_INCONNU/, "Creepy Doll : taux non publié.");
  const eq = act(s, { action: "adventure", adventure: { action: "equip", id: pendant, slot: "accessory" } }).state;
  assert.throws(() => act(eq, { action: "daycarePlace", itemId: pendant }), /OBJET_EQUIPE/);

  const rev = s.adventure.revision;
  const placed = act(s, { action: "daycarePlace", itemId: pendant });
  s = placed.state;
  assert.equal(placed.result.level, 3);
  assert.ok(!s.adventure.inventory.some((o) => o.id === pendant), "L'objet quitte l'inventaire.");
  assert.ok(s.adventure.revision > rev, "La révision d'inventaire avance (le client accepte le nouvel inventaire).");
  assert.equal(s.systems.daycare.data.slots.length, 1);

  // Page Item Daycare : fusionner un objet dans un objet en garderie ne fait rien.
  const other = addItem(s, "forest:pendant", 0);
  assert.throws(() => act(other.state, { action: "adventure", adventure: { action: "merge", a: pendant, b: other.id } }), /FUSION_INVALIDE/);
  // Un seul exemplaire de chaque objet, et un seul slot acheté.
  assert.throws(() => act(other.state, { action: "daycarePlace", itemId: other.id }), /DAYCARE_PLEIN/);
  const s3 = withSlot(3);
  let b = addItem(s3, "forest:pendant", 0); let t = b.state; const p1 = b.id;
  b = addItem(t, "forest:pendant", 0); t = b.state; const p2 = b.id;
  t = act(t, { action: "daycarePlace", itemId: p1 }).state;
  assert.throws(() => act(t, { action: "daycarePlace", itemId: p2 }), /DAYCARE_OBJET_DEJA_PRESENT/);

  // 5 h plus tard (Forest Pendant : 1 h par niveau) : 3 + 5 = 8 ; retrait vers l'inventaire.
  const later = syncIdleNguState(s, ctx, T0 + 5 * H);
  const snap = idleNguSnapshot(later, ctx, T0 + 5 * H);
  assert.equal(snap.daycare.items[0].item.level, 8);
  assert.equal(snap.daycare.items[0].levelsGained, 5);
  near(snap.daycare.items[0].secondsToNextLevel, 3600, "Prochain niveau dans 1 h");
  near(snap.daycare.items[0].secondsToMax, 92 * 3600, "Niveau 100 dans 92 h");
  const back = applyIdleNguAction(later, { action: "daycareRemove", itemId: pendant }, ctx, T0 + 5 * H);
  const item = back.state.adventure.inventory.find((o) => o.id === pendant);
  assert.equal(item.level, 8, "L'objet revient avec ses niveaux.");
  assert.equal(back.state.systems.daycare.data.slots.length, 0);
  assert.equal(back.state.adventure.itemList["forest:pendant"].maxLevel, 8, "Collection mise à jour au retour.");
}

// --- Hors ligne : 30 jours d'absence, plafond 100, persistance et Rebirth ---
{
  let s = withSlot(1);
  const cube = s.adventure.inventory.find((o) => o.definitionId === "tutorialCube");
  s = act(s, { action: "daycarePlace", itemId: cube.id }).state;
  const json = JSON.parse(JSON.stringify(s));
  const offline = syncIdleNguState(json, ctx, T0 + 30 * 24 * H);
  assert.equal(offline.systems.daycare.data.slots[0].item.level, 100, "Tutorial Cube (1 h/niveau) : maxé après 30 jours hors ligne.");
  const reborn = rebirthIdleNguState(offline, ctx, T0 + 30 * 24 * H);
  assert.equal(reborn.systems.daycare.data.slots.length, 1, "La garderie survit au Rebirth (comme l'inventaire).");
  const back = applyIdleNguAction(reborn, { action: "daycareRemove", itemId: cube.id }, { bosses: 4 }, T0 + 30 * 24 * H);
  assert.equal(back.state.adventure.unlockFlags.tutorialCubeMaxed, true, "Le Tutorial Cube maxé en garderie débloque le Cube au retour.");
}

// --- Chaque bonus Daycare déjà calculé ailleurs est maintenant lu ---
{
  const base = withSlot(1);
  const b0 = idleNguBonuses(base);
  assert.equal(b0.daycareSpeedMultiplier, 1);
  assert.equal(b0.daycareTimeMultiplier, 1);

  const perks = normalizeIdleNguState(base, ctx, T0);
  perks.systems.perks.data.levels = { 27: 5, 28: 5, 94: 55, 86: 1 };
  const bp = idleNguBonuses(normalizeIdleNguState(perks, ctx, T0));
  near(bp.daycareTimeMultiplier, 0.9025, "Blessing I + II");
  near(bp.daycareSpeedMultiplier, 1.05, "Fibonacci 55");
  assert.equal(bp.daycareSlots, 2, "Perk 86 : un slot de plus.");

  const wish = normalizeIdleNguState(base, ctx, T0);
  wish.systems.wishes.data.tracks["27"] = { level: 10, tempLevel: 0, permanentLevel: 0, progress: 0 };
  near(idleNguBonuses(normalizeIdleNguState(wish, ctx, T0)).daycareSpeedMultiplier, 1.10, "Souhait 27 niveau 10");

  const shop = normalizeIdleNguState(base, ctx, T0);
  shop.selloutShop.purchases.daycareSpeedBoost = 1;
  near(idleNguBonuses(normalizeIdleNguState(shop, ctx, T0)).daycareTimeMultiplier, 0.9, "Daycare Speed Boost");

  const ch = normalizeIdleNguState(base, ctx, T0);
  ch.challenge.completions.blind = 10;
  ch.challenge.completionsTier.difficile.blind = 10;
  ch.challenge.completionsTier.extreme.blind = 10;
  ch.challenge.completionsTier.difficile.troll = 3;
  const bc = idleNguBonuses(normalizeIdleNguState(ch, ctx, T0));
  near(bc.daycareTimeMultiplier, 0.85, "Blind Normal x10");
  near(bc.daycareSpeedMultiplier, 1.2 * 1.1, "Blind Evil x10 et Sadistic x10");
  assert.equal(bc.daycareSlots, 3, "EXP + Blind Normal final + Troll Evil 3");

  let g = addItem(base, "bagOfTrash", 0);
  const gear = act(g.state, { action: "adventure", adventure: { action: "equip", id: g.id, slot: "accessory" } }).state;
  near(idleNguBonuses(gear).daycareSpeedMultiplier, 1.10, "A Bag of Trash équipé : Daycare Speed +10 % (niveau 0)");

  const dig = normalizeIdleNguState(base, ctx, T0);
  dig.systems.diggers.unlocked = true;
  dig.systems.diggers.data.diggers.daycare = { maxLevel: 10, runLevel: 10, active: true };
  near(idleNguBonuses(normalizeIdleNguState(dig, ctx, T0)).daycareSpeedMultiplier, 1.06 * 1.005, "Daycare Digger niveau 10 : (105 + 0,1 x 10) % x bonus global 1,005");

  const hack = normalizeIdleNguState(base, ctx, T0);
  hack.difficulty = "difficile";
  hack.systems.hacks.data.tracks.daycare.level = 45;
  near(idleNguBonuses(normalizeIdleNguState(hack, ctx, T0)).daycareSpeedMultiplier, (1 + 0.02 * 45 / 100) * 1.005, "Daycare Hack niveau 45 : un palier (x100,5 %)");
}

console.log("idle-daycare-wiring ok");
