import assert from "node:assert/strict";
import { IDLE_NGU_META_VERSION, IDLE_NGU_SAVE_SCHEMA, advanceIdleNguState } from "../src/idle-ngu-progression.js";
import { macguffinOnItopodKillsV1 } from "../src/idle-macguffins-v1.js";

/*
 * docs/HORS-LIGNE.md, proposition 2 : le wiki (Build History .398) dit que l'ITOPOD progresse
 * hors ligne (et en ligne) SANS qu'il faille y être -- seulement l'ITOPOD débloqué et 650 de
 * Power d'Aventure au total (de quoi tuer l'étage 1 en un coup). Avant ce correctif, SOREAL
 * exigeait en plus `tower.active` (le même bouton Activer/Désactiver générique que les autres
 * systèmes), une condition absente du wiki.
 */

function baseState() {
  return {
    version: IDLE_NGU_META_VERSION,
    saveSchema: IDLE_NGU_SAVE_SCHEMA,
    systems: {
      tower: { unlocked: true, active: false, data: { floor: 0, killsOnFloor: 0, kills: 0, ppProgress: 0 } }
    },
    currencies: { pp: 0, experience: 0, ap: 0 }
  };
}

// Non actif mais 650+ de Power : l'ITOPOD progresse quand même (rattrapage hors ligne inclus).
{
  const ctx = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 30 };
  const state = advanceIdleNguState(baseState(), 3600, ctx, Date.now());
  const d = state.systems.tower.data;
  assert.ok(d.kills > 0, "des kills doivent s'accumuler sans tower.active");
  assert.ok(d.floor > 0, "des étages doivent être franchis sans tower.active");
}

// Sous 650 de Power d'Aventure au total : aucune progression, même « actif ».
{
  const ctx = { adventurePower: 649, adventureToughness: 649, bosses: 30 };
  const state = baseState();
  state.systems.tower.active = true;
  const after = advanceIdleNguState(state, 3600, ctx, Date.now());
  assert.equal(after.systems.tower.data.kills, 0, "moins de 650 de Power = pas de kill, même actif");
}

// Exactement 650 : au seuil, ça progresse (« assez de Power pour tuer l'étage 1 en un coup »).
{
  const ctx = { adventurePower: 650, adventureToughness: 650, bosses: 30 };
  const state = advanceIdleNguState(baseState(), 3600, ctx, Date.now());
  assert.ok(state.systems.tower.data.kills > 0, "650 exactement doit déjà progresser");
}

// MacGuffin ITOPOD Drops (perk 68) : les kills obtenus hors ligne alimentent bien le compteur
// et déposent un fragment dans l'inventaire MacGuffin (docs/HORS-LIGNE.md, proposition 5).
{
  const state = baseState();
  state.systems.perks = { unlocked: true, data: { levels: { 68: 1 } } };
  state.systems.macguffins = { unlocked: true, data: { inventory: [], equipped: [], itopodKills: 4999, zoneCounter: { zone: "", kills: 0 }, sourceDropped: {}, serial: 1 } };
  const ctx = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 30 };
  const after = advanceIdleNguState(state, 3600, ctx, Date.now());
  assert.ok(after.systems.tower.data.kills > 0, "l'ITOPOD doit avancer hors ligne pour ce test");
  assert.ok(after.systems.macguffins.data.inventory.length > 0, "un fragment MacGuffin doit être déposé par les kills ITOPOD hors ligne");
}

// Le compteur MacGuffin lui-même (fonction dédiée) est bien indépendant de tower.active.
{
  const state = baseState();
  state.systems.macguffins = { unlocked: true, data: { inventory: [], equipped: [], itopodKills: 0, zoneCounter: { zone: "", kills: 0 }, sourceDropped: {}, serial: 1 } };
  state.systems.perks = { unlocked: true, data: { levels: { 68: 1 } } };
  const drops = macguffinOnItopodKillsV1(state, 5000, () => 0);
  assert.equal(drops.length, 1, "5000 kills = 1 MacGuffin (perk 68, sans amélioration)");
}

console.log("idle-itopod-offline-without-active: OK");
