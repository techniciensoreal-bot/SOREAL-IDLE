import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-24) : « Oui, supprime le menu Infinity Cube » ; « le texte d'intro est trop grand, il est coupé à l'écran et le bouton
 * en dessous n'est pas visible ni cliquable — je le veux un gros bouton blanc avec écrit JOUER » ; « le même style pour la Boutique AP que
 * pour la XP Shop, d'une couleur différente (mauve ou vert cyan) ».
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

// --- Infinity Cube : plus aucun menu (l'emplacement du cube reste dans l'Inventaire) ---
assert.ok(!ui.includes("infinityCube"), "aucune trace du menu Infinity Cube dans l'interface");
assert.ok(!ui.includes("nom:'Infinity Cube'"));
assert.match(ui, /rendreSlotCubeInfiniAdventureIdleV1_/, "le cube de l'Inventaire, lui, est conservé");

// --- Premier récit : la carte tient dans l'écran, le corps défile, gros bouton blanc JOUER ---
const carte = css.slice(css.indexOf(".soreal-idle-modal-card-v63{"), css.indexOf("}", css.indexOf(".soreal-idle-modal-card-v63{")));
assert.match(carte, /max-height:calc\(100dvh - 36px\)/);
assert.match(carte, /display:flex;\s*flex-direction:column/);
const corps = css.slice(css.indexOf(".soreal-idle-modal-body-v63{"), css.indexOf("}", css.indexOf(".soreal-idle-modal-body-v63{")));
assert.match(corps, /overflow-y:auto/);
assert.match(corps, /min-height:0/);
assert.match(css, /\.soreal-idle-modal-actions-v63\{\s*flex:0 0 auto;/, "les boutons ne sont jamais poussés hors de l'écran");
assert.match(css, /\.soreal-idle-modal-button-v63\.jouer\{\s*background:#fff;/);
assert.match(ui, /titre:'LE COMMENCEMENT',\s*sousTitre:'\(ACCROCHE-TOI BIEN\)',\s*long:true,\s*bouton:'JOUER',/);
assert.match(ui, /class="soreal-idle-modal-button-v63 '\+\(page\.bouton\?'jouer':'confirm'\)\+'"/);
assert.equal((ui.match(/bouton:'JOUER'/g) || []).length, 1, "seul le premier récit a ce bouton");

// --- Boutique AP : le style de la Boutique EXP, couleur du menu (mauve) ---
assert.match(ui, /sellout:'#8b5cf6'/, "Boutique AP en mauve (Boutique EXP : cyan)");
assert.match(ui, /spendExp:'#0891b2'/);
const ap = ui.slice(ui.indexOf("function pageSelloutShopIdleV1_(j){"), ui.indexOf("function pageRenaissanceIdleV28_(j){"));
for (const classe of ["soreal-idle-exp-shop-v213", "soreal-idle-exp-awning-v213", "soreal-idle-exp-balance-v210", "soreal-idle-exp-tabs-v212", "soreal-idle-exp-tab-v212", "soreal-idle-exp-shelves-v213", "soreal-idle-exp-stat-v210", "soreal-idle-exp-buy-v210"]) {
  assert.ok(ap.includes(classe), "Boutique AP : " + classe);
}
assert.match(ap, /api\.boutiqueCssIdleV1_\(\)/, "CSS partagé avec la Boutique EXP");
assert.match(ui, /window\.__ongletApShopIdleV1__=function\(id\)/, "rayons (onglets) par catégorie");
assert.ok(!ap.includes("soreal-idle-shop-card-v12"), "l'ancienne présentation en cartes plates est retirée");
assert.match(ap, /🔒 Effet pas encore actif/, "les effets inactifs restent signalés");
assert.match(meta, /function idleBoutiqueCssIdleV1_\(\)\{[\s\S]*?var\(--nav-color,#0891b2\)/, "la couleur vient de --nav-color : une seule feuille de style pour les deux boutiques");
assert.match(meta, /const css=idleBoutiqueCssIdleV1_\(\);/, "la Boutique EXP utilise la même fonction");
assert.match(meta, /boutiqueCssIdleV1_:idleBoutiqueCssIdleV1_/);
assert.match(meta, /\.soreal-idle-exp-buy-v210:disabled\{/, "un achat impossible est grisé");

console.log("idle-menus-shops-intro-v1 OK");
