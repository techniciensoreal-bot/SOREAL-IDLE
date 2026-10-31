import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Garderie : cliquer un bocal ouvre un POPUP informatif (Norman, 2026-10-31), il n'y a plus de panneau sous le cadre.
 * Le popup est un bloc ajouté à <body> (règle n°4 : le morph de la page ne le retire pas), fermé par la croix, un clic dehors ou Échap ;
 * ses valeurs vivantes sont réécrites sur place (aucun clignotement) ; sur téléphone il tient à l'écran et défile en interne.
 */
const src = readFileSync(new URL("../public/modules/daycare-page-v1.js", import.meta.url), "utf8");
assert.ok(!src.includes("gd-sous") , "plus de panneau sous le cadre");
assert.ok(!src.includes("gd-choix-cadre\"") && !src.includes("soreal-idle-section-v8 gd-choix-cadre"), "plus de cadre de choix/reprise dans la page");
assert.ok(src.includes("document.body.appendChild(fond)") && src.includes("id='gd-popup-fond'") || src.includes("fond.id='gd-popup-fond'"), "le popup est ajouté à <body>");
assert.ok(src.includes("ev.target===fond") && src.includes("ev.key==='Escape'") && src.includes("gd-pop-x"), "fermeture : clic dehors, Échap, croix");
assert.ok(src.includes("popupHtml!==contenu"), "le squelette n'est réécrit que si le contenu change");
assert.ok(src.includes("data-gd-pop-niv") && src.includes("data-gd-pop-prog") && src.includes("majPopupVivant"), "valeurs vivantes mises à jour sur place");
assert.ok(/\.gd-popup\{[^}]*max-height:calc\(100dvh - 24px\);overflow:auto/.test(src), "tient à l'écran, défilement interne");
assert.ok(src.includes("#a8f0cc") && src.includes("#1b2621"), "couleurs de la Garderie (menthe / vert sombre)");
assert.ok(src.includes("__garderieConfirmerV1__") && src.includes("'daycareRemove'") && src.includes("'daycarePlace'"), "actions conservées : reprendre, placer");
assert.ok(/majPopup\(\);if\(appliquer\(\)>0\)demarrer\(\)/.test(src), "le popup est remis d'aplomb après chaque redessin");
assert.ok(src.includes("repriseId=null;choixOuvert=false;}"), "le popup se ferme quand on quitte la page");
console.log("idle-garderie-popup-v1 OK");
