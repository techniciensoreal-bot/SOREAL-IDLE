import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_CUBE_TIERS_V1,
  idleAdventureCubeTierV1,
  idleAdventureEquipmentStatsV47,
  idleAdventureSnapshotV47,
  normalizeIdleAdventureStateV47,
  createIdleAdventureStateV47
} from "../src/idle-adventure-v47.js";

function stateAvecCube(cube){
  const s=createIdleAdventureStateV47();
  s.cube=cube;
  return normalizeIdleAdventureStateV47(s);
}

/*
 * Cube Tiers (2026-09-11) — sourcé directement de la page wiki
 * "Infinity Cube" (ngu-idle.fandom.com, vérifiée au navigateur le
 * 2026-09-11 après que Norman a insisté : "TU dois... toujours ouvrir
 * la page de NGU wiki pour être certain"). "Cube tiers bonuses are
 * permanently unlocked and automatically applied upon reaching a
 * specific amount of total stats (cube's Power + Toughness)." Seuils
 * et pourcentages copiés tels quels du tableau du wiki.
 */

// Seuils et bonus exacts du tableau wiki (Tier 0 à 10).
const attendus=[
  {tier:0,seuil:0,dropChancePct:0,goldDropsPct:0,hackSpeedPct:0,wishSpeedPct:0},
  {tier:1,seuil:100,dropChancePct:50,goldDropsPct:0,hackSpeedPct:0,wishSpeedPct:0},
  {tier:2,seuil:1000,dropChancePct:70,goldDropsPct:50,hackSpeedPct:0,wishSpeedPct:0},
  {tier:3,seuil:10000,dropChancePct:90,goldDropsPct:123.11,hackSpeedPct:0,wishSpeedPct:0},
  {tier:4,seuil:100000,dropChancePct:110,goldDropsPct:208.56,hackSpeedPct:0,wishSpeedPct:0},
  {tier:5,seuil:1000000,dropChancePct:130,goldDropsPct:303.14,hackSpeedPct:0,wishSpeedPct:0},
  {tier:6,seuil:10000000,dropChancePct:150,goldDropsPct:405.16,hackSpeedPct:0,wishSpeedPct:0},
  {tier:7,seuil:100000000,dropChancePct:170,goldDropsPct:513.53,hackSpeedPct:0,wishSpeedPct:0},
  {tier:8,seuil:1000000000,dropChancePct:190,goldDropsPct:627.48,hackSpeedPct:10,wishSpeedPct:0},
  {tier:9,seuil:10000000000,dropChancePct:210,goldDropsPct:746.43,hackSpeedPct:15,wishSpeedPct:10},
  {tier:10,seuil:100000000000,dropChancePct:230,goldDropsPct:869.93,hackSpeedPct:20,wishSpeedPct:20}
];
assert.equal(IDLE_ADVENTURE_CUBE_TIERS_V1.length,11,"Il doit y avoir exactement 11 tiers (0 à 10), comme le wiki.");
attendus.forEach((att,i)=>{
  assert.deepEqual(IDLE_ADVENTURE_CUBE_TIERS_V1[i],att,`Tier ${att.tier} doit correspondre exactement au wiki.`);
});

// idleAdventureCubeTierV1 : sélectionne le tier le plus haut atteint par
// power+toughness combinés, jamais un seuil dépassé.
assert.equal(idleAdventureCubeTierV1({power:0,toughness:0}).tier,0);
assert.equal(idleAdventureCubeTierV1({power:50,toughness:49}).tier,0,"99 combiné ne doit pas atteindre le tier 1 (seuil 100).");
assert.equal(idleAdventureCubeTierV1({power:50,toughness:50}).tier,1,"100 combiné doit atteindre pile le tier 1.");
assert.equal(idleAdventureCubeTierV1({power:600000000000,toughness:0}).tier,10,"Un total dépassant largement le dernier seuil doit plafonner au tier 10 (pas au-delà).");

// suivant : doit exposer le prochain palier, ou null au tier max.
assert.equal(idleAdventureCubeTierV1({power:0,toughness:0}).suivant.tier,1);
assert.equal(idleAdventureCubeTierV1({power:600000000000,toughness:0}).suivant,null,"Aucun tier au-delà de 10 — suivant doit être null, pas un tier inventé.");

// Le bonus de drop chance du tier doit réellement influencer rollKill
// (gameplay), pas seulement un affichage — jamais un cube tier "décoratif".
{
  const s1=normalizeIdleAdventureStateV47(createIdleAdventureStateV47());
  const s2=stateAvecCube({power:600,toughness:600,unlocked:true}); // total 1200 => tier 2 (+70%)

  // On ne peut pas contrôler Math.random() directement ici sans mock ;
  // on vérifie donc indirectement via le champ stats.specials.dropChancePct
  // (dérivé de la même fonction idleAdventureCubeTierV1) et via le code
  // source de rollKill, qui doit inclure idleAdventureCubeTierV1(s.cube).
  const workerSource = (await import("node:fs")).readFileSync(
    new URL("../src/idle-adventure-v47.js", import.meta.url),
    "utf8"
  );
  assert.ok(
    workerSource.includes("idleAdventureCubeTierV1(s.cube).dropChancePct/100"),
    "rollKill doit inclure le bonus de drop chance du tier du Cube dans son calcul RÉEL, pas seulement dans l'affichage."
  );

  const stats1=idleAdventureEquipmentStatsV47(s1).specials.dropChancePct;
  const stats2=idleAdventureEquipmentStatsV47(s2).specials.dropChancePct;
  assert.ok(stats2>stats1,"Le % de chance de drop affiché doit augmenter avec le tier du Cube.");
  assert.equal(stats2-stats1,70,"Le tier 2 (+70% drop chance) doit se refléter exactement dans le % affiché.");
}

// Exposition dans le snapshot (consommé par le client).
{
  const snap=idleAdventureSnapshotV47(stateAvecCube({power:60,toughness:40,unlocked:true}),0);
  assert.ok(snap.cubeTier,"Le snapshot doit exposer cubeTier pour l'affichage client.");
  assert.equal(snap.cubeTier.tier,1);
  assert.equal(snap.cubeTier.totalStats,100);
}

console.log("idle-adventure-cube-tiers: OK");
