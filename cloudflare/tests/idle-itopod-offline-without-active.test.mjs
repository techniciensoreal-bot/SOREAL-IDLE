import assert from "node:assert/strict";
import { IDLE_NGU_META_VERSION, IDLE_NGU_SAVE_SCHEMA, advanceIdleNguState, normalizeIdleNguState } from "../src/idle-ngu-progression.js";
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
      tower: { unlocked: true, active: false, data: { floor: 0, killsOnFloor: 0, kills: 0, ppProgress: 0, highestFloor: 5000 } }
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
  /* Lu dans le jeu (audit IL 2026-11-21, Character::adventureOfflineProgress 2239 + calculateBestItopodLevel : 0 sous 700 de Puissance) : hors ligne, entre 650 et 700 le jeu ne fait RIEN ; en ligne (court), 650 suffit. */
  const horsLigne = advanceIdleNguState(baseState(), 3600, ctx, Date.now());
  assert.equal(horsLigne.systems.tower.data.kills, 0, "hors ligne : 650 ne suffit pas, il faut 700");
  const enLigne = advanceIdleNguState(Object.assign(baseState(), {}), 20, ctx, Date.now());
  assert.ok(enLigne.systems.tower.data.kills > 0, "en ligne : 650 exactement progresse");
  const ctx700 = { adventurePower: 700, adventureToughness: 700, bosses: 30 };
  assert.ok(advanceIdleNguState(baseState(), 3600, ctx700, Date.now()).systems.tower.data.kills > 0, "hors ligne : 700 progresse");
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

// Hors ligne (audit du code du jeu 2026-11-16, hors-ligne.md E2) : UN SEUL étage, jamais au-dessus de l'étage le plus haut déjà atteint, plages du joueur ignorées, aucun boost sans le filtre cube.
{
  const ctx = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 30 };
  const s = baseState();
  s.systems.tower.data.highestFloor = 3;
  s.systems.tower.data.startFloor = 0;
  s.systems.tower.data.endFloor = 2;
  const boostsAvant = normalizeIdleNguState(s, ctx, Date.now()).adventure.inventory.filter(i => i.kind === "boost").length;
  const after = advanceIdleNguState(s, 3600, ctx, Date.now());
  const d = after.systems.tower.data;
  assert.equal(d.floor, 3, "plafonné à l'étage le plus haut déjà atteint, plages ignorées");
  assert.equal(d.highestFloor, 3, "aucun nouvel étage hors ligne");
  assert.ok(d.kills > 0);
  assert.equal(after.adventure.inventory.filter(i => i.kind === "boost").length, boostsAvant, "pas de boost hors ligne sans le filtre cube");
}

console.log("idle-itopod-offline-without-active: OK");
