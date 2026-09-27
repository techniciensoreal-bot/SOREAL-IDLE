import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « Tu dois ajouter dans paramètres, des barres de son pour régler le volume des voix et
 * le volume d'ambiance. » Câblage : deux curseurs dans Paramètres, un module partagé de réglages
 * (audio-volume-v1.js), la voix (tutorial-tts-v202.js) et l'ambiance (ambient-audio-v1.js) qui s'y abonnent,
 * chargés avant le jeu.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const tts = readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");

// --- Deux curseurs, dans Paramètres, juste avant la section Version ---
{
  const i = ui.indexOf("function htmlReglagesAudioIdleV1_(){");
  assert.ok(i > 0, "section audio introuvable");
  const bloc = ui.slice(i, i + 1600);
  assert.match(bloc, /🎙️ Voix/);
  assert.match(bloc, /🎶 Ambiance/);
  assert.ok(bloc.includes("oninput=\"window.__reglerVolumeIdleV1__(\\'voix\\',this.value)\""), "curseur voix câblé");
  assert.ok(bloc.includes("oninput=\"window.__reglerVolumeIdleV1__(\\'ambiance\\',this.value)\""), "curseur ambiance câblé");
  assert.ok(bloc.includes('type="range" min="0" max="100"'), "deux vrais curseurs (input range)");
}
assert.match(ui, /htmlReglagesAudioIdleV1_\(\)\+\s*'<div class="soreal-idle-section-v8">'\+\s*'<div class="soreal-idle-window-title-v31">Version<\/div>'/, "la section Audio précède la section Version");

// --- Le curseur ajuste le module de réglages sans re-rendre toute la page (pas de perte de focus en plein glissement) ---
assert.match(ui, /window\.__reglerVolumeIdleV1__=function\(type,valeur\)\{/);
assert.ok(!/window\.__reglerVolumeIdleV1__=function[\s\S]{0,600}contenuMenuIdleV28_/.test(ui), "jamais un re-rendu complet sur un simple glissement de curseur");
assert.match(ui, /r\.setAmbiance\(v\)/);
assert.match(ui, /r\.setVoix\(v\)/);

// --- Voix : les deux chemins de lecture (Web Audio et <audio> natif) appliquent le volume réglé ---
assert.match(tts, /function volumeVoix_\(\)\{/);
assert.match(tts, /var gain=ctx\.createGain\(\);\s*gain\.gain\.value=volumeVoix_\(\);\s*source\.connect\(gain\);\s*gain\.connect\(ctx\.destination\);/, "chemin Web Audio : passe par un GainNode réglé sur le volume voix");
assert.match(tts, /audio=new Audio\(src\);\s*audio\.preload='auto';\s*audio\.volume=volumeVoix_\(\);/, "chemin <audio> natif : .volume réglé sur le volume voix");
assert.match(tts, /try\{gain\.disconnect\(\);\}catch\(_\)\{\}/, "le GainNode est bien nettoyé (pas de fuite) comme le node source");

// --- Chargement : audio-volume-v1.js avant tout ce qui joue du son ; ambient-audio-v1.js avant le jeu ---
for (const m of ["/modules/audio-volume-v1.js?v=1", "/modules/ambient-audio-v1.js?v=1"]) assert.ok(index.includes(m), m);
assert.ok(
  index.indexOf("/modules/audio-volume-v1.js") < index.indexOf("/modules/audio-effects-v199.js") &&
  index.indexOf("/modules/audio-volume-v1.js") < index.indexOf("/modules/tutorial-tts-v202.js"),
  "les réglages de volume doivent être en place avant les modules qui les lisent"
);
assert.ok(index.indexOf("/modules/ambient-audio-v1.js") < index.indexOf("/soreal-idle-ui.js?v="), "chargé avant le jeu (qui appelle window.__SOREAL_IDLE_AMBIENT_AUDIO_V1__ à chaque rendu)");

// --- Câblage : vérifié à chaque rendu, seulement quand Aventure est débloqué ---
assert.match(ui, /if\(window\.__SOREAL_IDLE_AMBIENT_AUDIO_V1__\)\{\s*window\.__SOREAL_IDLE_AMBIENT_AUDIO_V1__\.verifier\(Boolean\(j&&j\.aventure&&j\.aventure\.debloquee\)\);\s*\}/);

console.log("idle-audio-settings-ui-v1: OK");
