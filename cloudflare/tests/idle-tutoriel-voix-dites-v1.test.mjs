import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-23) : « quand ma fenêtre de tuto s'ouvre, il lit avec la voix de secours alors que les voix sont disponibles dans l'éditeur ». Les voix de l'éditeur sont celles du texte DIT (champ « parle »), pas du texte affiché : la fenêtre du guide doit lire ce texte-là, tel quel (mêmes empreintes que l'éditeur). */
const lire = (p) => readFileSync(new URL("../public/modules/" + p, import.meta.url), "utf8");
const tuto = lire("tutoriel-v1.js"), textes = lire("textes-admin-v1.js");
assert.ok(/parle:parleDe_,/.test(textes), "l'éditeur de textes expose le texte dit d'un champ");
const f = tuto.slice(tuto.indexOf("function texteParle_(guide,i)"), tuto.indexOf("function lireEtape_(s,force)"));
assert.ok(f.includes("T.parle(cleVoix_(guide,i),'texte')") && /if\(typeof dit==='string'&&dit\.trim\(\)\)brut=dit;/.test(f), "le texte dit passe avant le texte affiché");
assert.ok(f.indexOf("T.parle(") > f.indexOf("T.surcharge("), "le texte dit l'emporte sur la surcharge du texte affiché");
assert.ok(!/replace\(\/\s\+\/g,' '\)\.trim\(\)/.test(f.slice(f.indexOf("return tts&&"))), "les retours à la ligne ne sont plus écrasés (mêmes blocs que l'éditeur)");
console.log("idle-tutoriel-voix-dites-v1: OK");
