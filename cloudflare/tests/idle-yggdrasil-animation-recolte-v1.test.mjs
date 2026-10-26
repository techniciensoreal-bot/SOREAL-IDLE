import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Titre en branche vivante (feuilles, vigne) : Norman, 2026-10-16. L'animation des images au moment de manger ou de récolter n'existe plus (Norman, 2026-10-26 : une seule image de fruit et une de terre, la pousse est une taille) :
 * ce test garde le titre et vérifie que rien de l'ancienne animation ne revient.
 */
const src = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
assert.ok(!/lancerAnimation_|jouerImages_|precharger_|urlEtape_/.test(src), "plus d'animation d'images ni de préchargement");
const titre = src.match(/'\.ygg-titre\{[^\n]*/)[0];
assert.ok(!/clip-path/.test(titre) && /border-radius:999px/.test(titre) && /repeating-linear-gradient/.test(titre) && /rgba\(132,196,84/.test(titre), "titre en branche vivante : bouts arrondis (la bordure suit le contour), écorce striée, mousse");
assert.ok(!/filter|animation/.test(titre), "dégradés statiques seulement");
assert.ok(src.includes('<div class="ygg-titre"><i class="ygg-feu g">') && src.includes('<i class="ygg-feu d">') && src.includes('<i class="ygg-vigne">') && /var FEUILLAGE_='<svg/.test(src) && /var VIGNE_='<svg/.test(src), "touffes de feuilles aux deux bouts et vigne");
assert.ok(!/<animate|@keyframes[^']*ygg-(feu|vigne)/.test(src), "décor du titre fixe (aucune animation)");
console.log("idle-yggdrasil-animation-recolte-v1: OK");
