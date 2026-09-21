import assert from "node:assert/strict";
import fs from "node:fs";
import {
  createIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  idleAdventureBoostV1
} from "../src/idle-adventure-v47.js";
import {
  normalizeIdleNguState,
  syncIdleNguState
} from "../src/idle-ngu-progression.js";

const ui=fs.readFileSync(new URL("../public/soreal-idle-ui.js",import.meta.url),"utf8");
const tts=fs.readFileSync(new URL("../public/modules/tutorial-tts-v202.js",import.meta.url),"utf8");
const audio=fs.readFileSync(new URL("../public/modules/audio-effects-v199.js",import.meta.url),"utf8");
const index=fs.readFileSync(new URL("../public/index.html",import.meta.url),"utf8");

assert.match(index,new RegExp("/soreal-idle-ui\\\\.js\\\\?v=\\\\d+"));
assert.match(index,new RegExp("/modules/audio-effects-v199\\\\.js\\\\?v=\\\\d+"));
assert.match(index,new RegExp("/modules/tutorial-tts-v202\\\\.js\\\\?v=\\\\d+"));
assert.ok(ui.includes('Build <b style="color:#dce5f3">V212</b>'));

for(const token of [
  "sorealIdleSummaryApV210",
  "sorealIdleSummaryRebirthsV210",
  "{id:'sellout',icon:'🛍️',nom:'Boutique AP'}",
  "systemes.selloutShop&&systemes.selloutShop.unlockedEver",
  "Les cases apparaîtront dès que tu trouveras la première pièce d’un set.",
  "const setsDemarres=new Set(",
  "Cette statistique est déjà au maximum : le boost n’est pas consommé.",
  "Augmente la vitesse à laquelle cette ressource est générée",
  "Quantité personnalisée",
  "🎁 Offres débutant",
  "soreal-idle-exp-current-v211",
  "background:#17203f;color:#fff",
  "background:#fff;color:#17203f",
  "IDLE_SELLOUT_TRADUCTIONS_V210",
  "Potion d’énergie α",
  "Espace d’inventaire supplémentaire",
  "Mon cœur rouge <3",
  "Dépense tes AP ici. Aucun achat ne coûte d’argent réel."
]){
  assert.ok(ui.includes(token),"Garde UI V210 manquante: "+token);
}

for(const token of [
  "function stop_()",
  "⏹ Arrêter la lecture",
  "stop:stop_",
  "isSpeaking:function()"
]){
  assert.ok(tts.includes(token),"TTS stoppable V210 manquant: "+token);
}

const fightStart=audio.indexOf("function voixFight_()");
const fightEnd=audio.indexOf("function gongBoss_",fightStart);
assert.ok(fightStart>=0&&fightEnd>fightStart);
const fightBlock=audio.slice(fightStart,fightEnd);
assert.ok(!fightBlock.includes("SpeechSynthesisUtterance"),"Fight ne doit plus lancer de voix TTS.");
assert.ok(!fightBlock.includes('"FIGHT!"'),"Fight ne doit plus prononcer FIGHT.");
assert.ok(fightBlock.includes("jouerWebAudio_(310"),"Fight doit conserver un impact court WebAudio.");

let meta=normalizeIdleNguState(null,{},Date.now());
assert.equal(Boolean(meta.selloutShop&&meta.selloutShop.unlockedEver),false);
meta.currencies.ap=10;
meta=syncIdleNguState(meta,{},Date.now());
assert.equal(Boolean(meta.selloutShop.unlockedEver),true,"Le premier AP doit débloquer la Boutique AP.");
meta.currencies.ap=0;
meta=syncIdleNguState(meta,{},Date.now());
assert.equal(Boolean(meta.selloutShop.unlockedEver),true,"La Boutique AP doit rester débloquée après dépense des AP.");

let state=createIdleAdventureStateV47();
let step=applyIdleAdventureActionV47(state,{action:"addItem",definitionId:"training:weapon",level:100},{},Date.now());
state=step.state;
const weapon=state.inventory.find(x=>x&&x.definitionId==="training:weapon");
assert.ok(weapon);
weapon.power=1e99;
const boost=idleAdventureBoostV1("power",1);
state.inventory.push(boost);
assert.throws(
  ()=>applyIdleAdventureActionV47(
    state,
    {action:"boost",boostId:boost.id,targetId:weapon.id},
    {},
    Date.now()
  ),
  /BOOST_STAT_DEJA_MAX|OBJET_DEJA_MAXE/,
  "Un boost ne doit pas être absorbé si la statistique cible est déjà au plafond."
);

new Function(ui);
new Function("window","document","localStorage",tts);
new Function("window","document",audio);

console.log("SOREAL IDLE V212: OK — AP/Rebirth, Boutique AP, Collection progressive, TTS stop, Fight uniforme, boosts max et EXP Shop.");
