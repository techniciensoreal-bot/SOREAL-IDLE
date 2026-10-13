import assert from "node:assert/strict";
import { traduireReponseV1 } from "../src/idle-traductions-v1.js";
import fr from "../../design/ngu-boss-stories-fr.json" with { type: "json" };
import en from "../../design/ngu-boss-stories-en.json" with { type: "json" };
const vf = new Map(fr.map(x => [x.id, x.story]));
const vo = new Map(en.map(x => [x.id, x.story]));
for (const id of [80, 85, 86, 87, 100]) {
  const bad = { numero: id, histoire: vf.get(id + 1), conseil: "Test", nom: "Ne pas modifier" };
  if (!bad.histoire || !vf.get(id)) continue;
  const fixed = traduireReponseV1(bad, "fr");
  assert.equal(fixed.histoire, vf.get(id), "VF: boss " + id);
  assert.equal(fixed.nom, bad.nom);
  assert.equal(bad.histoire, vf.get(id + 1), "source non modifiee");
  assert.equal(traduireReponseV1(bad, "en").histoire, vo.get(id), "EN: boss " + id);
}
const custom = { numero: 85, histoire: "Texte personnalise", conseil: "Test" };
assert.equal(traduireReponseV1(custom, "fr").histoire, custom.histoire);
assert.equal(traduireReponseV1({ numero: 85, histoire: vf.get(85), conseil: "Test" }, "fr").histoire, vf.get(85));
assert.equal(traduireReponseV1({ numero: 85, description: vf.get(86), type: "boss_principal" }, "fr").description, vf.get(85));
assert.equal(traduireReponseV1({ bossSelection: 86, bossHistoire: vf.get(87) }, "fr").bossHistoire, vf.get(86));
assert.equal(traduireReponseV1({ numero: 79, histoire: vf.get(80), conseil: "Test" }, "fr").histoire, vf.get(80));
assert.equal(traduireReponseV1({ numero: 80, histoire: vf.get(80), conseil: "Test" }, "fr").histoire, vf.get(80));
console.log("Décalage des chroniques VF/EN et personnalisation: OK");
