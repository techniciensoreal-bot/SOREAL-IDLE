import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Effets visuels du combat (Norman, 2026-10-04) : un effet par attaque sur l'image du mob/titan, des croix vertes pendant un soin, du sang qui coule sur la barre de vie quand le titan fait saigner.
 */
const fx = readFileSync("cloudflare/public/modules/combat-effets-v1.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");

for (const classe of ["cfx-coup", "cfx-fort", "cfx-perce", "cfx-ultime", "cfx-degats", "cfx-puissante", "cfx-bloc", "cfx-aura", "cfx-eclair", "cfx-spore", "cfx-croix", "cfx-goutte", "cfx-saigne", "cfx-mob-para"])
  assert.ok(fx.includes(classe), "effet : " + classe);
assert.ok(fx.includes("prefers-reduced-motion"), "mouvement réduit respecté");
assert.ok(fx.includes("MAX_EFFETS"), "nombre d'effets plafonné");
assert.ok(fx.includes("'✚'"), "croix vertes du soin");

// Branchements : coups du joueur (un effet par attaque), attaques du titan, soin, états qui durent.
assert.ok(ui.includes("({strong:'fort',piercing:'perce',ultimate:'ultime'})[def&&def.id]||'coup'"), "un effet par attaque manuelle");
assert.ok(ui.includes("fxIdleV1_('mob','coup',idleEntier_(degats))"), "coup d'Idle");
assert.ok(ui.includes("fxIdleV1_('joueur',fxTypeAttaque,"), "attaque ennemie sur la barre du joueur");
assert.ok(ui.includes("fxIdleV1_('joueur','soin','+'+soigne)") && ui.includes("idleAdventureManualStateV3.hyperRegenUntil"), "soin et hyper-régénération");
assert.ok(ui.includes("saigne:tit?tit.saignements:0"), "saignement visible");
assert.ok(ui.includes("fxEtatsIdleV1_(fight,maintenantTick)") && ui.includes("fxEtatsIdleV1_(null,maintenantTick)"), "états rafraîchis, éteints hors combat");
assert.ok(/if\(!fx\)return;\s*try\{fx\.jouer/.test(ui), "jamais bloquant");
assert.ok(index.includes("/modules/combat-effets-v1.js?v=2"));
console.log("idle-combat-effets-v1: OK");
