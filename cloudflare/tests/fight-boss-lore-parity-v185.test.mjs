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
/*
 * V186 : le champ brut peut rester dans la définition interne pour
 * compatibilité des données, mais il ne doit plus être exposé au joueur.
 * Seule l'Histoire fait partie de la parité Collection/Fight Boss.
 */
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
  /bossConseil:\s*''/,
  "Les anciens conseils SOREAL ne doivent plus être exposés dans Fight Boss."
);
assert.doesNotMatch(
  runtime,
  /histoire:\s*""\s*,\s*conseil:\s*""/,
  "Le runtime ne doit jamais effacer l'Histoire en même temps que les anciens conseils."
);

console.log("Fight Boss lore parity with Collection V185: OK");
