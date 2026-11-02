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
  assert.ok(!/<svg|THEMES_|ygg-porte-emb/.test(h), "plus aucune ancienne porte dessinée");
  const f24 = src.match(/var FRUITS_24_={([^}]*)};/)[1].split(",").map((x) => x.split(":")[0]);
  assert.equal(f24.length, 21);
  for (const id of f24) assert.equal(m.api.liste[id], true, id + " : a sa porte");
  assert.equal(m.api.porteDe_("inconnu", false), "", "fruit sans image de porte : pas de porte");
  assert.equal(m.api.porteDe_("inconnu", true), "");
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
// 4. S'ouvre EN DEUX VOLETS comme les anciennes portes (Norman, 2026-11-02) : chaque moitié pivote sur son bord extérieur, une lueur passe, le tout se fond ; la fermeture est la même animation à l'envers ; elle déborde du cadre (rien de noir) ; mouvement réduit : pas d'animation.
{
  assert.ok(src.includes("@keyframes yggPorteG{0%{transform:rotateY(0)}100%{transform:rotateY(-104deg)}}") && src.includes("@keyframes yggPorteD{0%{transform:rotateY(0)}100%{transform:rotateY(104deg)}}"), "deux volets qui pivotent");
  assert.ok(!src.includes("@keyframes yggPorteG{0%{transform:rotateY(0)}25%") && !src.includes("@keyframes yggPorteD{0%{transform:rotateY(0)}25%"), "aucune image intermédiaire (pas d'à-coup)");
  assert.ok(src.includes(".ygg-porte.ouvre .ygg-porte-g{animation:yggPorteG") && src.includes(".ygg-porte.referme .ygg-porte-g{animation:yggPorteG") && src.includes("both reverse;}"), "ouverture, et fermeture à l'envers");
  const m = monde(); const h = m.api.porte_("gold", false);
  assert.ok(h.includes('class="ygg-porte-g"') && h.includes('class="ygg-porte-d"') && h.split("<img ").length === 3, "deux volets, chacun avec l'image de la porte");
  assert.ok(src.includes(".ygg-porte img{position:absolute;top:0;display:block;height:100%;width:200%;") && src.includes(".ygg-porte-d img{right:0;}"), "chaque volet montre sa moitié de l'image");
  assert.ok(src.includes(".ygg-porte{position:absolute;inset:-6px;") && src.includes("background:transparent;}") && src.includes(".ygg-vitre.ygg-decor{overflow:visible;border:0;}"), "la porte déborde du cadre, aucun fond ni bordure noirs");
  assert.ok(src.includes("@media (prefers-reduced-motion:reduce){.ygg-porte.ouvre,.ygg-porte.referme{display:none;}}"), "mouvement réduit : pas d'animation");
  const corps = src.slice(src.indexOf("function porteDe_(id,actif){"), src.indexOf("function porteDe_(id,actif){") + 1800);
  assert.ok(!corps.includes("setInterval") && !corps.includes("setTimeout"), "aucune minuterie pour les portes");
}
// 5. Branchement : la porte est dans la vitre de chaque fruit, selon son état actif.
assert.ok(src.includes("(porteHtml&&!v.active?'':couches_(d,v,id,def))+porteHtml+'</div>'") && src.includes("var porteHtml=porteDe_(id,Boolean(v.active));"), "porte dans la vitre de chaque fruit ; aucun fruit dessiné derrière une porte close");
assert.ok(src.includes(".ygg-carte.magie .ygg-vitre.ygg-decor{background-size:cover;background-position:center;background-repeat:no-repeat;}"), "l'arbre des fruits de magie tient dans son cadre (le fond de .magie ne remet plus sa taille à zéro)");
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

// Norman (2026-11-02) : « pour chacun des cadres d'Yggdrasil, adapte les couleurs par rapport à la porte qu'il a »
{
  const pal = src.match(/var PALETTES_PORTES_=\{([^}]*(?:\[[^\]]*\][^}]*)*)\};/);
  assert.ok(pal, "palettes des portes");
  const ids = src.match(/var FRUITS_24_=\{([^}]*)\};/)[1].split(",").map((x) => x.split(":")[0]);
  const valeurs = {};
  for (const m of pal[1].matchAll(/(\w+):\[(\d+),(\d+)(?:,\d+,\d+)?\]/g)) valeurs[m[1]] = [Number(m[2]), Number(m[3])];
  for (const id of ids) {
    assert.ok(valeurs[id], id + " : a sa palette");
    assert.ok(valeurs[id][0] >= 0 && valeurs[id][0] < 360 && valeurs[id][1] > 0 && valeurs[id][1] <= 100, id + " : teinte et saturation valides");
  }
  assert.ok(new Set(Object.values(valeurs).map((v) => v.join())).size >= 14, "des couleurs variées d'une porte à l'autre");
  assert.ok(src.includes("data-fruit=\"'+html_(id)+'\" style=\"'+styleCouleursPorte_(id)"), "la carte porte les couleurs de sa porte");
  assert.ok(src.includes(".ygg-carte.magie[data-fruit]{background:linear-gradient(100deg,transparent 35%,hsl(var(--yg-h2,"), "le cadre suit la porte, même pour les fruits de magie");
  assert.ok(src.includes("arbitrariness:[28,75,184,60]"), "Arbitraire : deux couleurs (orange et turquoise)");
  assert.ok(src.includes(".ygg-vitre.ygg-decor::before{content:\"\";position:absolute;inset:0;z-index:6;") && src.includes("inset 0 0 14px 3px rgba(0,0,0,.6)"), "ombrage dans le cadre de chaque image");
  for (const sel of [".ygg-carte[data-fruit] .ygg-btn.vert{", ".ygg-carte[data-fruit] .ygg-btn.vert:disabled{", '.ygg-carte[data-fruit] .ygg-mode button[aria-pressed="true"]{', ".ygg-carte[data-fruit] .ygg-poop{", ".ygg-carte[data-fruit] .ygg-auto{"]) assert.ok(src.includes(sel), "boutons accordés à la porte : " + sel);
  assert.ok(src.includes(".ygg-carte[data-fruit] .ygg-btn.vert{color:hsl(var(--yg-h,130) 70% 9%);background:linear-gradient(180deg,hsl(var(--yg-h,130) var(--yg-s,50%) 66%)"), "boutons CLAIRS (66 %) sur un fond foncé (30 % à 13 %) : jamais la même couleur que le fond");
  console.log("idle-yggdrasil-portes-v1 (couleurs des cadres) : OK");
}
