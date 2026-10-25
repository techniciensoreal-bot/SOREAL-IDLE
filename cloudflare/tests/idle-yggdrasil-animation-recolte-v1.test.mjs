import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-16) : « quand un fruit est prêt au niveau maximum (celui qui débloque la dernière image), au moment de manger ou de récolter, l'animation des 20 images se déclenche à bonne vitesse, ni trop
 * rapide ni trop lente. » + titre en branche vivante (feuilles, vigne), plus de découpe qui ne suit pas la bordure.
 */
const src = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
const coupe = (re) => src.match(re)[0];
const code = [
  "var etat={anim:{},precharge:{},fermees:{},ouvre:{}};",
  "var sons=[];function son_(n){sons.push(n);}",
  "var rafraichissements=0;function rafraichir_(){rafraichissements+=1;}",
  "var etapeFournie=null;function etapeCroissance_(){return etapeFournie;}",
  "function trouver_(){return {d:{},v:{}};}",
  coupe(/var REGLAGES_DEFAUT_=\{[^\n]*\n/),
  coupe(/var CLE_REGLAGES_=[^\n]*\n/),
  coupe(/function reglages_\(\)\{[\s\S]*?\n {2}\}\n/),
  coupe(/function ecrireReglages_\(r\)\{[\s\S]*?\n {2}\}\n/),
  coupe(/var FRUITS_24_=\{[^}]*\};/),
  coupe(/function nbEtapes_\(id\)\{[^\n]*\n/),
  coupe(/function urlEtape_\(id,k\)\{[^\n]*\n/),
  coupe(/function precharger_\(id\)\{[\s\S]*?\n {2}\}\n/),
  coupe(/function jouerImages_\(id,vitre,depart,R,fini\)\{[\s\S]*?\n {2}\}\n/),
  coupe(/function lancerAnimation_\(id\)\{[\s\S]*?\n {2}\}\n/),
  coupe(/var DUREE_OUVERTURE_=\d+;\n/),
  coupe(/var CLE_PORTES_VUES_=[^\n]*\n/),
  "function renaissances_(){return 0;}",
  coupe(/function portesVues_\(\)\{[\s\S]*?\n {2}\}\n/),
  coupe(/function porteVue_\(id\)\{[^\n]*\n/),
  coupe(/function noterPorteVue_\(id,vue\)\{[\s\S]*?\n {2}\}\n/),
  coupe(/function porteDe_\(id,actif\)\{[\s\S]*?\n {2}\}\n/),
  "function porte_(){return '<div class=\"ygg-porte\"></div>';}",
  "this.api={etat:etat,lancerAnimation_:lancerAnimation_,precharger_:precharger_,porteDe_:porteDe_,regler:function(e){etapeFournie=e;},rafraichissements:function(){return rafraichissements;},CADENCE:reglages_().cadence,reglages:reglages_,ecrire:ecrireReglages_};"
].join("\n");
function monde({ reduit = false, vitre = true, stock = {} } = {}) {
  let maintenant = 1_800_000_000_000; const timers = []; const images = []; const calques = [];
  const fabrique = () => { const o = { className: "", attrs: {}, parentNode: null, setAttribute(k, v) { this.attrs[k] = v; }, set src(v) { this.srcs.push(v); }, get src() { return this.srcs[this.srcs.length - 1]; }, srcs: [] }; return o; };
  const zoneVitre = { appendChild(n) { n.parentNode = { removeChild: (x) => { x.parentNode = null; calques.retires = (calques.retires || 0) + 1; } }; calques.push(n); }, };
  const ctx = {
    Date: class extends Date { static now() { return maintenant; } }, Math, String, Array, encodeURIComponent, Object, Boolean, JSON, Number, isFinite,
    localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); } },
    document: { querySelector: () => (vitre ? zoneVitre : null), createElement: () => fabrique() },
    window: { matchMedia: () => ({ matches: reduit }) },
    Image: function () { const o = fabrique(); images.push(o); return o; },
    setTimeout: (f, d) => { timers.push({ f, d, t: maintenant + d }); return timers.length; }
  };
  ctx.window.window = ctx.window;
  vm.runInNewContext("(function(){" + code + "}).call(this)", ctx);
  const jouer = () => { const delais = []; let garde = 0; while (timers.length && garde++ < 500) { timers.sort((a, b) => a.t - b.t); const x = timers.shift(); maintenant = x.t; delais.push(x.d); x.f(); } return delais; };
  return { api: ctx.api, calques, images, jouer, avancer: (ms) => { maintenant += ms; }, maintenant: () => maintenant };
}

