import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-29) : « Sur PC, j'aimerais que les statistiques des items
 * apparaissent instantanément au passage de la souris. Mais le popup doit
 * toujours se situer en haut à gauche/droite en bas à gauche/droite suivant
 * la place disponible à l'écran. Le popup ne doit pas couvrir l'objet qu'on
 * affiche. Il ne doit pas être directement sur la souris. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

function extraire(debut) {
  const i = ui.indexOf(debut);
  assert.ok(i >= 0, "introuvable : " + debut);
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

// --- Positionnement : ancré à un coin de l'emplacement survolé, jamais sur son rectangle ---
const { positionner } = new Function(
  "window",
  extraire("function calculerPositionInfobulleObjetAdventureIdleV1_(largeur,hauteur,ancreRect){") +
    "return {positionner:calculerPositionInfobulleObjetAdventureIdleV1_};"
)({ innerWidth: 1200, innerHeight: 800 });

function rectangleChevauche(pos, largeur, hauteur, ancre) {
  return !(
    pos.left + largeur <= ancre.left ||
    pos.left >= ancre.right ||
    pos.top + hauteur <= ancre.top ||
    pos.top >= ancre.bottom
  );
}

// Objet au centre de l'écran : assez de place partout -> jamais de recouvrement de l'objet.
{
  const ancre = { top: 300, bottom: 340, left: 500, right: 540 };
  const pos = positionner(200, 150, ancre);
  assert.equal(rectangleChevauche(pos, 200, 150, ancre), false, "l'infobulle ne doit jamais couvrir l'objet survolé");
  // Ni sur l'objet, ni collée à un bord tenant du curseur qui vient de l'atteindre : marge réelle avec l'ancre.
  assert.ok(pos.left >= ancre.right || pos.left + 200 <= ancre.left, "séparation horizontale franche avec l'objet");
  assert.ok(pos.top >= ancre.bottom || pos.top + 150 <= ancre.top, "séparation verticale franche avec l'objet");
}

// Objet collé en haut à gauche de l'écran : doit basculer en bas-droite, toujours à l'écran, jamais sur l'objet.
{
  const ancre = { top: 10, bottom: 50, left: 10, right: 50 };
  const pos = positionner(200, 150, ancre);
  assert.ok(pos.left >= 4 && pos.top >= 4, "reste dans la fenêtre (haut/gauche)");
  assert.equal(rectangleChevauche(pos, 200, 150, ancre), false);
}

// Objet collé en bas à droite de l'écran : doit basculer en haut-gauche, toujours à l'écran.
{
  const ancre = { top: 760, bottom: 795, left: 1160, right: 1195 };
  const pos = positionner(200, 150, ancre);
  assert.ok(pos.left + 200 <= 1196 && pos.top + 150 <= 796, "reste dans la fenêtre (bas/droite)");
  assert.equal(rectangleChevauche(pos, 200, 150, ancre), false);
}

// --- PC uniquement : le survol tactile est ignoré (même garde que l'infobulle d'énergie) ---
const bloc = extraire("function installerInfobulleObjetAdventureIdleV1_(){");
assert.match(bloc, /if\(ev\.pointerType==='touch'\)return;/, "le survol tactile ne doit jamais ouvrir l'infobulle (comportement réservé au PC)");

// --- N'apparaît jamais par-dessus le popup interactif déjà ouvert (évite deux infobulles superposées) ---
assert.match(bloc, /if\(popupDetailsObjetAdventureIdleOuvertV207_\(\)\)return;/);

// --- Réutilise les mêmes repères que le popup existant, aucune seconde recherche DOM dupliquée ---
assert.match(bloc, /elementObjetGesteAdventureIdleV196_\(ev\.target\)/);
assert.match(ui, /const id=idObjetGesteAdventureIdleV196_\(element\);[\s\S]{0,300}statsHtmlObjetAdventureIdleV138_\(item\)/, "l'infobulle doit réutiliser exactement le même calcul de stats que le popup, jamais un second");

// --- Se ferme au départ du survol ---
assert.match(bloc, /document\.addEventListener\('mouseout',function\(ev\)\{[\s\S]{0,200}fermerInfobulleObjetAdventureIdleV1_\(\);/);

// --- Style : jamais interactive (ne vole pas le survol à la grille en dessous) ---
assert.match(css, /\.soreal-idle-item-infobulle-v1\{[^}]*pointer-events:none;/);
assert.match(css, /\.soreal-idle-item-infobulle-v1\{[^}]*position:fixed;/);

console.log("idle-adventure-item-hover-tooltip-v1: OK");
