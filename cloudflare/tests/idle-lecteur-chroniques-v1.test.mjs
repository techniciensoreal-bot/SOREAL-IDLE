import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-10) : la chronique d'un boss s'affiche toute seule quand elle est lue (première rencontre), bouton Play / Stop à la place de « Lire la chronique » ; dans la fiche d'un boss, un bouton « Lire les chroniques à
 * partir d'ici » ouvre un lecteur flottant (pause / play, stop = ferme) déplaçable.
 */
const tts = readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const lec = readFileSync("cloudflare/public/modules/lecteur-chroniques-v1.js", "utf8");
const html = readFileSync("cloudflare/public/index.html", "utf8");

// 1. La chronique s'ouvre toute seule dès que sa lecture démarre.
assert.ok(tts.includes("window.__ouvrirChroniqueIdleV1__(true)") && ui.includes("window.__ouvrirChroniqueIdleV1__=poser"), "ouverture automatique pendant la lecture");
// 2. Play / Stop.
assert.ok(ui.includes("function boutonLectureChroniqueIdleV1_()") && ui.includes("${boutonLectureChroniqueIdleV1_()}") && !ui.includes("🔊 Lire la chronique</button>\n            ${window.__SOREAL_IDLE_TEXTES_V1__"), "bouton Play / Stop dans la chronique");
assert.ok(tts.includes("soreal-idle-chro-lecture-v1") && tts.includes("activeReadTarget===CHRONICLE_PANEL_ID") && css.includes('.soreal-idle-chro-lecture-v1[data-etat="stop"]'), "l'état du bouton suit la lecture");
assert.ok(!css.includes('content:"Lire la chronique"'), "l'invite « Lire la chronique » est supprimée");
// 3. Pause / reprise réelles du moteur vocal, et onDone(ok).
assert.ok(tts.includes("function pause_()") && tts.includes("audioContext.suspend()") && tts.includes("function reprendre_()") && tts.includes("pause:pause_") && tts.includes("resume:reprendre_"), "pause et reprise du moteur vocal");
assert.ok(tts.includes("onDone(ok===true)") && tts.includes("termine(true);"), "onDone indique si la lecture est allée au bout");
// 4. Fiche d'un boss + lecteur flottant.
assert.ok(ui.includes('data-lire-chroniques-depuis="') && ui.includes("Lire les chroniques à partir d’ici"), "bouton dans la fiche du boss");
assert.ok(lec.includes("x.decouvert") && lec.includes("setPointerCapture") && lec.includes("lc-pause-v1") && lec.includes("lc-stop-v1") && lec.includes("CLE_POS"), "boss découverts seulement, lecteur déplaçable, pause / stop");
assert.ok(html.includes("/modules/lecteur-chroniques-v1.js"), "module chargé");
// Anti-spoil : la file ne contient que des boss découverts ; compte « n sur m » = m chroniques déjà découvertes, jamais un total du jeu.
assert.ok(lec.includes("Chronique <b>") && !/\d+\s*\/\s*\d+/.test(lec.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").replace(/['"][^'"\n]*\/[^'"\n]*['"]/g, "").replace(/\/[^\/\n]+\/[gimsuy]*/g, "")), "pas de total « x / y »");
console.log("idle-lecteur-chroniques-v1: OK");
