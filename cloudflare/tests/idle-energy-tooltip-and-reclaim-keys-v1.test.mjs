import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-25) : « Je veux exactement le même comportement que dans NGU » — infobulle d'énergie de NGU (capture) :
 * « Max energy on this rebirth is capped at 916. On rebirth, you will have 1114 Energy. Every 20 Energy gained grants 1 extra energy to your max
 * upon rebirth, up to 100,000. You currently make 2 Energy per second. Current Energy Speed is 2, meaning the bar fills every 25 ticks. Next Speed
 * Increase is at 2.1 Energy Speed. SHORTCUT: Tap R to reclaim Energy from all features except training. »
 */
const context = { bosses: 4 };

// Serveur : les chiffres de la capture (run de 33:07 à 2 énergies/s : 3 974 générées)
{
  const s = normalizeIdleNguState({}, context, 1_000_000);
  s.resources.energy.cap = 916;
  s.resources.energy.speed = 2;
  s.resources.energy.generatedThisRun = 3974;
  const info = idleNguSnapshot(s, context, 1_000_000).resourceInfo.energy;
  assert.equal(info.capRun, 916);
  assert.equal(info.capAfterRebirth, 1114);
  assert.equal(info.perSecond, 2);
  assert.equal(info.speed, 2);
  assert.equal(info.ticksPerFill, 25, "la barre se remplit tous les 25 ticks");
  assert.equal(info.nextSpeed, 2.1, "prochain palier de vitesse");
}
// Vitesse maximale : plus de palier suivant ; plafond mou de 100 000 respecté
{
  const s = normalizeIdleNguState({}, context, 1_000_000);
  s.resources.energy.speed = 50;
  s.resources.energy.cap = 99_990;
  s.resources.energy.generatedThisRun = 1_000_000;
  const info = idleNguSnapshot(s, context, 1_000_000).resourceInfo.energy;
  assert.equal(info.ticksPerFill, 1);
  assert.equal(info.nextSpeed, null);
  assert.equal(info.capAfterRebirth, 100_000);
}
// Magic verrouillée : pas d'entrée (anti-spoil)
{
  const s = normalizeIdleNguState({}, { bosses: 4 }, 1_000_000);
  assert.equal(idleNguSnapshot(s, { bosses: 4 }, 1_000_000).resourceInfo.magic, undefined);
}

// Client : texte de l'infobulle (mêmes lignes que NGU, en français) et raccourcis R / T
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("function nombreInfobulleIdleV1_(v,decimales){");
const fin = ui.indexOf("function infoEnergieIdleV1_(){");
const texte = new Function("idleNombre_", ui.slice(debut, fin) + "return texteInfobulleEnergieIdleV1_;")((v) => Number(v) || 0);
const t = texte({ capRun: 916, capAfterRebirth: 1114, perSecond: 2, speed: 2, ticksPerFill: 25, nextSpeed: 2.1 });
const normaliser = (x) => x.split(String.fromCharCode(0x202f)).join(' ').split(String.fromCharCode(0xa0)).join(' ');
for (const attendu of [
  'plafonnée à 916.', 'tu auras 1 114 énergies.', '1 énergie à ton max au Rebirth, jusqu’à 100 000.', 'Tu produis actuellement 2 énergies par seconde.',
  'Vitesse d’énergie actuelle : 2, la barre se remplit tous les 25 ticks.', 'Prochain palier de vitesse : 2,1.', 'RACCOURCI : appuie sur R pour récupérer l’énergie de toutes les fonctions sauf l’entraînement.'
]) {
  assert.ok(normaliser(t).includes(attendu), "« " + attendu + " » dans l'infobulle");
}
assert.ok(texte({ capRun: 500, capAfterRebirth: 500, perSecond: 50, speed: 50, ticksPerFill: 1, nextSpeed: null }).includes("Vitesse maximale"));
assert.match(ui, /touche!=='r'&&touche!=='t'/);
assert.match(ui, /action:'reclaimResource',resource:ressource/);
assert.match(ui, /ressource=touche==='r'\?'energy':'magic'/);
assert.match(ui, /'mouseover',function\(ev\)/, "survol du panneau d'énergie (PC)");

console.log("idle-energy-tooltip-and-reclaim-keys-v1: OK");
