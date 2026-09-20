import assert from "node:assert/strict";
import {idleRuntimeTestHooks} from "../src/idle-sqlite-runtime.js";
import {readFileSync} from "node:fs";

const {
  equilibrerBossPrincipalSorealIdleV413_
}=idleRuntimeTestHooks;

const sourceBoss={
  id:2,
  nom:"Zombie rapide",
  pv:123,
  attaque:45,
  xp:7,
  histoire:"Une histoire présente dans Collection.",
  conseil:"Un conseil présent dans Collection."
};

const balanced=
  equilibrerBossPrincipalSorealIdleV413_(
    sourceBoss,
    1,
    "normal"
  );

assert.equal(
  balanced.histoire,
  sourceBoss.histoire,
  "L'équilibrage Fight Boss doit préserver exactement l'histoire du catalogue Collection."
);
assert.equal(
  balanced.conseil,
  sourceBoss.conseil,
  "L'équilibrage Fight Boss doit préserver exactement le conseil du catalogue Collection."
);

const runtime=readFileSync(
  new URL("../src/idle-sqlite-runtime.js",import.meta.url),
  "utf8"
);

assert.match(
  runtime,
  /bossHistoire:\s*String\([\s\S]{0,100}bossDefinitionEtat\.histoire/,
  "L'état Fight Boss doit exposer l'histoire équilibrée."
);
assert.match(
  runtime,
  /bossConseil:\s*String\([\s\S]{0,100}bossDefinitionEtat\.conseil/,
  "L'état Fight Boss doit exposer le conseil équilibré."
);
assert.doesNotMatch(
  runtime,
  /histoire:\s*""\s*,\s*conseil:\s*""/,
  "Le runtime ne doit plus effacer la narration des boss."
);

console.log("Fight Boss lore parity with Collection V185: OK");
