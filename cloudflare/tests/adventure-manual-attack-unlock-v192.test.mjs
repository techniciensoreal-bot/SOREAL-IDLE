import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);
const basic=readFileSync(
  new URL("../src/idle-basic-training.js",import.meta.url),
  "utf8"
);

const unlockStart=ui.indexOf("function competenceAdventureDebloqueeIdleV3_");
const unlockEnd=ui.indexOf("function niveauWishAdventureIdleV4_",unlockStart);
assert.ok(unlockStart>=0&&unlockEnd>unlockStart,"Fonction de déblocage Adventure introuvable.");
const unlockBlock=ui.slice(unlockStart,unlockEnd);

assert.match(
  unlockBlock,
  /return Boolean\(skill&&skill\.unlocked\)/,
  "Une compétence Adventure standard doit suivre uniquement son déblocage Basic Training."
);
assert.doesNotMatch(
  unlockBlock,
  /idleAdventureIdleModeV3/,
  "Idle Mode ne doit jamais participer au calcul de déblocage d'une compétence."
);

const refreshStart=ui.indexOf("function rafraichirCommandesAdventureIdleV3_");
const refreshEnd=ui.indexOf("function basculerIdleModeAdventureIdleV3_",refreshStart);
assert.ok(refreshStart>=0&&refreshEnd>refreshStart,"Rafraîchissement des commandes Adventure introuvable.");
const refreshBlock=ui.slice(refreshStart,refreshEnd);

assert.match(
  refreshBlock,
  /btn\.disabled=idleAdventureIdleModeV3\|\|!unlocked\|\|restant>0\|\|!prerequisOk/,
  "En Idle Mode OFF, une compétence débloquée sans cooldown/prérequis doit être cliquable."
);

assert.match(
  basic,
  /id:"attaque_reguliere"[\s\S]{0,260}prerequisite:"attaque_passive"[\s\S]{0,120}prerequisiteLevel:5000/,
  "Attaque régulière doit se débloquer à 5000 niveaux d'Attaque passive."
);

assert.match(
  ui,
  /id:'regular',label:'Attaque',[\s\S]{0,120}btIndex:1/,
  "Le bouton Attaque manuel doit rester relié à Attaque régulière, pas au boss 4."
);

console.log("Adventure manual attack unlock invariant: OK");
