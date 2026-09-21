import assert from "node:assert/strict";
import fs from "node:fs";
import {
  applyIdleAdventureActionV47,
  createIdleAdventureStateV47,
  idleAdventureSnapshotV47
} from "../src/idle-adventure-v47.js";

const ui=fs.readFileSync(new URL("../public/soreal-idle-ui.js",import.meta.url),"utf8");
const index=fs.readFileSync(new URL("../public/index.html",import.meta.url),"utf8");

function act(state,payload){
  return applyIdleAdventureActionV47(state,payload,{},Date.now());
}

let state=createIdleAdventureStateV47();
const rev0=idleAdventureSnapshotV47(state).revision;
let step=act(state,{action:"addItem",definitionId:"training:weapon",level:1});
state=step.state;
const rev1=idleAdventureSnapshotV47(state).revision;
assert.equal(rev1,rev0+1,"Chaque mutation Adventure doit avancer la révision.");

step=act(state,{action:"addItem",definitionId:"training:weapon",level:1});
state=step.state;
const weapons=state.inventory.filter(x=>x.definitionId==="training:weapon");
assert.equal(weapons.length,2);

const mutationId="test-v208-merge-idempotent";
step=act(state,{action:"merge",a:weapons[0].id,b:weapons[1].id,clientMutationId:mutationId});
state=step.state;
const apresPremier=idleAdventureSnapshotV47(state);
assert.equal(apresPremier.inventory.filter(x=>x.definitionId==="training:weapon").length,1);
const revisionApresPremier=apresPremier.revision;

const retry=act(state,{action:"merge",a:weapons[0].id,b:weapons[1].id,clientMutationId:mutationId});
state=retry.state;
const apresRetry=idleAdventureSnapshotV47(state);
assert.equal(retry.duplicate,true,"Le retry du même clientMutationId doit être reconnu.");
assert.equal(apresRetry.inventory.filter(x=>x.definitionId==="training:weapon").length,1);
assert.equal(apresRetry.revision,revisionApresPremier,"Un retry idempotent ne doit pas créer une nouvelle révision.");

assert.throws(
  ()=>act(state,{action:"merge",a:weapons[0].id,b:weapons[1].id,clientMutationId:"autre-id"}),
  /FUSION_INVALIDE/,
  "Un nouvel identifiant reste une nouvelle intention et ne doit pas masquer une vraie fusion invalide."
);

for(const token of [
  "idleAdventureRevisionServeurV208",
  "idleAdventureSnapshotDiffereV208",
  "fusionnerAdventureServeurAvecInventaireLocalV208_",
  "protegerJoueurServeurInventaireIdleV208_",
  "appliquerAdventureDiffereeIdleV208_",
  "clientMutationId",
  "joueurServeurProtegeV208",
  "joueurMetaProtegeV208",
  "joueurSortProtegeV208",
  "joueurRenduProtegeV208"
]){
  assert.ok(ui.includes(token),"Protection anti-rollback V208 manquante: "+token);
}

assert.ok(index.includes("/modules/audio-effects-v199.js?v=210"));
assert.ok(index.includes("/modules/tutorial-tts-v202.js?v=210"));
assert.ok(index.includes("/soreal-idle-ui.js?v=219"));
assert.ok(ui.includes('Build <b style="color:#dce5f3">V212</b>'));

new Function(ui);
console.log("SOREAL IDLE V208: OK — révisions Adventure, fusion idempotente et barrière anti-rollback.");
