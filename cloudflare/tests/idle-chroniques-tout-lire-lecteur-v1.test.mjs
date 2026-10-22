import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Norman (2026-10-22) : « Lire toute l'histoire » passe par le petit lecteur flottant (pause / stop), comme « à partir de ce boss ». */
const lecteur = readFileSync(new URL("../public/modules/lecteur-chroniques-v1.js", import.meta.url), "utf8");
const combat2 = readFileSync(new URL("../public/modules/ui-combat-2-v1.js", import.meta.url), "utf8");
assert.ok(lecteur.includes("function demarrer(numeroDepart,intro)") && lecteur.includes("etat.index===0&&etat.intro"), "le lecteur accepte une introduction avant la première chronique");
const i = combat2.indexOf("function lireHistoireCompleteBossIdleV206_()");
const bloc = combat2.slice(i, i + 2600);
assert.ok(bloc.includes("lecteur.demarrer(0,") && bloc.includes("lecteur.actif()") && bloc.includes("lecteur.stop()"), "tout lire démarre le lecteur (un second appui l'arrête)");
console.log("idle-chroniques-tout-lire-lecteur-v1: OK");
