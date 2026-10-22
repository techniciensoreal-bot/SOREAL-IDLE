import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-22) : « Échec de la génération : CUDA error: device-side assert » sur « Autant s'amuser un peu. Non? ». Cause (reproduite avec le vrai modèle Chatterbox, un segment à la fois) : depuis que chaque question
 * forme son propre segment, « Non? » part seul au modèle, et Chatterbox plante sous quelques mots (« Non. », « Oui ? » aussi ; « Zones. Zones. » passe). Un segment court est maintenant dit deux fois et on ne garde
 * que la première prononciation (comme les noms courts de synthetiser()). Vérifié à la main avec le modèle : Non? / Non. / Oui ? / Bien joué. / Ah ! / « Autant s'amuser un peu. Non? » passent.
 */
const src = readFileSync(new URL("../tools/voice-studio/serveur.py", import.meta.url), "utf8");
const debut = src.indexOf("def synthetiser_long(");
const fin = src.indexOf("def vers_m4a(");
assert.ok(debut > 0 && fin > debut);
const corps = src.slice(debut, fin);
assert.ok(corps.includes("if len(segment) < TEXTE_COURT:"), "un segment court est traité à part");
assert.ok(corps.includes('court + fin + " " + court + fin') && corps.includes("garder_premiere_prononciation(generer_segment("), "dit deux fois, première prononciation gardée");
assert.ok(corps.includes('fin = "?" if est_question(segment) else "."'), "la question garde son point d'interrogation");
assert.ok(corps.indexOf("if len(segment) < TEXTE_COURT:") < corps.indexOf("wav = generer_segment(m, segment, kwargs)"), "le cas court passe avant la génération normale");
console.log("idle-studio-segment-court-v1: OK");
