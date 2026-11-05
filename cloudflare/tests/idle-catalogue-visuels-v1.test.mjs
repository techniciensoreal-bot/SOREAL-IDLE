import assert from "node:assert/strict";
import fs from "node:fs";
import { inventaire } from "../tools/inventaire-visuels.mjs";

/*
 * Catalogue des visuels et effets (plan design/ARCHITECTURE-CIBLE.md, § 4-2 : « rien n'est jamais perdu »). Le catalogue écrit (design/catalogue-visuels.json) doit être celui du code ACTUEL : une animation, un son, une mort, un retour, un
 * effet ajouté, renommé ou RETIRÉ oblige à régénérer le catalogue (node cloudflare/tools/inventaire-visuels.mjs --ecrire) et donc à le relire. Un élément qui disparaît du code sans que le catalogue soit mis à jour fait échouer ce test.
 */
const courant = inventaire();
const ecrit = fs.readFileSync("design/catalogue-visuels.json", "utf8");
assert.equal(JSON.stringify(courant, null, 1) + "\n", ecrit, "le catalogue des visuels n'est plus à jour : node cloudflare/tools/inventaire-visuels.mjs --ecrire, puis relire design/CATALOGUE-VISUELS.md");
// garde-fous de plausibilité : l'inventaire voit bien tout (une régression de l'outil ne doit pas passer pour « le jeu a perdu ses animations »)
assert.equal(courant.menus.length, 29, "les 29 menus du jeu sont inventoriés");
assert.ok(courant.keyframes.length >= 400, "plus de 400 animations CSS : " + courant.keyframes.length);
assert.ok(courant.mortsNouvelles.length >= 5 && courant.retoursJoueur.length >= 8 && courant.retoursBoss.length >= 7, "morts et retours inventoriés");
assert.ok(courant.mortsDeBase.includes("rewind") && courant.mortsDeBase.includes("clignote"), "morts de base : rembobinage et clignotement");
assert.ok(courant.sons.effets.length >= 60, "sons nommés : " + courant.sons.effets.length);
assert.ok(Object.keys(courant.pointsEntree).length >= 100, "points d'entrée rejouables : " + Object.keys(courant.pointsEntree).length);
assert.ok(courant.effetsReglables.length >= 4, "effets réglables");
console.log("idle-catalogue-visuels-v1: OK (" + courant.keyframes.length + " animations CSS, " + Object.keys(courant.pointsEntree).length + " points d'entrée rejouables, " + courant.menus.length + " menus)");
