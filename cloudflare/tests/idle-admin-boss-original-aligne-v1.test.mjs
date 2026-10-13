import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { histoireBossFrAligneeV1 } from "../src/idle-traductions-v1.js";
import fr from "../../design/ngu-boss-stories-fr.json" with { type: "json" };
const vf = new Map(fr.map((x) => [x.id, x.story]));
for (const id of [85, 86, 87]) {
  assert.equal(histoireBossFrAligneeV1(id, vf.get(id + 1)), vf.get(id), "texte décalé rangé sous le boss " + id);
  assert.equal(histoireBossFrAligneeV1(id, vf.get(id)), vf.get(id));
}
assert.equal(histoireBossFrAligneeV1(85, "Texte personnalisé"), "Texte personnalisé");
assert.equal(histoireBossFrAligneeV1(5, ""), "");
const src = readFileSync(new URL("../src/idle-sqlite-runtime.js", import.meta.url), "utf8");
assert.ok(src.includes("original: histoireBossFrAligneeV1(numero,"), "l'éditeur Admin réaligne la chronique d'origine");
console.log("Éditeur Admin : chronique d'origine réalignée: OK");
