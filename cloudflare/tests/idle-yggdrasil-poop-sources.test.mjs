import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState } from "../src/idle-ngu-progression.js";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";
import { idlePerkByIdV1 } from "../src/idle-perks-v1.js";
import {
  idleYggItopodPoopV1,
  IDLE_YGG_ITOPOD_POOP_KILLS_V1,
  IDLE_YGG_ITOPOD_POOP_CHANCE_V1
} from "../src/idle-yggdrasil-extra-v1.js";
import { createSelloutEffectsV1 } from "../src/idle-sellout-shop-v1.js";

/*
 * Sources de Poop, 2026-09-24 (miroir NGU-Wiki) :
 *  - « The Sky », Loot > Icarus Proudbottom : « Poop (0.05% base chance, up to
 *    0.5% max) » (fiche « Icarus Proudbottom » : « the only enemy in The Sky
 *    that drops Poop ») ;
 *  - « Perk Points », perk 30 « What a Crappy Perk » (25 PP, 1 niveau) :
 *    « gives 1 poop every 9000 kills and additionally a 0.01% chance per kill
 *    for 1 poop » ; « It also works offline! ».
 */

function combatSky(mobName, rng, dropMultiplier = 1) {
  const etat = normalizeIdleAdventureStateV47({});
  etat.selectedZone = "sky";
  etat.fight = { active: true, zone: "sky", boss: false, mobName, monsterHp: 0, monsterHpMax: 1, playerHp: 1, playerHpMax: 1 };
  const avant = Math.random;
  Math.random = rng;
  try {
    return applyIdleAdventureActionV47(etat, { action: "resolveZoneFight" }, { bosses: 100, dropMultiplier, dropMultiplierIncludesGear: true }, 1000);
  } finally { Math.random = avant; }
}

// ---------- The Sky : Icarus Proudbottom uniquement ----------
{
  const r = combatSky("Icarus Proudbottom", () => 0.0004);
  assert.equal(r.result.poop, 1, "0,04 % < 0,05 % : une Poop");
  assert.equal(r.state.permanent.poop, 1);
  assert.equal(combatSky("Icarus Proudbottom", () => 0.0006).result.poop, 0, "0,06 % > 0,05 %");
  assert.equal(combatSky("747", () => 0).result.poop, 0, "autre ennemi de The Sky : jamais");
  // Drop Chance x20 -> 1 %, plafonné à 0,5 %.
  assert.equal(combatSky("Icarus Proudbottom", () => 0.0049, 20).result.poop, 1, "plafond 0,5 %");
  assert.equal(combatSky("Icarus Proudbottom", () => 0.0051, 20).result.poop, 0, "au-delà du plafond de 0,5 %");
  assert.equal(combatSky("Icarus Proudbottom", () => 0.0009, 2).result.poop, 1, "0,05 % x2 = 0,1 %");
}

// ---------- Crédit dans le stock de Poop via le moteur méta ----------
{
  const ctx = { bosses: 100 };
  let s = normalizeIdleNguState({}, ctx, 0);
  s.adventure.selectedZone = "sky";
  s.adventure.fight = { active: true, zone: "sky", boss: false, mobName: "Icarus Proudbottom", monsterHp: 0, monsterHpMax: 1, playerHp: 1, playerHpMax: 1 };
  const avant = Math.random;
  Math.random = () => 0;
  try { s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "resolveZoneFight" } }, ctx, 1).state; }
  finally { Math.random = avant; }
  assert.equal(s.selloutEffects.poop, 1, "Poop ajoutée au stock d'Yggdrasil");
}

// ---------- ITOPOD : perk 30 ----------
{
  const perk = idlePerkByIdV1(30);
  assert.equal(perk.name, "What a Crappy Perk");
  assert.equal(perk.cost, 25);
  assert.equal(perk.cap, 1);
  assert.equal(IDLE_YGG_ITOPOD_POOP_KILLS_V1, 9000);
  assert.equal(IDLE_YGG_ITOPOD_POOP_CHANCE_V1, 0.0001);

  const jamais = () => 0.5;
  const s = normalizeIdleNguState({}, {}, 0);
  assert.equal(idleYggItopodPoopV1(s, 20000, () => 0), 0, "sans la perk : rien");
  assert.equal(s.selloutEffects.poop, 0);
  s.systems.perks.data.levels = { 30: 1 };
  assert.equal(idleYggItopodPoopV1(s, 8999, jamais), 0);
  assert.equal(idleYggItopodPoopV1(s, 1, jamais), 1, "9 000e kill : une Poop garantie");
  assert.equal(s.selloutEffects.itopodPoopKills, 0);
  assert.equal(idleYggItopodPoopV1(s, 20000, jamais), 2, "20 000 kills : 2 Poop, reste 2 000");
  assert.equal(s.selloutEffects.itopodPoopKills, 2000);
  assert.equal(s.selloutEffects.poop, 3);
  // 0,01 % par kill : un jet réussi sur 3 kills.
  const jets = [0.5, 0.00009, 0.5];
  let i = 0;
  assert.equal(idleYggItopodPoopV1(s, 3, () => jets[i++]), 1, "jet < 0,01 %");
  assert.equal(createSelloutEffectsV1(s.selloutEffects).itopodPoopKills, 2003, "compteur conservé à la normalisation");
}

// ---------- ITOPOD : branché sur les kills du tick ----------
{
  const ctx = { bosses: 300 };
  const T0 = 1_000_000;
  let s = normalizeIdleNguState({}, ctx, T0);
  s.systems.perks.data.levels = { 30: 1 };
  s.systems.tower.unlocked = true;
  s.systems.tower.active = true;
  s.systems.tower.data = { kills: 0 };
  s.selloutEffects.itopodPoopKills = 8999;
  const avant = Math.random;
  Math.random = () => 0.5; // aucun jet de 0,01 % : seule la Poop garantie compte
  try { s = advanceIdleNguState(s, 3600, ctx, T0 + 3600 * 1000); }
  finally { Math.random = avant; }
  const tuees = s.systems.tower.data.kills;
  assert.ok(tuees >= 1, "l'ITOPOD tue au moins un ennemi en une heure");
  assert.equal(s.selloutEffects.poop, 1, "le 9 000e kill du tick donne une Poop");
  assert.equal(s.selloutEffects.itopodPoopKills, 8999 + tuees - 9000);
}

console.log("idle-yggdrasil-poop-sources: OK");
