import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Audit fluidité global (2026-11-02). Fige les optimisations de la couche globale :
 *  - tick de jeu plafonné à 60 Hz (écran 120 Hz : une image sur deux) ; les planchers 30 / 15 Hz restent ;
 *  - morph : pas de copie d'attributs ni de remontée « closest » par nœud (seulement si un attribut est à retirer) ;
 *  - barre de vie du bandeau : aucune écriture identique (mutation + invalidation de style inutiles) ;
 *  - mode économe : classe soreal-mode-eco (APK ou tactile petit écran) qui ne touche qu'à la réactivité du toucher.
 */
const lire = (p) => readFileSync(p, "utf8");

const boucle = lire("cloudflare/public/modules/ui-boucle-v1.js");
assert.ok(boucle.includes("const INTERVALLE_TICK_PLAFOND_MS_V1=15;"), "plafond du tick");
assert.ok(boucle.includes("if(coutTickMsV1<4.5)return INTERVALLE_TICK_PLAFOND_MS_V1;"), "le tick rapide est plafonné (plus de return 0)");
assert.ok(!/if\(coutTickMsV1<4\.5\)return 0;/.test(boucle), "plus de tick à chaque image d'un écran 120 Hz");
assert.ok(boucle.includes("if(coutTickMsV1<9)return 1000/30-3;"), "plancher 30 Hz conservé");
// 60 Hz : la gigue d'un rAF à 60 Hz (16,7 ms ±1) reste au-dessus du plafond de 15 ms ; 120 Hz (8,3 ms) saute une image.
assert.ok(16.7 - 1.5 >= 15 && 8.4 < 15 && 8.4 * 2 >= 15);

const morph = lire("cloudflare/public/modules/morph-v1.js");
assert.ok(!morph.includes("Array.prototype.slice.call(a.attributes)") && !morph.includes("Array.prototype.slice.call(b.attributes)"), "pas de copie des attributs par nœud");
assert.ok(morph.includes("if(aRetirer&&!(a.closest&&a.closest('[data-morph-vivant]')))"), "closest seulement si un attribut est à retirer");
assert.ok(morph.includes("window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__"), "attributs gardés conservés (règle n°4)");
assert.ok(morph.includes("data-morph-classes-gardees") && morph.includes("data-morph-garder"), "règle n°4 conservée");

const menus = lire("cloudflare/public/modules/ui-menus-v1.js");
const pv = menus.slice(menus.indexOf("function majHudPvIdleV2_("), menus.indexOf("function jumeauxClicIdleV1_"));
assert.ok(pv.includes("if(bar.style.transform!==transformVoulu)bar.style.transform=transformVoulu;"), "pas d'écriture identique du transform");
assert.ok(pv.includes("if(bar.dataset.idlePctHudV1!==pctTexte)bar.dataset.idlePctHudV1=pctTexte;"), "pas d'écriture identique du pourcentage");

const eco = lire("cloudflare/public/modules/effets-legers-v1.js");
assert.ok(eco.includes("soreal-mode-eco") && eco.includes("touch-action:manipulation") && eco.includes("-webkit-tap-highlight-color:transparent") && eco.includes("overscroll-behavior:none"), "mode économe");
assert.ok(/EST_APK\)return true/.test(eco), "l'APK est toujours en mode économe");
assert.ok(!/animation:\s*none/.test(eco.slice(eco.indexOf("function appareilEconome"), eco.indexOf("style();appliquer();"))), "le mode économe ne coupe aucune animation");

console.log("idle-fluidite-global-v1: OK");
