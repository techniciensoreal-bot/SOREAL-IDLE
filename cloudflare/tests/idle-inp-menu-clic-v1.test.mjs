import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* INP (Norman, 2026-11-04 : « Interaction to Next Paint 272 ms ») : un clic sur un bouton de menu rend la main au navigateur avant de changer de page (image suivante, puis tâche suivante). */
const nav = readFileSync("cloudflare/public/modules/ui-navigation-v1.js", "utf8");
assert.ok(nav.includes("onclick=\"window.__menuClicIdleV1__('${m.id}')\""), "les boutons de menu passent par __menuClicIdleV1__");
assert.ok(!nav.includes("onclick=\"window.__menuIdleV28__('${m.id}')\""), "plus d'appel direct synchrone depuis les boutons");
const a = nav.indexOf("window.__menuClicIdleV1__=function(id,geste){");
const b = nav.indexOf("Object.assign(REG,{", a);
assert.ok(a > 0 && b > a, "fonction présente");
const appels = [];
const ctx = { window: {}, setTimeout: (f) => { appels.push("timeout"); f(); }, requestAnimationFrame: (f) => { appels.push("image"); f(); } };
ctx.window.__menuIdleV28__ = (id, g) => appels.push("menu:" + id + ":" + (g || ""));
vm.runInNewContext(nav.slice(a, b), Object.assign(ctx, { window: ctx.window }));
ctx.window.__menuClicIdleV1__("combat");
assert.deepEqual(appels, ["image", "timeout", "menu:combat:"], "d'abord une image, puis une tâche, puis le changement de page");
/* sans requestAnimationFrame : immédiat (aucun menu perdu) */
const appels2 = [];
const ctx2 = { window: { __menuIdleV28__: (id) => appels2.push(id) }, setTimeout };
vm.runInNewContext(nav.slice(a, b), ctx2);
ctx2.window.__menuClicIdleV1__("ngu");
assert.deepEqual(appels2, ["ngu"]);
console.log("idle-inp-menu-clic-v1: OK");
