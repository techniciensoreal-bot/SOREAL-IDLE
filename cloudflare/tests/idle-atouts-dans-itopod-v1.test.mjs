import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-jeu.css", "utf8");

// Plus de menu « Atouts » à part ni de page dédiée.
assert.ok(!/\{id:'perks',icon/.test(ui), "le menu Atouts n'existe plus");
assert.ok(!/case 'perks':/.test(ui), "plus de route de page perks");
assert.ok(!/if\(id==='perks'\)return pagePerksIdleV1_/.test(meta), "plus de page perks dans le dispatcher");
// Un ancien menu mémorisé 'perks' est redirigé vers l'ITOPOD.
assert.ok(/ancien==='perks'\?'tower'/.test(ui), "menu mémorisé perks -> tower");
// L'annonce de déblocage des Atouts renvoie vers l'ITOPOD.
assert.ok(/IDLE_MENU_PAR_SYSTEME_V1\.perks='tower'/.test(ui));
// Bouton d'accès : visible seulement si le système est débloqué (aucun spoil), bascule sans redessiner.
assert.ok(/const atoutsOuverts=Boolean\(atouts&&atouts\.state&&atouts\.state\.unlocked\)/.test(meta));
assert.ok(/atoutsOuverts\?'<div class="itp-vues">/.test(meta), "bouton conditionné au déblocage");
assert.ok(/atoutsOuverts\?'<div class="itp-vue-atouts"/.test(meta), "vue Atouts absente si verrouillée");
assert.ok(/window\.__itopodVueIdleV1_basculer__=/.test(meta));
// Fond de la boutique rattaché à son propre conteneur (plus à data-menu="perks").
assert.ok(css.includes(".pk-fond{") && !css.includes('[data-menu="perks"]'));
assert.ok(meta.includes("document.querySelector('.pk-fond')"));
console.log("idle-atouts-dans-itopod-v1: OK");
