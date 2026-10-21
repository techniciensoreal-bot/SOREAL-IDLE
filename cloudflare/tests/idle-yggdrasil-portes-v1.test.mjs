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
  coupe(/function porte_\(id,ouvre,referme\)\{[\s\S]*?\n {2}\}\n/),
  coupe(/function nomSonPorte_\(\)\{[^\n]*\n/),
  coupe(/function nomSonFerme_\(\)\{[^\n]*\n/),
  coupe(/var CLE_PORTES_VUES_=[^\n]*\n/),
  coupe(/function renaissances_\(\)\{[^\n]*\n/),
  coupe(/function portesVues_\(\)\{[\s\S]*?\n {2}\}\n/),
  coupe(/function porteVue_\(id\)\{[^\n]*\n/),
  coupe(/var CLE_COQ_=[^\n]*\n/),
  coupe(/function coqPremiereOuverture_\(vit\)\{[\s\S]*?\n {2}\}\n/),
  coupe(/function noterPorteVue_\(id,vue\)\{[\s\S]*?\n {2}\}\n/),
  coupe(/function porteDe_\(id,actif\)\{[\s\S]*?\n {2}\}\n/),
  "this.api={porteDe_:porteDe_,porte_:porte_,sons:sons,etat:etat,teinte_:teinte_};"
].join("\n");
function monde(stock = {}, renaissances = { n: 0 }) {
  let maintenant = 1_800_000_000_000;
  const ctx = { Date: class extends Date { static now() { return maintenant; } }, String, Number, Boolean, Object, JSON, isFinite, Math, Array, window: { __SOREAL_IDLE_META_HOST_V130__: { getIdleEtat: () => ({ systemes: { records: { totalRebirths: renaissances.n } } }) } }, localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem(k, v) { stock[k] = String(v); } } };
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
// 2. Fruit déjà actif à la PREMIÈRE visite depuis la renaissance (auto actif, fruit même prêt) : la porte s'ouvre quand même, avec le son ; aux visites suivantes (même renaissance), plus de porte.
{
  const stock = {}, rb = { n: 3 };
  const m = monde(stock, rb);
  assert.ok(m.api.porteDe_("luck", true).includes("ygg-porte ouvre"), "première visite : la porte s'ouvre même si le fruit est déjà actif");
  assert.equal(m.api.sons.join(), "porte", "avec son");
  m.avancer(60_000);
  assert.equal(m.api.porteDe_("luck", true), "", "ouverture finie : plus de porte");
  const m2 = monde(stock, rb);   // page rechargée, même renaissance : rien ne se rejoue
  assert.equal(m2.api.porteDe_("luck", true), "");
  assert.equal(m2.api.sons.length, 0, "déjà vue : ni porte ni son");
  rb.n = 4;                       // renaissance : les portes sont à revoir
  const m3 = monde(stock, rb);
  assert.ok(m3.api.porteDe_("luck", true).includes("ygg-porte ouvre"), "après une renaissance, la porte s'ouvre de nouveau à la première visite");
  const m4 = monde({}, { n: 4 });
  assert.ok(ferme(m4.api.porteDe_("gold", false)), "après la renaissance, un fruit inactif reste derrière sa porte close");
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
  // Le fruit est mangé ou récolté (actif -> inactif, l'auto ne l'a pas relancé) : la porte se REFERME avec l'animation d'ouverture à l'envers et le même son, une seule fois ; puis porte close fixe.
  const h2 = m.api.porteDe_("gold", false);
  assert.ok(h2.includes("ygg-porte referme") && !h2.includes("ygg-porte ouvre"), "la porte se referme");
  assert.equal(m.api.sons.join(), "porte,porteFerme", "un son de fermeture à part (pas l'ouverture à l'envers), une fois");
  m.avancer(800);
  assert.ok(m.api.porteDe_("gold", false).includes("ygg-porte referme"), "redessin pendant la fermeture : pas relancée");
  assert.equal(m.api.sons.length, 2, "pas de second son pendant un redessin");
  m.avancer(900);
  assert.ok(ferme(m.api.porteDe_("gold", false)), "fermeture terminée : porte close fixe, sans animation");
  assert.equal(m.api.sons.length, 2);
  // Page chargée avec un fruit inactif : jamais de fermeture (il n'a jamais été vu ouvert).
  const m5 = monde();
  assert.ok(ferme(m5.api.porteDe_("luck", false)) && m5.api.sons.length === 0, "pas de fermeture sans ouverture vue");
  // Fruit mangé mais l'auto le relance aussitôt (toujours actif) : la porte ne bouge pas.
  const m6 = monde();
  m6.api.porteDe_("luck", true); m6.avancer(2000); m6.api.porteDe_("luck", true);
  assert.equal(m6.api.porteDe_("luck", true), "", "auto : toujours actif, aucune porte");
  // L'animation inversée est bien celle de l'ouverture.
  for (const k of ["", " .ygg-porte-g", " .ygg-porte-d", " .ygg-porte-lueur", " .ygg-porte-emb"]) assert.ok(new RegExp("\\.ygg-porte\\.referme" + k.replace(/ \./, " \\.") + "\\{animation:[^']*reverse").test(src), "fermeture inversée" + k);
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
  assert.ok(!/\.ygg-porte(?!\.ouvre)[^{]*\{[^}]*animation/.test(css.replace(/\.ygg-porte\.(?:ouvre|referme)[^{]*\{[^}]*\}/g, "")), "porte fermée : aucune animation (ni sur l'emblème)");
  assert.ok(/prefers-reduced-motion:reduce\)\{\.ygg-porte\.ouvre,\.ygg-porte\.referme\{display:none/.test(src), "mouvement réduit : pas d'animation d'ouverture ni de fermeture");
  assert.ok(!/setInterval|setTimeout/.test(coupe(/function porteDe_\(id,actif\)\{[\s\S]*?\n {2}\}\n/)), "aucune minuterie pour les portes");
}
// 6. Branchement et cadres : la porte est dans la vitre de chaque fruit ; TOUS les fruits ont le cadre en portrait des deux premiers (même taille avec ou sans image) ; la porte suit les coins du cadre.
assert.ok(src.includes("image_(id,emoji_(id,def.name),'',etapeCroissance_(d,v))+porteDe_(id,Boolean(v.active))+'</div>'"), "porte dans la vitre de chaque fruit, selon son état actif");
assert.ok(src.includes('\'<div class="ygg-vitre ygg-portrait">\'+image_(') && !src.includes("etapeCroissance_(d,v)!=null?' ygg-portrait'"), "cadre portrait pour tous les fruits");
assert.ok(/\.ygg-porte\{position:absolute;inset:0;[^}]*border-radius:9px;/.test(src), "la porte remplit le cadre et suit ses coins arrondis");
console.log("idle-yggdrasil-portes-v1: OK");
// 6. Le son de fermeture est un son à part, écrit à l'endroit (l'ouverture jouée à l'envers sonnait mal) : pierre ou bois selon le réglage, jamais de dent de scie.
{
  const sons = readFileSync("cloudflare/public/modules/yggdrasil-sons-v1.js", "utf8");
  const bloc = (nom, suite) => sons.slice(sons.indexOf("    " + nom + ":function"), sons.indexOf("    " + suite + ":function"));
  assert.ok(!/sawtooth/.test(bloc("porteFerme", "porteFermeBois")) && !/sawtooth/.test(bloc("porteFermeBois", "porteBois")), "aucune dent de scie dans les sons de fermeture");
  assert.ok(!/jouerEnvers|OfflineAudioContext/.test(sons), "plus de son retourné");
  assert.ok(/function nomSonFerme_\(\)\{return reglages_\(\)\.son==='bois'\?'porteFermeBois':'porteFerme';\}/.test(src), "le réglage pierre / bois choisit aussi le bruit de fermeture");
}
