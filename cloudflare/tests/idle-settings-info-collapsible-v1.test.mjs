import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * 2026-09-24 (Norman) : « dans paramètres, Info doit être un menu qui s'ouvre et se ferme, comme le coffre.
 * De base, il doit être fermé et si on ouvre, ça ouvre la liste des infos. »
 * Contrôles sur le source du monolithe (comme les autres tests d'UI de ce dépôt).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

// Fermé par défaut : seule la valeur stockée "1" ouvre le menu (contrairement au Coffre, ouvert tant que rien n'est stocké).
const lecture = ui.slice(ui.indexOf("function idleInfoOuvertV1_()"), ui.indexOf("function toggleInfoOuvertIdleV1_()"));
assert.match(lecture, /getItem\('soreal_idle_info_ouvert_v1'\)==='1'/);
assert.match(lecture, /catch\(e\)\{\s*return false;/, "sans localStorage : fermé");

// Titre cliquable avec chevron et aria-expanded ; la liste n'est rendue que si le menu est ouvert.
const page = ui.slice(ui.indexOf("function pageParametresIdleV28_(j)"), ui.indexOf("function contenuMenuIdleV28_(j)"));
assert.match(page, /soreal-idle-info-titre-v1/);
assert.match(page, /window\.__toggleInfoOuvertIdleV1__\(\)/);
assert.match(page, /aria-expanded="'\+\(infoOuvert\?'true':'false'\)/);
assert.match(page, /\(infoOuvert\?\s*carteSpecialPrizeIdleV1_\(\)\+\s*'<div style="font-size:12px;color:#8b93ab;margin-bottom:10px">Revoir les explications/);
assert.match(page, /Aucune intervention disponible pour l’instant\.<\/div>'\s*\):''\)\+/, "la liste (infos + Norman & Sébastien) est entièrement conditionnée");

// Le titre reprend le style du Coffre.
assert.match(css, /\.soreal-idle-coffre-titre-v1,\s*\.soreal-idle-info-titre-v1,\s*\.soreal-idle-inv-auto-titre-v1\s*\{/);

console.log("idle-settings-info-collapsible-v1: OK");
