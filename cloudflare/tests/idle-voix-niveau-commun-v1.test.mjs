import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-11-04) : « la génération de voix ne me donne pas le même volume ; entre 2 textes on sent vraiment une différence » (histoire Hooloovo, savant cynique). Le niveau se règle sur les seuls passages parlés, après l'humeur, pour toutes les voix françaises. */
const s = readFileSync("cloudflare/tools/voice-studio/serveur.py", "utf8");
assert.ok(s.includes("def niveau_parole(") && s.includes("def niveler("), "niveau des passages parlés et nivellement");
assert.ok((s.match(/wav = niveler\(wav, sr, humeur\)/g) || []).length === 2, "appliqué aux deux chemins de synthèse (nom court et texte normal)");
assert.ok(/appliquer_humeur\(wav, sr, humeur\)\s+wav = niveler\(/.test(s.replace(/\r/g, "")), "après l'humeur");
assert.ok(!/niveler\(.*langue/.test(s) && /if not en:[\s\S]{0,200}niveler/.test(s), "jamais pour l'anglais (voix déjà publiées)");
assert.ok(s.includes("np.tanh((a - 0.8) / 0.19)"), "limiteur doux, pas d'écrêtage dur");
console.log("idle-voix-niveau-commun-v1: OK");
