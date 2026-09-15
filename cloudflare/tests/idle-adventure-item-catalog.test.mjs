import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_ITEM_CATALOG_V1,
  IDLE_ADVENTURE_SETS,
  IDLE_ADVENTURE_SPECIALS,
  createIdleAdventureStateV47,
  idleAdventureSnapshotV47,
  idleAdventureItemStatsMaxV1
} from "../src/idle-adventure-v47.js";

/*
 * Collection (2026-09-11) — Norman : "je voudrais Renommer Bestiaire en
 * Collection... toutes les armes obtenues et montées niveau max... avec
 * l'image et les stats." itemList (idle-adventure-v47.js) ne garde que
 * {maxLevel,seen} par definitionId — jamais de quoi afficher un nom, et
 * un objet totalement fusionné/jeté n'a plus aucune trace exploitable
 * côté client (il a disparu de inventory/equipment). Ce test verrouille
 * que le catalogue statique couvre BIEN tout definitionId qu'itemList
 * peut un jour contenir, avec un nom stable et reconstructible même
 * longtemps après que l'objet réel a disparu.
 */

/*
 * Isolation des vraies stats par objet (2026-09-15, Norman : "je veux que
 * chaque item ait exactement les mêmes statistiques que dans NGU Idle...
 * regarde chaque page du wiki avec les sets d'armures") — basePower/
 * baseToughness ne sont plus un partage égal du total du set
 * (def.p/k/2), mais la vraie répartition par pièce du wiki
 * (idleAdventureItemStatsMaxV1), avec baseHp/baseRegen dérivés (×3/×0.03).
 */
for(const[setId,def]of Object.entries(IDLE_ADVENTURE_SETS)){
  for(const slot of def.slots){
    const cle=`${setId}:${slot}`;
    const entree=IDLE_ADVENTURE_ITEM_CATALOG_V1[cle];
    assert.ok(entree,`Catalogue manquant pour ${cle}.`);
    assert.equal(entree.kind,"equipment");
    assert.equal(entree.set,setId);
    assert.equal(entree.name,`${def.name} ${slot}`,`Le nom catalogué doit correspondre exactement au nom donné par item() pour ${cle}.`);
    const{p,t}=idleAdventureItemStatsMaxV1(setId,slot);
    assert.equal(entree.basePower,p/2,`basePower doit reproduire exactement la formule d'item() pour ${cle}.`);
    assert.equal(entree.baseToughness,t/2,`baseToughness doit reproduire exactement la formule d'item() pour ${cle}.`);
    assert.equal(entree.baseHp,(p/2)*3,`baseHp doit être basePower×3 (règle NGU vérifiée sur ~90 objets) pour ${cle}.`);
    assert.equal(entree.baseRegen,(t/2)*.03,`baseRegen doit être baseToughness×0.03 pour ${cle}.`);
  }
}

/*
 * Verrouille quelques valeurs RÉELLES du wiki NGU (Training/Sewers,
 * vérifiées au navigateur le 2026-09-15) — pour prouver que ce ne sont
 * plus des placeholders répartis également, mais les vraies fiches
 * objet par objet. "Cloth Hat" (Training/head) : Stats Max Toughness 2,
 * HP regen 0.06 (donc niveau 0 = moitié : 1 / 0.03) ; l'arme "A Stick"
 * (Training/weapon) porte tout le Power du set (6), aucune Toughness.
 */
{
  const clothHat=IDLE_ADVENTURE_ITEM_CATALOG_V1["training:head"];
  assert.equal(clothHat.basePower,0,"Le Cloth Hat (Training/head) n'a aucun Power sur le wiki.");
  assert.equal(clothHat.baseToughness,1,"Le Cloth Hat (Training/head) doit avoir Toughness 1 au niveau 0 (2 au niveau 100, wiki).");
  assert.equal(clothHat.baseRegen,.03,"Le Cloth Hat doit procurer 0.03 HP Regen au niveau 0 (0.06 au niveau 100, wiki) — c'est le bug signalé par Norman.");

  const stick=IDLE_ADVENTURE_ITEM_CATALOG_V1["training:weapon"];
  assert.equal(stick.basePower,3,"A Stick (Training/weapon) doit porter tout le Power du set (6 au niveau 100, wiki).");
  assert.equal(stick.baseToughness,0,"A Stick n'a aucune Toughness sur le wiki.");

  const rustySword=IDLE_ADVENTURE_ITEM_CATALOG_V1["sewers:weapon"];
  assert.equal(rustySword.basePower,20,"Rusty Sword (Sewers/weapon) : Power Max at lvl 0 = 20 (40 au niveau 100, wiki).");
  assert.equal(rustySword.baseHp,60,"Rusty Sword doit donner 60 HP Max au niveau 0 (Power×3, 120 au niveau 100, wiki).");
}

// Chaque spécial doit avoir une entrée, avec kind="cube" pour le seul objet cube.
for(const[id,def]of Object.entries(IDLE_ADVENTURE_SPECIALS)){
  const entree=IDLE_ADVENTURE_ITEM_CATALOG_V1[id];
  assert.ok(entree,`Catalogue manquant pour le spécial ${id}.`);
  assert.equal(entree.name,def.name);
  assert.equal(entree.kind,def.cube?"cube":"special");
}

// Le catalogue doit être exposé dans le snapshot envoyé au client (même
// objet statique à chaque appel, pas recalculé par joueur).
{
  const snap1=idleAdventureSnapshotV47(createIdleAdventureStateV47(),0);
  const snap2=idleAdventureSnapshotV47(createIdleAdventureStateV47(),50);
  assert.ok(snap1.itemCatalog,"Le snapshot doit exposer itemCatalog.");
  assert.equal(snap1.itemCatalog,IDLE_ADVENTURE_ITEM_CATALOG_V1,"Le catalogue est statique — jamais reconstruit par snapshot.");
  assert.equal(snap1.itemCatalog,snap2.itemCatalog);
}

console.log("idle-adventure-item-catalog: OK");
