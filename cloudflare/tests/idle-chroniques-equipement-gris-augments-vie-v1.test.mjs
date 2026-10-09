import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-09) : (1) Chroniques > Équipement : les pièces maxées à 100 % en couleur, les autres grisées ; (2) quand un Augment prend un niveau, la vie max (et l'attaque) doit suivre tout de suite, pas à la synchro.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

assert.ok(ui.includes("(maxAtteint?' maxed':' nonmax')") && ui.includes("(boostMaxe?' maxed':' nonmax')"), "tout objet de la collection qui n'est pas à 100 % est grisé (pièces, objets spéciaux, boosts)");
assert.ok(css.includes(".soreal-idle-collection-card-v1.nonmax .soreal-idle-collection-card-icon-v1{filter:grayscale(1)"), "gris sur l'icône, nom encore lisible");

// Augments : multiplicateur recalculé depuis les niveaux rejoués, répercuté sur les multiplicateurs de combat (donc sur la vie max, qui vaut attaque × 10).
assert.ok(ui.includes("function appliquerAugmentsSurCombatIdleV1_(visual,niveaux)") && ui.includes("appliquerAugmentsSurCombatIdleV1_(augVisual,niveauxAugmentsLocaux)"));
assert.ok(ui.includes("cp.multiplicateurAttaqueTotal=atk*ratio/applique") && ui.includes("cp.multiplicateurDefenseTotal=def*ratio/applique"), "attaque et défense suivent");
assert.ok(meta.includes("base:{mult:baseMult,additif:baseAdditif}") && meta.includes("appliedRatio:1"), "repère du multiplicateur au moment de la photo du serveur");

// Formule : la même que le moteur (somme base × niveau^exposant × (1 + niveau d'Upgrade²)), l'effet des perks/NGU déduit du multiplicateur serveur.
const defs = [{ id: "a", baseMultiplier: 1, exponent: 1 }, { id: "b", baseMultiplier: 2, exponent: 1.5 }];
const additif = (niv) => defs.reduce((s, d) => { const n = niv[d.id + ":main"] || 0; return n > 0 ? s + d.baseMultiplier * Math.pow(n, d.exponent) * (1 + Math.pow(niv[d.id + ":upgrade"] || 0, 2)) : s; }, 0);
const base = { mult: 1 + additif({ "a:main": 10 }) * 0.5, additif: additif({ "a:main": 10 }) };
const k = (base.mult - 1) / base.additif;
assert.equal(k, 0.5, "facteur déduit du serveur");
const maintenant = Math.max(1, 1 + additif({ "a:main": 12 }) * k);
assert.ok(Math.abs(maintenant / base.mult - (1 + 12 * 0.5) / (1 + 10 * 0.5)) < 1e-12, "rapport appliqué au combat");
console.log("idle-chroniques-equipement-gris-augments-vie-v1: OK");
