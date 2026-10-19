import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-19) : « quand on passe dans la page 2 de l'inventaire, la page se redessine ». Changer de page du sac met à jour la grille et les deux sélecteurs EN PLACE ; le redessin complet de la page n'est qu'un repli. */
const s = readFileSync("cloudflare/public/modules/ui-inventaire-v1.js", "utf8");
const debut = s.indexOf("function changerPageSacV1_(page){");
const corps = s.slice(debut, s.indexOf("function pagerSacIdleV1_(", debut));
assert.ok(corps.includes("REG.patchInventaireAdventureIdleV160_(REG.idleEtat,{action:'page'})"), "mise à jour en place de la grille");
assert.ok(corps.includes("querySelectorAll('.soreal-idle-bag-pager-v1')") && corps.includes("el.replaceWith(neuf)"), "les deux sélecteurs de page sont remplacés en place");
assert.ok(corps.indexOf("return;") < corps.lastIndexOf("rafraichirMenuRacineIdleV28_()"), "le redessin complet n'arrive qu'après, en repli");
assert.ok(s.includes("REG.idlePagesSacV1=pagesSac;"), "le nombre de pages est connu de la mise à jour en place");
console.log("idle-sac-page-en-place-v1: OK");
