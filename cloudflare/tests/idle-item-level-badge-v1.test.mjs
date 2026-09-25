import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-24) : « Sur les objets qui peuvent monter de niveau, je veux que le niveau soit inscrit sur l'image, de manière visible,
 * avec un contour. Quand un objet n'a pas de statistiques (un boost) et qu'on le stack niveau 100, il faut en plus un V vert. Pour les
 * items qui nécessitent des boosts : niveau 100 ET tous les boosts accumulés — le même prérequis que pour le Coffre. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

function extraire(debut) {
  const i = ui.indexOf(debut);
  assert.ok(i >= 0, debut);
  let p = 0;
  let k = ui.indexOf("{", i);
  for (; k < ui.length; k += 1) {
    if (ui[k] === "{") p += 1;
    else if (ui[k] === "}") {
      p -= 1;
      if (!p) break;
    }
  }
  return ui.slice(i, k + 1);
}
const badges = new Function(
  "idleEntier_",
  extraire("function badgesNiveauObjetIdleV1_(item){") + "return badgesNiveauObjetIdleV1_;"
)((v) => Math.max(0, Math.floor(Number(v) || 0)));

// Niveau : affiché dès le niveau 1, doré au 100, jamais à 0
assert.equal(badges(null), "");
assert.equal(badges({ level: 0 }), "", "niveau 0 : rien");
assert.match(badges({ level: 7 }), /<i class="idle-lvl-badge-v1" aria-hidden="true">7<\/i>/);
assert.match(badges({ level: 64 }), />64<\/i>/);
assert.match(badges({ level: 100 }), /idle-lvl-badge-v1 max/);
// V vert : uniquement pour un objet « pleinement maxé » (niveau 100 + stats comblées), donc jamais pour un niveau 100 incomplet
assert.ok(!badges({ level: 100, fullyMaxed: false }).includes("idle-maxok-badge-v1"), "niveau 100 sans tous les boosts : pas de V");
assert.ok(!badges({ level: 99, fullyMaxed: false }).includes("idle-maxok-badge-v1"));
assert.match(badges({ level: 100, fullyMaxed: true }), /idle-maxok-badge-v1/, "niveau 100 + boosts complets : V vert");
assert.match(badges({ level: 100, fullyMaxed: true }), /idle-lvl-badge-v1 max/);

// Posé sur l'image de tous les objets rendus par iconeObjetAdventureIdleV138_ (sac, équipement, accessoires, corbeille, collection, coffre)
assert.match(extraire("function iconeObjetAdventureIdleV138_(item){"), /iconeBaseObjetAdventureIdleV138_\(item\)\+badgesNiveauObjetIdleV1_\(item\)/);
assert.match(ui, /kind:'equipment',level:niveau\}/, "collection : niveau sur l'image");
assert.ok(ui.includes("const pseudoItem={set:s.set,slot:s.slot,name:s.name,level:100,definitionId:s.definitionId,wikiItemId:s.wikiItemId,kind:item.kind};"), "coffre : niveau sur l'image");

// Même prérequis que le Coffre : le serveur calcule fullyMaxed avec la fonction du Coffre (et un boost, sans stats, l'est au niveau 100)
const serveur = readFileSync("cloudflare/src/idle-adventure-v47.js", "utf8");
assert.match(serveur, /fullyMaxed:idleAdventureObjetPleinementMaxeV1\(o\)/);
assert.match(serveur, /function idleAdventureObjetPleinementMaxeV1\(o\)\{\s*if\(!idleAdventureNiveauEstMaxV1\(o\?\.level\)\)return false;/);

// Style : contour sombre + halo, doré au 100 ; V vert rond à bord blanc ; ne gêne pas les clics ; cases positionnées
assert.match(css, /\.idle-lvl-badge-v1\{[^}]*-webkit-text-stroke:[^}]*paint-order:stroke fill;/);
assert.match(css, /\.idle-lvl-badge-v1\.max\{[^}]*color:#ffd84a;/);
assert.match(css, /\.idle-maxok-badge-v1\{[^}]*background:linear-gradient\(145deg,#34d67a,#16a34a\);[^}]*border:2px solid #fff;/);
assert.match(css, /\.idle-lvl-badge-v1\{[^}]*pointer-events:none;/);
assert.match(css, /\.soreal-idle-v138-slot-icon,\s*\.soreal-idle-v138-bag-card,\s*\.soreal-idle-v138-trash-slot,\s*\.soreal-idle-collection-card-icon-v1\{\s*position:relative;/);

console.log("idle-item-level-badge-v1 OK");
