import assert from "node:assert/strict";
import fs from "node:fs";
/* Norman (2026-11-07) : « trop de longueurs entre les bulles ; ça doit enchaîner à la suivante quand la voix a terminé de lire » : avec une vraie lecture, la bulle suivante vient 0,35 s après la fin de la voix ; sans voix (ou voix qui ne part pas), le temps de lecture prévu. */
const t = fs.readFileSync("cloudflare/public/modules/tutoriel-v1.js", "utf8");
assert.ok(t.includes("var SOUFFLE_APRES_VOIX_MS=350;") && /function pretASuivre_\(s\)\{[\s\S]*if\(voixParle_\(s\)\)return false;[\s\S]*if\(s\.aVoix\)return Date\.now\(\)-s\.voixFinieA>=SOUFFLE_APRES_VOIX_MS;[\s\S]*s\.tempsLecture;/.test(t), "règle d'enchaînement");
assert.ok(t.includes("if(Date.now()-debutVoix>=800){s.aVoix=true;s.voixFinieA=Date.now();}"), "un rappel immédiat (voix absente) ne compte pas comme une lecture");
assert.ok(t.includes("b.classList.contains('tu-bulle')&&!s.sceneEnCours&&pretASuivre_(s)"), "la bulle de Lhu utilise la règle");
assert.ok((t.match(/s\.aVoix=false;s\.voixFinieA=0;/g) || []).length >= 2, "remise à zéro à chaque étape");
console.log("idle-tuto-bulles-enchainent-voix-v1: OK");
