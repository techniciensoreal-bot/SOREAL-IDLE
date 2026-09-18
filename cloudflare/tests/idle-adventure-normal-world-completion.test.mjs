import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_ZONES,IDLE_ADVENTURE_SETS,IDLE_ADVENTURE_SPECIALS,
  normalizeIdleAdventureStateV47,applyIdleAdventureActionV47,idleAdventureSnapshotV47
} from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-11) : "tu as tout sur le wiki, utilise ton navigateur."
 * Complète les 4 zones du monde "Normal" qui manquaient (17 Beardverse,
 * 19 Badly Drawn World, 20 Boring-Ass Earth, 22 Chocolate World) — Manual
 * P/T et p/t de set copiés en direct des pages wiki NGU (fandom), pas
 * inventés. Chaque récompense de set n'inclut QUE ce qui correspond à un
 * mécanisme déjà existant côté SOREAL (jamais une approximation d'un
 * système non construit comme Beards/MacGuffins/coffre rare).
 */

// Zones : Manual P/T + boss + set, copiés du wiki (vérifiés au navigateur).
const gates=Object.fromEntries(IDLE_ADVENTURE_ZONES.map(z=>[z.id,z]));
// Re-audit 2026-09-13 (Norman : "boss ennemis pas pareil en aventure") :
// Toughness re-vérifiée en direct au navigateur (capture d'écran de la
// ligne du tableau Adventure_Mode) = 550 000, pas 850 000 — le wiki a dû
// changer depuis la vérification du 2026-09-11.
assert.deepEqual(
  [gates.beardverse.boss,gates.beardverse.p,gates.beardverse.t,gates.beardverse.set],
  [108,1300000,550000,"beardverse"]
);
assert.deepEqual(
  [gates.badly.boss,gates.badly.p,gates.badly.t,gates.badly.set],
  [116,18000000,11000000,"badly"]
);
assert.deepEqual(
  [gates.boring.boss,gates.boring.p,gates.boring.t,gates.boring.set],
  [124,180000000,90000000,"stealth"]
);
assert.deepEqual(
  [gates.chocolate.boss,gates.chocolate.p,gates.chocolate.t,gates.chocolate.set],
  [137,70000000000,50000000000,"choco"]
);
assert.ok(
  IDLE_ADVENTURE_ZONES.every(z=>z.avatarLevel<=6),
  "Aucune zone ne doit inventer un palier d'avatar au-delà de 6 (Mega Lands), le seul confirmé exister visuellement."
);

// Sets : p/t = Total Power/Toughness Max du wiki, 5 emplacements standard.
assert.deepEqual(
  [IDLE_ADVENTURE_SETS.beardverse.p,IDLE_ADVENTURE_SETS.beardverse.t,IDLE_ADVENTURE_SETS.beardverse.slots],
  [175000,111000,["head","chest","legs","boots","weapon"]]
);
assert.deepEqual(
  [IDLE_ADVENTURE_SETS.badly.p,IDLE_ADVENTURE_SETS.badly.t],
  [1000000,530000]
);
assert.deepEqual(
  [IDLE_ADVENTURE_SETS.stealth.p,IDLE_ADVENTURE_SETS.stealth.t],
  [2040000,1054000]
);
assert.deepEqual(
  [IDLE_ADVENTURE_SETS.choco.p,IDLE_ADVENTURE_SETS.choco.t],
  [7780000,3286000]
);

// Récompenses : uniquement ce qui a un équivalent SOREAL réel aujourd'hui.
assert.deepEqual(IDLE_ADVENTURE_SETS.beardverse.reward,{experience:8000});
assert.deepEqual(IDLE_ADVENTURE_SETS.badly.reward,{experience:30000,ap:5000,boostEffectiveness:.2});
assert.deepEqual(IDLE_ADVENTURE_SETS.stealth.reward,{experience:50000,ap:10000});
assert.deepEqual(
  IDLE_ADVENTURE_SETS.choco.reward,{},
  "Choco (set) ne débloque que MacGuffins/Bar Bar dans le vrai NGU — aucun système équivalent chez SOREAL, donc pas de nombre inventé."
);

