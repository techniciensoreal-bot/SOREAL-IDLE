import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : l'icône de la boutique ne bouge que dans la boutique ou quand il y a du nouveau ; point rouge sur les nouveaux achats, leurs rayons et le bouton, qui disparaît une fois l'achat vu.
 */
const src = readFileSync("cloudflare/public/modules/boutique-nouveautes-v1.js", "utf8");
const stockage = {};
const fenetre = {};
new Function("window", "localStorage", src)(fenetre, { getItem: (k) => (k in stockage ? stockage[k] : null), setItem: (k, v) => { stockage[k] = String(v); } });
const B = fenetre.__SOREAL_IDLE_BOUTIQUE_V1__;

// Première visite : tout ce qui est déjà en vente est « vu » (aucun point rouge pour un joueur existant).
let rayons = { debuts: ["a", "b"], aventure: ["c"] };
assert.deepEqual(B.nonVus("exp", rayons), {});
assert.equal(B.boutiqueNonVue("exp", rayons), false);
// Un achat apparaît (catalogue enrichi ou déblocage par la progression) : point sur l'achat, le rayon et la boutique.
rayons = { debuts: ["a", "b"], aventure: ["c", "d"], slots: ["e"] };
assert.deepEqual(B.nonVus("exp", rayons), { aventure: ["d"], slots: ["e"] });
assert.equal(B.rayonNonVu("exp", rayons, "aventure"), true);
assert.equal(B.rayonNonVu("exp", rayons, "debuts"), false);
assert.equal(B.boutiqueNonVue("exp", rayons), true);
assert.equal(B.estNouveau("exp", "d"), false, "pas encore ouvert : pas de point sur la carte, le rayon porte le point");
// Ouvrir le rayon : il ne compte plus comme non vu, mais la carte garde son point le temps de la visite.
B.marquerRayon("exp", rayons, "aventure");
assert.equal(B.rayonNonVu("exp", rayons, "aventure"), false);
assert.equal(B.estNouveau("exp", "d"), true);
assert.equal(B.estNouveau("exp", "c"), false);
assert.equal(B.rayonNonVu("exp", rayons, "slots"), true, "l'autre rayon garde son point");
assert.equal(B.boutiqueNonVue("exp", rayons), true);
// Quitter la boutique : les points des cartes disparaissent ; le rayon « slots » reste signalé tant qu'il n'est pas ouvert.
B.reinitialiserVisite();
assert.equal(B.estNouveau("exp", "d"), false);
B.marquerRayon("exp", rayons, "slots");
assert.equal(B.boutiqueNonVue("exp", rayons), false, "tout vu : plus de point sur le bouton");
// Les deux boutiques sont indépendantes.
assert.deepEqual(B.nonVus("ap", { boosts1: ["p"] }), {}, "première visite de la boutique AP");
assert.deepEqual(B.nonVus("ap", { boosts1: ["p", "q"] }), { boosts1: ["q"] });
assert.equal(B.boutiqueNonVue("exp", rayons), false);
// Mémoire effacée : pas de plantage, on repart de zéro sans point.
for (const k of Object.keys(stockage)) delete stockage[k];
assert.deepEqual(B.nonVus("exp", rayons), {});

// Câblage.
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(index.includes('/modules/boutique-nouveautes-v1.js?v=1'));
assert.ok(ui.includes("const classeShopNouveau=nouveautesShop?' soreal-idle-nav-shop-nouveau-v1':'';") && ui.includes("window.__SOREAL_IDLE_BOUTIQUE_V1__.point('Nouveautés dans la boutique')"), "bouton du menu : classe + point");
assert.ok(ui.includes("if(idleMenuActifV28!=='shop'&&window.__SOREAL_IDLE_BOUTIQUE_V1__)window.__SOREAL_IDLE_BOUTIQUE_V1__.reinitialiserVisite();"), "les points des cartes disparaissent quand on quitte la boutique");
assert.ok(ui.includes("B.marquerRayon('ap',parRayonAp,onglet)") && ui.includes("B.estNouveau('ap',item.id)") && ui.includes("B.rayonNonVu('ap',parRayonAp,cle)"), "boutique AP : rayon, carte, onglet");
assert.ok(meta.includes("B.marquerRayon('exp',parRayon,onglet)") && meta.includes("B.rayonNonVu('exp',parRayon,o.id)") && meta.includes("idleExpPointIdleV1_(it.id)") && meta.includes("idleExpPointIdleV1_('res:'+res.id+':'+stat.id)"), "boutique EXP : rayon, cartes, ressources");
assert.ok(ui.includes("✨ EXP Shop'+pointExp+'") && ui.includes("🛍️ Boutique AP'+pointAp+'"), "bascule EXP / AP");
// Animation : l'étoile ne scintille que dans la boutique (active) ou avec du nouveau.
assert.ok(!/\[data-menu-id-v1="shop"\] \.soreal-idle-nav-texte-v2::after\{[^}]*animation:sorealBoutiqueMagieV1/.test(css), "plus d'animation permanente");
assert.ok(css.includes('[data-menu-id-v1="shop"].active .soreal-idle-nav-texte-v2::after') && css.includes('[data-menu-id-v1="shop"].soreal-idle-nav-shop-nouveau-v1 .soreal-idle-nav-texte-v2::after{animation:sorealBoutiqueMagieV1'));
assert.ok(css.includes(".soreal-idle-point-rouge-v1{"));
console.log("idle-boutique-nouveautes-v1: OK");
