import assert from "node:assert/strict";
import fs from "node:fs";
const m = fs.readFileSync(new URL("../public/modules/inventaire-volet-v1.js", import.meta.url), "utf8");
/*
 * Norman (2026-10-15) : sur téléphone, le REPÈRE de la barre à côté de l'inventaire suit le doigt (glisser vers le bas = le repère descend). Seul le repère est inversé : le défilement de la page reste celui du
 * navigateur (une première version avait capté le geste pour défiler à la place du navigateur : défilement inversé, retirée).
 */
assert.ok(!m.includes("touchmove") && !m.includes("railGeste") && !m.includes("preventDefault"), "aucun geste capté : le défilement de la page est celui du navigateur");
assert.ok(m.includes("var y=Math.round(32+Math.max(0,barreReelle-86)*(1-prog));") && m.includes("var barreReelle=Math.max(140,(window.innerHeight||0)-191-22);"), "repère inversé ; amplitude = hauteur réelle de la barre de la feuille de style (le repère atteint le bas)");
assert.ok(m.includes("var barre=Math.max(140,(window.innerHeight||0)-hb-22);") && m.includes("var total=Math.max(1,r.height-barre-8);") && !m.includes("setProperty('--inv-haut'"), "suivi du défilement inchangé");
assert.ok(m.includes("var prog=Math.max(0,Math.min(1,(hb+8-r.top)/total));"), "avancement du défilement inchangé");
console.log("idle-inventaire-barre-sens-v1: OK");