// Bonus accessoires par zone (SPECIALS), copiés du wiki.
assert.deepEqual(
  [IDLE_ADVENTURE_SPECIALS.beardComb.zone,IDLE_ADVENTURE_SPECIALS.beardComb.dropLevel],
  ["beardverse",1]
);
assert.deepEqual(
  [IDLE_ADVENTURE_SPECIALS.randomCrayons.zone,IDLE_ADVENTURE_SPECIALS.randomCrayons.dropLevel],
  ["badly",1]
);
assert.deepEqual(
  [IDLE_ADVENTURE_SPECIALS.redLipstick.zone,IDLE_ADVENTURE_SPECIALS.redLipstick.dropLevel],
  ["boring",1]
);
assert.deepEqual(
  [IDLE_ADVENTURE_SPECIALS.candyCornNecklace.zone,IDLE_ADVENTURE_SPECIALS.candyCornNecklace.dropLevel],
  ["chocolate",1]
);

// Le moteur générique (checkSets/rollKill/item) doit gérer les 4 zones
// sans code dédié — complétion réelle du set Badly Drawn de bout en bout.
{
  let s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter(function(i){return i.definitionId!=="tutorialCube";});  for(const slot of IDLE_ADVENTURE_SETS.badly.slots){
    const r=applyIdleAdventureActionV47(
      s,{action:"addItem",definitionId:`badly:${slot}`,level:100},{bosses:116},1
    );
    s=r.state;
  }
  assert.equal(s.completedSets.badly,true);
  assert.equal(s.setRewards.experience,30000);
  assert.equal(s.setRewards.ap,5000);
  assert.equal(s.setRewards.boostEffectiveness,.2);
}

/*
 * boostEffectiveness doit réellement amplifier la force d'un boost
 * appliqué.
 *
 * RÉVISÉ 2026-09-14 (Norman : "Power 4/1 alors que le maximum est 1/1",
 * voir idle-adventure-v47.js::applyBoost) : un objet créé directement
 * via addItem est toujours déjà à son propre plafond pur, quel que soit
 * son niveau — un boost n'y a donc plus AUCUN effet, bonus ou pas, une
 * fois plafonné. Il faut un vrai écart (fusion de deux objets de même
 * niveau, exactement comme dans idle-adventure-v47.test.mjs) pour que
 * l'effet de boostEffectiveness reste observable. "training" (basePower
 * ≈0,6) est trop petit : même un seul boost de force 1 sature aussitôt
 * le plafond des deux côtés (avec et sans bonus), rendant les deux
 * résultats identiques — "mega" (basePower=9040) laisse assez de marge
 * pour que l'écart entre les deux force+bonus reste mesurable sans
 * toucher le plafond.
 */
{
  let s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter(function(i){return i.definitionId!=="tutorialCube";});  s=applyIdleAdventureActionV47(
    s,{action:"addItem",definitionId:"mega:head",level:40},{bosses:90},1
  ).state;
  s=applyIdleAdventureActionV47(
    s,{action:"addItem",definitionId:"mega:head",level:40},{bosses:90},1
  ).state;
  const idsFusion=s.inventory.map(x=>x.id);
  s=applyIdleAdventureActionV47(
    s,{action:"merge",a:idsFusion[0],b:idsFusion[1]},{bosses:90},1
  ).state;
  const cibleId=s.inventory[0].id;
  s.inventory.push({id:"boostTestBadly",definitionId:"boost:power:1",kind:"boost",boostType:"power",strength:1,level:0});

  const sansBonus=applyIdleAdventureActionV47(
    JSON.parse(JSON.stringify(s)),{action:"boost",boostId:"boostTestBadly",targetId:cibleId},{bosses:90},1
  ).state.inventory.find(x=>x.id===cibleId).power;

  s.setRewards.boostEffectiveness=.2;
  const avecBonus=applyIdleAdventureActionV47(
    s,{action:"boost",boostId:"boostTestBadly",targetId:cibleId},{bosses:90},1
  ).state.inventory.find(x=>x.id===cibleId).power;

  assert.ok(
    avecBonus>sansBonus,
    "boostEffectiveness (Badly Drawn Set) doit réellement augmenter la force ajoutée par un boost."
  );
}

// Une zone du nouveau lot doit apparaître verrouillée/déverrouillée comme
// n'importe quelle autre, sans logique dédiée.
{
  const s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter(function(i){return i.definitionId!=="tutorialCube";});  assert.equal(
    idleAdventureSnapshotV47(s,107).zones.find(x=>x.id==="beardverse").unlocked,false
  );
  assert.equal(
    idleAdventureSnapshotV47(s,108).zones.find(x=>x.id==="beardverse").unlocked,true
  );
}

console.log("idle-adventure-normal-world-completion: OK");
