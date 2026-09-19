import assert from "node:assert/strict";
import fs from "node:fs";

const src=fs.readFileSync("cloudflare/src/idle-adventure-v47.js","utf8");

assert.ok(src.includes("export const IDLE_ADVENTURE_WIKI_ITEM_IDS_V1"),"Le catalogue doit exposer la table definitionId -> wikiItemId.");
assert.ok(src.includes("wikiItemId:wikiItemIdAdventureV1(definitionId)"),"Les drops d'équipement doivent transporter wikiItemId.");
assert.ok(src.includes("wikiItemId:wikiItemIdAdventureV1(id)"),"Les SPECIALS doivent transporter wikiItemId.");
assert.ok(src.includes("wikiItemId:wikiItemIdBoostV1(type,strength)"),"Les boosts doivent transporter leur Item ID wiki.");

const moduleUrl=new URL("../src/idle-adventure-v47.js",import.meta.url);
const mod=await import(moduleUrl.href+"?wiki-item-ids="+Date.now());
const ids=mod.IDLE_ADVENTURE_WIKI_ITEM_IDS_V1;
const catalog=mod.IDLE_ADVENTURE_ITEM_CATALOG_V1;

assert.deepEqual(
  Object.keys(ids).sort(),
  Object.keys(catalog).sort(),
  "La table wikiItemId doit couvrir exactement le catalogue Adventure courant, sans entrée manquante ni ID orphelin."
);
assert.equal(ids["training:head"],62);
assert.equal(ids["training:chest"],63);
assert.equal(ids["training:legs"],64);
assert.equal(ids["training:boots"],65);
assert.equal(ids["training:weapon"],75);
assert.equal(ids.tutorialCube,77);
assert.equal(ids.tubaTime,432);
assert.equal(ids.wandoos98,66);
assert.equal(ids.beardComb,441);
assert.equal(ids.shrunkenVoodooDoll,190);

for(const [definitionId,def] of Object.entries(catalog)){
  assert.ok(Number.isInteger(def.wikiItemId)&&def.wikiItemId>0,definitionId+" doit exposer un wikiItemId positif.");
  assert.equal(def.wikiItemId,ids[definitionId],definitionId+" doit utiliser la table canonique d'IDs wiki.");
}
assert.equal(catalog.tutorialCube.wikiItemId,77);

const state=mod.createIdleAdventureStateV47();
const cube=state.inventory.find(x=>x.definitionId==="tutorialCube");
assert.equal(cube?.wikiItemId,77,"Le Tutorial Cube initial doit transporter l'ID 77.");

for(const [type,base] of Object.entries({power:1,toughness:14,special:27})){
  const strengths=mod.IDLE_ADVENTURE_BOOSTS;
  strengths.forEach((strength,index)=>{
    const boost=mod.idleAdventureBoostV1(type,strength);
    assert.equal(boost.wikiItemId,base+index,`${type} ${strength} doit utiliser l'Item ID NGU attendu.`);
  });
}

console.log("idle-wiki-item-ids: OK");
