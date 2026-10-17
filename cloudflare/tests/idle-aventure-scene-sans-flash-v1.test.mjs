import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-17) : « Aventure affiche une fraction de seconde l'inventaire avant de montrer le haut de la fenêtre. » La scène (≈ 700 px) n'était insérée que ~130 ms après le rendu (runtime : 70 ms de
 * débounce, puis 60 ms de minuterie) : le bas de la page, l'inventaire, était peint, puis repoussé. Un observateur de mutations la construit maintenant dans le même tour que le rendu, avant la peinture.
 */
const src = readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");
assert.ok(src.includes("function observerEntree_(){") && src.includes("new MutationObserver(function(){") && src.includes("root.querySelector('.soreal-idle-v79-adventure-scene')"), "observateur d'entrée");
assert.ok(src.includes("observerEntree_();\n    schedule_();"), "branché à l'initialisation, la minuterie reste pour les mises à jour");
const obs = src.slice(src.indexOf("function observerEntree_(){"), src.indexOf("function init_(){"));
assert.ok(!/setTimeout\(render_|setTimeout\(function\(\)\{[^}]*render_/.test(obs) && obs.includes("render_();"), "la scène est construite tout de suite, sans minuterie");
assert.ok(obs.includes("if(enConstruction)return;") && obs.includes("adventurePage_(root)"), "seulement sur la page Aventure, sans réentrance");
console.log("idle-aventure-scene-sans-flash-v1: OK");
