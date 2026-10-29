// Norman (2026-10-29) : « la barre de défilement de la page, au thème de chaque page, avec des textures » : le module pose le thème de la page affichée sur <html> et une texture par famille de pages.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const src = fs.readFileSync("cloudflare/public/modules/defilement-theme-v1.js", "utf8");
const index = fs.readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(/<script defer src="\/modules\/defilement-theme-v1\.js\?v=\d+"><\/script>/.test(index), "module chargé par index.html");
/* jamais scrollbar-width / scrollbar-color sur la barre de la page : Chromium ignorerait alors les textures ::-webkit-scrollbar */
assert.ok(!/scrollbar-(width|color)/.test(src), "pas de scrollbar-width/color");
assert.ok(!/@keyframes|animations*:|transitions*:/.test(src), "aucune animation (rien à boucler)");

/* le module sur un faux navigateur */
const posees = {}, attrs = {};
const racine = { style: { setProperty: (k, v) => { posees[k] = v; } }, getAttribute: (k) => attrs[k], setAttribute: (k, v) => { attrs[k] = v; } };
let menu = "wandoos", vars = { "--i-a": "#8c7b58", "--i-b": "#4a3f27", "--i-bg2": "#17150e" };
const cs = { getPropertyValue: (n) => vars[n] || "" };
const page = { getAttribute: () => menu };
const document = { documentElement: racine, hidden: false, head: { appendChild() {} }, createElement: () => ({}), querySelector: (s) => (s === ".soreal-idle-page-root-v28" ? page : null) };
const fenetre = {};
vm.runInNewContext(src, { window: fenetre, document, getComputedStyle: () => cs, setInterval: () => 0 });
const api = fenetre.__SOREAL_IDLE_DEFILEMENT_V1__;
assert.equal(attrs["data-sb"], "ecran"); assert.equal(posees["--sb-a"], "#8c7b58"); assert.equal(posees["--sb-b"], "#4a3f27");
assert.ok(posees["--sb-d"].includes("#17150e"), "rail = fond sombre du thème");
menu = "yggdrasil"; vars = { "--i-a": "#3f9b5a", "--i-b": "#17492b", "--i-bg2": "#0a2415" }; api.appliquer();
assert.equal(attrs["data-sb"], "ecorce"); assert.equal(posees["--sb-a"], "#3f9b5a");
/* une valeur encore sous forme var(...) est ignorée au profit du thème de repli */
menu = "bestiaire"; vars = { "--i-a": "var(--th-a)", "--th-a": "#e2b25a", "--th-b": "#6a4a1a", "--th-bg2": "#2a1e12" }; api.appliquer();
assert.equal(posees["--sb-a"], "#e2b25a"); assert.equal(attrs["data-sb"], "papier");
/* toute page inconnue a une texture (grille) ; chaque famille est présente dans la feuille */
menu = "inconnu"; api.appliquer(); assert.equal(attrs["data-sb"], "grille");
for (const f of Object.keys(api.familles)) assert.ok(src.includes('html[data-sb="' + f + '"]::-webkit-scrollbar-thumb'), "texture de la famille " + f);
/* les menus du jeu ont tous une famille */
for (const m of ["entrainement", "combat", "aventure", "renaissance", "moneyPit", "augmentations", "machine", "sang", "tower", "ngu", "wandoos", "yggdrasil", "diggers", "beards", "macguffins", "shop", "chroniques", "chat", "parametres", "titans", "challenges"]) assert.ok(Object.values(api.familles).some((l) => l.includes(m)) || m === "shop", "famille pour " + m);
console.log("idle-defilement-theme-v1 : OK");
