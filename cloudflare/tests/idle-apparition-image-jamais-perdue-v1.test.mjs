// Norman (2026-11-02) : « j'ai tué le boss 71 et l'image du 72 n'est pas apparue ; j'ai dû changer d'onglet et revenir ».
// Filet de sécurité d'apparition-boss-v1.js : un calque .app-boss périmé, la classe de mort ou une opacité 0 restées sur l'image sont défaits, sans toucher à un calque encore dans sa durée de vie.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const code = fs.readFileSync("cloudflare/public/modules/apparition-boss-v1.js", "utf8");
const classes = new Set(["soreal-idle-boss-death-v61"]);
const img = {
  classList: { contains: (c) => classes.has(c), remove: (c) => classes.delete(c) },
  style: { opacity: "0", removeProperty() { this.opacity = ""; } },
  complete: true, naturalWidth: 0, _src: "/b.webp?id=72",
  getAttribute() { return this._src; }, removeAttribute() { this._src = null; }, setAttribute(n, v) { this._src = v; },
};
let calques = [];
const hote = {
  querySelectorAll: () => calques.slice(),
  querySelector: (s) => (s === "img" ? img : s === ".app-boss" ? calques[0] || null : null),
};
const fen = {
  document: { getElementById: () => hote, addEventListener() {}, body: null, head: {}, createElement() { return {}; } },
  performance: { now: () => now }, setTimeout() { return 1; }, clearTimeout() {}, console,
};
let now = 100000;
fen.window = fen;
vm.runInNewContext(code, fen);
const A = fen.__SOREAL_IDLE_APPARITION_BOSS_V1__;
assert.equal(typeof A.assurer, "function");
// calque jeune : conservé (jamais l'ancien boss révélé), et l'image n'est pas touchée
calques = [{ __depuis: now - 3000, parentNode: { removeChild(e) { calques = calques.filter((x) => x !== e); } } }];
let r = A.assurer();
assert.equal(calques.length, 1, "un calque dans sa durée de vie reste");
assert.ok(classes.has("soreal-idle-boss-death-v61"), "image intacte sous un calque vivant");
// calque périmé : retiré, image nettoyée et redemandée
calques = [{ __depuis: now - 20000, parentNode: { removeChild(e) { calques = calques.filter((x) => x !== e); } } }];
r = A.assurer();
assert.equal(calques.length, 0, "un calque périmé est retiré");
assert.equal(classes.has("soreal-idle-boss-death-v61"), false, "la classe de mort est retirée");
assert.equal(img.style.opacity, "", "l'opacité 0 est retirée");
assert.equal(r.rechargee, true, "une image sans taille est redemandée");
// pendant une victoire : rien n'est touché
classes.add("soreal-idle-boss-death-v61");
fen.__SOREAL_IDLE_VICTOIRE_EN_COURS__ = true;
A.assurer();
assert.ok(classes.has("soreal-idle-boss-death-v61"), "rien n'est défait pendant une victoire");
// garde bornée : quatre vérifications au plus, aucune boucle permanente
assert.match(code, /GARDE_DELAIS=\[4000,9000,15000,22000\]/);
assert.ok(!/setInterval/.test(code), "aucune minuterie périodique");
// le calque d'attente ne reste plus jamais si personne n'a pris le relais
assert.ok(code.includes("if(m>0&&m!==idMort){jouer(hote);return;}"), "l'attente joue toujours quand le boss suivant est là");
console.log("idle-apparition-image-jamais-perdue-v1 : OK");
