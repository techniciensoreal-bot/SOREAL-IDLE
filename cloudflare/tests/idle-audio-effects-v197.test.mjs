import assert from "node:assert/strict";
import fs from "node:fs";

const ui=fs.readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

const audio=fs.readFileSync(
  new URL("../public/modules/audio-effects-v197.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

const longPress=fs.readFileSync(
  new URL("../public/modules/long-press-v197.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

const index=fs.readFileSync(
  new URL("../public/index.html",import.meta.url),
  "utf8"
);

assert.ok(
  index.includes('/modules/audio-effects-v197.js')&&
  index.includes('/modules/long-press-v197.js')&&
  index.indexOf('/modules/audio-effects-v197.js')<
    index.indexOf('/soreal-idle-ui.js')&&
  index.indexOf('/modules/long-press-v197.js')<
    index.indexOf('/soreal-idle-ui.js'),
  "Audio et long-press doivent être chargés avant l'UI principale."
);

for(const method of [
  "fight:voixFight_",
  "bossAppear:gongBoss_",
  "defeat:defaite_",
  "chestOpen:coffreOuverture_",
  "chestClose:coffreFermeture_"
]){
  assert.ok(audio.includes(method),"Effet audio manquant: "+method);
}

assert.ok(
  audio.includes('new SpeechSynthesisUtterance("Fight!")')&&
  audio.includes('utterance.lang="en-US"')&&
  audio.includes("utterance.pitch=.58")&&
  audio.includes("utterance.rate=1.32"),
  "Fight doit utiliser une voix synthétique courte et transformée."
);

assert.ok(
  audio.includes("Partiels légèrement inharmoniques")&&
  audio.includes("function gongBoss_()"),
  "Le son d'apparition doit être un gong synthétique dédié."
);

assert.ok(
  ui.includes("jouerEffetAudioIdleV197_('fight')")&&
  ui.includes("jouerEffetAudioIdleV197_('bossAppear')")&&
  ui.includes("jouerEffetAudioIdleV197_('defeat')")&&
  ui.includes("jouerEffetAudioIdleV197_('chestOpen')")&&
  ui.includes("jouerEffetAudioIdleV197_('chestClose')"),
  "Chaque transition de jeu demandée doit déclencher son effet dédié."
);

assert.ok(
  ui.includes("idleDerniereImageBossV61=key;")&&
  ui.includes("jouerEffetAudioIdleV197_('bossAppear');")&&
  ui.includes("return ' soreal-idle-image-fade-v61';"),
  "Le gong doit être lié au changement de boss qui déclenche le Fade In."
);

assert.ok(
  ui.includes("idleCombatEnPauseApresDefaiteV1=true;")&&
  ui.includes("jouerEffetAudioIdleV197_('defeat');"),
  "La défaite Fight Boss doit jouer son son au coup fatal local."
);

assert.ok(
  ui.includes("jouerSonFermetureCoffreIdleV197_")&&
  ui.includes("jouerEffetAudioIdleV197_('chestClose')"),
  "Le coffre doit posséder un son de fermeture distinct."
);

new Function(audio);
new Function(longPress);
new Function(ui);

console.log(
  "SOREAL IDLE Audio V197: OK — Fight vocal, gong boss, défaite, coffre ouverture/fermeture, modules chargés."
);
