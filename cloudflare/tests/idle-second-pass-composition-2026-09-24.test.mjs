import assert from "node:assert/strict";
import { idleAchievementsApMultiplierV1 } from "../src/idle-achievements-v1.js";
import {
  normalizeIdleNguState,
  advanceIdleNguState,
  rebirthIdleNguState,
  applyIdleNguAction,
  idleNguBonuses,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";
import { idleAdventureTitanCooldownMsV1, normalizeIdleAdventureStateV47, applyIdleAdventureActionV47, idleAdventureSpecialItemV1, idleAdventureAddItemV1, IDLE_ADVENTURE_ITEM_EVOLUTIONS_V1, IDLE_ADVENTURE_SPECIALS } from "../src/idle-adventure-v47.js";

/*
 * Audit de seconde passe (2026-09-24), méthode de COMPOSITION :
 *  1. Hacks : temps = divider x 1.0078^L x (L+1) / (R3 alloué x Puissance R3 x vitesse) ; les Bars de R3 n'y figurent pas.
 *  2. NGU : 50 niveaux par seconde au maximum (page NGU / Energy).
 *  3. NUMBER : NGU Number et Beard Number sont dans le NUMBER figé au Rebirth, pas remultipliés en direct.
 *  4. Arbitrary Points : facteurs (Yellow Heart x Fibonacci 89) sur toutes les sources SAUF les kills de l'ITOPOD, arrondi inférieur.
 *  5. Titans : délai minimal de 60 minutes et nouveau délai complet à chaque Rebirth.
 */
const ctx = { bosses: 100 };
const T0 = 1_000_000;

/* --- 1. Hacks : les Bars de R3 sont sans effet sur la vitesse. --- */
function hackApres(bars, secondes) {
  const s = normalizeIdleNguState({}, ctx, T0);
  s.systems.hacks.unlocked = true;
  s.systems.hacks.data.activeTrack = "attackDefense";
  s.systems.hacks.allocation.r3 = 100;
  s.resources.r3.cap = 1000;
  s.resources.r3.current = 1000;
  s.resources.r3.power = 1000;
  s.resources.r3.bars = bars;
  const r = advanceIdleNguState(s, secondes, ctx, T0 + secondes * 1000);
  const t = r.systems.hacks.data.tracks.attackDefense;
  return t.level + t.progress;
}
{
  const avecPeu = hackApres(1, 3600);
  const avecBeaucoup = hackApres(1_000_000, 3600);
  assert.ok(avecPeu > 0, "le hack progresse");
  assert.equal(avecBeaucoup, avecPeu, "des Bars R3 x1 000 000 ne changent rien à la vitesse des Hacks");
}

/* --- 2. NGU : 50 niveaux/s maximum (même avec un débit gigantesque). --- */
{
  const s = normalizeIdleNguState({}, ctx, T0);
  s.systems.ngu.unlocked = true;
  s.systems.bloodMagic.unlocked = true;
  s.resources.energy.power = 1e15;
  s.resources.energy.cap = 1e15;
  s.resources.energy.current = 1e15;
  const n = s.systems.ngu.data.ngus.normal.gold;
  n.allocation = 1e12;
  const r = advanceIdleNguState(s, 10, ctx, T0 + 10_000);
  const niveaux = r.systems.ngu.data.ngus.normal.gold.level;
  assert.ok(niveaux > 0 && niveaux <= 500, `au plus 50 niveaux/s pendant 10 s (obtenu ${niveaux})`);
}

/* --- 4. Arbitrary Points : composition et arrondi. --- */
function etatAvecFib89() {
  const s = normalizeIdleNguState({}, ctx, T0);
  s.systems.perks.data.levels = { 94: 89 };
  return normalizeIdleNguState(s, ctx, T0);
}
{
  /* Défi Basic (2 500 AP) : x1,02 (Fibonacci 89) arrondi à l'inférieur = 2 550. */
  const s0 = etatAvecFib89();
  s0.systems.challenges.unlocked = true;
  const demarre = applyIdleNguAction(s0, { action: "challenge", mode: "start", challenge: "basic" }, { bosses: 0 }, T0 + 500).state;
  const ap0 = demarre.currencies.ap;
  const r = applyIdleNguAction(demarre, { action: "challenge", mode: "complete", challenge: "basic" }, { bosses: 58 }, T0 + 1000).state;
  /* 2026-09-24 (fusion avec main) : le bonus AP commun inclut aussi les succès (BP/10000) -> facteur relu sur l état obtenu. */
  const succes = idleAchievementsApMultiplierV1(r);
  assert.equal(r.currencies.ap - ap0, Math.floor(2500 * 1.02 * succes + 1e-9));
  assert.ok(r.currencies.ap - ap0 >= 2550);
}
{
  /* Money Pit / roue : entiers, jamais fractionnaires. */
  const s = etatAvecFib89();
  s.systems.dailySpin.unlocked = true;
  s.systems.dailySpin.data.totalSpins = 0;
  s.systems.dailySpin.data.readyAt = 0;
  const avant = Math.random;
  Math.random = () => 0.1; // palier 0 : 50 AP
  try {
    const r = applyIdleNguAction(s, { action: "collect", system: "dailySpin" }, ctx, T0 + 1000);
    /* 2026-09-24 (fusion avec main) : x succes (BP/10000) en plus du Fibonacci 89. */
    assert.equal(r.result.reward.ap, Math.floor(50 * 1.02 * idleAchievementsApMultiplierV1(r.state) + 1e-9), "50 x 1,02 x succes");
    assert.ok(Number.isInteger(r.state.currencies.ap));
  } finally { Math.random = avant; }
}

/* --- 5. Titans : délai minimal 60 minutes ; nouveau délai à chaque Rebirth. --- */
{
  const H = 3600000;
  // Jake (titan 3, 2 h) avec 8 No Rebirth Challenges (120 min) : plancher de 60 min, pas 0.
  assert.equal(idleAdventureTitanCooldownMsV1("t3", { titanCooldownReductionMs: 8 * 15 * 60000 }), H);
  assert.equal(idleAdventureTitanCooldownMsV1("t3", { titanCooldownReductionMs: 2 * 15 * 60000 }), 2 * H - 30 * 60000);
  // Le Nerd (Evil, titan 7, 4 h 30) : la réduction Normal ne s'applique pas avant le rang 3 mais s'applique ici ; Evil dès le rang 7.
  assert.equal(idleAdventureTitanCooldownMsV1("nerd", { titanCooldownReductionMs: 60 * 60000, titanCooldownReductionEvilMs: 30 * 60000 }), 4.5 * H - 90 * 60000);
  // Walderp non terminé : pas de délai (il reste caché).
  assert.equal(idleAdventureTitanCooldownMsV1("t5", {}, 1), null);
  assert.equal(idleAdventureTitanCooldownMsV1("inconnu", {}), null);

  // Après un combat, le délai ne descend jamais sous 60 minutes.
  const etat = normalizeIdleAdventureStateV47({});
  etat.titans.t2 = { kills: 24, nextAt: 0 };
  etat.unlockFlags.yggdrasil = true;
  const r = applyIdleAdventureActionV47(etat, { action: "titan", titan: "t3" },
    { bosses: 100, stats: { power: 1e9, toughness: 1e9 }, titanCooldownReductionMs: 8 * 15 * 60000 }, 5_000_000);
  assert.equal(r.state.titans.t3.nextAt - 5_000_000, H);

  // Rebirth : chaque titan déjà vaincu repart avec son délai complet.
  const s = normalizeIdleNguState({}, ctx, T0);
  s.adventure.titans.t1 = { kills: 3, rebirthKills: 3, nextAt: 0 };
  const t = T0 + 4 * H;
  const apres = rebirthIdleNguState(s, ctx, t);
  assert.equal(apres.adventure.titans.t1.nextAt, t + H, "Gordon Ramsay Bolton : 1 h après le Rebirth");
}

/* --- 3. NUMBER : le niveau du Reverse Hitler (barbe NUMBER) n'agit pas en direct sur l'Attaque. --- */
{
  const s = normalizeIdleNguState({}, ctx, T0);
  s.systems.beards.unlocked = true;
  const avant = idleNguBonuses(s);
  const t = s.systems.beards.data.tracks.defense; // « The Reverse Hitler » (NUMBER)
  t.permanentLevel = 5000;
  const apres = idleNguBonuses(s);
  assert.ok(apres.beardNumberMultiplier > avant.beardNumberMultiplier, "le bonus de barbe est bien calculé (utilisé pour le NUMBER figé au Rebirth)");
  assert.equal(apres.attackMultiplier, avant.attackMultiplier, "mais l'Attaque en direct ne le remultiplie pas");
}

/* --- 6. Wishes : la Puissance de la formule est la Puissance effective (perks compris). --- */
{
  const act = (s, payload) => applyIdleNguAction(s, payload, ctx, T0).state;
  function progresSouhait(niveauPerkEnergie) {
    let s = normalizeIdleNguState({}, ctx, T0);
    s.systems.wishes.unlocked = true;
    s.systems.hacks.unlocked = true;
    s.systems.bloodMagic.unlocked = true;
    for (const k of ["energy", "magic", "r3"]) {
      s.resources[k].power = 1;
      s.resources[k].cap = 1e6;
      s.resources[k].current = 1e6;
    }
    if (niveauPerkEnergie) s.systems.perks.data.levels = { 6: niveauPerkEnergie }; // Generic Energy Power Perk I : +1 %/niveau
    s = normalizeIdleNguState(s, ctx, T0);
    s = act(s, { action: "setWishSlot", slot: 0, wish: "1" });
    for (const r of ["energy", "magic", "r3"]) s = act(s, { action: "allocateWishSlot", slot: 0, resource: r, value: 100 });
    const apres = advanceIdleNguState(s, 1000, ctx, T0 + 1000);
    return apres.systems.wishes.data.tracks["1"].progress;
  }
  const sans = progresSouhait(0);
  const avec = progresSouhait(50); // Puissance Energy effective x1,5
  assert.ok(sans > 0);
  const attendu = Math.pow(1.5, 0.17);
  assert.ok(Math.abs(avec / sans / attendu - 1) < 1e-6, `un perk de Puissance Energy x1,5 accélère le souhait de 1,5^0,17 (obtenu ${avec / sans}, attendu ${attendu})`);
}

/* --- 7. PPBonus : les quatre sets « PP earnings » sont des facteurs séparés (page Yggdrasil, Fruit of Rage). --- */
{
  const s = normalizeIdleNguState({}, ctx, T0);
  const sets = { heartGreen: 0.2, pissedOffKey: 0.1, pinkprincess: 0.1, halloweenie: 0.45 };
  s.adventure.completedSets = Object.fromEntries(Object.keys(sets).map((k) => [k, true]));
  s.adventure.setRewards.itopodPpPct = 0.85;
  const attendu = 1.2 * 1.1 * 1.1 * 1.45;
  const b = idleNguBonuses(s);
  assert.ok(Math.abs(b.ppMultiplier / attendu - 1) < 1e-9, `PPBonus = 1,2 x 1,1 x 1,1 x 1,45 = ${attendu} (obtenu ${b.ppMultiplier})`);
}

/* --- 8. 24 Hour Challenge : « bonus also applies to Titans » (+10 % EXP par complétion Normal, arrondi inférieur). --- */
{
  const etat = normalizeIdleAdventureStateV47({});
  const r = applyIdleAdventureActionV47(etat, { action: "titan", titan: "t1" },
    { bosses: 58, stats: { power: 1300, toughness: 1300 }, titanExpChallengePct: 0.10 * 3 }, 1000);
  assert.equal(r.result.experience, Math.floor(35 * 1.3), "35 EXP x 1,3 = 45,5 -> 45");
}

/* --- 9. Cube : 1 % de la valeur TOTALE du boost (Boosted Boosts / Beasted Boosts compris, page Boost). --- */
{
  const s = normalizeIdleAdventureStateV47({});
  s.inventory.push({ id: "b1", definitionId: "boost:power:100", kind: "boost", boostType: "power", strength: 100, level: 0 });
  const r = applyIdleAdventureActionV47(s, { action: "boost", boostId: "b1", toCube: true }, { bosses: 100, boostPowerMultiplier: 3 }, 1);
  assert.ok(Math.abs(r.state.cube.power - 3) < 1e-9, "boost 100 x3 (perks/quirks) -> 1 % = 3");
}

/* --- 10. Ascension des objets de niveau 100 (page Inventory + pages d'objets « can be upgraded to »). --- */
{
  /* Chaque maillon existe, et le dernier x9 / la dernière Looty n'ont pas de suite. */
  for (const [de, vers] of Object.entries(IDLE_ADVENTURE_ITEM_EVOLUTIONS_V1)) {
    assert.ok(IDLE_ADVENTURE_SPECIALS[vers], `définition de ${vers} (suite de ${de})`);
  }
  assert.equal(IDLE_ADVENTURE_ITEM_EVOLUTIONS_V1.ascendedX9Pendant, undefined);
  assert.equal(IDLE_ADVENTURE_ITEM_EVOLUTIONS_V1.glitchyLooty, undefined);

  function ascendre(definitionId, niveau) {
    const s = normalizeIdleAdventureStateV47({});
    const item = idleAdventureSpecialItemV1(definitionId, niveau);
    const ajoute = idleAdventureAddItemV1(s, item);
    return applyIdleAdventureActionV47(s, { action: "transformAdventureItem", id: ajoute.id || item.id }, { bosses: 100 }, 1);
  }
  const r = ascendre("ascendedForestPendant", 100);
  const suivants = r.state.inventory.filter((x) => x.definitionId === "ascendedAscendedForestPendant");
  assert.equal(suivants.length, 1, "l'Ascended Forest Pendant niveau 100 devient un Ascended Ascended Forest Pendant");
  assert.equal(suivants[0].level, 0, "niveau 0 après l'ascension");
  assert.equal(r.state.inventory.filter((x) => x.definitionId === "ascendedForestPendant").length, 0, "l'ancien objet est consommé");
  assert.throws(() => ascendre("kingLooty", 99), /OBJET_NON_MAXE/, "niveau 100 requis");
  const looty = ascendre("supremeIntelligenceLooty", 100);
  assert.equal(looty.state.inventory.filter((x) => x.definitionId === "grandDemonLootzifer").length, 1);
}

console.log("idle-second-pass-composition-2026-09-24 ok");
