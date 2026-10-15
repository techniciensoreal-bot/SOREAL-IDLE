import assert from "node:assert/strict";
import fs from "node:fs";
const py = fs.readFileSync(new URL("../tools/voice-studio/serveur.py", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const essai = fs.readFileSync(new URL("../tools/voice-studio/test_decoupe.py", import.meta.url), "utf8");
/*
 * Norman (2026-10-15) : « dans la génération de voix, j'ai énormément de dérapage ; ça met une éternité à générer à cause de ça ». Chatterbox appelle t3.inference(max_new_tokens=1000) en dur : un segment qui dérape tournait
 * toujours jusqu'au bout des 1000 jetons, puis était refait jusqu'à trois fois. Le studio plafonne maintenant le nombre de jetons d'après la durée plausible du segment (essais : python test_decoupe.py, avec le python du studio).
 */
assert.ok(py.includes("def plafond_jetons(segment):") && py.includes("(duree_max_segment(segment) + MARGE_PLAFOND_S) * JETONS_PAR_SECONDE"), "plafond d'après la durée plausible du segment");
assert.ok(py.includes("def installer_plafond(modele):") && py.includes('kwargs["max_new_tokens"] = min(int(kwargs["max_new_tokens"]), plafond)') && py.includes("installer_plafond(_modele)"), "t3.inference enveloppé à l'installation du modèle");
assert.ok(py.includes("_plafond_jetons[0] = plafond_jetons(segment)") && py.includes("SOREAL_VOIX_PLAFOND"), "plafond posé avant chaque génération, désactivable");
assert.ok((py.match(/_plafond_jetons\[0\] = 0/g) || []).length >= 2, "plafond remis à zéro après chaque segment");
assert.ok(essai.includes("serveur.plafond_jetons") && essai.includes("dérapage : trois essais, chacun plafonné"), "essais Python du plafond");
console.log("idle-studio-plafond-jetons-v1: OK");
