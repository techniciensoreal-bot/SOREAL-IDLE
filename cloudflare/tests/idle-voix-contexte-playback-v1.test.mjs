// Norman (2026-10-30) : « hier, sur mon téléphone, les voix crachouillaient encore ; les autres sons ne crachouillent plus » :
// les sons du jeu passent par le contexte partagé (tampon « balanced ») et le limiteur ; la voix des tutoriels garde son propre contexte (elle se met en pause sans couper les sons) mais l'ouvre
// désormais avec le plus large tampon (« playback ») et passe par le même limiteur de sortie.
import fs from "node:fs";
import assert from "node:assert/strict";
const s = fs.readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(s.includes("audioContext=new Ctor({latencyHint:'playback'});") && s.includes("catch(_e){audioContext=new Ctor();}"), "contexte des voix : latence « playback », repli sur le contexte par défaut");
assert.ok(s.includes("limiteur.brancher(ctx,gain)") && s.includes("gain.connect(ctx.destination);"), "la voix passe par le limiteur de sortie (repli : sortie directe)");
assert.ok(!/source\.connect\(gain\);\n\s*gain\.connect\(ctx\.destination\);/.test(s), "plus de branchement direct sur la sortie");
console.log("idle-voix-contexte-playback-v1 : OK");
