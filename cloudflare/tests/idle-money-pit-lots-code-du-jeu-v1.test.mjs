import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { IDLE_MONEY_PIT_REWARDS_V1, moneyPitSnapshotV1 } from "../src/idle-ngu-snapshot.js";

/* Lu dans le code du jeu (PitController::tier1Reward à tier11Reward, build 1260, 2026-11-16) : un entier uniforme, un lot par cas. */
assert.deepEqual(IDLE_MONEY_PIT_REWARDS_V1.map((t) => t.length), [0, 8, 9, 9, 9, 10, 11, 12, 12, 12, 12, 12, 5, 5, 5, 5, 5], "nombre de cas par palier (Random.Range - 1)");
for (const [i, lots] of IDLE_MONEY_PIT_REWARDS_V1.entries()) {
  for (const lot of lots) {
    assert.ok(!("adventureStats" in lot), "Puissance et Endurance sont deux lots distincts (palier " + i + ")");
    const effets = Object.keys(lot).filter((k) => !["wandoosMax", "type", "parJets"].includes(k));
    assert.equal(effets.length, 1, "un lot = un seul effet (palier " + i + ")");
  }
}
const paliers1a4 = IDLE_MONEY_PIT_REWARDS_V1.slice(1, 5);
for (const lots of paliers1a4) assert.deepEqual(lots.filter((l) => l.boost).map((l) => l.type), ["power", "toughness", "special"], "3 cas de boost");
assert.equal(IDLE_MONEY_PIT_REWARDS_V1[1].filter((l) => l.rien).length, 1, "palier 1 : un cas « rien »");

const ctx = { bosses: 100 };
function partie() {
  const s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.systems.moneyPit.unlocked = true;
  for (const id of ["infinityCube", "wandoos", "yggdrasil"]) s.systems[id].unlocked = true;
  return s;
}
function jeter(s, or, alea) {
  s.currencies.gold = or;
  const old = Math.random;
  Math.random = () => alea;
  try { return applyIdleNguAction(s, { action: "moneyPit" }, ctx, 10_000_000); } finally { Math.random = old; }
}
{
  // palier 5 (1e13) : 10 cas, le 4e = niveau de tout l'équipement porté
  const s = partie();
  const arme = s.adventure.inventory.find((x) => x && x.kind === "cube");   /* un accessoire porté (le Cube de départ) */
  assert.ok(arme, "le Cube de départ existe");
  s.adventure.equipment.accessories = [arme.id];
  arme.level = 99;
  const r = jeter(s, 1e13, 3.5 / 10);
  assert.equal(r.result.tier, 5);
  const apres = r.state.adventure.inventory.find((x) => x.id === arme.id);
  assert.equal(apres.level, 100, "l'équipement porté gagne 1 niveau, plafonné à 100");
  assert.equal(r.result.reward.levelUps, 1);
  r.state.systems.moneyPit.data.nextAt = 0;
  const r2 = jeter(r.state, 1e13, 3.5 / 10);
  assert.equal(r2.state.adventure.inventory.find((x) => x.id === arme.id).level, 100, "plafond de 100 respecté");
}
{
  // palier 1 (1e5) : 8 cas, le 8e = rien (aucune monnaie sauf AP)
  const r = jeter(partie(), 1e5, 7.5 / 8);
  assert.equal(r.result.tier, 1);
  assert.deepEqual(Object.keys(r.result.reward).filter((k) => k !== "ap"), []);
}
{
  // paliers 12 à 16 : seulement avec le souhait n°4 ; sans lui tout reste au palier 11
  const sans = partie();
  assert.equal(moneyPitSnapshotV1(Object.assign(sans, { currencies: { ...sans.currencies, gold: 1e55 } })).tier, 11, "sans le souhait n°4 : palier 11");
  const avec = partie();
  avec.currencies.gold = 1e55;
  avec.systems.wishes = avec.systems.wishes || {};
  const origine = avec.systems.wishes;
  const wishes = origine.data && origine.data.tracks ? origine.data.tracks : null;
  assert.ok(wishes && wishes[4], "le souhait n°4 existe dans l état");
  avec.difficulty = "difficile";   /* le souhait n°4 n existe qu en Evil et au-dela */
  wishes[4].level = 1;
  const sn = moneyPitSnapshotV1(avec, ctx);
  assert.equal(sn.tier, 13, "1E55 avec le souhait n°4 : palier 13 (< 1E60)");
  assert.equal(sn.min, 1e55);
  assert.equal(sn.suivant, 1e60);
  /* 5 cas ; EXP 3000 x (jets du run + 1) ; le palier 13 : fractions 0,25 / 0,025 */
  const exp = sn.lots.find((l) => l.experience);
  assert.equal(exp.experience, 3000, "premier jet du run : facteur 1");
  /* lots concrets : graines de grenade (Yggdrasil débloqué) > 0 ; pilule absente tant que Blood Magic n'est pas débloquée */
  assert.ok(sn.lots.find((l) => l.seeds).seeds > 0, "graines de grenade : valeur concrète");
  avec.systems.bloodMagic.unlocked = false;
  assert.ok(!moneyPitSnapshotV1(avec, ctx).lots.some((l) => l.pilule !== undefined), "pas de pilule sans Blood Magic");
  avec.systems.bloodMagic.unlocked = true;
  const avecSang = moneyPitSnapshotV1(avec, ctx).lots;
  assert.ok(avecSang.some((l) => l.pilule !== undefined), "la pilule apparaît avec Blood Magic");
  /* tirage de bout en bout : l'EXP du palier 13 (3e des 5 cas) */
  {
    avec.systems.moneyPit.unlocked = true;
    avec.currencies.gold = 1e55;
    const r = jeter(avec, 1e55, 2.5 / avecSang.length);
    assert.equal(r.result.tier, 13);
    assert.equal(r.result.reward.experience, 3000, "EXP 3000 x 1 (premier jet)");
  }
  avec.systems.moneyPit.data.tossesThisRun = 4;
  assert.equal(moneyPitSnapshotV1(avec, ctx).lots.find((l) => l.experience).experience, 15000, "5e jet : facteur 5");
  avec.systems.moneyPit.data.tossesThisRun = 40;
  assert.equal(moneyPitSnapshotV1(avec, ctx).lots.find((l) => l.experience).experience, 30000, "facteur plafonné à 10");
}
console.log("idle-money-pit-lots-code-du-jeu-v1 OK");
