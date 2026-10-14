import assert from "node:assert/strict";
import fs from "node:fs";
const lire=(p)=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
const e=lire("public/modules/titans-combat-ecran-v1.js");
const t=lire("public/modules/titans-v1.js");
const ui=lire("public/soreal-idle-ui.js");
/* écran d'annonce */
assert.ok(e.includes("function annoncer(")&&e.includes("ttnAnnonceV1")&&e.includes("Un Titan approche"));
assert.ok(t.includes("ecran.annoncer(")&&t.indexOf("ecran.annoncer(")<t.indexOf("marquerVu(id);",t.indexOf("function lancerCombatTitan_")),"l'annonce capture 'vu' avant marquerVu");
assert.ok(e.includes("finirAnnonce()"));
/* plein écran : alignement à chaque passage, html verrouillé */
assert.ok(e.includes("html.tcv-actif{overflow:hidden")&&e.includes("dernierDefil"));
/* Grand Arbre corrompu qui grandit */
assert.ok(e.includes("function echelleTitan(")&&e.includes("'t2'"));
/* sortie du titan vaincu */
assert.ok(e.includes("tcvAdieu")&&e.includes("rotate(3240deg)")&&e.includes("sera de retour dans"));
assert.ok(ui.includes("soreal-titan-vaincu"));
assert.ok(t.includes("infoRetour:infoRetour"));
/* bouton Aventure depuis les Titans */
assert.ok(/nouveauMenu==='aventure'&&idleMenuActifV28==='aventure'&&idleVueAventureV1==='titans'/.test(ui));
console.log("idle-titan-arrivee-depart-v1: OK");
/* page Titans : redessinée toute seule quand un titan est vaincu (le chrono apparaît sans changer de menu) */
assert.ok(t.includes("signatureRendue")&&t.includes("__titansRafraichirPageIdleV1__")&&ui.includes("__titansEtatJoueurIdleV1__"));
