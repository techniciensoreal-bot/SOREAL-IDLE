import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/* Météo du Trou sans fond (modules/trou-meteo-v1.js) : le vrai module sur un faux navigateur. */
const src = fs.readFileSync(new URL("../public/modules/trou-meteo-v1.js", import.meta.url), "utf8");
const win = { __SOREAL_IDLE_TROU_NUIT_V1__: { position: () => [50.85, 4.35] } };
const ctx = { window: win, document: { querySelector: () => null, getElementById: () => null, visibilityState: "visible" }, localStorage: { getItem: () => null }, setInterval: () => 0, clearTimeout() {}, setTimeout: () => 0, fetch: undefined, encodeURIComponent, Math, Date };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const M = win.__SOREAL_IDLE_TROU_METEO_V1__;
assert.deepEqual(Array.from(M.CATEGORIES), ["clair", "nuageux", "couvert", "brouillard", "bruine", "pluie", "forte-pluie", "neige", "forte-neige", "orage"], "mêmes catégories que le serveur");
assert.equal(M.couches("clair"), "", "ciel clair : aucune couche (aucun coût)");
for (const c of M.CATEGORIES.filter((x) => x !== "clair")) {
  const h = M.couches(c);
  assert.ok(h.length > 50, c + " : des couches");
  /* une image en data: dans un attribut style="…" ne doit jamais contenir de guillemet double (elle casserait l'attribut) */
  for (const m of h.matchAll(/style="([^"]*)"/g)) assert.ok(!/url\("/.test(m[1]), c + " : guillemets de l'URL");
  assert.ok((h.match(/mp-m-chute/g) || []).length <= 6, c + " : 3 couches de chute au plus (légèreté)");
}
assert.ok(M.couches("orage").includes("mp-m-flash") && M.couches("orage").includes("mp-m-foudre"), "l'orage a ses éclairs");
assert.ok(M.couches("neige").includes("mp-m-sol"), "la neige se pose au sol");
assert.ok(!M.couches("pluie").includes("mp-m-flash"), "pas d'éclair sans orage");
/* Garde de légèreté et de boucle parfaite (règle n°3) : seuls transform et opacity s'animent, aucun filtre ni mélange. */
const feuille = fs.readFileSync(new URL("../public/trou-meteo-v1.css", import.meta.url), "utf8");
const css = feuille;
assert.ok(css.length > 500, "règles de la météo dans la feuille de style");
assert.ok(!/!important/.test(css), "aucun !important (dette CSS plafonnée)");
assert.ok(!/(^|[^-])filter\s*:\s*(blur|drop|sat|bright)|mix-blend|backdrop|background-position/i.test(css.replace(/filter:none/g, "")), "pas de filtre, mélange ni background-position animé");
for (const k of css.matchAll(/@keyframes (\w+)\{([^@]*?)\}\}/g)) assert.ok(/transform|opacity/.test(k[2]) && !/(^|[^-])(left|top|width|height)\s*:/.test(k[2]), k[1] + " : transform/opacity seulement");
assert.ok(/mpMChute\{from\{transform:translate3d\(0,0,0\)\}to\{transform:translate3d\(0,calc\(50% \/ var\(--n\)\),0\)\}/.test(css), "la chute glisse d'exactement une tuile");
assert.ok(/mpMDerive\{from\{transform:translate3d\(0,0,0\)\}to\{transform:translate3d\(-50%,0,0\)\}/.test(css), "la dérive glisse d'exactement une tuile");
assert.ok(/mpMOnde\{0%\{opacity:0;transform:scale\(\.2\)\}[\s\S]*?100%\{opacity:0;/.test(css), "ronds dans l'eau : fondu d'entrée et de sortie");
assert.ok(/prefers-reduced-motion:reduce/.test(css), "mouvement réduit respecté");
/* branchements */
assert.ok(/data-morph-garder/.test(src) && /APRES_REDESSIN_V1__/.test(src), "règle n°4 : bloc gardé et reposé après redessin");
assert.ok(/soreal_idle_effet_meteo_v1/.test(src) && /soreal_idle_effet_meteo_v1/.test(fs.readFileSync(new URL("../public/soreal-idle-ui.js", import.meta.url), "utf8")), "case de Réglages > Effets visuels");
assert.ok(/trou-meteo-v1\.js/.test(fs.readFileSync(new URL("../public/index.html", import.meta.url), "utf8")), "script chargé");
/* confidentialité : seule la position approximative du fuseau est envoyée */
assert.ok(/position\(\)/.test(src) && !/geolocation/.test(src), "aucune géolocalisation");
console.log("idle-trou-meteo-v1: OK");
