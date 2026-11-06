import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Norman (2026-10-21) : explosion du NUKE sur l'image du boss dans la borne d'arcade ; air qui monte du bas des jauges de la machine (minibulles rapides, quelques-unes qui grossissent en montant). */
const lire = (f) => readFileSync(new URL("../public/" + f, import.meta.url), "utf8");
const combat2 = lire("modules/ui-combat-2-v1.js");
const itopod = lire("soreal-idle-itopod.css");
const machine = lire("soreal-idle-machine.css");
const augm = lire("modules/augmentations-page-v1.js");

// 1. Explosion : la fonction, jouée au lancement du NUKE (après les vérifications), pose un calque gardé par le redessin.
const debut = combat2.indexOf("function exploserBossNukeIdleV1_(){");
const fin = combat2.indexOf("function nukerBossIdleV1_(){");
assert.ok(debut > 0 && fin > debut);
const calques = [];
const hote = {
  classes: new Set(),
  classList: { add(c) { hote.classes.add(c); }, remove(c) { hote.classes.delete(c); } },
  querySelector: () => (calques.length ? calques[calques.length - 1] : null),
  appendChild(c) { calques.push(c); c.parentNode = hote; },
  removeChild(c) { calques.splice(calques.indexOf(c), 1); c.parentNode = null; }
};
let fins = [];
const document = {
  getElementById: (id) => (id === "sorealIdleBossImageHostV36" ? hote : null),
  createElement: () => ({ attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, remove() { if (this.parentNode) hote.removeChild(this); } })
};
const exploser = vm.runInNewContext("(function(document,window,setTimeout,clearTimeout){" + combat2.slice(debut, fin) + "\nreturn exploserBossNukeIdleV1_;})", {})(document, { matchMedia: () => ({ matches: false }) }, (f) => { fins.push(f); return fins.length; }, () => {});
assert.equal(exploser(), true, "explosion lancée");
assert.equal(calques.length, 1, "un calque posé sur l'image du boss");
assert.equal(calques[0].className, "nk-boum");
assert.ok("data-morph-garder" in calques[0].attrs, "gardé par le redessin (règle n°4)");
assert.ok(calques[0].innerHTML.includes("nk-flash") && calques[0].innerHTML.includes("nk-feu") && calques[0].innerHTML.includes("nk-onde") && (calques[0].innerHTML.match(/<b /g) || []).length === 16, "éclair, boule de feu, ondes de choc et 16 étincelles");
assert.ok(hote.classes.has("nk-tremble"), "l'image tremble");
exploser();
assert.equal(calques.length, 1, "un seul calque à la fois (un NUKE rapproché remplace le précédent)");
fins.forEach((f) => f());
assert.equal(calques.length, 0, "calque retiré à la fin");
assert.equal(hote.classes.has("nk-tremble"), false, "tremblement terminé");
assert.equal(vm.runInNewContext("(function(document,window){" + combat2.slice(debut, fin) + "\nreturn exploserBossNukeIdleV1_;})", {})({ getElementById: () => hote, createElement: document.createElement }, { matchMedia: () => ({ matches: true }) })(), false, "aucun effet avec « réduire les animations »");
assert.equal(vm.runInNewContext("(function(document,window){" + combat2.slice(debut, fin) + "\nreturn exploserBossNukeIdleV1_;})", {})({ getElementById: () => null }, {})(), false, "pas de borne à l'écran : rien");
assert.ok(combat2.includes("jouerEffetAudioIdleV199_('nuke');\n        try{exploserBossNukeIdleV1_();}catch(_e){}"), "jouée au lancement du NUKE, après les vérifications qui le refusent");
for (const k of ["nkFlash", "nkFeu", "nkFumee", "nkOnde", "nkEtincelle"]) {
  assert.ok(new RegExp("@keyframes " + k + "\\{0%\\{opacity:0[^}]*\\}[^]*?100%\\{opacity:0").test(itopod), k + " : invisible au début et à la fin (usage unique, rien ne reste affiché)");
}

// 2. Jauges de la machine : 14 minibulles + 3 grosses qui montent, dans le tube, avec unités de conteneur pour la hauteur.
assert.ok(augm.includes('<div class="tmm-liq" style="height:\'+largeur.toFixed(2)+\'%"><div class="tmm-bulles"><canvas class="tmm-bulles-cv" data-morph-vivant="1"'), "bulles DANS le liquide (un canvas par tube, rogné par le calque du liquide) : jamais au-dessus de sa surface");
assert.ok(machine.includes(".tmm-liq{position:absolute;") && !/\.tmm-liq\{[^}]*container-type/.test(machine) && machine.includes(".tmm-bulles{position:absolute;inset:0;overflow:hidden;"), "le calque des bulles suit la hauteur du liquide et rogne ce qui dépasse ; le liquide n'est plus un conteneur de requête (plus aucun cqh appliqué à un élément, et sa taille change à chaque image)");
assert.ok(/@keyframes tmmMonte\{0%\{opacity:0;[^}]*scale\(1\)\}[^]*?scale\(3\.8\)\}\}/.test(machine) && /@keyframes tmmFizz\{0%\{opacity:0;[^}]*\}[^]*?100%\{opacity:0/.test(machine), "courbes de référence gardées (fondu d'entrée et de sortie, les bulles grossissent en montant) ; le canvas les reproduit : test idle-tm-bulles-canvas-v1");
console.log("idle-nuke-explosion-bulles-v1: OK");
