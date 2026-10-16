import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { IDLE_NGU_YGG_FRUITS } from "../src/idle-ngu-catalogues.js";

/*
 * Norman (2026-10-16) : dans Yggdrasil, tant que l'énergie n'a pas été placée pour activer un fruit, une porte close cache son image. Fermée : dessin fixe, aucune animation, peu coûteux (SVG intégré, rien à
 * télécharger). Seule animation : l'ouverture, au moment où l'énergie est placée, avec son son. Chaque fruit a sa porte (palette et emblème propres).
 */
const src = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
const coupe = (re) => src.match(re)[0];
const code = [
  "var etat={fermees:{},ouvre:{},anim:{}};",
  "var sons=[];function son_(n){sons.push(n);}",
  coupe(/var DUREE_OUVERTURE_=\d+;\n/),
  coupe(/var REGLAGES_DEFAUT_=\{[^\n]*\n/),
  coupe(/var CLE_REGLAGES_=[^\n]*\n/),
  coupe(/function reglages_\(\)\{[\s\S]*?\n {2}\}\n/),
  coupe(/function teinte_\(id\)\{[^\n]*\n/),
  ...(src.match(/ {2}var EMB_[A-Z_]+='[^\n]*\n/g) || []),
  coupe(/var THEMES_=\{[\s\S]*?\n {2}\};\n/),
  coupe(/var VANTAIL_='[^\n]*\n/),
  coupe(/function porte_\(id,ouvre\)\{[\s\S]*?\n {2}\}\n/),
  coupe(/function porteDe_\(id,actif\)\{[\s\S]*?\n {2}\}\n/),
  "this.api={porteDe_:porteDe_,porte_:porte_,sons:sons,etat:etat,teinte_:teinte_};"
].join("\n");
function monde() {
  let maintenant = 1_800_000_000_000;
  const ctx = { Date: class extends Date { static now() { return maintenant; } }, String, Number, Boolean, Object, JSON, isFinite, Math, localStorage: { getItem: () => null, setItem() {} } };
  vm.runInNewContext("(function(){" + code + "}).call(this)", ctx);
  return { api: ctx.api, avancer: (ms) => { maintenant += ms; } };
}
const ferme = (h) => h.includes('class="ygg-porte"') && !h.includes("ouvre");

// 1. Fruit pas encore actif : porte close, aucun son, aucune classe d'animation.
{
  const m = monde();
  const h = m.api.porteDe_("gold", false);
  assert.ok(ferme(h), "porte close tant que le fruit n'est pas actif");
  assert.equal(m.api.sons.length, 0, "aucun son tant qu'elle est fermée");
  assert.equal(m.api.porteDe_("gold", false), h, "redessin à l'identique (rien ne bouge)");
}
// 2. Fruit déjà actif à l'ouverture de la page : pas de porte, pas d'animation, pas de son.
{
  const m = monde();
  assert.equal(m.api.porteDe_("luck", true), "");
  assert.equal(m.api.sons.length, 0);
}
// 3. Le fruit s'active sous les yeux du joueur : ouverture UNE fois, avec le son « porte » ; puis plus de porte.
{
  const m = monde();
  m.api.porteDe_("gold", false);
  m.avancer(300);
  const h = m.api.porteDe_("gold", true);
  assert.ok(h.includes("ygg-porte ouvre"), "la porte s'ouvre");
  assert.deepEqual(Array.from(m.api.sons), ["porte"], "le son d'ouverture est joué une seule fois");
  m.avancer(800);
  assert.ok(m.api.porteDe_("gold", true).includes("ygg-porte ouvre"), "la porte reste en train de s'ouvrir pendant l'animation (redessin sans la relancer)");
  assert.equal(m.api.sons.length, 1, "pas de second son pendant un redessin");
  m.avancer(900);
  assert.equal(m.api.porteDe_("gold", true), "", "ouverture terminée : plus de porte");
  assert.equal(m.api.porteDe_("gold", true), "");
  assert.equal(m.api.sons.length, 1);
  // Le fruit est mangé (inactif) : sa porte se referme sans animation ni son.
  const h2 = m.api.porteDe_("gold", false);
  assert.ok(ferme(h2) && m.api.sons.length === 1, "refermée sans animation ni son");
}
// 4. Chaque fruit sa porte : palette ET emblème propres (même gabarit), aucun fruit du catalogue sans thème.
{
  const m = monde();
  const ids = IDLE_NGU_YGG_FRUITS.map((f) => f.id);
  assert.ok(ids.length >= 15, "catalogue des fruits lu : " + ids.length);
  const emb = (h) => h.match(/<b class="ygg-porte-emb">[\s\S]*?<\/b>/)[0];
  const palettes = new Set(), emblemes = new Set();
  for (const id of ids) {
    const h = m.api.porte_(id, false);
    assert.ok(/--b:#[0-9a-f]{6};--r:#[0-9a-f]{6};--e:#[0-9a-f]{6}/i.test(h), id + " : palette propre (ferrures, liseré, emblème)");
    assert.ok(src.includes("    " + id + ":["), id + " : a son thème dans THEMES_ (pas la porte de secours)");
    palettes.add(h.match(/style="([^"]*)"/)[1]); emblemes.add(emb(h));
  }
  assert.equal(palettes.size, ids.length, "une palette différente par fruit");
  assert.ok(emblemes.size >= ids.length - 1, "des emblèmes différents (seules les deux gemmes MacGuffin se ressemblent) : " + emblemes.size + " pour " + ids.length);
  assert.notEqual(emb(m.api.porte_("powerAlpha", false)), emb(m.api.porte_("powerBeta", false)), "α, β et δ se distinguent par leur lettre");
  assert.ok(m.api.porte_("powerDelta", false).includes("δ"));
  assert.ok(m.api.porte_("inconnu", false).includes("ygg-porte-emb"), "un fruit inconnu garde une porte sobre, sans erreur");
}
// 5. Peu coûteux : dessin intégré sans image ni lien ; CSS sans animation hors ouverture ; aucune minuterie ajoutée.
{
  const m = monde();
  for (const id of ["gold", "powerAlpha", "knowledge", "luck", "rage"]) {
    const h = m.api.porte_(id, false);
    assert.ok(!/<image|href=|url\(|<img|filter/i.test(h), id + " : aucune image, aucun lien, aucun filtre");
    assert.ok(h.length < 3600, id + " : petit : " + h.length + " octets par porte");
  }
  const css = src.match(/\.ygg-porte[^\n]*/g).join("\n");
  assert.ok(!/\.ygg-porte(?!\.ouvre)[^{]*\{[^}]*animation/.test(css.replace(/\.ygg-porte\.ouvre[^{]*\{[^}]*\}/g, "")), "porte fermée : aucune animation (ni sur l'emblème)");
  assert.ok(/prefers-reduced-motion:reduce\)\{\.ygg-porte\.ouvre\{display:none/.test(src), "mouvement réduit : pas d'animation d'ouverture");
  assert.ok(!/setInterval|setTimeout/.test(coupe(/function porteDe_\(id,actif\)\{[\s\S]*?\n {2}\}\n/)), "aucune minuterie pour les portes");
}
// 6. Branchement et cadres : la porte est dans la vitre de chaque fruit ; TOUS les fruits ont le cadre en portrait des deux premiers (même taille avec ou sans image) ; la porte suit les coins du cadre.
assert.ok(src.includes("image_(id,emoji_(id,def.name),'',etapeCroissance_(d,v))+porteDe_(id,Boolean(v.active))+'</div>'"), "porte dans la vitre de chaque fruit, selon son état actif");
assert.ok(src.includes('\'<div class="ygg-vitre ygg-portrait">\'+image_(') && !src.includes("etapeCroissance_(d,v)!=null?' ygg-portrait'"), "cadre portrait pour tous les fruits");
assert.ok(/\.ygg-porte\{position:absolute;inset:0;[^}]*border-radius:9px;/.test(src), "la porte remplit le cadre et suit ses coins arrondis");
console.log("idle-yggdrasil-portes-v1: OK");
