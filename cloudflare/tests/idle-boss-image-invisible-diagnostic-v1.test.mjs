// Norman (2026-11-03) : « l'image du boss "Un Gamin sur un Nuage" n'est pas apparue ; comme hier avec un autre boss ; obligé de changer d'onglet et revenir ».
// Cause exacte non reproduite (média sain : boss 38 servi par le vrai serveur de médias de l'exe, déchiffré ; les 17 effets se terminent ; fenêtre au premier plan) :
// (1) l'effet d'apparition a une échéance sur MINUTERIE (requestAnimationFrame suspendu = calque opaque 7 s de trop, mesuré) ;
// (2) le filet de sécurité est armé à CHAQUE changement de boss (pas seulement quand un effet est joué) ;
// (3) toute image de boss invisible sans calque, calque périmé ou erreur de chargement est écrite dans le journal de diagnostic avec tout l'état de la balise.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const code = fs.readFileSync("cloudflare/public/modules/apparition-boss-v1.js", "utf8");

// (1) échéance sur minuterie dans jouer()
assert.match(code, /echeance=setTimeout\(terminer,Math\.round\(\(\(neuf&&Number\(neuf\.duree\)\)\|\|DUREES\[i\]\|\|2\)\*1000\)\+1500\)/, "échéance minuterie de l'effet");
assert.match(code, /clearTimeout\(echeance\);/, "l'échéance est annulée à la fin normale");
// (2) filet armé à chaque changement de boss, avant tout retour anticipé de verifier()
const v = code.indexOf("function verifier(){");
const corps = code.slice(v, code.indexOf("function surveiller()", v));
assert.ok(corps.indexOf("garde_();") > corps.indexOf("if(n===dernierId)return;") && corps.indexOf("garde_();") < corps.indexOf("__SOREAL_IDLE_VICTOIRE_EN_COURS__"), "garde_() armé dès que l'id change");

// (3) rapport au journal
const lignes = [];
let etatImg = { complete: true, naturalWidth: 184, op: "0", vis: "visible", dis: "block", w: 243, h: 243, mort: false };
const img = {
  get complete() { return etatImg.complete; }, get naturalWidth() { return etatImg.naturalWidth; },
  classList: { contains: (c) => c === "soreal-idle-boss-death-v61" && etatImg.mort, remove() { etatImg.mort = false; } },
  style: { opacity: "", removeProperty() {} },
  getAttribute() { return "/api/idle/media/boss?id=38"; }, removeAttribute() {}, setAttribute() {},
  getBoundingClientRect() { return { width: etatImg.w, height: etatImg.h }; },
};
const hote = { querySelectorAll: () => [], querySelector: (s) => (s === "img" ? img : null) };
const fen = {
  document: { getElementById: () => hote, addEventListener() {}, body: null, head: {}, createElement() { return {}; }, visibilityState: "visible" },
  performance: { now: () => 1000 }, setTimeout() { return 1; }, clearTimeout() {}, console, URL, location: { href: "http://127.0.0.1:1/" },
  getComputedStyle: () => ({ opacity: etatImg.op, visibility: etatImg.vis, display: etatImg.dis }),
  __SOREAL_IDLE_DIAG_V1__: { noter: (type, cle, d) => lignes.push({ type, cle, d }) },
};
fen.window = fen;
vm.runInNewContext(code, fen);
const A = fen.__SOREAL_IDLE_APPARITION_BOSS_V1__;

// image visible : rien dans le journal
etatImg.op = "1";
let r = A.assurer();
assert.equal(r.invisible, "");
assert.equal(lignes.length, 0, "image visible : aucune ligne");
// opacité 0 sans calque : rapportée avec l'état complet
etatImg.op = "0";
r = A.assurer();
assert.equal(r.invisible, "opacite_0");
assert.equal(lignes.length, 1);
assert.equal(lignes[0].type, "boss_image_invisible");
assert.equal(lignes[0].cle, "38");
for (const k of ["raison", "complete", "nw", "opacite", "visibilite", "affichage", "larg", "haut", "mort", "calques", "combat", "victoire", "visible"]) assert.ok(k in lignes[0].d, "champ " + k);
// sans dimension, sans taille, non chargée
etatImg.op = "1"; etatImg.w = 0;
assert.equal(A.raisonInvisible(img), "sans_dimension");
etatImg.w = 243; etatImg.naturalWidth = 0;
assert.equal(A.raisonInvisible(img), "sans_taille");
etatImg.complete = false;
assert.equal(A.raisonInvisible(img), "non_chargee");
console.log("idle-boss-image-invisible-diagnostic-v1 : OK");
