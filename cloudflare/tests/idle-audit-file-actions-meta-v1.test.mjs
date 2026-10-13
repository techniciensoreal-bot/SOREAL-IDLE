import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Audit 2026-10-13 : la file d'actions « meta » ne perd plus un clic quand la même action revient après une autre (A, B, A). */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(meta.includes("const dernierEnFile=idleMetaFileV1.length?cleActionMetaV1_(idleMetaFileV1[idleMetaFileV1.length-1]):'';") && meta.includes("if(cle&&idleMetaFileV1.length&&cle===dernierEnFile)return;"), "dédoublonnage contre la dernière action en file seulement");
assert.ok(!meta.includes("idleMetaFileV1.some(function(x){return cleActionMetaV1_(x)===cle;})"), "plus de dédoublonnage contre toute la file");
{ // règle pure
  const file = [], envoye = { cle: "", at: 0 };
  const poser = (c, now) => { const dernier = file.length ? file[file.length - 1] : ""; if (file.length && c === dernier) return; if (!file.length && c === envoye.cle && now - envoye.at < 700) return; file.push(c); };
  envoye.cle = "A"; envoye.at = 0;
  poser("B", 100); poser("A", 200); poser("A", 210);
  assert.deepEqual(file, ["B", "A"], "A, B, A : le troisième clic est gardé, le double clic identique est ignoré");
}
console.log("idle-audit-file-actions-meta-v1: OK");
