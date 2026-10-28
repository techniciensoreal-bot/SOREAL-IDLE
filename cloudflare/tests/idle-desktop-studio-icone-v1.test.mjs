// Exe Windows (Norman, 2026-10-28) : (1) le menu Admin doit pouvoir lancer le studio de voix depuis l'exe (origine « app://soreal » admise par le pilote et le studio, lien « soreal-studio:// » confié à Windows) ;
// (2) l'application a une vraie icône (fichier .ico multi-tailles, identité Windows pour la barre des tâches, icône de l'exécutable et de l'installateur).
import fs from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const lire = (f) => fs.readFileSync(path.join(R, f), "utf8");

for (const f of ["cloudflare/tools/voice-studio/pilote.py", "cloudflare/tools/voice-studio/serveur.py"]) {
  assert.match(lire(f), /workers\.dev,app:\/\/soreal,/, f + " : l'origine app://soreal doit être autorisée par défaut");
}
const main = lire("desktop/coeur.js");
assert.match(main, /LIEN_STUDIO = \/\^soreal-studio:/, "le lien du studio est reconnu");
assert.equal((main.match(/LIEN_STUDIO\.test\(url\)/g) || []).length, 2, "lien confié à Windows à la navigation ET à l'ouverture de fenêtre");
assert.match(main, /app\.setAppUserModelId\("be\.soreal\.idle\.windows"\)/, "identité Windows (barre des tâches)");
assert.match(main, /icone\.ico/, "la fenêtre utilise l'icône .ico");

const ico = fs.readFileSync(path.join(R, "desktop/icone.ico"));
assert.equal(ico.readUInt16LE(0), 0); assert.equal(ico.readUInt16LE(2), 1);
const n = ico.readUInt16LE(4);
assert.ok(n >= 6, "plusieurs tailles dans l'icône");
const tailles = [];
for (let i = 0; i < n; i += 1) {
  const o = 6 + i * 16, t = ico[o] || 256, len = ico.readUInt32LE(o + 8), off = ico.readUInt32LE(o + 12);
  tailles.push(t);
  assert.equal(ico.subarray(off, off + 8).toString("hex"), "89504e470d0a1a0a", "entrée " + t + " : PNG valide");
  assert.ok(off + len <= ico.length);
}
assert.ok(tailles.includes(16) && tailles.includes(32) && tailles.includes(256), "tailles 16, 32 et 256 présentes");
const cons = lire("desktop/construire.mjs");
assert.match(cons, /win: \{[^}]*icon: path\.join\(STAGE, "icone\.ico"\)/, "icône de l'exécutable");
assert.match(cons, /installerIcon/, "icône de l'installateur");
console.log("idle-desktop-studio-icone-v1 : OK");
