import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : « j'aimerais qu'on puisse lancer le menu (du haut, sur téléphone) et qu'il continue de défiler jusqu'au bout ; là il s'arrête très vite. »
 * Causes : aimantation du défilement (scroll-snap) qui arrêtait l'élan à chaque bouton ; rendus de la page qui recréaient le menu (retour au début + recentrage sur le bouton actif), coupant l'élan.
 */
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// CSS : plus d'aimantation, élan natif conservé et non propagé à la page.
const bloc = css.slice(css.indexOf("Menu du haut sur téléphone : il continue de défiler jusqu'au bout"));
assert.ok(bloc.includes("scroll-snap-type:none!important") && bloc.includes("overscroll-behavior-x:contain") && bloc.includes("-webkit-overflow-scrolling:touch"));
assert.ok(bloc.includes("scroll-snap-align:none!important"), "plus d'alignement forcé sur les boutons");

// Détection du défilement : doigt posé ou mouvement dans la seconde qui précède, avec un faux document.
const debut = ui.indexOf("      let idleNavDefilementMsV1=0;");
const fin = ui.indexOf("      function rendreIdleEtat_(res){");
assert.ok(debut > 0 && fin > debut);
const ecouteurs = {};
const document_ = { addEventListener: (t, f) => { (ecouteurs[t] = ecouteurs[t] || []).push(f); } };
let maintenant = 1_000_000;
const D = { now: () => maintenant };
const o = new Function("document", "Date", ui.slice(debut, fin) + "\nreturn {enDefilement:navEnDefilementIdleV1_};")(document_, D);
const nav = { classList: { contains: (c) => c === "soreal-idle-nav-v28" }, closest: (sel) => (sel === ".soreal-idle-nav-v28" ? nav : null) };
const ailleurs = { classList: { contains: () => false }, closest: () => null };
const lancer = (t, e) => (ecouteurs[t] || []).forEach((f) => f(e));

assert.equal(o.enDefilement(), false, "au repos");
lancer("touchstart", { target: ailleurs }); assert.equal(o.enDefilement(), false, "un doigt ailleurs que sur le menu ne compte pas");
lancer("touchstart", { target: nav }); assert.equal(o.enDefilement(), true, "doigt posé sur le menu");
maintenant += 5000; assert.equal(o.enDefilement(), true, "tant que le doigt reste posé");
lancer("touchend", {}); assert.equal(o.enDefilement(), true, "élan : juste après le relâchement");
maintenant += 700; lancer("scroll", { target: nav }); maintenant += 700; assert.equal(o.enDefilement(), true, "l'élan continue : chaque mouvement prolonge");
maintenant += 1300; assert.equal(o.enDefilement(), false, "fini : plus de mouvement depuis plus d'une seconde");
lancer("scroll", { target: ailleurs }); assert.equal(o.enDefilement(), false, "le défilement d'une autre zone ne compte pas");

// Le rendu est repoussé seulement si le menu actif n'a pas changé, pas en rangement, pour 4 s au plus ; la position de défilement est conservée.
assert.ok(ui.includes("if(navEnDefilementIdleV1_()&&idleMenuRenduV179===idleMenuActifV28&&!idleMenuEditionV1){"));
assert.ok(ui.includes("if(Date.now()-depuisDiffere<4000){") && ui.includes("idleRenduDiffereV1=res;"), "le dernier état reçu est rendu ensuite");
assert.ok(ui.includes("return n&&idleMenuRenduV179===idleMenuActifV28?n.scrollLeft:null;") && ui.includes("restaurerScrollNavIdleV28_(idleNavScrollAvantRenduV1);"));
assert.ok(ui.includes("typeof scrollAvant==='number'&&Number.isFinite(scrollAvant)?scrollAvant:cible"), "position conservée, sinon recentré sur le bouton actif (changement de menu)");
console.log("idle-menu-defilement-tel-v1: OK");
