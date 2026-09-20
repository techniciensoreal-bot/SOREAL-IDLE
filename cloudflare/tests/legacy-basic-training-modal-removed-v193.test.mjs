import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

assert.doesNotMatch(
  ui,
  /Ton énergie ne disparaît pas quand tu la places ici/,
  "L'ancien popup SOREAL Basic Training ne doit plus exister."
);

assert.doesNotMatch(
  ui,
  /programmerTutorielBasicTrainingIdleV47_/,
  "Le hook de l'ancien tutoriel Basic Training ne doit plus être appelé."
);

assert.doesNotMatch(
  ui,
  /sorealIdleBasicTrainingTutorielV47/,
  "L'ancien modal Basic Training V47 ne doit plus être présent."
);

assert.match(
  ui,
  /titre:'Basic Training'/,
  "Le tutoriel NGU actuel Basic Training doit rester présent."
);

console.log("Legacy Basic Training modal removed: OK");
