import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lirePagesMeta } from "./_meta-pages.mjs";

/*
 * Norman (2026-11-05) : « la barre continue à avancer quand on retire l'énergie » (Machine temporelle). Mesuré dans son navigateur après la touche R : +0,76 point pendant les 300 ms d'attente du moteur, puis un recul de 0,43.
 * Le bouton « 0 » arrête la barre au clic (recalcul local) ; la touche R (énergie) / T (magie) envoyait seulement l'action au moteur. La piste passe maintenant à 0 à l'écran AU CLIC, avant l'envoi.
 */
const pages = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8") + lirePagesMeta();
const f = pages.slice(pages.indexOf("window.__tmReprendreLocalIdleV1__=function(ressource){"));
assert.ok(f.length > 100, "fonction présente");
const corps = f.slice(0, f.indexOf("};", f.indexOf("allocSpan")) + 2);
assert.ok(corps.includes("s.state.allocation[ressource]=0;") && corps.includes("recalculerTimeMachineLocalIdleV1_(j,ressource,0);"), "allocation à 0 et recalcul local de la barre, comme le bouton « 0 »");
assert.ok(corps.indexOf("s.state.allocation[ressource]=0;") < corps.indexOf("recalculerTimeMachineLocalIdleV1_"), "l'allocation est posée avant le recalcul");
assert.ok(!/envoyerAllocRapideV1_|__actionMetaV47__/.test(corps), "pas d'envoi au moteur ici : l'action réelle (reclaimResource) part depuis la touche, une seule fois");
const touche = readFileSync("cloudflare/public/modules/ui-aventure-2-v1.js", "utf8");
const i = touche.indexOf("__tmReprendreLocalIdleV1__(ressource)");
const j = touche.indexOf("window.__actionMetaV47__({action:'reclaimResource',resource:ressource})");
assert.ok(i > 0 && j > i, "la barre s'arrête AVANT l'envoi de reclaimResource");
console.log("idle-tm-reprendre-arret-immediat-v1: OK");
