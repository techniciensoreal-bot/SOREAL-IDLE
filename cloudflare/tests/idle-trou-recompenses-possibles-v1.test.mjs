// Trou sans fond (Norman, 2026-11-02) : « suivant ce que le joueur a en stock, montre-lui les récompenses possibles pour son palier ».
// Le moteur envoie state.systemes.puitRecompenses = { tier, min, suivant, lots, ap } : palier de l'Or EN STOCK, lots lus à la source du tirage, aucune probabilité (le wiki n'en publie pas), anti-spoil (règle n°2).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { IDLE_MONEY_PIT_REWARDS_V1, IDLE_MONEY_PIT_SEUILS_V1, moneyPitSnapshotV1 } from "../src/idle-ngu-snapshot.js";

function etat(gold, debloques = []) {
  const s = normalizeIdleNguState({}, { bosses: 100 }, 1_000_000);
  s.systems.moneyPit.unlocked = true;
  for (const id of ["infinityCube", "wandoos", "yggdrasil"]) s.systems[id].unlocked = false;
  for (const id of debloques) s.systems[id].unlocked = true;
  s.currencies.gold = gold;
  return s;
}
const TOUS = ["infinityCube", "wandoos", "yggdrasil"];

// 1. palier de l'Or en stock = palier que le tirage utiliserait (mêmes seuils que le wiki : 1E5, 1E7, 1E9, 1E11, 1E13, 1E15, 1E18, 1E21, 1E24, 1E27, 1E30)
assert.deepEqual([...IDLE_MONEY_PIT_SEUILS_V1], [1e5, 1e7, 1e9, 1e11, 1e13, 1e15, 1e18, 1e21, 1e24, 1e27, 1e30]);
for (const [gold, tier] of [[0, 0], [99999, 0], [1e5, 1], [9.9e6, 1], [1e7, 2], [1e9, 3], [1e11, 4], [1e13, 5], [1e15, 6], [1e18, 7], [1e21, 8], [1e24, 9], [1e27, 10], [1e30, 11], [1e40, 11]]) {
  const sn = moneyPitSnapshotV1(etat(gold, TOUS));
  assert.equal(sn.tier, tier, `or ${gold} : palier ${tier}`);
  if (gold >= 1e5) {
    const r = applyIdleNguAction(etat(gold, TOUS), { action: "moneyPit" }, { bosses: 100 }, 10_000_000);
    assert.equal(r.result.tier, sn.tier, `or ${gold} : le tirage utilise le palier affiché`);
  }
}

// 2. tout débloqué : les lots envoyés sont EXACTEMENT ceux du tirage du palier (même ordre, mêmes valeurs ; l'EXP est multipliée par le bonus d'EXP, ici 1)
for (let tier = 1; tier <= 11; tier += 1) {
  const sn = moneyPitSnapshotV1(etat(IDLE_MONEY_PIT_SEUILS_V1[tier - 1], TOUS));
  assert.deepEqual(sn.lots, IDLE_MONEY_PIT_REWARDS_V1[tier], `palier ${tier} : lots`);
  assert.equal(sn.min, IDLE_MONEY_PIT_SEUILS_V1[tier - 1]);
  assert.equal(sn.suivant, tier < 11 ? IDLE_MONEY_PIT_SEUILS_V1[tier] : 0);
}
// chaque tirage possible est dans la liste annoncée
for (let tier = 1; tier <= 11; tier += 1) {
  const lots = moneyPitSnapshotV1(etat(IDLE_MONEY_PIT_SEUILS_V1[tier - 1], TOUS)).lots;
  const n = lots.length;
  for (let k = 0; k < n; k += 1) {
    const old = Math.random; Math.random = () => (k + 0.5) / n;
    let r;
    try { r = applyIdleNguAction(etat(IDLE_MONEY_PIT_SEUILS_V1[tier - 1], TOUS), { action: "moneyPit" }, { bosses: 100 }, 10_000_000); } finally { Math.random = old; }
    const lot = lots[k];
    if (lot.adventureStats) assert.equal(r.result.reward.adventureStats, lot.adventureStats);
    if (lot.adventureHp) assert.equal(r.result.reward.adventureHp, lot.adventureHp);
    if (lot.seeds) assert.equal(r.result.reward.seeds, lot.seeds);
    if (lot.boost) assert.equal(r.result.boost.strength, lot.boost);
  }
}

// 3. anti-spoil : aucun lot d'un système non débloqué (Cube de l'Infini, Wandoos, Yggdrasil), aucun total
{
  const sn = moneyPitSnapshotV1(etat(1e30, []));
  assert.ok(sn.lots.length > 0, "les lots d'Aventure et d'EXP restent");
  for (const l of sn.lots) {
    assert.ok(!l.cubePower && !l.cubeToughness && !l.cubeBoth && !l.wandoos && !l.seeds, "aucun lot de système verrouillé : " + JSON.stringify(l));
  }
  const avecCube = moneyPitSnapshotV1(etat(1e30, ["infinityCube"]));
  assert.ok(avecCube.lots.some((l) => l.cubePower) && !avecCube.lots.some((l) => l.seeds || l.wandoos), "seul le Cube est débloqué");
  const avecYgg = moneyPitSnapshotV1(etat(1e30, ["yggdrasil"]));
  assert.ok(avecYgg.lots.some((l) => l.seeds) && !avecYgg.lots.some((l) => l.cubePower || l.wandoos), "seul Yggdrasil est débloqué");
  const avecWan = moneyPitSnapshotV1(etat(1e30, ["wandoos"]));
  assert.ok(avecWan.lots.some((l) => l.wandoos) && !avecWan.lots.some((l) => l.cubePower || l.seeds), "seul Wandoos est débloqué");
}

// 4. fidélité (règle n°1) : aucune probabilité inventée dans la réponse ; sous 100 000 Or ou Money Pit verrouillé : rien à montrer
{
  const sn = moneyPitSnapshotV1(etat(5e6, TOUS));
  assert.deepEqual(Object.keys(sn).sort(), ["ap", "lots", "min", "suivant", "tier"]);
  assert.ok(!JSON.stringify(sn).match(/poids|prob|chance|pct/i), "aucun poids ni pourcentage");
  const zero = moneyPitSnapshotV1(etat(1000, TOUS));
  assert.deepEqual(zero.lots, []);
  assert.equal(zero.ap, 0);
  const ferme = etat(1e9, TOUS); ferme.systems.moneyPit.unlocked = false;
  assert.equal(moneyPitSnapshotV1(ferme), null, "Money Pit verrouillé : rien n'est envoyé");
  // AP versé en plus du lot : floor(log10(or)) avec le bonus AP commun (wiki « The pit also rewards AP using the formula log10(gold) »)
  assert.ok(moneyPitSnapshotV1(etat(1e9, TOUS)).ap >= 9);
}

// 5. la pièce d'état est bien dans la réponse du moteur
const snap = readFileSync("cloudflare/src/idle-ngu-snapshot.js", "utf8");
assert.ok(snap.includes("puitRecompenses: moneyPitSnapshotV1(state),"), "champ de réponse ajouté (non cassant : rien n'est renommé ni retiré)");

console.log("idle-trou-recompenses-possibles-v1 : OK");
