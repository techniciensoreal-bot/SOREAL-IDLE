import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/* Norman (2026-10-04) : plus d'animation « menu actif » sur les boutons du haut de base ; achat « Menus animés » à 40 EXP dans le rayon Toc. */
const ctx = { bosses: 100 };
const s = normalizeIdleNguState({}, ctx, 0);
s.currencies.experience = 100;
const avant = idleNguSnapshot(s, ctx, 0);
assert.deepEqual(avant.expShop.filter((x) => x.id === "menuAnimations").map((x) => [x.nextCost, x.max]), [[40, 1]]);
const r = applyIdleNguAction(s, { action: "buyExpShop", item: "menuAnimations" }, ctx, 1000);
assert.equal(r.state.currencies.experience, 60);
assert.equal(r.state.bonuses.expShop.menuAnimations, 1);
assert.throws(() => applyIdleNguAction(r.state, { action: "buyExpShop", item: "menuAnimations" }, ctx, 2000), /ACHAT_AU_MAXIMUM/);
const p = normalizeIdleNguState({}, ctx, 0); p.currencies.experience = 39;
assert.throws(() => applyIdleNguAction(p, { action: "buyExpShop", item: "menuAnimations" }, ctx, 1000), /EXP_INSUFFISANT/);

const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
assert.ok(rt.includes("menusAnimes:") && rt.includes("expShop.menuAnimations"), "le serveur annonce l'achat");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("function idleMenuAlimenteV1_(id,j){\n        if(!menusAnimesAchetesIdleV1_(j))return false;"), "sans l'achat, aucun bouton n'est animé");
assert.ok(ui.includes("return Boolean(j&&j.menusAnimes===true);"));
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(meta.includes("const IDLE_EXP_TOC_V1=['sortInventory','syncBasicTraining','menuAnimations'];") && meta.includes("menuAnimations:'🎞️ Menus animés'"));
assert.ok(/menuAnimations:'Les boutons du menu du haut s’animent/.test(meta), "explication courte");
console.log("idle-menus-animes-achat-v1: OK");
