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

// --- Trois curseurs (voix, ambiance, sons de l'interface) avec une case à cocher chacun, dans Paramètres, juste avant la section Version ---
{
  const i = ui.indexOf("function htmlReglagesAudioIdleV1_(){");
  assert.ok(i > 0, "section audio introuvable");
  const bloc = ui.slice(i, i + 2600);
  assert.match(bloc, /🎙️ Voix/);
  assert.match(bloc, /🎶 Ambiance/);
  assert.match(bloc, /🔔 Sons de l’interface/);
  assert.ok(bloc.includes("oninput=\"window.__reglerVolumeIdleV1__(\\''+type+'\\',this.value)\""), "curseur câblé");
  assert.ok(bloc.includes("onchange=\"window.__basculerSonIdleV1__(\\''+type+'\\',this.checked)\""), "case à cocher câblée");
  assert.ok(bloc.includes('type="range" min="0" max="100"'), "de vrais curseurs (input range)");
  assert.ok(bloc.includes("['interface','🔔 Sons de l’interface']") && bloc.includes("['voix','🎙️ Voix']") && bloc.includes("['ambiance','🎶 Ambiance']"));
  assert.ok(bloc.includes("(actif?'checked ':'')"), "cochée de base");
}
/* Depuis le 2026-10-08, la section « Effets visuels » s'intercale entre l'Audio et la Version. */
assert.match(ui, /htmlReglagesAudioIdleV1_\(\)\+\s*htmlReglagesEffetsIdleV1_\(\)\+\s*'<div class="soreal-idle-section-v8">'\+\s*'<div class="soreal-idle-window-title-v31">Version<\/div>'/, "la section Audio précède la section Version (avec les Effets visuels entre les deux)");

// --- Le curseur ajuste le module de réglages sans re-rendre toute la page (pas de perte de focus en plein glissement) ---
assert.match(ui, /window\.__reglerVolumeIdleV1__=function\(type,valeur\)\{/);
assert.ok(!/window\.__reglerVolumeIdleV1__=function[\s\S]{0,600}contenuMenuIdleV28_/.test(ui), "jamais un re-rendu complet sur un simple glissement de curseur");
assert.match(ui, /r\.setReglage\(type,v\)/);
assert.match(ui, /window\.__basculerSonIdleV1__=function\(type,coche\)\{/);

// --- Sons de l'interface : le gain maître des effets suit la barre (75 % = l'ancien gain fixe 0,78) ---
{
  const fx = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
  assert.ok(fx.includes("master.gain.value=gainMaitre_();") && fx.includes("r.getInterface()*(.78/.75)"));
}

// --- Voix : les deux chemins de lecture (Web Audio et <audio> natif) appliquent le volume réglé ---
assert.match(tts, /function volumeVoix_\(\)\{/);
assert.match(tts, /var gain=ctx\.createGain\(\);\s*gain\.gain\.value=volumeVoix_\(\);\s*source\.connect\(gain\);\s*gain\.connect\(ctx\.destination\);/, "chemin Web Audio : passe par un GainNode réglé sur le volume voix");
assert.match(tts, /audio=new Audio\(src\);\s*audio\.preload='auto';\s*audio\.volume=volumeVoix_\(\);/, "chemin <audio> natif : .volume réglé sur le volume voix");
assert.match(tts, /try\{gain\.disconnect\(\);\}catch\(_\)\{\}/, "le GainNode est bien nettoyé (pas de fuite) comme le node source");

// --- Chargement : audio-volume-v1.js avant tout ce qui joue du son ; ambient-audio-v1.js avant le jeu ---
for (const m of ["/modules/audio-volume-v1.js?v=5", "/modules/ambient-audio-v1.js?v=8"]) assert.ok(index.includes(m), m);
assert.ok(
  index.indexOf("/modules/audio-volume-v1.js") < index.indexOf("/modules/audio-effects-v199.js") &&
  index.indexOf("/modules/audio-volume-v1.js") < index.indexOf("/modules/tutorial-tts-v202.js"),
  "les réglages de volume doivent être en place avant les modules qui les lisent"
);
assert.ok(index.indexOf("/modules/ambient-audio-v1.js") < index.indexOf("/soreal-idle-ui.js?v="), "chargé avant le jeu (qui appelle window.__SOREAL_IDLE_AMBIENT_AUDIO_V1__ à chaque rendu)");

// --- Câblage : vérifié à chaque rendu, seulement quand Aventure est débloqué ---
assert.match(ui, /if\(window\.__SOREAL_IDLE_AMBIENT_AUDIO_V1__\)\{\s*window\.__SOREAL_IDLE_AMBIENT_AUDIO_V1__\.verifier\(Boolean\(j&&j\.aventure&&j\.aventure\.debloquee\)\);\s*\}/);

console.log("idle-audio-settings-ui-v1: OK");
