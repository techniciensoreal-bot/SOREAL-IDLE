import assert from "node:assert/strict";
import {
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47
} from "../src/idle-adventure-v47.js";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * Audit NGU 2026-09-23 (parité wiki) : les titans donnaient des objets
 * garantis inventés et AUCUNE récompense d'EXP / or / AP / PP. Chaque titan
 * suit maintenant la section Loot de sa page (miroir local NGU-Wiki) et la
 * colonne "Base Rewards" de la page Titans.
 */

function tirage(valeur, fn) {
  const avant = Math.random;
  Math.random = () => valeur;
  try { return fn(); } finally { Math.random = avant; }
}
const PLUS_RIEN = 0.999999; // aucun jet "base chance" ne réussit
const TOUT = 0;             // tous les jets réussissent

function combat(id, { etat, ctx, difficulty, valeur }) {
  const s = etat || normalizeIdleAdventureStateV47({});
  return tirage(valeur, () =>
    applyIdleAdventureActionV47(s, { action: "titan", titan: id, difficulty }, ctx, 1000)
  );
}

// ---- Titan 1 : Gordon Ramsay Bolton ----
{
  const ctx = { bosses: 58, stats: { power: 1300, toughness: 1300 } };
  const r = combat("t1", { ctx, valeur: PLUS_RIEN });
  const pieces = r.result.drops.filter((d) => d.set === "grb");
  assert.equal(pieces.length, 1, "une seule pièce GRB garantie quand aucun jet ne réussit");
  assert.ok(["head", "chest", "legs", "boots", "weapon"].some((sl) => pieces[0].definitionId === `grb:${sl}`),
    "la pièce garantie est l'une des 5 pièces de base (ni le collier ni la viande)");
  assert.equal(pieces[0].level, 0, "lvl 0 garanti");
  assert.equal(r.result.experience, 35);
  assert.equal(r.result.ap, 10);
  assert.ok(r.result.gold >= 1000000 && r.result.gold <= 1250000, "or 1 000 000 – 1 250 000");
  assert.equal(r.state.permanent.experience, 35);
  assert.equal(r.state.permanent.ap, 10);
  assert.ok(r.state.permanent.gold >= 1000000);

  const tout = combat("t1", { ctx, valeur: TOUT });
  const definitions = tout.result.drops.map((d) => d.definitionId);
  assert.ok(definitions.includes("grb:necklace") && definitions.includes("grb:meat"),
    "le collier et la viande ne tombent qu'avec le jet à 15 %");
  assert.ok(definitions.includes("forest:pendant"), "Forest Pendant à 10 %");
}

// ---- Titan 2 : Grand Corrupted Tree ----
{
  const ctx = { bosses: 66, stats: { power: 6000, toughness: 5000 } };
  const etat = normalizeIdleAdventureStateV47({});
  etat.titans.t1 = { kills: 24, nextAt: 0 };
  etat.unlockFlags.ngu = true;
  const r = combat("t2", { etat, ctx, valeur: PLUS_RIEN });
  const boosts = r.result.drops.filter((d) => d.kind === "boost");
  assert.deepEqual(
    boosts.map((b) => `${b.boostType}:${b.strength}`).sort(),
    ["power:10", "special:10", "toughness:10"],
    "un Boost 10 garanti de chaque type, rien d'autre sans jet réussi"
  );
  assert.equal(r.result.experience, 60);
  assert.equal(r.result.ap, 15);
  assert.ok(r.result.gold >= 1600000 && r.result.gold <= 2000000);
}

// ---- Titan 3 : Jake From Accounting ----
{
  const ctx = { bosses: 82, stats: { power: 22000, toughness: 14000 } };
  const etat = normalizeIdleAdventureStateV47({});
  etat.titans.t2 = { kills: 24, nextAt: 0 };
  etat.unlockFlags.yggdrasil = true;
  const r = combat("t3", { etat, ctx, valeur: PLUS_RIEN });
  const jake = r.result.drops.filter((d) => d.set === "jake");
  assert.equal(jake.length, 1, "une seule pièce du set Jake garantie");
  assert.equal(jake[0].level, 0);
  assert.equal(r.result.experience, 200);
  assert.equal(r.result.ap, 50);
  assert.ok(r.result.gold >= 1200000 && r.result.gold <= 1500000);
}

