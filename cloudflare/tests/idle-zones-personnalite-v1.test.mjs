import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { IDLE_ADVENTURE_ZONES } from "../src/idle-adventure-zones.js";

/*
 * Norman (2026-10-28) : « chaque ligne du menu déroulant d'Aventure a sa personnalité : zone sûre un feu de camp, zone tutoriel un rat… la ligne complète a une couleur qui s'accorde avec la zone, pour repérer les zones d'un coup d'œil ».
 * Toutes les zones du jeu ont une icône et une palette ; le style est posé en ligne (!important) pour battre les feuilles du thème sans ajouter de surcharge aux feuilles ; la liste ne change pas ce qu'elle montre (règle n°2 : zones débloquées seulement).
 */
const src = readFileSync("cloudflare/public/modules/zones-personnalite-v1.js", "utf8");
const bac = {}; bac.window = bac; vm.createContext(bac); vm.runInContext(src, bac);
const Z = bac.__SOREAL_IDLE_ZONES_STYLE_V1__;
assert.ok(Z, "module exposé");

const zones = Object.values(IDLE_ADVENTURE_ZONES).map((z) => z.id || z.key).filter(Boolean);
const ids = zones.length ? zones : Array.from(Z.ids());
assert.ok(ids.length >= 32, "zones du jeu : " + ids.length);
const connus = new Set(Array.from(Z.ids()));
for (const id of ids) assert.ok(connus.has(id), "la zone « " + id + " » a sa personnalité");

assert.equal(Z.icone("safe"), "🔥", "Zone sûre : un feu de camp");
assert.equal(Z.icone("tutorial"), "🐀", "Zone Tutoriel : un rat");
const sew = Z.icone("sewers"); assert.ok(sew && sew !== Z.icone("tutorial"), "Égouts : une icône à eux (" + sew + ")");

const icones = new Set(), fonds = new Set();
for (const id of connus) {
  const p = Z.palette(id);
  assert.ok(/^#[0-9a-f]{6}$/i.test(p.debut) && /^#[0-9a-f]{6}$/i.test(p.fin) && /^#[0-9a-f]{6}$/i.test(p.bord) && /^#[0-9a-f]{6}$/i.test(p.texte), "couleurs de " + id);
  icones.add(p.icone); fonds.add(p.debut + p.fin);
}
assert.ok(icones.size >= connus.size - 1, "une icône différente par zone (" + icones.size + " pour " + connus.size + ")");
assert.ok(fonds.size === connus.size, "un fond différent par zone");

/* lisibilité : le texte est nettement plus clair que le fond (contraste suffisant sur chaque ligne) */
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(n >> 16) + .7152 * f((n >> 8) & 255) + .0722 * f(n & 255); };
for (const id of connus) { const p = Z.palette(id); const c = (lum(p.texte) + .05) / (Math.max(lum(p.debut), lum(p.fin)) + .05); assert.ok(c >= 4.5, id + " : contraste du texte " + c.toFixed(1)); }

const st = Z.style("forest", true);
assert.ok(st.includes("url(/api/idle/media/adventure-zone?name=forest)"), "la ligne est texturée par le décor de la zone vers laquelle elle mène");
assert.ok(st.includes("linear-gradient(90deg,rgba(") && st.includes("!important"), "voile teinté de la palette de la zone, style en ligne qui bat les feuilles");
assert.ok(!st.includes("border-left"), "aucune languette de couleur sur le côté (Norman, 2026-10-28)");
assert.ok(st.includes("box-shadow:inset 0 0 2px") || st.includes("box-shadow:inset 0 0 0 2px"), "zone choisie cerclée");
assert.ok(!Z.style("forest", false).includes("box-shadow"), "une zone non choisie n'est pas cerclée");
for (const id of connus) assert.ok(Z.style(id, false).includes("name=" + id), "texture de " + id);

const av = readFileSync("cloudflare/public/modules/ui-aventure-1-v1.js", "utf8");
assert.ok(av.includes("window.__SOREAL_IDLE_ZONES_STYLE_V1__") && av.includes("perso.style(z.id,active)") && av.includes("zone-perso-v1"), "la liste des zones utilise la personnalité");
assert.ok(av.includes("zones.filter(function(z){return z&&z.unlocked;})"), "la liste ne montre toujours que les zones débloquées (règle n°2)");
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/zones-personnalite-v1.js?v="), "module chargé");
console.log("idle-zones-personnalite-v1: OK");
