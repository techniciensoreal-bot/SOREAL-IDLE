import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-29) : « Au survol de la souris sur la barre "Magie", les
 * infos sont les mêmes que pour Énergie. » Cause : le panneau Magie
 * partage .soreal-idle-energy-panel-v34 avec le panneau Énergie (même
 * style de carte) — ouvrirInfobulleEnergieIdleV1_ affichait toujours le
 * texte Énergie, quel que soit le panneau réellement survolé. Le panneau
 * survolé doit maintenant afficher SES propres infos (texteInfobulleMagieIdleV1_
 * pour Magie, distinct de texteInfobulleEnergieIdleV1_).
 */

// --- Serveur : resourceInfoV1 pour la magie n'a pas de croissance "+1 tous les 20" (propre à l'Énergie) ---
{
  const context = { bosses: 4 };
  const s = normalizeIdleNguState({}, context, 1_000_000);
  s.systems.bloodMagic = { unlocked: true };
  s.resources.magic.cap = 200;
  s.resources.magic.speed = 3;
  s.resources.magic.generatedThisRun = 5000;
  const info = idleNguSnapshot(s, context, 1_000_000).resourceInfo.magic;
  assert.equal(info.capRun, 200);
  assert.equal(info.capAfterRebirth, 200, "la Magie n'a pas de croissance de plafond par Rebirth, contrairement à l'Énergie");
  assert.equal(info.capGain, 0);
}

// --- Client : texteInfobulleMagieIdleV1_ existe, distinct du texte Énergie, sans la ligne "tous les 20" ---
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("function nombreInfobulleIdleV1_(v,decimales){");
const fin = ui.indexOf("function fermerInfobulleEnergieIdleV1_(){");
const texte = new Function(
  "idleNombre_",
  ui.slice(debut, fin) + "return {energie:texteInfobulleEnergieIdleV1_,magie:texteInfobulleMagieIdleV1_};"
)((v) => Number(v) || 0);

const infoCommun = { capRun: 200, capAfterRebirth: 200, perSecond: 3.5, speed: 3, ticksPerFill: 17, nextSpeed: 3.1 };
const texteMagie = texte.magie(infoCommun);
const texteEnergie = texte.energie({ capRun: 916, capAfterRebirth: 1114, perSecond: 2, speed: 2, ticksPerFill: 25, nextSpeed: 2.1 });
const normaliser = (x) => x.split(String.fromCharCode(0x202f)).join(" ").split(String.fromCharCode(0xa0)).join(" ");

assert.notEqual(normaliser(texteMagie), normaliser(texteEnergie), "le texte Magie doit différer du texte Énergie");
for (const attendu of [
  "Ton maximum de Magie ACTUEL sur ce Rebirth : 200",
  "Au Rebirth, tu auras 200 de Magie.",
  "Tu produis actuellement 3,5 de Magie par seconde.",
  "Vitesse de Magie actuelle : 3, la barre se remplit tous les 17 ticks.",
  "Prochain palier de vitesse : 3,1.",
  "RACCOURCI : appuie sur T pour récupérer toute la Magie allouée dans toutes les fonctions."
]) {
  assert.ok(normaliser(texteMagie).includes(attendu), "« " + attendu + " » dans l'infobulle Magie");
}
assert.equal(
  normaliser(texteMagie).includes("tous les 20"),
  false,
  "la croissance de plafond « tous les 20 obtenus » est propre à l'Énergie, jamais inventée pour la Magie"
);
assert.ok(texte.magie({ capRun: 50, capAfterRebirth: 50, perSecond: 50, speed: 50, ticksPerFill: 1, nextSpeed: null }).includes("Vitesse maximale"));
assert.ok(
  /pas un plafond absolu/.test(texteMagie) && /Perks\/Quirks\/Souhaits/.test(texteMagie),
  "même correctif que l'Énergie (2026-09-29) : le maximum de Magie affiché n'est pas non plus un mur absolu"
);

// --- Le survol détecte le panneau réellement ciblé (Magie vs Énergie), jamais un texte figé ---
assert.match(
  ui,
  /function estPanneauMagie\(p\)\{\s*return Boolean\(p&&p\.classList&&p\.classList\.contains\('soreal-idle-magic-panel-v1'\)\);/,
  "le panneau survolé doit être identifié par sa classe Magie"
);
assert.match(ui, /ouvrirInfobulleEnergieIdleV1_\(p,estPanneauMagie\(p\)\)/);
assert.match(
  ui,
  /const texte=estMagie\s*\?texteInfobulleMagieIdleV1_\(infoMagieIdleV1_\(\)\)\s*:texteInfobulleEnergieIdleV1_\(infoEnergieIdleV1_\(\)\);/,
  "ouvrirInfobulleEnergieIdleV1_ doit choisir le texte selon le panneau réellement survolé"
);
assert.match(ui, /el\.dataset\.ressource=estMagie\?'magic':'energy';/, "le type de ressource affichée doit être mémorisé pour le rafraîchissement périodique");

console.log("idle-magic-tooltip-v1: OK");