// ---- Titan 4 : UUG ----
{
  const etat = normalizeIdleAdventureStateV47({});
  etat.unlockFlags.diggers = true;
  etat.unlockFlags.ringOfApathyMaxed = true;
  etat.titans.t3 = { kills: 28, nextAt: 0 };
  const ctx = { bosses: 100, stats: { power: 1e6, toughness: 1e6 } };
  const premier = combat("t4", { etat, ctx, valeur: PLUS_RIEN });
  const anneaux = premier.result.drops.filter((d) => d.set === "uug");
  assert.equal(anneaux.length, 1);
  assert.equal(anneaux[0].definitionId, "uug:ringGreed", "le premier anneau (Ring of Greed) est garanti");
  assert.equal(anneaux[0].level, 4, "UUG's rings lvl 4");
  assert.equal(premier.result.experience, 300);
  assert.equal(premier.result.ap, 60);

  const suivant = combat("t4", {
    etat: { ...premier.state, titans: { ...premier.state.titans, t4: { kills: 1, nextAt: 0 } } },
    ctx,
    valeur: PLUS_RIEN
  });
  assert.equal(suivant.result.drops.filter((d) => d.set === "uug").length, 0,
    "ensuite plus aucun anneau garanti : 2 % par anneau");
}

// ---- Titan 5 : Walderp (récompenses à la forme finale seulement) ----
{
  const etat = normalizeIdleAdventureStateV47({});
  etat.titans.t5 = { kills: 4, nextAt: 0, hiddenPanel: "" };
  const r = combat("t5", {
    etat,
    ctx: { bosses: 116, stats: { power: 1e12, toughness: 1e12 } },
    valeur: PLUS_RIEN
  });
  assert.equal(r.result.drops.filter((d) => d.set === "wanderer" || d.set === "rerednaw").length, 0,
    "les sets Wanderer's et S'rerednaW ne tombent qu'à 0,5 % par pièce");
  assert.equal(r.result.experience, 500);
  assert.equal(r.result.ap, 70);
  assert.ok(r.result.gold >= 4000000 && r.result.gold <= 5000000);
}

// ---- Pont vers les vraies monnaies (EXP, or, AP, progression de PP) ----
{
  let s = normalizeIdleNguState({ difficulty: "extreme" }, {}, 0);
  s.currencies.experience = 0;
  s.currencies.gold = 0;
  s.currencies.ap = 0;
  s.currencies.pp = 0;
  const avant = Math.random;
  Math.random = () => PLUS_RIEN;
  let r;
  try {
    r = applyIdleNguAction(
      s,
      { action: "adventure", adventure: { action: "titan", titan: "t1", stats: { power: 1300, toughness: 1300 } } },
      { bosses: 58 },
      1000
    );
  } catch (e) {
    Math.random = avant;
    throw e;
  }
  Math.random = avant;
  assert.equal(r.state.currencies.experience, 35, "EXP de titan créditée");
  assert.equal(r.state.currencies.ap, 10, "AP de titan créditée");
  assert.ok(r.state.currencies.gold >= 1000000, "or de titan crédité");
}

// PP progress : 250 000 par kill de The Beast, 1 000 000 = 1 PP
{
  let s = normalizeIdleNguState({ difficulty: "extreme" }, {}, 0);
  s.currencies.pp = 0;
  s.systems.tower.data = { ...(s.systems.tower.data || {}), ppProgress: 800000 };
  s.adventure.titans.t6 = { kills: 0, nextAt: 0 };
  const avant = Math.random;
  Math.random = () => PLUS_RIEN;
  let r;
  try {
    r = applyIdleNguAction(
      s,
      { action: "adventure", adventure: { action: "titan", titan: "t6", stats: { power: 1e9, toughness: 1e9 } } },
      { bosses: 132 },
      1000
    );
  } finally {
    Math.random = avant;
  }
  assert.equal(r.result.ppProgress, 250000);
  assert.equal(r.state.currencies.pp, 1, "800 000 + 250 000 = 1 PP entier");
  assert.equal(r.state.systems.tower.data.ppProgress, 50000, "le reste (50 000) est conservé");
}


