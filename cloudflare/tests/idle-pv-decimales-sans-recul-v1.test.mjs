import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-19) : « dans les virgules des PV, ça augmente rapidement mais on peut voir un rollback des décimales ». Hors combat, un petit recul des PV au remplacement de l'état
   (réponse du moteur calculée un peu plus tôt que la valeur déjà prévue par la régénération) est ignoré ; un vrai retrait de PV n'est jamais masqué. */
const src = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = src.indexOf("Object.defineProperty(UI_PARTAGE_V1,'idleEtat'");
const fin = src.indexOf("configurable:true});", debut) + "configurable:true});".length;
assert.ok(debut > 0 && fin > debut, "setter de idleEtat présent");
const U = new Function("let idleEtat=null;const UI_PARTAGE_V1={};" + src.slice(debut, fin) + ";return UI_PARTAGE_V1;")();

function essai(avant, apres) { U.idleEtat = avant; U.idleEtat = apres; return U.idleEtat.pvJoueur; }
assert.equal(essai({ pvJoueur: 15.1, defense: 100, pvJoueurMax: 1000 }, { pvJoueur: 14.95, defense: 100, pvJoueurMax: 1000 }), 15.1, "petit recul (< 1,5 s de régénération) ignoré");
assert.equal(essai({ pvJoueur: 100, defense: 100, pvJoueurMax: 1000 }, { pvJoueur: 90, defense: 100, pvJoueurMax: 1000 }), 90, "un vrai retrait de PV passe");
assert.equal(essai({ pvJoueur: 100, defense: 100, pvJoueurMax: 1000, combatBossActif: true }, { pvJoueur: 99.9, defense: 100, pvJoueurMax: 1000 }), 99.9, "en combat, rien n'est masqué");
assert.equal(essai({ pvJoueur: 100, defense: 100, pvJoueurMax: 1000 }, { pvJoueur: 100, defense: 100, pvJoueurMax: 1000, combatBossActif: true }), 100, "combat qui commence : valeur du moteur");
assert.equal(essai({ pvJoueur: 15.1, defense: 100, pvJoueurMax: 1000 }, { pvJoueur: 16.4, defense: 100, pvJoueurMax: 1000 }), 16.4, "une hausse passe");
assert.equal(essai({ pvJoueur: 40, defense: 100, pvJoueurMax: 30 }, { pvJoueur: 39, defense: 100, pvJoueurMax: 30 }), 39, "au-dessus du maximum : jamais conservé");
U.idleEtat = null; U.idleEtat = { pvJoueur: 5 };
assert.equal(U.idleEtat.pvJoueur, 5, "premier état reçu");
console.log("idle-pv-decimales-sans-recul-v1: OK");
