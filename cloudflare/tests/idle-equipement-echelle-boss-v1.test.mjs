import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47, idleAdventureEquipmentStatsV47 } from "../src/idle-adventure-v47.js";
import { normalizeIdleNguState, syncIdleNguState } from "../src/idle-ngu-progression.js";
import { IDLE_BOSS_REQUIS_V1, idleBossRequisFacteurV1 } from "../src/idle-adventure-boss-requis-v1.js";
import { IDLE_ADVENTURE_WIKI_ITEM_IDS_V1 } from "../src/idle-adventure-sets.js";

/*
 * Alignement sur le jeu (build 1260, equipAttackBonus 3604 / equipDefenseBonus 3605 / equipSpecBonus 3606) : chaque valeur d'un objet équipé (Power, Toughness, chaque special)
 * vaut floor(valeur x min(1, boss effectif / bossRequired)) ; HP = somme des Power mis à l'échelle x 3, Regen = somme des Toughness x 0,03 ;
 * boss effectif = boss tués dans le Rebirth en cours + 301 par difficulté. Table : idle-adventure-boss-requis-v1.js (champ bossRequired du jeu).
 */

// Table : 158 objets, paliers du rapport
assert.equal(Object.keys(IDLE_BOSS_REQUIS_V1).length, 158);
const par = {};
for (const v of Object.values(IDLE_BOSS_REQUIS_V1)) par[v] = (par[v] || 0) + 1;
assert.deepEqual(par, { 20: 8, 33: 13, 58: 8, 67: 1, 82: 31, 100: 97 });
const wiki = (def) => IDLE_ADVENTURE_WIKI_ITEM_IDS_V1[def];
assert.equal(IDLE_BOSS_REQUIS_V1[wiki("uug:ringGreed")], 100, "UUG Ring of Greed : palier 100");
assert.equal(IDLE_BOSS_REQUIS_V1[wiki("jake:head")], 82, "Jake : palier 82");
assert.equal(IDLE_BOSS_REQUIS_V1[wiki("meta:legs")] || 0, 0, "Meta : aucune échelle");

// Facteur : min(1, boss / requis) ; sans boss connu ou sans palier : 1
assert.equal(idleBossRequisFacteurV1(wiki("uug:ringGreed"), 50), 0.5);
assert.equal(idleBossRequisFacteurV1(wiki("uug:ringGreed"), 0), 0);
assert.equal(idleBossRequisFacteurV1(wiki("uug:ringGreed"), 250), 1);
assert.equal(idleBossRequisFacteurV1(wiki("uug:ringGreed"), null), 1);
assert.equal(idleBossRequisFacteurV1(wiki("meta:legs"), 0), 1);

function equipe(defs, bossEffectif) {
  let a = normalizeIdleAdventureStateV47({});
  const ids = [];
  for (const [definitionId, slot] of defs) {
    a = applyIdleAdventureActionV47(a, { action: "addItem", definitionId, level: 0 }, { bosses: 400 }, 1).state;
    const it = a.inventory.filter((i) => i.definitionId === definitionId).pop();
    a = applyIdleAdventureActionV47(a, { action: "equip", id: it.id, slot }, { bosses: 400 }, 1).state;
    ids.push(it);
  }
  if (bossEffectif !== undefined) a.bossEffectif = bossEffectif;
  return { a, items: ids };
}

// Objet de palier 100 : 0 %, 50 %, 100 % ; floor de chaque valeur ; HP et Regen dérivés des valeurs mises à l'échelle
{
  const base = equipe([["uug:ringGreed", "accessory"]]);
  const plein = idleAdventureEquipmentStatsV47(base.a);
  assert.ok(plein.specials.goldDropsPct > 0 && plein.specials.respawnReductionPct > 0, "sans boss effectif connu : aucune échelle (états sans synchro)");
  const it = base.items[0];
  const pw = it.power, tg = it.toughness;
  for (const be of [0, 1, 37, 50, 99, 100, 101, 5000]) {
    const e = idleAdventureEquipmentStatsV47(equipe([["uug:ringGreed", "accessory"]], be).a);
    const f = Math.min(1, be / 100);
    assert.equal(e.power, Math.floor(pw * f + 1e-9), `power à ${be} boss`);
    assert.equal(e.toughness, Math.floor(tg * f + 1e-9), `toughness à ${be} boss`);
    assert.ok(Math.abs(e.hp - Math.floor(pw * f + 1e-9) * 3) < 1e-9, `hp à ${be} boss`);
    assert.ok(Math.abs(e.regen - Math.floor(tg * f + 1e-9) * 0.03) < 1e-9, `regen à ${be} boss`);
    if (be === 0) {
      assert.equal(e.specials.goldDropsPct || 0, 0, "0 boss : aucun special");
      assert.equal(e.specials.respawnReductionPct || 0, 0);
    }
    if (be >= 100) assert.equal(e.specials.goldDropsPct, plein.specials.goldDropsPct, "100 boss : special entier");
    if (be === 50) assert.ok(e.specials.goldDropsPct < plein.specials.goldDropsPct && e.specials.goldDropsPct > 0, "50 boss : special partiel");
  }
}

// Objet sans palier (Meta) : jamais mis à l'échelle
{
  const sans = idleAdventureEquipmentStatsV47(equipe([["meta:legs", "legs"]]).a);
  const zero = idleAdventureEquipmentStatsV47(equipe([["meta:legs", "legs"]], 0).a);
  assert.equal(zero.power, sans.power);
  assert.equal(zero.toughness, sans.toughness);
  assert.deepEqual(zero.specials, sans.specials);
}

// Seconde arme : même échelle (floor puis ratio de la seconde arme)
{
  const { a } = equipe([["jake:head", "head"]], 41);
  const e = idleAdventureEquipmentStatsV47(a);
  const it = a.inventory.find((i) => i.definitionId === "jake:head");
  assert.equal(e.power, Math.floor(it.power * 41 / 82 + 1e-9), "Jake (palier 82) à 41 boss : moitié");
}

// La clé de mémo change avec le boss effectif : jamais de résultat périmé
{
  const { a } = equipe([["uug:ringGreed", "accessory"]], 10);
  const e10 = idleAdventureEquipmentStatsV47(a);
  a.bossEffectif = 100;
  const e100 = idleAdventureEquipmentStatsV47(a);
  assert.ok(e100.power + e100.toughness + e100.specials.goldDropsPct > e10.power + e10.toughness + e10.specials.goldDropsPct, "le mémo ne ressert pas l'équipement à 10 boss");
  a.bossEffectif = 10;
  assert.equal(JSON.stringify(idleAdventureEquipmentStatsV47(a)), JSON.stringify(e10));
}

// Synchro NGU : boss effectif = boss du Rebirth + 301 par difficulté
{
  const sync = (diff, bosses) => {
    const s = normalizeIdleNguState({ difficulty: diff }, { bosses }, 0);
    return syncIdleNguState(s, { bosses }, 1000).adventure.bossEffectif;
  };
  assert.equal(sync("normal", 0), 0);
  assert.equal(sync("normal", 57), 57);
  assert.equal(sync("difficile", 5), 306);
  assert.equal(sync("extreme", 5), 607);
}
console.log("idle-equipement-echelle-boss-v1 : OK");
