import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-02) : champs Input/Target sélectionnés d'un clic, Time Machine aux couleurs de NGU Idle (capture du jeu), trois barres de son.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const themes = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");

// 1. Un clic ou le focus sur un champ de quantité sélectionne tout (taper remplace le nombre) ; jamais sur les champs de texte libres.
{
  const debut = ui.indexOf("function champQuantiteIdleV1_(el){");
  const fin = ui.indexOf("document.addEventListener('click',toutSelectionnerIdleV1_,true);");
  assert.ok(debut > 0 && fin > debut, "gestionnaire de sélection présent");
  const champ = new Function(ui.slice(debut, ui.indexOf("function toutSelectionnerIdleV1_", debut)) + "\nreturn champQuantiteIdleV1_;")();
  const dans = { closest: (s) => (s === ".soreal-idle-page-root-v28" ? {} : null) };
  const input = (o) => Object.assign({ tagName: "INPUT", type: "text", placeholder: "", maxLength: -1 }, dans, o);
  assert.equal(champ(input({})), true, "Input (texte)");
  assert.equal(champ(input({ type: "number" })), true, "Target / Cible (nombre)");
  assert.equal(champ(input({ placeholder: "Ton pseudo" })), false, "champ de texte libre : jamais");
  assert.equal(champ(input({ maxLength: 20 })), false);
  assert.equal(champ(input({ closest: () => null })), false, "hors des menus de jeu : jamais");
  assert.equal(champ({ tagName: "TEXTAREA" }), false);
  assert.ok(ui.includes("document.addEventListener('focusin'") && ui.includes("el.select()"));
}

// 2. Time Machine : palette du jeu (bandeau bleu acier, piste verte, piste jaune, panneau gris), plus de néon cyan par-dessus.
{
  const bloc = themes.slice(themes.indexOf("Broken Time Machine : retour à l'aspect du jeu d'origine"));
  for (const couleur of ["#5f86ab", "#a5dfb4", "#ebe89b", "#c1c1c1", "#59d08b", "#fdfba7"]) assert.ok(bloc.includes(couleur), "couleur du jeu : " + couleur);
  assert.ok(index.includes("/soreal-idle-themes.css?v=26"));
}

// 3. Paramètres : trois barres de son, cases cochées de base.
{
  const vol = readFileSync("cloudflare/public/modules/audio-volume-v1.js", "utf8");
  assert.ok(vol.includes("var DEFAUT=0.75;") && vol.includes("CLE_INTERFACE"));
  assert.ok(ui.includes("['interface','🔔 Sons de l’interface']"));
}

// 4. Fil « En direct » : les achats en boutique sont annoncés (voir idle-flux-v1.test.mjs pour le détail).
assert.ok(readFileSync("cloudflare/public/modules/flux-v1.js", "utf8").includes("case 'achat':"));
assert.ok(readFileSync("cloudflare/src/idle-flux-v1.js", "utf8").includes('type: "achat"'));
console.log("idle-saisie-son-tm-v1: OK");
