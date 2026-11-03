import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * Audit « valeur libre périmée » (Norman, 2026-11-03 : « le bouton CAP de Wandoos ne place pas toute mon énergie ; c'est peut-être ce qui arrive aussi dans d'autres menus »).
 * La page ne doit jamais BORNER une demande de placement avec une valeur lue dans la dernière synchro du moteur (systemes.*View, resourceBudget.available, r3 qui n'avance pas entre deux
 * synchros, argent d'un bouton) : le moteur borne déjà (allocate : précédent + libre réel). Gardes : (1) « Max » des menus génériques (Hacks, Barbes...) avec une r3 libre périmée à 0 ;
 * (2) la lecture « Magie disponible » d'Yggdrasil est la magie VIVANTE ; (3) le bouton « Creuser plus profond » des Mineurs n'est jamais `disabled` pour un manque d'Or lu dans la synchro ;
 * (4) aucun module de placement ne lit énergieLibre/magieLibre d'une vue pour borner.
 */
const lire = (p) => readFileSync("cloudflare/public/" + p, "utf8");

// (1) Max générique, au vrai moteur.
const context = { bosses: 120, bestGold: 1e9, adventurePower: 1e12 };
const now = 100_000_000;
let state = normalizeIdleNguState({}, context, now);
state.systems.hacks.unlocked = true;
state.resources.r3.cap = 1e6;
state.resources.r3.current = 7777;      /* ce que le moteur possède réellement */
state = normalizeIdleNguState(state, context, now);
const actions = [];
const f = {
  document: { getElementById: () => null, querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, hidden: false },
  setInterval: () => 1,
  __actionMetaIdleV130__: (p) => actions.push(JSON.parse(JSON.stringify(p))),
  __lireMontantAugmentIdleV1__: () => 125,
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat: () => ({
      energie: 0, energieMax: 0,
      systemes: { resources: { r3: { current: 0, cap: 1e6 } }, systems: [{ id: "hacks", state: { allocation: { r3: 1000 } } }] }
    })
  }
};
f.window = f;
vm.runInNewContext(lire("modules/barre-allocation-v1.js"), f, { filename: "barre-allocation-v1.js" });
f.__SOREAL_IDLE_ALLOC_V1__.ajuster("hacks", "r3", "max");
assert.equal(actions.length, 1, "Max envoie toujours sa demande (r3 libre lue à 0 dans une synchro périmée)");
assert.ok(actions[0].value >= 1e6, "Max demande le plafond de la ressource, pas courant + libre périmé : " + actions[0].value);
state.systems.hacks.allocation.r3 = 1000;
state.resources.r3.current = 7777;
state = applyIdleNguAction(state, actions[0], context, now).state;
assert.equal(state.systems.hacks.allocation.r3, 1000 + 7777, "le moteur place tout ce qui est réellement libre (aucun reliquat)");
assert.equal(state.resources.r3.current, 0);

// (2) Yggdrasil : la magie disponible est la magie vivante.
const amorcage = lire("modules/ui-amorcage-v1.js");
const iDisp = amorcage.indexOf("window.__SOREAL_IDLE_DISPONIBLE_V2__=function");
const blocDisp = amorcage.slice(iDisp, iDisp + 900);
assert.ok(/magie:r\?Math\.max\(0,idleNombre_\(r\.current\)\)/.test(blocDisp), "magie disponible = resources.magic.current (vivante), pas resourceBudget.available (instantané)");

// (3) Mineurs : pas de `disabled` pour un manque d'Or lu dans la synchro.
const mineurs = lire("modules/mineurs-page-v1.js");
assert.ok(!/!abordable\?'disabled/.test(mineurs), "le bouton d'amélioration n'est pas désactivé par un Or périmé");
assert.ok(/mn-manque/.test(mineurs) && mineurs.includes(".mn-btn.mn-manque"), "manque d'Or : grisé mais cliquable");

// (4) Garde générale : aucune borne de placement par une vue périmée.
for (const nom of readdirSync("cloudflare/public/modules").filter((n) => n.endsWith(".js"))) {
  const code = lire("modules/" + nom);
  if (/Math\.min\([^;\n]*\.(energieLibre|magieLibre)\b/.test(code) || /Math\.min\([^;\n]*vue\[cleLibre\]/.test(code)) {
    assert.fail(nom + " borne un placement avec energieLibre/magieLibre d'une vue périmée (utiliser la valeur vivante, le moteur borne)");
  }
}
const wandoos = lire("modules/wandoos-retro-v1.js");
assert.ok(wandoos.includes("libreVivante_(j,res,"), "Wandoos lit l'énergie / magie libre VIVANTE");
assert.ok(!/var libre=Math\.max\(0,nb_\(e\.vue\[cleLibre\]\)\),actuelle/.test(wandoos), "Wandoos ne lit plus la vue périmée pour borner");
console.log("idle-allocation-libre-vivante-v1: OK");
