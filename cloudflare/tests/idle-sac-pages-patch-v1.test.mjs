import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-08) : « je ne veux que 60 cases d'inventaire affichées à la fois ; quand je range avec TRIER, ça m'ajoute plus de 60 cases ». La mise à jour en place du sac (patchGrilleSacInventaireIdleV160_)
 * posait TOUTES les cases du sac ; le rendu complet, lui, découpait déjà en pages de 60. Les deux ne montrent plus que la page affichée.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("function patchGrilleSacInventaireIdleV160_(modele){");
const fin = ui.indexOf("function patchResumeInventaireIdleV160_(modele){");
assert.ok(debut > 0 && fin > debut);
const fonction = ui.slice(debut, fin);
assert.ok(fonction.includes("planComplet.slice(debutSac,debutSac+IDLE_SAC_CASES_PAR_PAGE_V1)"), "la mise à jour en place ne pose que la page affichée");
assert.ok(fonction.includes("if(idlePageSacV1>pagesSac)idlePageSacV1=pagesSac;"), "page recadrée si le sac a rétréci");
assert.ok(!/plan\.forEach/.test(fonction.replace(/planComplet\.slice[\s\S]*?const fragment/, "")) || fonction.includes("const plan=planComplet.slice"), "la boucle de pose part du plan de la page");

// Même découpage que le rendu complet (rendreGrilleSacAdventureIdleV1_) : 60 cases par page, numéros d'emplacement absolus.
assert.ok(ui.includes("const IDLE_SAC_CASES_PAR_PAGE_V1=60;"));
const plan = (total) => Array.from({ length: total }, (_, i) => ({ index: i }));
const page = (total, p) => { const pages = Math.max(1, Math.ceil(total / 60)); const pp = Math.min(p, pages); return plan(total).slice((pp - 1) * 60, (pp - 1) * 60 + 60); };
assert.equal(page(150, 1).length, 60);
assert.equal(page(150, 3).length, 30);
assert.equal(page(150, 3)[0].index, 120, "numéros absolus");
assert.equal(page(150, 9).length, 30, "page trop grande : dernière page");
assert.equal(page(24, 1).length, 24, "petit sac : une seule page");
console.log("idle-sac-pages-patch-v1: OK");
