import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const fr = JSON.parse(readFileSync("design/ngu-boss-stories-fr.json", "utf8"));
const en = JSON.parse(readFileSync("design/ngu-boss-stories-en.json", "utf8"));
const index = rows => new Map(rows.map(row => [row.id, row.story]));
const vf = index(fr), vo = index(en);
assert.equal(vo.get(80), "The joke here is the name itself is ghostly. :effort:");
assert.equal(vf.get(80), "La blague ici, c'est que le nom lui-même est fantomatique. :effort:");
for (let id = 80; id <= 301; id++) {
  assert.equal(vf.has(id), vo.has(id), "VF / EN : presence incoherente au boss " + id);
}
assert.match(vf.get(81), /arène de gladiateurs/);
assert.match(vo.get(81), /gladiator arena/);
const script = readFileSync("design/apply-idle-boss-stories.mjs", "utf8");
assert.match(script, /const adjacent = current &&/);
assert.match(script, /current === storiesById.get\(id - 1\)/);
assert.match(script, /current === storiesById.get\(id \+ 1\)/);
assert.match(script, /!current \|\| adjacent/);
assert.match(script, /--apply/);
console.log("Chroniques 80-301 VF/EN : associations et protection des textes verifies.");
