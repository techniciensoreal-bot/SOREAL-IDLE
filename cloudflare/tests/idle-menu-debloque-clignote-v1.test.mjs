import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-26) : « quand un menu apparaît, le bouton doit clignoter 3 fois avec un bip bip bip agréable, pas trop aigu ; si plusieurs menus se débloquent en même temps (nuke), tous clignotent 3 fois en synchro mais le son n'est joué qu'une fois.
 * Pareil pour Yggdrasil : quel que soit le nombre de portes qui s'ouvrent, un seul son de porte et un seul coq. »
 */
const menus = readFileSync("cloudflare/public/modules/ui-menus-v1.js", "utf8");
const fn = menus.slice(menus.indexOf("function annoncerNouveauxMenusIdleV1_(j){"), menus.indexOf("Identité de chaque bouton du menu"));
assert.equal((fn.match(/jouerEffetAudioIdleV199_\('menuUnlock'\)/g) || []).length, 1, "UN seul son pour tous les menus débloqués ensemble");
assert.ok(fn.includes("clignoterMenusDebloquesIdleV1_(nouveaux.map(function(m){return m.id;}))"), "tous les boutons débloqués clignotent ensemble");
const clign = menus.slice(menus.indexOf("function clignoterMenusDebloquesIdleV1_(ids){"), menus.indexOf("function annoncerNouveauxMenusIdleV1_(j){"));
assert.ok(clign.includes("iterations:3") && clign.includes("a.startTime=debut"), "3 clignotements, tous démarrés sur le même instant");
assert.ok(clign.includes("prefers-reduced-motion"), "sans animation si l'utilisateur les réduit");
assert.ok(clign.includes("essais<15"), "le bouton d'un menu qui vient d'apparaître est cherché pendant 1,5 s au plus");

const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const son = audio.slice(audio.indexOf("function menuDebloque_(){"), audio.indexOf("Set complété (Norman, 2026-09-27"));
assert.ok(son.includes("[0,.52,1.04].forEach") && son.includes("from:587,to:587"), "trois bips doux d'une note médium (587 Hz), un par clignotement");
assert.ok(!/from:(1\d{3}|2\d{3})/.test(son), "aucune note aiguë (>= 1000 Hz)");

const ygg = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
assert.ok(ygg.includes("function sonPorteUnique_(genre,nom,option,duree)") && ygg.includes("dernierSonPorte_[genre]&&t-dernierSonPorte_[genre]<duree"), "garde : un seul son de porte à la fois");
assert.ok(ygg.includes("sonPorteUnique_('ouvre',nomSonPorte_(),vit,1200))coqPremiereOuverture_(vit)") && ygg.includes("sonPorteUnique_('ferme',nomSonFerme_(),reglages_().porte,1200)"), "ouverture et fermeture passent par la garde ; le coq seulement avec le son de porte retenu");
assert.ok(!/[^_]son_\(nomSonPorte_\(\)/.test(ygg), "aucun appel direct au son de porte hors de la garde");

console.log("idle-menu-debloque-clignote-v1: OK");