// Souhait 3 (meilleures récompenses V2/3/4) et souhait 73 (QP de The Beast)
{
  let st = normalizeIdleNguState({ difficulty: "extreme" }, {}, 0);
  st.currencies.qp = 0;
  st.systems.wishes.data.tracks[3] = { level: 3 };
  st.systems.wishes.data.tracks[73] = { level: 1 };
  st.adventure.titans.t6 = { kills: 0, nextAt: 0 };
  const avant = Math.random;
  Math.random = () => PLUS_RIEN;
  let r;
  try {
    r = applyIdleNguAction(
      st,
      { action: "adventure", adventure: { action: "titan", titan: "t6", difficulty: "brutal", stats: { power: 1e13, toughness: 1e13 } } },
      { bosses: 132 },
      1000
    );
  } finally {
    Math.random = avant;
  }
  assert.equal(r.result.experience, 975, "750 EXP x 1,3 (souhait 3 niveau 3, Brutal)");
  assert.equal(r.result.ppProgress, 325000, "250 000 x 1,3");
  assert.ok(Math.abs(r.result.qp - 1.3) < 1e-9, "1 QP de base x 1,3");
  assert.ok(Math.abs(r.state.currencies.qp - 1.3) < 1e-9, "QP créditée");
  assert.equal(r.state.currencies.experience, 975);
}
{
  // sans le souhait 73 : aucun QP ; niveau 1 du souhait 3 en Hard : x1,1 seulement
  let st = normalizeIdleNguState({ difficulty: "extreme" }, {}, 0);
  st.systems.wishes.data.tracks[3] = { level: 1 };
  st.adventure.titans.t6 = { kills: 0, nextAt: 0 };
  const avant = Math.random;
  Math.random = () => PLUS_RIEN;
  let r;
  try {
    r = applyIdleNguAction(
      st,
      { action: "adventure", adventure: { action: "titan", titan: "t6", difficulty: "hard", stats: { power: 1e13, toughness: 1e13 } } },
      { bosses: 132 },
      1000
    );
  } finally {
    Math.random = avant;
  }
  assert.equal(r.result.qp, 0);
  assert.equal(r.result.experience, 825, "750 x 1,1");
}


// Digger Slot : "Scrap of Paper (set)" (1 objet), plus le set Jake
{
  const jake = tirage(PLUS_RIEN, () => {
    const etat = normalizeIdleAdventureStateV47({});
    etat.titans.t2 = { kills: 24, nextAt: 0 };
    etat.unlockFlags.yggdrasil = true;
    return applyIdleAdventureActionV47(etat, { action: "titan", titan: "t3" }, { bosses: 82, stats: { power: 22000, toughness: 14000 } }, 1000);
  });
  assert.ok(jake.result.drops.some((d) => d.definitionId === "scrap:paper" && d.level === 0), "A Scrap of Paper lvl 0 garanti");

  let st = normalizeIdleAdventureStateV47({});
  st = applyIdleAdventureActionV47(st, { action: "addItem", definitionId: "scrap:paper", level: 100 }, { bosses: 100 }, 1).state;
  assert.equal(st.completedSets.scrap, true);
  assert.equal(st.setRewards.diggerSlot, 1, "un Digger Slot à la complétion du Scrap of Paper Set");

  let jakeSet = normalizeIdleAdventureStateV47({});
  for (const slot of ["head", "chest", "legs", "boots", "weapon", "tie", "paperweight"]) {
    jakeSet = applyIdleAdventureActionV47(jakeSet, { action: "addItem", definitionId: "jake:" + slot, level: 100 }, { bosses: 100 }, 1).state;
  }
  assert.equal(jakeSet.completedSets.jake, true);
  assert.equal(jakeSet.setRewards.diggerSlot, 0, "le set Jake ne donne plus de Digger Slot (7 000 EXP + Wandoos MEH)");
}

console.log("idle-adventure-titan-wiki-loot-and-rewards: OK");
