import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : les barres de l'Advanced Training, en accord avec le thème de la page, de belles couleurs différentes suivant ce que fait chaque compétence (elles étaient violettes pour toutes).
 */
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const mod = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

const pistes = ["toughness", "power", "block", "wandoosEnergy", "wandoosMagic"];
const couleurs = new Set();
const motifs = new Set();
for (const id of pistes) {
  const debut = css.indexOf(`[data-at-piste="${id}"]{--ac-1:`);
  assert.ok(debut > 0, "palette et motif pour " + id);
  const bloc = css.slice(debut, css.indexOf("}\n", debut));
  const c1 = /--ac-1:(#[0-9a-f]{6})/.exec(bloc)?.[1];
  const c3 = /--ac-3:(#[0-9a-f]{6})/.exec(bloc)?.[1];
  const motif = bloc.slice(bloc.indexOf("--ac-pat:"));
  assert.ok(c1 && c3 && motif.length > 20, "dégradé et motif de " + id);
  couleurs.add(c1 + c3); motifs.add(motif);
  assert.ok(css.includes(`[data-at-piste="${id}"]{--ac:#`), "couleur d'accent de " + id + " (liseré, boutons)");
}
assert.equal(couleurs.size, 5, "un dégradé différent par compétence");
assert.equal(motifs.size, 5, "un motif différent par compétence");
assert.ok(css.includes("var(--ac-1),var(--ac) 58%,var(--ac-3)"), "le remplissage suit la couleur de la compétence");
assert.ok(css.includes("var(--ac-pat)"), "le motif suit la compétence");
assert.ok(css.includes('[data-menu="avance"] .soreal-idle-at-ligne-v1 .soreal-idle-at-barre-v1'), "cadre sombre de la console de la page");
// Les barres du module sont toujours celles qui s'animent en direct (classes inchangées).
assert.ok(mod.includes("soreal-idle-at-remplissage-v1") && mod.includes("data-at-fill") && mod.includes("barre.classList.toggle('pleine',pleine)"));
let d = 0; for (const c of css) { if (c === "{") d++; if (c === "}") d--; }
assert.equal(d, 0, "accolades CSS équilibrées");
console.log("idle-advanced-training-couleurs-v1: OK");
