import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, syncIdleNguState, IDLE_NGU_YGG_FRUITS } from "../src/idle-ngu-progression.js";
import { apercuYggFruitV1 } from "../src/idle-ngu-systemes.js";
import { idleYggExtraSnapshotV1 } from "../src/idle-yggdrasil-extra-v1.js";

/*
 * Norman (2026-10-22) : sur chaque fruit prêt de Yggdrasil, le nombre de graines que donnerait « Récolter » et les bonus que donnerait « Manger ». L'aperçu est une LECTURE SEULE qui copie les formules de
 * useYggFruit : ce test le compare, fruit par fruit, à ce que l'action réelle donne vraiment (sans et avec Poop, première récolte ou non).
 */
const ctx = { bosses: 150 };
const near = (a, b, m) => assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)), m + " : " + a + " != " + b);

function pret(id, tier, { firstHarvest = false, poop = 0 } = {}) {
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 0);
  s.systems.yggdrasil.unlocked = true;
  const f = s.systems.yggdrasil.data.fruits[id];
  f.tier = tier; f.active = true; f.growthHours = tier + 0.4; f.firstHarvestThisRun = firstHarvest;
  s.selloutEffects = s.selloutEffects || {};
  s.selloutEffects.poop = poop;
  return s;
}
const reel = (s, id, mode, poop) => applyIdleNguAction(s, { action: "useYggFruit", fruit: id, mode, poop }, ctx, 1);

for (const def of IDLE_NGU_YGG_FRUITS) {
  for (const [tier, firstHarvest, avecPoop] of [[3, false, false], [7, true, false], [5, false, true], [9, true, true]]) {
    /* L'action réelle commence par synchroniser l'état (même instant) : l'aperçu est calculé sur l'état synchronisé, comme dans le snapshot. */
    const base = syncIdleNguState(pret(def.id, tier, { firstHarvest, poop: 3 }), ctx, 1);
    const f = base.systems.yggdrasil.data.fruits[def.id];
    const facteur = avecPoop ? 1.5 : 1;
    const ap = apercuYggFruitV1(base, def, f, facteur);
    const etiquette = def.id + " T" + tier + (firstHarvest ? " 1re récolte" : "") + (avecPoop ? " poop" : "");
    // Récolter : graines.
    const avantR = pret(def.id, tier, { firstHarvest, poop: 3 });
    const r = reel(avantR, def.id, "harvest", avecPoop);
    assert.equal(r.result.seeds, ap.harvest.seeds, etiquette + " : graines récoltées");
    // Manger : graines + effet.
    const e = reel(pret(def.id, tier, { firstHarvest, poop: 3 }), def.id, "eat", avecPoop);
    assert.equal(e.result.seeds, ap.eat.seeds, etiquette + " : graines mangées");
    const res = e.result;
    const dict = Object.fromEntries(ap.eat.effets);
    if (def.effect === "gold") near(dict.gold, res.gold, etiquette + " : or");
    if (def.effect === "powerAlpha") assert.equal(dict.powerAlpha, e.state.systems.yggdrasil.data.runPowerAlphaValue - 0, etiquette + " : Power α");
    if (def.effect === "adventure") assert.equal(dict.adventure, res.adventureGain, etiquette + " : Adventure");
    if (def.effect === "experience") assert.equal(dict.experience, res.experience, etiquette + " : EXP");
    if (def.effect === "luck") near(dict.luck, res.dropPct, etiquette + " : chance de drop");
    if (def.effect === "powerBeta") assert.equal(dict.powerBeta, res.powerBeta, etiquette + " : Power β");
    if (def.effect === "numbers") assert.equal(dict.numbers, res.numbers, etiquette + " : Nombres");
    if (def.effect === "ap") assert.equal(dict.ap, res.ap, etiquette + " : AP");
    if (def.effect === "pp") near(dict.pp, res.ppProgress / 1e6, etiquette + " : PP");
    if (def.effect === "macguffinAlpha" || def.effect === "macguffinBeta") assert.equal(dict.macguffin, res.macguffinLevels, etiquette + " : MacGuffin");
    if (def.effect === "powerDelta") assert.equal(dict.powerDelta, res.powerDelta, etiquette + " : Power δ");
    if (def.effect === "quirks") assert.equal(dict.quirks, res.qp, etiquette + " : QP");
    if (def.effect === "mayo") near(dict.mayo, res.mayoProgress, etiquette + " : mayo");
    if (def.effect === "seeds") assert.equal(ap.eat.effets.length, 0, etiquette + " : un fruit de graines n'a pas d'autre effet");
  }
}

// L'aperçu ne modifie rien.
{
  const s = pret("gold", 5, { poop: 2 });
  const avant = JSON.stringify(s);
  apercuYggFruitV1(s, IDLE_NGU_YGG_FRUITS.find((d) => d.id === "gold"), s.systems.yggdrasil.data.fruits.gold, 1.5);
  assert.equal(JSON.stringify(s), avant, "lecture seule");
}

// Snapshot : seulement pour un fruit PRÊT et découvert ; la variante Poop seulement avec de la Poop en stock.
{
  const s = pret("gold", 4, { poop: 0 });
  const defs = IDLE_NGU_YGG_FRUITS;
  const deps = { maxTier: 10, tierCost: () => 1, apercu: (def, f, pf) => apercuYggFruitV1(s, def, f, pf) };
  let snap = idleYggExtraSnapshotV1(s, defs, deps);
  assert.ok(snap.fruits.gold.apercu && snap.fruits.gold.apercu.sans && snap.fruits.gold.apercu.avec === null, "prêt, sans poop en stock");
  assert.equal(snap.fruits.powerAlpha.apercu, null, "fruit non actif : aucun aperçu");
  s.selloutEffects.poop = 2;
  snap = idleYggExtraSnapshotV1(s, defs, deps);
  assert.ok(snap.fruits.gold.apercu.avec.harvest.seeds >= snap.fruits.gold.apercu.sans.harvest.seeds, "avec poop : au moins autant");
  s.systems.yggdrasil.data.fruits.gold.growthHours = 0.5;
  snap = idleYggExtraSnapshotV1(s, defs, deps);
  assert.equal(snap.fruits.gold.apercu, null, "fruit qui pousse encore : aucun aperçu");
}
console.log("idle-ygg-apercu-v1: OK");
