import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { IDLE_ADVENTURE_SETS, normalizeIdleAdventureStateV47, idleAdventureSnapshotV47, IDLE_ADVENTURE_ITEM_CATALOG_V1 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-10-03) : « dans le coffre, les sets côte à côte, et en dessous seulement quand il n'y a plus de place ; sur téléphone, centrés s'il n'y en a qu'un par ligne ;
 * un cadre dédié à chaque set, qui rappelle la zone d'où il vient, avec ses couleurs et ses décorations : un thème par set. »
 */
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// 1. Un thème par set du jeu (couleurs + décor), et pour chaque groupe d'objets sans set.
const manquants = Object.keys(IDLE_ADVENTURE_SETS).filter((id) => !css.includes(`.soreal-idle-coffre-cadre-v1[data-theme-set-v1="${id}"]{`));
assert.deepEqual(manquants, [], "sets sans thème : " + manquants.join(", "));
for (const g of ["titan", "coeur", "looty", "pendentif", "autre", "ciel"]) {
  assert.ok(css.includes(`[data-theme-set-v1="${g}"]{`), "thème du groupe " + g);
}
// 2. Chaque thème définit couleur, fond sombre et décor ; les décors sont tous différents d'un set à l'autre quand c'est possible.
const lignes = [...css.matchAll(/\[data-theme-set-v1="([^"]+)"\]\{--t1:(#[0-9a-f]{6});--t2:(#[0-9a-f]{6});--deco:"([^"]+)"\}/g)];
assert.ok(lignes.length >= 50, "au moins 50 thèmes : " + lignes.length);
const decors = new Map();
for (const [, id, , , deco] of lignes) decors.set(deco, [...(decors.get(deco) || []), id]);
const doublons = [...decors.values()].filter((v) => v.length > 1).map((v) => v.join("/"));
assert.ok(doublons.length <= 6, "décors partagés seulement entre sets voisins (edgy/bothedgy/edgyboots…) : " + doublons.join(" ; "));

// 3. Les cases du coffre sont regroupées en cadres : un cadre par zone (son set + ses objets), un par set de titan.
assert.ok(ui.includes("function cadreThematique(cle,titre,corps)") && ui.includes('data-theme-set-v1="'));
assert.ok(ui.includes("const cle=g.sets.length?g.sets[0].id:'ciel';"), "zone sans set (Le Ciel) : thème « ciel »");
assert.ok(ui.includes("g.sets.forEach(function(st){html+=cadreThematique(st.id,st.nom,mannequin(st.pieces));});"), "un cadre par set pour les titans");
assert.ok(!ui.includes("soreal-idle-coffre-titre-groupe-v1"), "plus de titre pleine largeur : il cassait la ligne entre deux zones");

// 4. Côte à côte, puis à la ligne ; centrés sur téléphone.
assert.ok(css.includes("@media (max-width:700px){body.soreal-idle-active-v47 .soreal-idle-page-root-v28 .soreal-idle-coffre-mannequins-v1{justify-content:center}}"));
assert.ok(css.includes(".soreal-idle-coffre-mannequins-v1{display:flex!important;flex-wrap:wrap"), "flex avec retour à la ligne");

// 5. Donnée : la zone fournit bien set + objets libres (cadre unique), les titans plusieurs sets (plusieurs cadres).
const s = normalizeIdleAdventureStateV47({});
for (const k of Object.keys(IDLE_ADVENTURE_ITEM_CATALOG_V1)) s.itemList[k] = { seen: true };
const slots = idleAdventureSnapshotV47(s, 300).coffreSlots;
const parGroupe = new Map();
for (const x of slots) parGroupe.set(x.groupeNom, (parGroupe.get(x.groupeNom) || new Set()).add(x.set || ""));
assert.ok([...parGroupe.get("Forêt")].includes("forest"));
assert.ok([...parGroupe.get("👹 Objets des titans")].filter(Boolean).length >= 10, "plusieurs sets de titans");
console.log("idle-coffre-cadres-themes-v1: OK (" + lignes.length + " thèmes)");
