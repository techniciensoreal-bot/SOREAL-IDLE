import assert from "node:assert/strict";
import fs from "node:fs";

const ui=fs.readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

const audio=fs.readFileSync(
  new URL("../public/modules/audio-effects-v199.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

const index=fs.readFileSync(
  new URL("../public/index.html",import.meta.url),
  "utf8"
);

const worker=fs.readFileSync(
  new URL("../src/idle-worker-entry-v1.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

assert.ok(
  index.includes('/modules/audio-effects-v199.js?v=201')&&
  index.includes('/modules/long-press-v200.js?v=200')&&
  index.includes('/soreal-idle-ui.js?v=200')&&
  index.indexOf('/modules/audio-effects-v199.js?v=201')<
    index.indexOf('/soreal-idle-ui.js?v=200'),
  "La révision V199 doit être cache-bustée et chargée avant l'UI."
);

assert.ok(
  worker.includes('headers.set("cache-control", "no-cache, no-store, must-revalidate")')&&
  worker.includes('headers.set("pragma", "no-cache")'),
  "Le shell standalone doit être revalidé après chaque déploiement."
);

for(const method of [
  "fight:voixFight_",
  "bossAppear:gongBoss_",
  "defeat:defaite_",
  "chestOpen:coffreOuverture_",
  "chestClose:coffreFermeture_",
  "mergeArmor:fusionArmure_",
  "mergeWeapon:fusionArme_",
  "boostPower:boostPower_",
  "boostToughness:boostToughness_",
  "boostSpecial:boostSpecial_"
]){
  assert.ok(audio.includes(method),"Effet audio manquant: "+method);
}

assert.ok(
  audio.includes('new SpeechSynthesisUtterance("Fight!")')&&
  audio.includes('utterance.lang="en-US"')&&
  audio.includes("utterance.pitch=.52")&&
  audio.includes("utterance.rate=1.34")&&
  audio.includes("utterance.onend=terminer"),
  "Fight doit être une voix synthétique dont la fin pilote le scheduler."
);

assert.ok(
  audio.includes("function amorcerAudioDepuisGeste_()")&&
  audio.includes("c.createBuffer(")&&
  audio.includes("c.createBufferSource()")&&
  audio.includes("source.start(0)")&&
  audio.includes('document.addEventListener("pointerdown",debloquer_')&&
  audio.includes('document.addEventListener("touchstart",debloquer_')&&
  audio.includes('document.addEventListener("click",debloquer_'),
  "La WebView doit amorcer réellement Web Audio pendant un geste utilisateur."
);

assert.ok(
  audio.includes("var actif=null;")&&
  audio.includes("var file=[];")&&
  audio.includes("if(actif)return;")&&
  audio.includes("while(file.length>2)")&&
  audio.includes("retirerPerimes_();")&&
  audio.includes("existing.group!==cue.group"),
  "Le moteur doit garantir un seul son actif, une file courte et la suppression des sons périmés/doublons."
);

assert.ok(
  ui.includes("function jouerEffetAudioIdleV199_(nom)")&&
  ui.includes("__SOREAL_IDLE_AUDIO_V199__")&&
  ui.includes("jouerEffetAudioIdleV199_('fight')")&&
  ui.includes("jouerEffetAudioIdleV199_('bossAppear')")&&
  ui.includes("jouerEffetAudioIdleV199_('defeat')")&&
  ui.includes("jouerEffetAudioIdleV199_('chestOpen')")&&
  ui.includes("jouerEffetAudioIdleV199_('chestClose')"),
  "Toutes les transitions existantes doivent passer par V199."
);

assert.ok(
  ui.includes("function cueAudioMutationInventaireIdleV199_(a,payload)")&&
  ui.includes("return 'mergeArmor';")&&
  ui.includes("return 'mergeWeapon';")&&
  ui.includes("return 'boostPower';")&&
  ui.includes("return 'boostToughness';")&&
  ui.includes("return 'boostSpecial';")&&
  ui.includes("audioCue:cueAudioMutationInventaireIdleV199_(current,payload||{})")&&
  ui.includes("if(tx.audioCue){\n            jouerEffetAudioIdleV199_(tx.audioCue);"),
  "Les sons de fusion/boost doivent être déterminés avant mutation mais joués seulement après confirmation serveur."
);

assert.ok(
  !ui.includes("__SOREAL_IDLE_AUDIO_V197__")&&
  !ui.includes("jouerEffetAudioIdleV197_"),
  "Aucun appel production ne doit encore contourner le scheduler V199."
);

// Test comportemental minimal du scheduler sans périphérique audio.
const listeners={};
const fakeDocument={
  addEventListener(name,fn){
    listeners[name]=fn;
  }
};

class FakeUtterance{
  constructor(text){
    this.text=text;
    this.onend=null;
    this.onerror=null;
  }
}

const fakeSpeech={
  cancel(){},
  getVoices(){return [];},
  speak(utterance){
    setTimeout(()=>{
      if(typeof utterance.onend==="function")utterance.onend({elapsedTime:.02});
    },20);
  }
};

const fakeWindow={
  speechSynthesis:fakeSpeech,
  SpeechSynthesisUtterance:FakeUtterance
};

new Function("window","document",audio)(fakeWindow,fakeDocument);
const engine=fakeWindow.__SOREAL_IDLE_AUDIO_V199__;
assert.ok(engine,"Le moteur V199 doit s'installer.");

engine.fight();
engine.defeat();

let state=engine.debugState();
assert.equal(state.active,"fight","Fight doit rester le son actif.");
assert.deepEqual(state.pending,["defeat"],"La défaite doit attendre Fight, jamais le chevaucher.");

await new Promise(resolve=>setTimeout(resolve,45));
state=engine.debugState();
assert.equal(state.active,"defeat","La défaite doit démarrer après la fin de Fight.");

await new Promise(resolve=>setTimeout(resolve,140));
state=engine.debugState();
assert.equal(state.active,"","La file doit finir proprement après la défaite.");
assert.deepEqual(state.pending,[]);

engine.fight();
engine.chestOpen();
engine.chestClose();
engine.mergeArmor();
engine.boostPower();
state=engine.debugState();
assert.ok(state.pending.length<=2,"La file ne doit jamais dépasser deux sons en attente.");

await new Promise(resolve=>setTimeout(resolve,320));

new Function(audio);
new Function(ui);

console.log(
  "SOREAL IDLE Audio V199: OK — cache-bust, Fight→défaite séquentiel, file max 2, sons merge/boost confirmés."
);
