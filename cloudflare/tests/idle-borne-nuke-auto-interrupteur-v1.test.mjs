import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-22) : « une possibilité de désactiver le nuke automatique. Un switch par exemple, sur la borne d'arcade ».
 */
const lire = (f) => readFileSync(new URL("../public/" + f, import.meta.url), "utf8");
const CLE = "soreal_idle_auto_nuke_off_v1";
const stock = new Map();
const fen = {
  localStorage: { getItem: (k) => (stock.has(k) ? stock.get(k) : null), setItem: (k, v) => stock.set(k, String(v)), removeItem: (k) => stock.delete(k) }
};
vm.runInNewContext(lire("modules/borne-nuke-auto-v1.js"), { window: fen, localStorage: fen.localStorage });
const M = fen.__SOREAL_IDLE_BORNE_NUKE_AUTO_V1__;
const avec = (n) => ({ systemes: { selloutShop: { purchases: { autoNuker: n } } } });

// Anti-spoil : pas d'interrupteur tant que l'Auto Nuker n'est pas acheté.
assert.equal(M.boutonHtml(avec(0)), "");
assert.equal(M.boutonHtml({ systemes: {} }), "");
assert.ok(M.boutonHtml(avec(1)).includes("bna-sw"), "acheté : l'interrupteur existe");

// Par défaut activé ; un clic le coupe, un second le remet ; la préférence est une clé soreal_idle_ (liée au compte, règle n°6).
assert.equal(M.actif(), true);
assert.ok(M.boutonHtml(avec(1)).includes('class="bna-sw on"') && M.boutonHtml(avec(1)).includes('aria-checked="true"'));
const el = { cl: new Set(["on"]), classList: { toggle(c, v) { v ? el.cl.add(c) : el.cl.delete(c); } }, a: {}, setAttribute(k, v) { el.a[k] = v; } };
M.basculer(el);
assert.equal(stock.get(CLE), "1");
assert.equal(M.actif(), false);
assert.equal(el.cl.has("on"), false);
assert.equal(el.a["aria-checked"], "false");
assert.ok(!M.boutonHtml(avec(1)).includes('class="bna-sw on"'), "un redessin garde l'état coupé");
M.basculer(el);
assert.equal(stock.has(CLE), false);
assert.equal(M.actif(), true);
assert.ok(CLE.startsWith("soreal_idle_"));

// Câblage : la boucle de l'Auto Nuker respecte l'interrupteur ; le pupitre l'affiche ; chargé par la page.
const amorce = lire("modules/ui-amorcage-v1.js");
const garde = amorce.indexOf("__SOREAL_IDLE_BORNE_NUKE_AUTO_V1__.actif()");
assert.ok(garde > 0 && garde < amorce.indexOf("nukerBossIdleV1_(true)"), "la boucle lit l'interrupteur avant de lancer le Nuke");
assert.ok(lire("modules/ui-combat-2-v1.js").includes("__SOREAL_IDLE_BORNE_NUKE_AUTO_V1__.boutonHtml(j)"));
const index = lire("index.html");
assert.ok(index.includes("/modules/borne-nuke-auto-v1.js") && index.includes("/soreal-idle-borne-nuke-auto-v1.css"));
assert.ok(lire("soreal-idle-borne-nuke-auto-v1.css").includes("prefers-reduced-motion"));
console.log("idle-borne-nuke-auto-interrupteur-v1: OK");
