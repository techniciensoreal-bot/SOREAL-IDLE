import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-02) : onglet Énergie du NGU : un gros nuage gris tant qu'aucune énergie n'est placée ; ensuite il disparaît, le soleil brille et des nuages blancs passent. Le soleil et les nuages blancs n'existent pas (ni DOM ni animation) tant que le gris est là.
 */
const src = readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8");
const m = src.match(/function veutAstres_[\s\S]*?function cielSync_[\s\S]*?\n\}\n/);
assert.ok(m, "fonctions du ciel présentes");
// logique pure : états
const ctx = new Function(src.match(/function veutAstres_[^\n]*\n[^\n]*function veutGris_[^\n]*\n/)[0] + "return {a:veutAstres_,g:veutGris_};")();
assert.equal(ctx.a("energy", "0"), false, "niveau 0 jour : ni soleil ni nuages blancs");
assert.equal(ctx.g("energy", "0"), true, "niveau 0 jour : nuage gris");
assert.equal(ctx.a("energy", "1"), true); assert.equal(ctx.g("energy", "1"), false, "niveau >= 1 : soleil, plus de gris");
assert.equal(ctx.a("magic", "0"), true, "la nuit garde sa lune et ses chauves-souris à tout niveau");
assert.equal(ctx.g("magic", "0"), false, "la nuit n'a pas de nuage gris");
assert.ok(/function astresHtml_\(onglet,niv\)\{return '<span class="nl-arc"[^}]*veutAstres_\(onglet,niv\)\?HTML_ASTRE:''\)\+\(veutGris_\(onglet,niv\)\?HTML_GRIS:''\)/.test(src), "HTML du rendu conditionnel");
assert.ok(src.includes("+ETOILES+astresHtml_(onglet,nivDe_(lueurPage_))+"), "le rendu utilise le ciel conditionnel");
assert.ok(src.includes("cielSync_(racine,true)") && src.includes("cielSync_(racine,false)"), "le tick et le changement d'onglet synchronisent le ciel");
// CSS : gris statique, fondu par opacité seule
assert.ok(/\.nl-v1>\.nl-gris\{[^}]*transition:opacity 1\.2s ease/.test(src), "fondu 1,2 s par opacité");
const css = src.match(/\.nl-v1>\.nl-gris\{[^}]*\}/)[0];
assert.ok(!/animation|filter|box-shadow/.test(css), "gris : ni animation, ni filtre, ni ombre");
assert.ok(/\.nl-gris\.nl-gris-ent,\.nl-v1>\.nl-gris\.nl-gris-sort\{opacity:0\}/.test(src), "états d'entrée et de sortie");
assert.ok(/prefers-reduced-motion:reduce\)\{\.nl-v1>\.nl-gris\{transition:none\}/.test(src), "reduced-motion coupe la transition");
assert.ok(src.includes("setAttribute('data-morph-garder','')"), "le gris qui sort est gardé par le morph (règle n°4)");
assert.ok(/data-nl-niv="0"\]>\.nl-arc\{display:none\}/.test(src), "arc-en-ciel retiré sous le gris");
assert.ok(!/data-nl-onglet="energy"\]\[data-nl-niv="0"\] \.nl-(astre|nuages)/.test(src), "plus de soleil/nuages grisés à niveau 0 (ils n'existent pas)");
console.log("idle-ngu-nuage-gris-v1: OK");
