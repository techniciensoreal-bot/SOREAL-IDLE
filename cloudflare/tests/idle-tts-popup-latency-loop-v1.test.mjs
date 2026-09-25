import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-25) : « Dans les popups informatifs, la voix auto se lance sur le premier popup. Quand on fait Suivant, ça met du temps avant que
 * le son soit joué. Tout à l'heure il a buggé et repassait les mêmes phrases en boucle. »
 */
const tts = readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// 1. Limitation et non plus anti-rebond : une évaluation planifiée n'est jamais repoussée par les mutations suivantes
const schedule = tts.slice(tts.indexOf("function schedule_(){"), tts.indexOf("function style_(){"));
assert.ok(schedule.includes("if(timer)return;"), "une évaluation à la fois");
assert.ok(!schedule.includes("clearTimeout(timer)"), "plus d'anti-rebond qui n'aboutit jamais tant que la page bouge");

// 2. narrate_ conserve l'empreinte du texte lu (sinon chaque mutation relance la narration : phrases en boucle)
const narrate = tts.slice(tts.indexOf("function narrate_("), tts.indexOf("function readVisible_("));
assert.ok(/var empreinteGardee=lastFingerprint;\s*stop_\(\);\s*lastFingerprint=empreinteGardee;/.test(narrate));
assert.ok(!/lastFingerprint='';\s*updateReadButtons_\(\);\s*var message=/.test(narrate), "une erreur ne vide plus l'empreinte (pas de relance en boucle)");
assert.ok(tts.includes("retryAuGeste=true") && tts.includes("if(retryAuGeste){retryAuGeste=false;lastFingerprint='';}"), "réessai au prochain geste");

// 3. Comportement réel de la limitation : 200 mutations rapprochées => une évaluation au plus toutes les 70 ms, et elle a bien lieu
{
  const source = tts.slice(tts.indexOf("function schedule_(){"), tts.indexOf("function style_(){"));
  const evaluations = [];
  const horloge = { t: 0, taches: [] };
  const setTimeoutFactice = (f, ms) => { const id = horloge.taches.push({ f, a: horloge.t + ms }); return id; };
  const fabrique = new Function("scan_", "setTimeout", "let timer=0;\n" + source + "\nreturn {schedule:schedule_};");
  const api = fabrique(() => evaluations.push(horloge.t), setTimeoutFactice);
  for (let i = 0; i < 200; i += 1) { horloge.t = i * 5; api.schedule(); }
  horloge.taches.forEach((t) => { horloge.t = t.a; t.f(); });
  assert.equal(horloge.taches.length, 1, "un seul minuteur planifié malgré 200 mutations");
  assert.equal(evaluations.length, 1, "l'évaluation a bien lieu (l'anti-rebond ne l'aurait jamais déclenchée)");
}

// 4. Préchargement des voix de la page suivante d'un popup
assert.ok(tts.includes("function prechauffer_(value)") && tts.includes("prechauffer:prechauffer_,"));
assert.ok(tts.includes("var blocsFichiers={};") && tts.includes("function chargerBlocFichier_(text)"), "cache par empreinte, indépendant de la narration en cours");
assert.match(ui, /tts\.prechauffer\(texteVoixTutorielIdleV1_\(suivante\)\)/);
assert.ok(ui.indexOf("prechaufferVoixTutorielIdleV1_(etat);") > ui.indexOf("function rendreTutorielPagesIdleV1_(){"));

console.log("idle-tts-popup-latency-loop-v1: OK");
