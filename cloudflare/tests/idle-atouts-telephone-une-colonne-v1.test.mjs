/* Boutique d'atouts sur téléphone (Norman, 2026-11-22 : « les atouts points débordent de l'écran sur téléphone ») : en dessous de 480 px la grille n'a qu'UNE colonne qui peut rétrécir (minmax(0,1fr)). Avec « 1fr 1fr », chaque colonne gardait la largeur minimale de son contenu (233 px) : la seconde sortait de l'écran. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("cloudflare/public/soreal-idle-jeu.css", "utf8");
const debut = css.indexOf("@media (max-width:480px){.pk-etagere{");
assert.ok(debut >= 0, "règle téléphone de la grille des atouts introuvable");
const m = [css.slice(debut, css.indexOf("}", css.indexOf("}", debut) + 1) + 1)];
const regle = /.pk-etagere{([^}]*)}/.exec(m[0])[1];
assert.ok(/grid-template-columns:minmax\(0,1fr\)(;|$)/.test(regle), "une seule colonne qui peut rétrécir sur téléphone : " + regle);
assert.ok(!/grid-template-columns:1fr 1fr/.test(regle), "plus de deux colonnes « 1fr 1fr » (débordement)");
assert.ok(/\.pk-vitrine\{min-width:0\}/.test(m[0]), "les cartes peuvent rétrécir (min-width:0)");
// l'écran large garde plusieurs colonnes
assert.ok(/\.pk-etagere\{display:grid;grid-template-columns:repeat\(auto-fill,minmax\(230px,1fr\)\)/.test(css), "grille à colonnes automatiques au-dessus de 480 px");
console.log("idle-atouts-telephone-une-colonne-v1: OK");
