// Norman (2026-11-01) : « sur le mini lecteur des chroniques, un bouton précédent, play/pause, suivant, stop » ; « je veux pouvoir le réduire en petite enceinte que je peux placer où je veux » ; « que le lecteur ait une forme de cassette de walkman ».
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const l = lire("cloudflare/public/modules/lecteur-chroniques-v1.js");
// quatre touches, dans l'ordre
const i = l.indexOf('class="lc-prec-v1"');
assert.ok(i > 0 && l.indexOf('class="lc-pause-v1"', i) > i && l.indexOf('class="lc-suiv-v1"', i) > l.indexOf('class="lc-pause-v1"', i) && l.indexOf('class="lc-stop-v1"', i) > l.indexOf('class="lc-suiv-v1"', i), "précédent, play/pause, suivant, stop dans cet ordre");
// navigation : coupe la voix, invalide la fin de lecture en cours, relit ; suivant sur la dernière ferme
const a = l.indexOf("function aller(delta)");
assert.ok(a > 0 && l.slice(a, a + 700).includes("etat.jeton+=1") && l.slice(a, a + 700).includes("t.stop()") && l.slice(a, a + 700).includes("cible>=etat.file.length){terminer()") && l.slice(a, a + 700).includes("etat.pause=false;") && l.slice(a, a + 700).includes("lireCourante()"), "aller : coupe la voix, invalide l'ancienne fin, reprend la lecture");
assert.ok(l.includes("precedent:precedent,suivant:suivant"), "exposés");
// petite enceinte déplaçable, préférence liée au compte
assert.ok(l.includes("lc-enceinte-v1") && l.includes("soreal_idle_lecteur_chroniques_mini_v1") && l.includes("regler(false)") && l.includes("Math.abs(ev.clientX-d.x)<6"), "enceinte : un toucher agrandit, un glissement déplace");
// cassette : étiquette, deux bobines qui tournent d'un tour complet, coupées en mouvement réduit
assert.ok(l.includes("lc-cassette-v1") && l.includes("lc-etiquette-v1") && l.includes("lc-bobine-v1") && l.includes("lc-base-v1"), "forme de cassette");
assert.ok(l.includes("@keyframes lcTourne{from{transform:rotate(0)}to{transform:rotate(360deg)}}") && l.includes("animation:lcTourne 2.4s linear infinite") && l.includes("animation-play-state:paused") && l.includes("prefers-reduced-motion:reduce"), "bobines : un tour complet, pause à l'arrêt, mouvement réduit");
assert.ok(!/\!important/.test(l), "aucun !important");
// les DEUX bobines tournent dans le sens inverse des aiguilles d'une montre (comme une vraie cassette en lecture)
assert.ok(l.includes("' .lc-bobine-v1 svg{animation-direction:reverse}'") && !l.includes(".lc-bobine-v1.d svg{animation-direction:reverse}"), "les deux bobines en sens inverse des aiguilles d'une montre");
// anti-spoil : aucun total de chroniques n'est ajouté (le compte « x sur n » ne compte que les chroniques déjà découvertes)
assert.ok(l.includes("x.decouvert"), "file = boss découverts seulement");
console.log("idle-lecteur-cassette-v1 : OK");
