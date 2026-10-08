import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-26) : son de combat qui commence ; « Zone Tutoriel » ; PV du duel plus beaux ; bouton Adventure rouge clignotant après un K.O. ; retrait de la partie B et du bouton
 * « Réinitialiser TOUS les joueurs ».
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const adventure = readFileSync("cloudflare/src/idle-adventure-v47.js", "utf8");
const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
const coord = readFileSync("cloudflare/src/index-idle-coordinator-v1.js", "utf8");
const contract = JSON.parse(readFileSync("cloudflare/contracts/idle-protocol.json", "utf8"));

// --- son du début de combat : lames, tambours, cuivres ---
{
  const a = audio.indexOf("function voixFight_(){");
  const b = audio.indexOf("Sons d'apparition des boss", a);
  const f = audio.slice(a, b);
  assert.ok(f.includes("jouerWebAudio_(950,"), "0,95 s");
  assert.ok(f.includes("1500*2.76") && f.includes("highpass"), "éclat de lames");
  assert.equal((f.match(/\[\.\d+,\.\d+\]/g) || []).length, 3, "trois coups de tambour");
  assert.ok(f.includes("type:\"sawtooth\",from:196,to:294"), "appel de cuivres");
  assert.ok(!f.includes("SpeechSynthesisUtterance"));
}

// --- « Zone Tutoriel » ---
assert.ok(adventure.includes('{id:"tutorial",name:"Zone Tutoriel",'));
assert.ok(!adventure.includes('{id:"tutorial",name:"Tutoriel",'));

// --- PV du duel ---
for (const morceau of [".soreal-idle-duel-hp-v41 .soreal-idle-note-v4{", "#sorealIdleJoueurPvV15.soreal-idle-note-v4{", "font-variant-numeric:tabular-nums", ".soreal-idle-bossbar-v7::after", "height:17px"]) {
  assert.ok(css.includes(morceau), "style : " + morceau);
}
/* La barre de vie du joueur a quitté la borne (2026-10-08) : elle vit dans le bandeau du haut, mise à jour par le même tick. */
assert.ok(ui.includes('id="sorealIdleBossPvV7"') && ui.includes('id="sorealIdleBossBarV7"'), "mêmes identifiants du boss : le tick de combat continue de les mettre à jour");
assert.ok(!ui.includes('id="sorealIdleJoueurPvV15"') && !ui.includes('id="sorealIdleJoueurBarV15"'), "plus de barre de vie du joueur sur la borne");
assert.ok(ui.includes("majHudPvIdleV2_(") && ui.includes("idleNombre_(idleEtat.pvJoueur)") , "le bandeau reçoit la vie à chaque tick");

// --- K.O. en aventure : le bouton clignote en rouge ---
assert.ok(css.includes("@keyframes sorealIdleNavKoV1") && css.includes(".soreal-idle-nav-button-v28.soreal-idle-nav-adventure-ko-v1{"), "la classe posée par le jeu a enfin un style");
assert.ok(css.includes("animation:sorealIdleNavKoV1 .85s ease-in-out infinite"));
assert.ok(ui.includes("function marquerBoutonAventureKoIdleV1_(){") && ui.includes("idleAdventureKoAlertV1=true;\n          marquerBoutonAventureKoIdleV1_();"), "posé tout de suite au K.O.");
assert.ok(ui.includes("m.id==='aventure'&&idleAdventureKoAlertV1&&idleMenuActifV28!=='aventure'"), "aussi au rendu du menu, tant qu'on n'a pas rouvert Adventure");
assert.ok(ui.includes("if(nouveauMenu==='aventure')idleAdventureKoAlertV1=false;"), "s'arrête quand on ouvre Adventure");

// --- « Réinitialiser TOUS les joueurs » retiré (la partie B, retirée ce même jour, a été redemandée et restaurée le
// 2026-09-27 -- voir idle-dev-save-slots.test.mjs / idle-dev-save-slots-client.test.mjs) ---
for (const [nom, source] of [["ui", ui], ["moteur", runtime], ["coordinateur", coord]]) {
  for (const interdit of ["ResetTousJoueurs", "reinitialiserTousLesComptesSorealIdle"]) {
    assert.ok(!source.includes(interdit), nom + " ne contient plus « " + interdit + " »");
  }
}
assert.ok(!contract.operations.includes("reinitialiserTousLesComptesSorealIdle"), "opération retirée du contrat");
assert.ok(runtime.includes("email.indexOf('+partieb@') !== -1"), "une éventuelle ligne de la partie B reste hors classement");
assert.ok(ui.includes("Réinitialisation complète"), "le reset de SA propre partie reste");

console.log("idle-fight-hp-ko-cleanup-v1: OK");
