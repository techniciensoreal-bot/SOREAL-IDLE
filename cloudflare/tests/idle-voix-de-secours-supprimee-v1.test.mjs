import assert from "node:assert/strict";
import fs from "node:fs";
/*
 * Norman (2026-11-07) : « enlève les voix de secours du jeu ; je n'en veux plus, ça fait ramer le jeu ». La voix de secours (Piper, synthèse WASM dans la page) n'existe plus : ni script, ni modèle, ni préchauffage.
 * Un texte sans voix générée (Admin) reste MUET ; seules les voix générées sont lues.
 */
const index = fs.readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(!/piper|onnxruntime|local-neural/i.test(index.replace(/<!--[\s\S]*?-->/g, "")), "aucun script de synthèse dans la page");
const tts = fs.readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
assert.ok(/voiceStats\.muets\+=1;return null;/.test(tts), "sans fichier de voix : muet");
assert.ok(!/return requestLocalNeuralAudio_\(/.test(tts) && !/\srequestLocalNeuralAudio_\(texte,/.test(tts), "aucun appel à la synthèse locale (lecture ni préchauffage)");
console.log("idle-voix-de-secours-supprimee-v1: OK");
