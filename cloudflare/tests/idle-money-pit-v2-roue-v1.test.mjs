import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-10) : Money Pit plus joli (image entière, polices de jeu) et roue journalière qui tourne ; « Daily Spin » traduit. */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const dict = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));

assert.ok(meta.includes("Roue journalière !</div>") && !meta.includes("Daily Spin!</div>"), "titre en français");
assert.equal(dict["Roue journalière !"], "Daily Spin!", "version anglaise");
assert.ok(meta.includes('class="mp2-grille-v1"') && css.includes("grid-row:1/3"), "image à gauche, actions à droite");
assert.ok(/mp2-grille-v1 \.soreal-idle-money-scene-v206>img\{[^}]*height:auto!important[^}]*object-fit:contain!important/.test(css), "image entière, jamais rognée");
assert.ok(/@media \(max-width:760px\)\{\s*\.soreal-idle-page-root-v28\[data-menu="moneyPit"\] \.mp2-grille-v1\{grid-template-columns:1fr\}/.test(css), "téléphone : tout s'empile");
assert.ok(css.includes('--mp2-titre:"Bangers"') && css.includes('"Russo One"'), "polices de jeu");
assert.ok(!/font-family:[^;]*Georgia/.test(css.slice(css.indexOf("Money Pit v2"))), "pas de police traitement de texte");

// Roue : le tour se joue AVANT la demande au serveur ; sans animation la demande part tout de suite.
assert.ok(meta.includes("window.__lancerRoueIdleV1__=lancerRoueIdleV1_") && meta.includes('onclick="window.__lancerRoueIdleV1__()"'), "le bouton lance la roue");
const f = meta.slice(meta.indexOf("function lancerRoueIdleV1_"), meta.indexOf("window.__lancerRoueIdleV1__="));
assert.ok(f.includes("prefers-reduced-motion") && f.includes("roue.animate(") && f.includes("setTimeout(envoyer,4000)"), "animation, réduction de mouvement, filet de sécurité");
assert.ok(f.includes("anim.onfinish=function(){setTimeout(envoyer,350);}"), "la demande part à la fin du tour de roue");
// Règle n°3 : un tour exact, linéaire, coupé en mouvement réduit.
assert.ok(css.includes("mp2RoueDouceV1 9s linear infinite") && css.includes("to{transform:rotate(360deg)}") && /prefers-reduced-motion:reduce\)\{\.mp2-roue-prete-v1\{animation:none\}/.test(css));
// Calendrier de connexion compact, police de jeu.
const cal = css.slice(css.indexOf("Calendrier de connexion compact"));
assert.ok(cal.includes("max-width:600px!important") && cal.includes("aspect-ratio:1/.82") && cal.includes("--mp2-jeu"), "calendrier resserré, cases basses, police de jeu");
assert.ok(!/Georgia/.test(cal));
console.log("idle-money-pit-v2-roue-v1: OK");
