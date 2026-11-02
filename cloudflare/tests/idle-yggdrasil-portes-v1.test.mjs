import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Portes d'Yggdrasil (Norman, 2026-11-02) : les anciennes portes dessinées en SVG sont REMPLACÉES par des images fournies par lui (une par fruit, 1024 x 1024, R2 idle/ygg-portes/<fruit>.webp, route ?porte=1).
 * La porte couvre le cadre tant que le fruit n'est pas actif ; elle s'ouvre par le HAUT (comme une herse de château fort) avec un bruit de herse, une fois, quand l'énergie est placée ; elle redescend si le fruit est mangé ou récolté.
 * Un fruit sans image de porte n'a ni porte ni son (liste PORTES_IMAGES_).
 */
const src = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8").split(String.fromCharCode(13)).join("");
const coupe = (re) => src.match(re)[0];
const code = [
  "var etat={fermees:{},ouvre:{},anim:{}};",
  "var sons=[];function son_(n){sons.push(n);}",
  coupe(/var DUREE_OUVERTURE_=\d+;\n/),
  coupe(/var REGLAGES_DEFAUT_=\{[^\n]*\n/),
  coupe(/function reglages_\(\)\{[^\n]*\n/),
  coupe(/var PORTES_IMAGES_=\{[^\n]*\n/),
  coupe(/function porte_\(id,ouvre,referme\)\{[\s\S]*?\n {2}\}\n/),
  coupe(/var dernierSonPorte_=\{\};\n/),
  coupe(/function sonPorteUnique_\([^)]*\)\{[\s\S]*?\n {2}\}\n/),
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
  "this.api={porteDe_:porteDe_,porte_:porte_,sons:sons,etat:etat,liste:PORTES_IMAGES_};"
].join("\n");
function monde(stock = {}, renaissances = { n: 0 }) {
  let maintenant = 1_800_000_000_000;
  const ctx = { Date: class extends Date { static now() { return maintenant; } }, String, Number, Boolean, Object, JSON, isFinite, Math, Array, window: { __SOREAL_IDLE_META_HOST_V130__: { getIdleEtat: () => ({ systemes: { records: { totalRebirths: renaissances.n } } }) } }, localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); } } };
  vm.runInNewContext("(function(){" + code + "}).call(this)", ctx);
  return { api: ctx.api, avancer: (ms) => { maintenant += ms; } };
}
const ferme = (h) => h.includes('class="ygg-porte"') && !h.includes("ouvre");

