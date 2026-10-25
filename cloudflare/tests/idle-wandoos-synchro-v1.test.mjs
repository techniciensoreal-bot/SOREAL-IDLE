import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lireSrc } from "./_src-sources.mjs";
import { lirePagesMeta } from "./_meta-pages.mjs";
import { normalizeIdleNguState, idleNguSnapshot, applyIdleNguAction, IDLE_NGU_EXP_SHOP_V1 } from "../src/idle-ngu-progression.js";

/* « Synchro Wandoos » (Norman, 2026-10-23) : rayon Toc, 25 EXP de plus que la Synchro Basic Training, interrupteur de métal sur le clavier de Wandoos. */
assert.equal(IDLE_NGU_EXP_SHOP_V1.syncWandoos.cost(0), IDLE_NGU_EXP_SHOP_V1.syncBasicTraining.cost(0) + 25, "25 EXP de plus que la Synchro Basic Training");
assert.equal(IDLE_NGU_EXP_SHOP_V1.syncWandoos.max, 1);
const ctx = { bosses: 100 };
let etat = normalizeIdleNguState({}, ctx, 1_000_000);
etat.currencies.experience = 500;
assert.equal(idleNguSnapshot(etat, ctx, 2_000_000).bonuses.wandoosSync, false);
etat = applyIdleNguAction(etat, { action: "buyExpShop", item: "syncWandoos", quantity: 1 }, ctx, 0).state;
assert.equal(idleNguSnapshot(etat, ctx, 2_000_000).bonuses.wandoosSync, true);
assert.ok(lireSrc("idle-runtime-etat.js").includes("wandoosSynchro:"), "drapeau annoncé au client");

const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8") + lirePagesMeta();
assert.ok(meta.includes("syncWandoos:'🔗 Synchro Wandoos'") && meta.includes("const IDLE_EXP_TOC_V1=['sortInventory','syncBasicTraining','syncWandoos','menuAnimations'];"));
assert.ok(/syncWandoos:'wandoos'/.test(meta), "anti-spoil : l'achat n'apparaît qu'avec Wandoos découvert");

const w = readFileSync("cloudflare/public/modules/wandoos-retro-v1.js", "utf8");
assert.ok(w.includes('role="switch"') && w.includes("wd-lampe") && w.includes(">Sync<"), "interrupteur, loupiote, libellé « Sync »");
assert.ok(w.includes("placerUn_('energy',mode,charges);placerUn_('magic',mode,charges);"), "0, −, + et CAP agissent sur l'énergie ET la magie");
assert.ok(w.includes("synchroAchetee(j))return ''"), "sans achat, aucun interrupteur");
assert.ok(/\.wd-sw\[aria-checked="true"\] \.wd-sw-manette\{transform:translateY\(0\)/.test(w), "la manette monte pour activer");
assert.ok(/\.wd-sw\[aria-checked="true"\]~\.wd-lampe\{background:radial-gradient\(circle at 35% 30%,#d8ffd8/.test(w), "loupiote verte allumée, rouge sinon");
assert.ok(w.includes("soreal_idle_wandoos_synchro_v1"), "réglage lié au compte");
assert.ok(w.includes("if(!j.wandoosSynchro){try{localStorage.removeItem(CLE_SYNCHRO);}catch(_e){}}"), "éteint à l'achat : le réglage est effacé tant que l'achat n'est pas fait");
console.log("idle-wandoos-synchro-v1 OK");