// 1. Fruit au tier maximum, entièrement poussé (image 19) : les 20 images, de la dernière à la graine, à cadence régulière ; un seul calque, retiré à la fin ; la page est redessinée une fois.
{
  const m = monde(); m.api.regler(19);
  const debut = m.maintenant();
  m.api.lancerAnimation_("gold");
  assert.equal(m.calques.length, 1, "un calque posé sur l'image");
  assert.equal(m.calques[0].attrs["data-morph-garder"], "", "le redessin périodique ne le retire pas (règle n°4)");
  assert.equal(m.calques[0].srcs[0], "/api/idle/media/ygg?name=gold&etape=19", "part de la dernière image");
  assert.ok(Number(m.api.etat.anim.gold) > debut, "animation en cours enregistrée");
  assert.equal(m.api.porteDe_("gold", false), "", "pas de porte close par-dessus pendant l'animation");
  const delais = m.jouer();
  const etapes = m.calques[0].srcs.map((u) => Number(u.match(/etape=(\d+)/)[1]));
  assert.deepEqual(etapes, Array.from({ length: 20 }, (_, i) => 19 - i), "20 images, de 19 à 0, sans en sauter");
  assert.ok(delais.slice(0, 19).every((d) => d === m.api.CADENCE), "cadence régulière");
  const duree = m.maintenant() - debut;
  assert.ok(duree >= 1500 && duree <= 3200, "vitesse raisonnable : " + duree + " ms pour 20 images (ni flash, ni éternité)");
  assert.equal(m.calques.retires, 1, "calque retiré à la fin");
  assert.equal(m.api.rafraichissements(), 1, "page redessinée une fois, après coup");
  assert.equal(m.api.etat.anim.gold, undefined, "animation terminée");
  assert.ok(m.api.porteDe_("gold", false).includes("ygg-porte"), "ensuite la porte close revient");
}
// 2. Un fruit qui n'a pas de croissance (image de départ ou pas d'images) : aucune animation.
for (const e of [null, 0]) { const m = monde(); m.api.regler(e); m.api.lancerAnimation_("luck"); assert.equal(m.calques.length, 0, "aucune animation pour l'étape " + e); }
// 3. Fruit pas au maximum : l'animation part de SON image actuelle (plus courte), même cadence.
{ const m = monde(); m.api.regler(7); m.api.lancerAnimation_("powerAlpha"); m.jouer(); assert.equal(m.calques[0].srcs.length, 8, "de l'image 7 à 0"); }
// 4. Mouvement réduit : pas d'animation. Carte absente : rien (jamais d'erreur).
{ const m = monde({ reduit: true }); m.api.regler(19); m.api.lancerAnimation_("gold"); assert.equal(m.calques.length, 0); }
{ const m = monde({ vitre: false }); m.api.regler(19); m.api.lancerAnimation_("gold"); assert.equal(m.calques.length, 0); }
// 5. Préchargement : les 20 images, une seule fois par fruit.
{ const m = monde(); m.api.precharger_("gold"); m.api.precharger_("gold"); assert.equal(m.images.length, 20, "20 images préchargées, une fois"); assert.deepEqual(m.images.map((i) => i.srcs[0].match(/etape=(\d+)/)[1]), Array.from({ length: 20 }, (_, i) => String(i))); }
// 6. Branchements : l'animation part du clic Manger / Récolter (et de « tout »), le préchargement dès qu'un fruit est prêt au maximum ; titre en bois sans découpe.
assert.ok(/function lancerUsage_\(id,avecPoop\)\{[\s\S]{0,200}lancerAnimation_\(id\);/.test(src), "animation lancée par Manger / Récolter / tout (même chemin)");
assert.ok(src.includes("if(etapeCroissance_(d,v)===nbEtapes_(id)-1)precharger_(id);"), "préchargement dès l'arrivée d'un fruit prêt au maximum");
const titre = src.match(/'\.ygg-titre\{[^\n]*/)[0];
assert.ok(!/clip-path/.test(titre) && /border-radius:999px/.test(titre) && /repeating-linear-gradient/.test(titre) && /rgba\(132,196,84/.test(titre), "titre en branche vivante : bouts arrondis (la bordure suit le contour), écorce striée, mousse");
assert.ok(!/filter|animation/.test(titre), "dégradés statiques seulement");
assert.ok(src.includes('<div class="ygg-titre"><i class="ygg-feu g">') && src.includes('<i class="ygg-feu d">') && src.includes('<i class="ygg-vigne">') && /var FEUILLAGE_='<svg/.test(src) && /var VIGNE_='<svg/.test(src), "touffes de feuilles aux deux bouts et vigne");
assert.ok(!/<animate|@keyframes[^']*ygg-(feu|vigne)/.test(src), "décor du titre fixe (aucune animation)");
console.log("idle-yggdrasil-animation-recolte-v1: OK");
