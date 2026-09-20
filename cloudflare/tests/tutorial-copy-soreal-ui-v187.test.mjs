import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

assert.ok(
  ui.includes("En haut, en dessous de la grosse barre verte, tu vois tes deux stats principales, Attaque et Défense."),
  "Le tutoriel Objectif doit décrire la position réelle des stats dans SOREAL IDLE."
);

assert.ok(
  ui.includes("En parlant de la grosse barre verte, elle représente ton énergie."),
  "Le tutoriel Énergie doit décrire la grosse barre verte de l'interface actuelle."
);

assert.ok(
  ui.includes("titre:'Basic Training'"),
  "Basic Training ne doit pas être traduit dans le tutoriel."
);

assert.ok(
  ui.includes("Si tu sélectionnes Basic Training dans le menu en haut"),
  "Les explications du tutoriel doivent conserver le nom Basic Training."
);

assert.ok(
  ui.includes("à côté de « Attaque passive »"),
  "Le tutoriel Basic Training doit pointer vers « Attaque passive »."
);

assert.ok(
  !ui.includes("Attaque Idle"),
  "L'ancien libellé « Attaque Idle » ne doit plus subsister dans le tutoriel."
);

assert.ok(
  ui.includes(String.raw`La grosse barre verte, représente ton energie d\'entrainement disponible.`),
  "La page Énergie Idle doit expliquer l'énergie d'entraînement disponible via la barre verte."
);

assert.ok(
  ui.includes("transpalette électrique mais en carton"),
  "La comparaison Défense doit utiliser 'en carton'."
);

assert.ok(
  ui.includes("titre:'Fight Boss'") &&
  ui.includes("menu Fight Boss") &&
  ui.includes("'⚔️ Fight Boss',"),
  "Le tutoriel et l'en-tête de l'écran doivent utiliser Fight Boss."
);

assert.ok(
  !ui.includes("Sur la gauche, tu vois tes deux stats principales") &&
  !ui.includes("En haut à gauche, tu as aussi ton Énergie") &&
  !ui.includes("Entraînement de base") &&
  !ui.includes("transpalette électrique mais en verre"),
  "Les anciennes formulations du tutoriel ne doivent plus être présentes."
);

console.log("SOREAL IDLE tutorial copy alignment: OK");
