import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, advanceIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-17) : « comme pour le Money Pit, un total de ce que la roue nous a donné : toute l'AP cumulée, etc. ». Totaux cumulés côté serveur (data.rewardsTotal), au-delà des 20 tours de l'historique,
 * conservés par la normalisation, affichés en bandeau sur la page Money Pit & Roue.
 */
const context = { bosses: 100 };
let s = normalizeIdleNguState({}, context, 10_000_000);
s.currencies.gold = 100000;
s = advanceIdleNguState(s, 0, context, 10_000_000);
assert.deepEqual(JSON.parse(JSON.stringify(s.systems.dailySpin.data.rewardsTotal)), { ap: 0, seeds: 0, items: {} }, "totaux vides dès une sauvegarde neuve");

// 40 tours : les totaux gardent tout (l'historique, lui, est borné).
let at = 10_000_000, ap = 0, seeds = 0; const items = {};
for (let i = 0; i < 40; i += 1) {
  const r = applyIdleNguAction(s, { action: "collect", system: "dailySpin" }, context, at);
  const rw = r.result.reward;
  ap += Number(rw.ap) || 0; seeds += Number(rw.seeds) || 0;
  for (const [id, n] of Object.entries(rw.items || {})) items[id] = (items[id] || 0) + n;
  s = r.state; at = r.result.readyAt;
}
const t = s.systems.dailySpin.data.rewardsTotal;
assert.equal(t.ap, ap, "toute l'AP cumulée de la roue : " + ap);
assert.equal(t.seeds, seeds, "toutes les graines cumulées");
assert.deepEqual(JSON.parse(JSON.stringify(t.items)), items, "chaque objet obtenu, en nombre");
assert.ok(s.systems.dailySpin.data.history.length < 40 || t.ap >= 0, "l'historique reste borné, pas les totaux");
assert.equal(s.systems.dailySpin.data.totalSpins, 40);
// survit à une normalisation
const re = normalizeIdleNguState(JSON.parse(JSON.stringify(s)), context, at + 1000);
assert.equal(re.systems.dailySpin.data.rewardsTotal.ap, ap, "totaux gardés par la normalisation");
// sauvegarde d'avant : partent de l'historique disponible
const vieux = JSON.parse(JSON.stringify(s));
delete vieux.systems.dailySpin.data.rewardsTotal;
const rv = normalizeIdleNguState(vieux, context, at + 1000);
const apHist = vieux.systems.dailySpin.data.history.reduce((a, e) => a + (Number(e.reward && e.reward.ap) || 0), 0);
assert.equal(rv.systems.dailySpin.data.rewardsTotal.ap, apHist, "ancienne sauvegarde : depuis l'historique disponible");
// identifiants sûrs seulement
const sale = JSON.parse(JSON.stringify(s));
sale.systems.dailySpin.data.rewardsTotal = { ap: 5, seeds: -3, items: { "ok_1": 2, "<script>": 9, bad: -1 } };
const rs = normalizeIdleNguState(sale, context, at + 1000).systems.dailySpin.data.rewardsTotal;
assert.deepEqual(JSON.parse(JSON.stringify(rs)), { ap: 5, seeds: 0, items: { ok_1: 2 } }, "valeurs négatives et identifiants douteux écartés");

// Page : bandeau sous le bandeau du Money Pit, seulement des lignes réellement obtenues.
const page = readFileSync("cloudflare/public/modules/money-pit-page-v1.js", "utf8");
assert.ok(page.includes("function bandeauRoueIdleV1_(data){") && page.includes("bandeauMoneyPitIdleV1_(pitData)+\n          bandeauRoueIdleV1_(roueData)+"), "bandeau de la roue branché sous celui du Money Pit");
const src = page.slice(page.indexOf("      function bandeauRoueIdleV1_(data){"), page.indexOf("      function libelleRecompenseMetaV206_"));
const ctx = { H: null };
const fab = (total) => {
  const code = "const window={__SOREAL_IDLE_META_HOST_V130__:{formatGrandNombreIdleV70_:(v)=>String(v),idleHtml_:(x)=>String(x)}};" + src + "; bandeauRoueIdleV1_(" + JSON.stringify({ rewardsTotal: total }) + ")";
  return vm.runInNewContext(code, {});
};
const vide = fab({ ap: 0, seeds: 0, items: {} });
assert.ok(vide.includes("Aucun bonus pour l’instant") && !vide.includes("AP"), "rien d'obtenu : phrase d'attente, aucune ligne");
const plein = fab({ ap: 1234, seeds: 50, items: { luckyCharm: 2, poop: 1 } });
assert.ok(plein.includes("+1234 AP") && plein.includes("+50 graines") && plein.includes("2 × Lucky Charm") && plein.includes("1 × crottin"), "AP, graines et objets cumulés");
console.log("idle-roue-totaux-v1: OK");
