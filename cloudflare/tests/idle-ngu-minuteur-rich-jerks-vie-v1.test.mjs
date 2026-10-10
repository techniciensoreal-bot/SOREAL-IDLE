import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-09) : (1) conseil sur « pour riches » ; (2) minuteur de fin de niveau dans NGU ; (3) le volet « Effets de tous tes NGU » ne se referme plus tout seul ;
 * (4) la vie max ne doit plus changer en passant d'un menu à l'autre (le multiplicateur d'Augments n'est répercuté que quand la page Augmentations rejoue les niveaux).
 */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const ngu = readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

assert.ok(meta.includes("Conseil : n’achète ceci qu’une fois que tu as acheté tout le reste."), "Rich Jerks : conseil");
assert.ok(ngu.includes("function etaTexte_(spl,fraction,cibleAtteinte)") && ngu.includes("data-nl-eta") && ngu.includes("Niveau suivant dans"), "NGU : minuteur");
assert.ok(ngu.includes("eta.innerHTML=texteEta"), "le minuteur est mis à jour en direct");
assert.ok(ngu.includes("var resumeOuvert=false;") && ngu.includes("(resumeOuvert?' open':'')") && ngu.includes("resume:function(o){resumeOuvert=Boolean(o);}"), "volet Effets : état conservé");

assert.ok(ui.includes("if(!Object.keys(niveaux).length)return;"), "hors page Augmentations : aucun changement");
assert.ok(ui.includes("if(!(base.additif>0))return;"), "sans niveau de départ : on attend la synchro");
assert.ok(ui.includes("ratio<=applique+1e-12)return;"), "jamais de baisse due à une donnée manquante");

// Formule du minuteur (même calcul que le module).
const dureeTexte = (s) => { s = Math.max(0, Math.ceil(s)); if (s < 60) return s + " s"; let m = Math.floor(s / 60), r = s % 60; if (m < 60) return m + " min" + (r ? " " + r + " s" : ""); let h = Math.floor(m / 60); m %= 60; if (h < 24) return h + " h" + (m ? " " + m + " min" : ""); const j = Math.floor(h / 24); h %= 24; return j + " j" + (h ? " " + h + " h" : ""); };
assert.equal(dureeTexte(42 * (1 - 0.5)), "21 s");
assert.equal(dureeTexte(600 * 0.9), "9 min");
assert.equal(dureeTexte(7380), "2 h 3 min");
// NGU : étoiles qui scintillent seulement quand de l'énergie / de la magie est placée ; « Je fais quoi ? » reste ouvert.
assert.ok(ngu.includes('.nl-v1 .nl-etoiles b{animation:nlEtoile') && ngu.includes('.nl-etoiles{position:absolute;inset:0;pointer-events:none;z-index:0;contain:strict;display:none;'), "étoiles : cachées tant qu'aucune machine n'est en route, puis scintillantes");
assert.ok(ngu.includes("racine.setAttribute('data-nl-actif',actif)"), "étoiles : mise à jour en direct");
assert.ok(ngu.includes("var aideOuverte=false;") && ngu.includes("aideOuverte=!el.hidden;") && ngu.includes("(aideOuverte?'':' hidden')"), "aide : état conservé");
// Borne : stick et boutons rapprochés, groupe centré (milieu entre 0,355 et 0,675 ≈ 0,515).
const itopod = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.ok(itopod.includes("* .355 -") && itopod.includes("* 0.495 -") && itopod.includes("* 0.585 -") && itopod.includes("* 0.675 -") && !itopod.includes("* .24 -"), "borne : stick et boutons rapprochés");
console.log("idle-ngu-minuteur-rich-jerks-vie-v1: OK");
