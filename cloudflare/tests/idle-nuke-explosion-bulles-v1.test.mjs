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
assert.ok(augm.includes("for(let i=0;i<14;i+=1)bulles+='<i class=\"tmm-bulle mini\"") && augm.includes("for(let i=0;i<3;i+=1)bulles+='<i class=\"tmm-bulle gde\""), "14 minibulles et 3 grosses bulles");
assert.ok(augm.includes("<div class=\"tmm-liq\"></div><div class=\"tmm-bulles\">'+bulles+'</div></div>"), "bulles dans le tube, indépendantes du niveau du liquide");
assert.ok(machine.includes(".tmm-tube{container-type:size;") && machine.includes("translateY(-98cqh)"), "les bulles montent jusqu'en haut du tube");
assert.ok(/\.tmm-bulle\.mini\{width:2px;height:2px;animation-name:tmmFizz\}/.test(machine) && /\.tmm-bulle\.gde\{width:3px;height:3px;animation-name:tmmMonte/.test(machine), "minibulles très fines, grosses bulles de départ fines");
assert.ok(/@keyframes tmmMonte\{0%\{opacity:0;[^}]*scale\(1\)\}[^]*?scale\(3\.8\)\}\}/.test(machine) && /@keyframes tmmFizz\{0%\{opacity:0;[^}]*\}[^]*?100%\{opacity:0/.test(machine), "les bulles grossissent en montant, fondu d'entrée et de sortie");
assert.ok(machine.includes(".tmm-bulle,.tmm-rouleau"), "arrêtées avec « réduire les animations »");
console.log("idle-nuke-explosion-bulles-v1: OK");
