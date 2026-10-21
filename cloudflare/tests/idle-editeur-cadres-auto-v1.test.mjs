import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-21) : dans l'éditeur de voix, les cadres de texte des personnages s'allongent avec leur contenu ; le générateur respecte le ton interrogatif. */
const ed = readFileSync(new URL("../public/modules/textes-admin-v1.js", import.meta.url), "utf8");
assert.ok(ed.includes("field-sizing:content") && ed.includes("function ajusterCadres_(") && ed.includes("t.scrollHeight"), "cadres de texte auto-extensibles");
assert.ok(ed.includes("new MutationObserver") && ed.includes("planifier"), "recalcul à chaque réécriture de l'éditeur");
const srv = readFileSync(new URL("../tools/voice-studio/serveur.py", import.meta.url), "utf8");
assert.ok(srv.includes("def est_question(") && srv.includes("couper_bords(wav, m.sr, est_question(segment))") && srv.includes("Ton interrogatif (Norman, 2026-10-21)"), "ton interrogatif : segment à part, bords gardés, espace retirée");
console.log("idle-editeur-cadres-auto-v1: OK");
