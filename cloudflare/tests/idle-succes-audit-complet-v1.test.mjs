import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";
import { IDLE_ACHIEVEMENTS_V1, idleAchievementsEvaluateV1, idleAchievementsBpV1 } from "../src/idle-achievements-v1.js";
import { normalizeIdleNguState } from "../src/idle-ngu-progression.js";
import { achievementMetricsV1 } from "../src/idle-ngu-bonus.js";

/*
 * AUDIT COMPLET des succès (Norman, 2026-11-14 : « il faut vraiment que tout y soit »). Pour CHACUN des 153 succès, un état de jeu réel (pas des mesures inventées) qui remplit sa condition par les voies du jeu, puis la mesure du moteur
 * (achievementMetricsV1) et l'évaluation (idleAchievementsEvaluateV1) doivent le débloquer. Un succès qui ne se débloque pas ici est INOBTENABLE : le test échoue en le nommant.
 * Les cas qui exigent un combat (explosif survécu, titans sans coup) ont leur propre test : idle-succes-secrets-obtenables-v1.
 */
const t0 = 1_000_000;
const parId = new Map(IDLE_ACHIEVEMENTS_V1.map((a) => [a.id, a]));
function niveau69() {
  let s = normalizeIdleAdventureStateV47({});
  const add = (definitionId) => { const r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId, level: 69 }, {}); s = r.state; return s.inventory.find((x) => x.id === r.result.id); };
  for (const [def, slot] of [["sewers:head", "head"], ["sewers:chest", "chest"], ["sewers:legs", "legs"], ["sewers:boots", "boots"], ["sewers:weapon", "weapon"]]) {
    const o = add(def);
    s = applyIdleAdventureActionV47(s, { action: "equip", id: o.id, slot }, {}).state;
  }
  return s;
}
/* Prépare l'état qui remplit la condition de ce succès, comme le jeu le fait. */
function etatPour(a) {
  const e = normalizeIdleNguState({}, {}, t0);
  e.adventure = normalizeIdleAdventureStateV47({});
  const f = e.adventure.unlockFlags;
  const ressource = { energyPower: ["energy", "power"], magicPower: ["magic", "power"], energyCap: ["energy", "cap"], magicCap: ["magic", "cap"], energyBars: ["energy", "bars"], magicBars: ["magic", "bars"] }[a.group];
  if (ressource) { e.resources[ressource[0]][ressource[1]] = a.threshold; return e; }
  if (a.group === "boss") { e.records.highestBoss = a.threshold; return e; }
  if (a.group === "rebirth") { e.records.totalRebirths = a.threshold; return e; }
  switch (a.id) {
    case "secretExploder": f.exploderSurvived = true; break;
    case "secretLevel69": e.adventure = niveau69(); break;
    case "secretNguMenu": e.systems.ngu.unlocked = true; break;
    case "secretYggdrasilMenu": e.systems.yggdrasil.unlocked = true; break;
    case "secretBeardsMenu": e.systems.beards.unlocked = true; break;
    case "secretNoHitGrb": f.noHit_t1 = true; break;
    case "secretNoHitGct": f.noHit_t2 = true; break;
    case "secretNoHitJake": f.noHit_t3 = true; break;
    case "secretNoHitUug": f.noHit_t4 = true; break;
    case "secretNoHitWalderp": f.noHit_t5 = true; break;
    case "secretAtCorner": e.records.cornerClicked = 1; break;
    case "secretWalderpFinal": f.walderpFinalDefeated = true; break;
    case "secretSpeedrun": e.records.speedrunBonusClaimed = 1; break;
    case "secretBeastV1": f.beastDefeated_easy = true; break;
    case "secretBeastV2": f.beastDefeated_normal = true; break;
    case "secretBeastV3": f.beastDefeated_hard = true; break;
    case "secretBeastV4": f.beastDefeated_brutal = true; break;
    case "secretEvil": e.difficulty = "difficile"; break;
    default: assert.fail("succès sans condition connue de l'audit : " + a.id);
  }
  return e;
}

const inobtenables = [];
for (const a of IDLE_ACHIEVEMENTS_V1) {
  const e = etatPour(a);
  const gagnes = idleAchievementsEvaluateV1(e, achievementMetricsV1(e), 1);
  if (!gagnes.includes(a.id)) inobtenables.push(a.id + " (" + a.name + ")");
}
assert.deepEqual(inobtenables, [], "succès INOBTENABLES : " + inobtenables.join(" ; "));

// Un joueur qui a tout fait : les 153 débloqués ; le total des BP est celui des lignes du catalogue.
{
  const e = normalizeIdleNguState({}, {}, t0);
  e.adventure = niveau69();
  Object.assign(e.adventure.unlockFlags, { exploderSurvived: true, noHit_t1: true, noHit_t2: true, noHit_t3: true, noHit_t4: true, noHit_t5: true, walderpFinalDefeated: true, beastDefeated_easy: true, beastDefeated_normal: true, beastDefeated_hard: true, beastDefeated_brutal: true });
  Object.assign(e.records, { highestBoss: 300, totalRebirths: 10000, cornerClicked: 1, speedrunBonusClaimed: 1 });
  for (const [r, c] of [["energy", ["power", "cap", "bars"]], ["magic", ["power", "cap", "bars"]]]) for (const k of c) e.resources[r][k] = 1e13;
  for (const id of ["ngu", "yggdrasil", "beards"]) e.systems[id].unlocked = true;
  e.difficulty = "difficile";
  const gagnes = idleAchievementsEvaluateV1(e, achievementMetricsV1(e), 1);
  assert.equal(gagnes.length, 153, "tous les succès se débloquent chez un joueur qui a tout fait");
  assert.equal(idleAchievementsBpV1(e), IDLE_ACHIEVEMENTS_V1.reduce((s, a) => s + a.bp, 0), "total des BP = somme des lignes");
}
console.log("idle-succes-audit-complet-v1 : OK (" + IDLE_ACHIEVEMENTS_V1.length + " succès obtenables)");
