import assert from "node:assert/strict";
import fs from "node:fs";

/* Norman (2026-11-03) : « les 3 premiers circuits peuvent rester comme ils sont, mais au-delà on doit sentir une montée en puissance : leurs couleurs et leurs complexités, ils mélangent des couleurs » + « les écrans des circuits imprimés mieux incrustés, comme si un emplacement était prévu, mais pas un bord noir ». */
const lire = (f) => fs.readFileSync(new URL("../public/" + f, import.meta.url), "utf8");
const css = lire("soreal-idle-augment-pcb-puissance-v1.css"), index = lire("index.html"), touches = lire("soreal-idle-augment-touches-v1.css");
assert.ok(/soreal-idle-augment-pcb-puissance-v1\.css\?v=\d+/.test(index), "feuille chargée");
assert.ok(!/!\s*important/.test(css.replace(/\/\*[\s\S]*?\*\//g, "")), "aucun !important");
const cartes = ["🔫", "⚡", "🦾", "🗡️", "🌀"];
for (const c of cartes) assert.ok(css.includes(`[data-icone="${c}"]::after{background:`), "carte " + c);
for (const c of ["✂️", "🥛", "💥"]) assert.ok(!css.includes(`data-icone="${c}"`), "les trois premiers ne changent pas : " + c);
// montée en puissance : chaque carte pèse plus que la précédente (nombre d'éléments de la tuile), et mélange plusieurs couleurs
const blocs = css.split("::after{background:").slice(1).map((b) => decodeURIComponent((b.match(/data:image\/svg\+xml,([^"]+)"/) || [, ""])[1]));
const poids = blocs.map((s) => (s.match(/<(path|rect|circle)/g) || []).length);
for (let i = 1; i < poids.length; i++) assert.ok(poids[i] > poids[i - 1], "complexité croissante : " + poids.join(" < "));
const nbCouleurs = blocs.map((s) => new Set(s.match(/stroke='(#[0-9a-f]{6})'/gi) || []).size);
assert.ok(nbCouleurs.every((n) => n >= 2) && nbCouleurs[4] >= 4 && nbCouleurs[4] > nbCouleurs[0], "couleurs mélangées, de plus en plus : " + nbCouleurs.join(","));
// écrans incrustés sans bord noir
assert.ok(/aug-piste-v2:not\(\.upgrade\) :is\([^)]*\):not\(#_\)\{box-shadow:inset 0 3px 7px color-mix\(in srgb,var\(--pcb-base/.test(touches), "écrans des circuits : ombre teintée par la carte");
assert.ok(/0 0 0 1\.5px color-mix\(in srgb,var\(--pcb-acc/.test(touches) && /0 0 0 3\.5px color-mix\(in srgb,var\(--pcb-base,#0f5a34\) 82%,#000\)/.test(touches), "liseré de cuivre puis découpe du vernis dans la teinte de la carte");
console.log("idle-augment-pcb-puissance-v1: OK");
