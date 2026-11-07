import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-07) : « les barres dans Augmentations ont l'air de ne pas être en 60 images par seconde ; le reste est fluide, c'est la manière dont elles avancent ». Cause : le panneau LED de chaque barre était redessiné point par point
 * au plus toutes les 33 ms (30 images par seconde) avec 8 niveaux d'intensité pour la colonne en cours. Garde : plus de limite de 33 ms, calques en mémoire (trame, colonnes allumées, sprite de colonne), 64 niveaux d'intensité, colonnes
 * de largeur entière, et le dessin ne recompose que quelques images par barre (pas de redessin de tous les points à chaque image).
 */
const s = fs.readFileSync("cloudflare/public/modules/aug-led-barres-v1.js", "utf8");
assert.ok(!/ts-dernier>=33/.test(s), "plus de limite à 30 images par seconde");
assert.ok(/Math\.round\(allume\*64\)/.test(s) && !/Math\.round\(allume\*8\)/.test(s), "64 niveaux d'intensité pour la colonne en cours");
assert.ok(/function calques\(/.test(s) && /o\.litCtx\.drawImage\(o\.spr/.test(s) && /ctx\.drawImage\(o\.dim,0,0\)/.test(s) && /ctx\.drawImage\(o\.lit,0,0\)/.test(s), "calques en mémoire recomposés à chaque image");
const dessiner = s.slice(s.indexOf("function dessiner(cv,tube){"), s.indexOf("function attacher(){"));
assert.ok(!/ctx\.arc\(|ctx\.beginPath\(/.test(dessiner) && !/shadowBlur/.test(dessiner), "aucun arc ni halo recalculé à chaque image dans dessiner()");
assert.ok(/var cw=W\/cols,ox=0,/.test(s), "les colonnes remplissent exactement le cadre : la première au bord gauche, la dernière au bord droit (Norman, 2026-11-07)");
assert.ok(/Math\.round\(o\.ox\+i\*o\.cw-o\.m\)/.test(s) && /Math\.round\(o\.ox\+plein\*o\.cw-o\.m\)/.test(s), "calques posés à des pixels entiers");
console.log("idle-aug-led-barres-60-images-v1: OK");
