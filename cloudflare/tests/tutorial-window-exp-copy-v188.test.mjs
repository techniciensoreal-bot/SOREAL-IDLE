import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

assert.ok(
  ui.includes("menu EXP Shop, qui vient aussi de se débloquer. Tu devrais voir un joli bouton bleu dans la barre en haut."),
  "Le tutoriel Récompenses doit pointer vers EXP Shop et le bouton bleu du haut."
);
assert.ok(
  ui.includes("On les a faites spécifiquement pour des débutants comme toi... ne le prends pas mal."),
  "Le Conseil de pro doit utiliser la nouvelle formulation."
);

const renderStart=ui.indexOf("root.innerHTML=\n          '<div class=\"soreal-idle-tuto-flottant-drag-v1\"");
const renderEnd=ui.indexOf("function demarrerTutorielPagesIdleV1_",renderStart);
assert.ok(renderStart>=0&&renderEnd>renderStart,"Rendu du tutoriel flottant introuvable.");
const render=ui.slice(renderStart,renderEnd);

assert.match(
  render,
  /if\(nouveau\)\{[\s\S]*?positionnerTutoFlottantV1_\(root\);[\s\S]*?\}[\s\S]*?activerGlisserTutoFlottantV1_\(root\);/,
  "Le drag doit être réattaché après chaque recréation de la poignée."
);
assert.doesNotMatch(
  render,
  /if\(nouveau\)\{[\s\S]*?activerGlisserTutoFlottantV1_\(root\);[\s\S]*?\}/,
  "Le drag ne doit plus être limité au tout premier rendu du tutoriel."
);

console.log("Tutorial draggable window and EXP copy: OK");
