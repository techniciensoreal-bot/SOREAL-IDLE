import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-22) : « je peux réaliser le rituel de la sangsue alors que je n'ai pas assez d'or ; l'animation se déroule normalement mais le sang n'est pas comptabilisé ». Cause : le message « il manque X Or » (que la scène lit pour s'arrêter) n'était plus reposé quand une autre partie du jeu réécrivait la ligne en texte simple sans toucher au repère. */
const src = readFileSync(new URL("../public/modules/ui-boucle-v1.js", import.meta.url), "utf8");
const i = src.indexOf("function ecrireSiChangeIdleV1_(el,texte)");
const bloc = src.slice(i, i + 900);
assert.ok(bloc.includes("el.__orHtmlV1!==texte||!el.querySelector('.or-somme-v1')"), "on vérifie ce que la ligne affiche vraiment, pas seulement le repère mémorisé");

// Comportement : on rejoue la fonction sur un faux élément dont le texte a été réécrit par un autre module.
const corps = bloc.slice(bloc.indexOf("{") , bloc.indexOf("\n        }\n") + 10);
const ecrire = new Function("el", "texte", corps.replace(/^\{/, "").replace(/\}\s*$/, ""));
const el = { __orHtmlV1: null, textContent: "", html: "", querySelector() { return this.html.includes("or-somme-v1") ? {} : null; }, set innerHTML(v) { this.html = v; this.textContent = v.replace(/<[^>]*>/g, ""); }, get innerHTML() { return this.html; } };
const msg = '🪙 Il manque <b class="or-somme-v1">2T Or</b> pour le prochain rituel.';
ecrire(el, msg);
assert.match(el.textContent, /Il manque 2T Or/, "le message est posé");
el.textContent = "⏱ 0 s avant le prochain rituel complété"; el.html = "";   // une autre partie du jeu réécrit la ligne
ecrire(el, msg);
assert.match(el.textContent, /Il manque 2T Or/, "le message est reposé même si le repère mémorisé n'a pas changé");
console.log("idle-blood-or-manque-relu-v1: OK");