// 0. L'image de la porte : une par fruit, route ?porte=1 ; un fruit sans image n'a pas de porte, pas de son.
{
  const m = monde();
  const h = m.api.porte_("gold", false);
  assert.ok(h.includes('src="/api/idle/media/ygg?name=gold&amp;porte=1"') && h.includes('data-porte-img="1"'), "image de la porte du fruit");
  assert.ok(!/<svg|THEMES_|ygg-porte-g|ygg-porte-emb/.test(h), "plus aucune ancienne porte dessinée");
  for (const id of ["gold", "powerAlpha", "adventure", "knowledge", "luck", "arbitrariness", "numbers", "angryMayo", "ayyMayo", "cincoMayo", "moldyMayo"]) assert.equal(m.api.liste[id], true, id + " : a sa porte");
  assert.equal(m.api.porteDe_("powerBeta", false), "", "fruit sans image de porte : pas de porte");
  assert.equal(m.api.porteDe_("powerBeta", true), "");
  assert.equal(m.api.sons.length, 0, "ni son sans porte");
}
// 1. Fruit pas encore actif : porte close, aucun son, aucune classe d'animation.
{
  const m = monde();
  const h = m.api.porteDe_("gold", false);
  assert.ok(ferme(h), "porte close tant que le fruit n'est pas actif");
  assert.equal(m.api.sons.length, 0, "aucun son tant qu'elle est fermée");
  assert.equal(m.api.porteDe_("gold", false), h, "redessin à l'identique (rien ne bouge)");
}
// 2. Fruit déjà actif à la PREMIÈRE visite depuis la renaissance : la porte s'ouvre quand même, avec le son ; aux visites suivantes (même renaissance), plus de porte.
{
  const stock = {}, rb = { n: 3 };
  const m = monde(stock, rb);
  assert.ok(m.api.porteDe_("luck", true).includes("ygg-porte ouvre"), "première visite : la porte s'ouvre même si le fruit est déjà actif");
  assert.equal(m.api.sons.join(), "herse", "avec le bruit de herse");
  m.avancer(60_000);
  assert.equal(m.api.porteDe_("luck", true), "", "ouverture finie : plus de porte");
  const m2 = monde(stock, rb);
  assert.equal(m2.api.porteDe_("luck", true), "");
  assert.equal(m2.api.sons.length, 0, "déjà vue : ni porte ni son");
  rb.n = 4;
  const m3 = monde(stock, rb);
  assert.ok(m3.api.porteDe_("luck", true).includes("ygg-porte ouvre"), "après une renaissance, la porte s'ouvre de nouveau à la première visite");
  const m4 = monde({}, { n: 4 });
  assert.ok(ferme(m4.api.porteDe_("gold", false)), "après la renaissance, un fruit inactif reste derrière sa porte close");
}
// 3. Le fruit s'active sous les yeux du joueur : ouverture UNE fois ; puis plus de porte ; fermeture si mangé / récolté.
{
  const m = monde();
  m.api.porteDe_("gold", false);
  m.avancer(300);
  const h = m.api.porteDe_("gold", true);
  assert.ok(h.includes("ygg-porte ouvre"), "la porte s'ouvre");
  assert.deepEqual(Array.from(m.api.sons), ["herse"], "le son d'ouverture est joué une seule fois");
  m.avancer(800);
  assert.ok(m.api.porteDe_("gold", true).includes("ygg-porte ouvre"), "la porte reste en train de s'ouvrir pendant l'animation (redessin sans la relancer)");
  assert.equal(m.api.sons.length, 1, "pas de second son pendant un redessin");
  m.avancer(900);
  assert.equal(m.api.porteDe_("gold", true), "", "ouverture terminée : plus de porte");
  assert.equal(m.api.sons.length, 1);
  const h2 = m.api.porteDe_("gold", false);
  assert.ok(h2.includes("ygg-porte referme") && !h2.includes("ygg-porte ouvre"), "la porte se referme");
  assert.equal(m.api.sons.join(), "herse,herseFerme", "un son de fermeture à part, une fois");
  m.avancer(800);
  assert.ok(m.api.porteDe_("gold", false).includes("ygg-porte referme"), "redessin pendant la fermeture : pas relancée");
  assert.equal(m.api.sons.length, 2);
  m.avancer(900);
  assert.ok(ferme(m.api.porteDe_("gold", false)), "fermeture terminée : porte close fixe");
  const m5 = monde();
  assert.ok(ferme(m5.api.porteDe_("luck", false)) && m5.api.sons.length === 0, "pas de fermeture sans ouverture vue");
}
// 4. S'ouvre par le HAUT : une image clé de départ, une d'arrivée (translateY de -102 %), une seule courbe ; la fermeture est la même animation à l'envers ; mouvement réduit : pas d'animation.
{
  assert.ok(src.includes("@keyframes yggHerse{0%{transform:translateY(0)}100%{transform:translateY(-102%)}}"), "la porte monte et sort par le haut");
  assert.ok(!/@keyframes yggHerse\{[^}]*25%/.test(src), "aucune image intermédiaire (pas d'à-coup)");
  assert.ok(src.includes(".ygg-porte.ouvre img{animation:yggHerse") && /\.ygg-porte\.referme img\{animation:yggHerse[^']*reverse/.test(src), "ouverture, et fermeture à l'envers");
  assert.ok(/\.ygg-porte\{position:absolute;inset:0;[^}]*overflow:hidden;/.test(src), "le cadre coupe la porte qui sort");
  assert.ok(/prefers-reduced-motion:reduce\)\{\.ygg-porte\.ouvre,\.ygg-porte\.referme\{display:none/.test(src), "mouvement réduit : pas d'animation");
  assert.ok(!/setInterval|setTimeout/.test(coupe(/function porteDe_\(id,actif\)\{[\s\S]*?\n {2}\}\n/)), "aucune minuterie pour les portes");
}
// 5. Branchement : la porte est dans la vitre de chaque fruit, selon son état actif.
assert.ok(src.includes("couches_(d,v,id,def)+porteDe_(id,Boolean(v.active))+'</div>'"), "porte dans la vitre de chaque fruit");
// 6. Le bruit : herse de château fort (treuil, chaîne, choc), jamais de dent de scie ; réglage pierre / bois supprimé.
{
  const sons = readFileSync("cloudflare/public/modules/yggdrasil-sons-v1.js", "utf8").split(String.fromCharCode(13)).join("");
  const bloc = (nom, suite) => sons.slice(sons.indexOf("    " + nom + ":function"), sons.indexOf("    " + suite + ":function"));
  assert.ok(!/sawtooth/.test(bloc("herse", "herseFerme")) && !/sawtooth/.test(bloc("herseFerme", "porte")), "aucune dent de scie dans la herse");
  assert.ok(src.includes("function nomSonPorte_(){return 'herse';}") && src.includes("function nomSonFerme_(){return 'herseFerme';}"), "le jeu joue la herse");
}
// 7. La route R2 des portes et le bucket.
{
  const media = readFileSync("cloudflare/src/idle-media-v1.js", "latin1");
  assert.ok(media.includes('url.searchParams.get("porte")==="1"') && media.includes('"idle/ygg-portes/"'), "route ?porte=1 : R2 idle/ygg-portes/<fruit>.webp");
}
console.log("idle-yggdrasil-portes-v1: OK");
