import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lireUiComplet } from "./_ui-sources.mjs";

/*
 * Anti-spoil (règle n°2) du menu « Énigmes » : le bouton n'existe que si le système `scummvm` est dans la liste envoyée par le moteur (liste filtrée sur « débloqué »),
 * il se place avant la Boutique, le module ne montre que le nom du jeu courant (aucun total « x / y », aucune liste de jeux), le script est chargé avant le module méta.
 */
const ui = lireUiComplet();
const bloc = ui.slice(ui.indexOf("const IDLE_MENUS_V1=["), ui.indexOf("];", ui.indexOf("const IDLE_MENUS_V1=[")) + 2);
const menus = new Function(bloc + "return IDLE_MENUS_V1;")();
const ids = menus.map((m) => m.id);
assert.deepEqual(menus.find((m) => m.id === "scummvm"), { id: "scummvm", icon: "🕹️", nom: "Énigmes" });
assert.equal(ids.indexOf("scummvm") + 1, ids.indexOf("shop"), "juste avant la Boutique");
assert.ok(ui.includes("scummvm:'scummvm'"), "menu relié au système (disponible seulement si le moteur l'envoie débloqué)");
assert.ok(/case 'scummvm':\s*return window\.__SOREAL_IDLE_SCUMMVM_PAGE_V1__/.test(ui), "page branchée");

const mod = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8");
assert.ok(!/\bjeuxTotal|\.length\s*\+\s*['"]\s*\/|jeux\.length/.test(mod.replace(/\/\*[\s\S]*?\*\//g, "")), "aucun total de jeux affiché");
assert.ok(mod.includes("soreal_idle_scummvm_etat_v1"), "état lié au compte (préfixe soreal_idle_)");
assert.ok(mod.includes("data-morph-garder") && mod.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__"), "règle n°4");

const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(index.indexOf("/modules/scummvm-page-v1.js") > 0 && index.indexOf("/modules/scummvm-page-v1.js") < index.indexOf("/modules/meta-progression-v130.js"), "script chargé avant meta-progression-v130.js");

const dico = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
for (const k of ["Énigmes", "▶ Jouer", "⛶ Plein écran", "Chargement…", "Aucun jeu disponible pour l’instant."]) assert.ok(dico[k], "traduction anglaise : " + k);
console.log("idle-anti-spoil-scummvm-v1 OK");
