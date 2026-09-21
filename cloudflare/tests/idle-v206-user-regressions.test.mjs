import assert from "node:assert/strict";
import fs from "node:fs";
import { NGU_BOSS_REFERENCE_COUNT_V1, nguBossStatsV1 } from "../src/idle-ngu-boss-reference-v1.js";

const ui=fs.readFileSync(new URL("../public/soreal-idle-ui.js",import.meta.url),"utf8");
const audio=fs.readFileSync(new URL("../public/modules/audio-effects-v199.js",import.meta.url),"utf8");
const tts=fs.readFileSync(new URL("../public/modules/tutorial-tts-v202.js",import.meta.url),"utf8");
const index=fs.readFileSync(new URL("../public/index.html",import.meta.url),"utf8");
const media=fs.readFileSync(new URL("../src/idle-media-v1.js",import.meta.url),"utf8");
const ngu=fs.readFileSync(new URL("../src/idle-ngu-progression.js",import.meta.url),"utf8");
const runtime=fs.readFileSync(new URL("../src/idle-sqlite-runtime.js",import.meta.url),"utf8");

assert.ok(index.includes("/modules/audio-effects-v199.js?v=210")&&index.includes("/modules/tutorial-tts-v202.js?v=210")&&index.includes("/soreal-idle-ui.js?v=219"),"Assets V207 non cache-bustés.");

for(const token of ["background:#071226","soreal-idle-loading-card","soreal-idle-loading-banner","1omNowtqq_YjUQitljdBXbLK9VZ0oJ7qb","standaloneProgress","standalonePercent"]){
  assert.ok(index.includes(token),"Écran de chargement bleu manquant: "+token);
}
assert.ok(!index.includes("body{min-height:100vh;background:#f4f6fb;color:#17203f}"),"Le shell blanc ne doit plus être utilisé.");

const boss6=nguBossStatsV1(5,"normal");
assert.deepEqual({attaque:boss6.attaque,defense:boss6.defense,pv:boss6.pv,xp:boss6.xp},{attaque:32500000,defense:17500000,pv:325000000,xp:0},"Boss 6 NGU incorrect.");
assert.ok(NGU_BOSS_REFERENCE_COUNT_V1>=6);

for(const token of ["let idleCombatArmeLocalV206=false;","idleCombatArmeLocalV206=true;","idleCombatArmeLocalV206 &&","joueurServeur.combatBossActif &&","!idleCombatArmeLocalV206","raison:'garde_client'","{stopBossOnOpen:true}","{stopBossOnOpen:false}"]){
  assert.ok((ui+runtime).includes(token),"Garde anti-combat fantôme manquant: "+token);
}
const stopAt=runtime.indexOf("if(options&&options.stopBossOnOpen)");
const progAt=runtime.indexOf("const progression =",stopAt);
assert.ok(stopAt>=0&&progAt>stopAt,"Le Fight persisté doit être coupé avant la progression hors-ligne.");

for(const token of ["victory:{group:\"combat-end\"","nuke:{group:\"combat-action\"","function victoireBoss_()","function nuke_()","victory:victoireBoss_","nuke:nuke_"]){
  assert.ok(audio.includes(token),"Audio victoire/NUKE manquant: "+token);
}
assert.ok(ui.includes("jouerEffetAudioIdleV199_('victory')")&&ui.includes("jouerEffetAudioIdleV199_('nuke')"),"Fight Boss doit lancer victoire et NUKE.");

for(const token of ["/api/idle/media/banner","const key=\"idle/banners/\"+nom","Money_Pit.jpg","function pageMoneyPitDailySpinIdleV206_(j)","Balance ton argent","Daily Spin!","TON PRIX","TABLE DES RÉCOMPENSES","RÉCOMPENSES OBTENUES"]){
  assert.ok((media+ui).includes(token),"Money Pit V206 manquant: "+token);
}
assert.ok(ngu.includes("s.data.history=historique.slice(0,20)")&&ngu.includes("history:Array.isArray(data.history)"),"Historique des prix non persistant.");

for(const token of ["readText:function(value)","sorealIdleBossChroniqueV206","🔊 Lire la chronique","sorealIdleCollectionBossStoryV206_","🔊 Lire cette chronique","function lireHistoireCompleteBossIdleV206_()","🔊 Lire toute l’histoire des boss débloqués","return b&&b.connu&&String(b.histoire||'').trim();"]){
  assert.ok((tts+ui).includes(token),"TTS chroniques Boss manquant: "+token);
}

assert.ok(ui.includes('Build <b style="color:#dce5f3">V212</b>'),"Settings doit afficher V208.");
new Function(ui);
new Function("window","document",audio);
new Function("window","document","localStorage",tts);
console.log("SOREAL IDLE V208: OK — loader, Boss 6, Fight explicite, audio, Money Pit et chroniques TTS.");