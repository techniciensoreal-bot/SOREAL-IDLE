import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « Tu crois que ce serait possible que dans le classement, il y ait une catégorie Clique / Tap ?
 * Le nombre de cliques de souris Droite/gauche effectué dans l'appli. Et les taps pareils mais dans la même catéogire. »
 * Puis, sur la question anti-triche : « Oui tu peux implémenter, même si quelqu'un triche, ca n'est pas grave... il sera
 * premier, il sera content mdr » -- compteur brut assumé, sans anti-triche. Couverture serveur (compteur cumulatif, exclu
 * du classement Global) : idle-leaderboard-v1.test.mjs. Ici : câblage client (écoute, lot, envoi).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

const debut = ui.indexOf("let idleClicsEnAttenteV1=0;");
assert.ok(debut > 0, "bloc de suivi des clics introuvable");
const bloc = ui.slice(debut, debut + 2000);

// Écoute gauche (button 0) ET droite (button 2), uniquement pendant que le jeu IDLE est actif.
assert.match(bloc, /document\.addEventListener\('mousedown',function\(ev\)\{\s*if\(PAGE_ACTIVE!=='idle'\)return;\s*if\(ev\.button===0\|\|ev\.button===2\)idleClicMarquerV1_\(\);\s*\},true\);/);
// Taps (tactile) comptés dans la même catégorie.
assert.match(bloc, /document\.addEventListener\('touchstart',function\(\)\{\s*if\(PAGE_ACTIVE!=='idle'\)return;\s*idleClicMarquerV1_\(\);\s*\},\{capture:true,passive:true\}\);/);

// Jamais un appel serveur par clic : accumulation + envoi par lot (débounce).
assert.match(bloc, /function idleClicMarquerV1_\(\)\{\s*idleClicsEnAttenteV1\+=1;/, "chaque clic incrémente un compteur en mémoire");
assert.match(bloc, /setTimeout\(function\(\)\{\s*idleClicsEnvoiMinuterieV1=null;\s*idleClicsEnvoyerV1_\(\);\s*\},15000\);/, "un seul envoi différé par rafale");
assert.match(bloc, /\.enregistrerClicsSorealIdle\(SOREAL_SESSION,lot\);/, "le lot accumulé est envoyé en une fois");
// Échec réseau : le lot repart dans le compteur, jamais perdu.
assert.match(bloc, /withFailureHandler\(function\(\)\{\s*idleClicsEnvoiEnCoursV1=false;\s*idleClicsEnAttenteV1\+=lot;\s*\}\)/);

// Onglet dédié au classement (cf. aussi idle-shop-classement-menu-order-v1.test.mjs).
assert.match(ui, /\{id:'clics',nom:'🖱️ Clics\/Tap'\}/);

console.log("idle-clicks-tracking-v1: OK");
