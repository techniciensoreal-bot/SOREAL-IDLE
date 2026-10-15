import assert from "node:assert/strict";
import fs from "node:fs";
const lire = (p) => fs.readFileSync(new URL("../public/" + p, import.meta.url), "utf8");
const audio = lire("modules/audio-effects-v199.js"), meta = lire("modules/meta-progression-v130.js");
/* Norman (2026-10-15) : un son d'ordinateur « positif » à chaque mise à jour de Wandoos par une copie utilisée. */
assert.ok(audio.includes('wandoosMaj:{group:"wandoos-maj"') && audio.includes("function wandoosMajConstruire_(c){") && audio.includes('wandoosMaj:function(){return demander_("wandoosMaj");}') && audio.includes("wandoosMaj:wandoosMaj_,"), "son enregistré et exposé");
const a = meta.indexOf("if(payload&&payload.action==='consumeWandoosCopy'){"), b = meta.indexOf("toastIdleV5_(", a);
assert.ok(a > 0 && meta.slice(a, b).includes("__SOREAL_IDLE_AUDIO_V199__.wandoosMaj()"), "joué à la réussite seulement (pas au refus)");
assert.ok(audio.includes("function wandoosErreurConstruire_(c){") && meta.includes("__SOREAL_IDLE_AUDIO_V199__.wandoosErreur()"), "son d erreur à l installation refusée");
console.log("idle-wandoos-son-maj-v1: OK");
