import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : pour les menus à plusieurs barres qui se débloquent avec une montée en puissance, les barres doivent être de plus en plus bad ass avec le même thème (attaque régulière > passive,
 * attaque puissante > régulière…), en ajoutant du foncé. Le rang (0 à 5) est posé par le rendu ; le CSS fait monter l'habillage sans changer les couleurs de chaque menu.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");

// Le rang est posé sur les lignes de Basic Training, les rituels de Blood et les Augments ; jamais sur la ligne qui n'est pas encore débloquée.
assert.ok(ui.includes('data-rang-v1="${rangBt}"'), "Basic Training");
assert.ok(ui.indexOf("const rangBt=") > ui.indexOf("if(!skill.unlocked){"), "le rang n'est calculé que pour une barre débloquée");
assert.ok(meta.includes('data-rang-v1="\'+rangRituel+\'"') && meta.includes("const rangRituel=Math.max(0,Math.min(5,"), "rituels de Blood");
assert.ok(meta.includes('data-rang-v1="\'+rangAugment(def)+\'"'), "Augments");

// Le CSS : un habillage par rang, de 1 à 5, dans chacun des menus concernés ; les couleurs restent celles du menu (variables --rg-*).
for (const menu of ["entrainement", "augmentations", "bloodMagic", "sang"]) {
  for (let n = 1; n <= 5; n++) assert.ok(css.includes(`[data-menu="${menu}"] [data-rang-v1="${n}"] .soreal-idle-bt-fill-v120`), `${menu} : rang ${n}`);
}
for (const v of ["--rg-c1:#c1121f", "--rg-c1:#1d4ed8", "--rg-c1:#ff2d7a", "--rg-c1:#7a0f24"]) assert.ok(css.includes(v), "palette " + v);

// Ça monte vraiment : la hauteur de la barre croît avec le rang et le fond passe au noir au départ de la barre.
const hauteur = (n) => Number(new RegExp(`\\[data-rang-v1="${n}"\\] \\.soreal-idle-bt-track-v120\\{[^}]*?height:(\\d+)px`).exec(css)?.[1]);
const h = [1, 2, 3, 4, 5].map(hauteur);
assert.ok(h.every(Number.isFinite), "hauteurs : " + h);
assert.deepEqual(h, [...h].sort((a, b) => a - b), "la barre grandit avec le rang");
assert.ok(new Set(h).size === 5, "chaque rang a sa hauteur : " + h);
assert.ok(css.includes("#000 0%,var(--rg-dark) 7%"), "départ noir de la barre");
assert.ok(css.includes("@keyframes sorealRgFluxV1") && css.includes("@keyframes sorealRgBatV1") && css.includes("@keyframes sorealRgBraiseV1"), "reflets, battement, braise");
assert.ok(css.includes("@media (prefers-reduced-motion:reduce)") && css.includes("sorealRgBraiseV1"), "mouvement réduit respecté");

let d = 0; for (const c of css) { if (c === "{") d++; if (c === "}") d--; }
assert.equal(d, 0, "accolades CSS équilibrées");
console.log("idle-barres-montee-en-puissance-v1: OK");
