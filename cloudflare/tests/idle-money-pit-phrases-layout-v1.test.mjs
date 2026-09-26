import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyIdleNguAction, normalizeIdleNguState } from "../src/idle-ngu-progression.js";

/* Norman (2026-09-26) : Money Pit — « Ton prix » lisible, boutons sous l'image (une moitié chacun), phrases en français, générosité vérifiée sur le wiki. */
const ui = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

// 1. Texte du prix : foncé sur fond jaune (la règle .soreal-idle-offre-v1 le repeignait en jaune pâle)
assert.ok(css.includes(".soreal-idle-offre-v1 .soreal-idle-prize-v206{color:#19160b}"));
assert.equal(css.includes(".soreal-idle-offre-v1 .soreal-idle-note-v4,.soreal-idle-offre-v1 .soreal-idle-prize-v206{color:#e9d9a3}"), false);
assert.ok(ui.includes("background:#f4c83b;color:#19160b"));

// 2. Boutons sous l'image, une moitié de la largeur chacun
const page = ui.slice(ui.indexOf("function pageMoneyPitDailySpinIdleV206_(j){"), ui.indexOf("function pageNguIdleV1_(j){"));
assert.ok(page.includes(".soreal-idle-money-actions-v206{display:flex;gap:8px;max-width:760px;margin:0 auto 14px}"));
assert.ok(page.includes(".soreal-idle-money-action-v206{flex:1 1 0;min-width:0;"), "chaque bouton prend la moitié");
assert.equal(/position:absolute/.test(page), false, "plus de bouton posé sur l'image");
const iImg = page.indexOf('id="sorealIdleMoneyPitImageV209"'), iActions = page.indexOf('<div class="soreal-idle-money-actions-v206">');
const iPit = page.indexOf("Balance ton argent</div>"), iSpin = page.indexOf("Daily Spin!</div>");
assert.ok(iImg > 0 && iActions > iImg && iPit > iActions && iSpin > iPit, "image, puis les deux actions : Puits à gauche, Daily Spin à droite");

// 3. Phrases : les trois messages du wiki traduits, les autres dans le même ton
const src = ui.slice(ui.indexOf("function phraseMoneyPitIdleV1_(entree,j){"), ui.indexOf("function historiqueMoneyPitIdleV206_(pit,roue){"));
const H = { formatGrandNombreIdleV70_: (v, d) => (d ? Number(v).toFixed(d) : String(v)) };
let ygg = null;
const phrase = new Function("window", "systemeMetaParIdIdleV130_", src + "\nreturn phraseMoneyPitIdleV1_;")({ __SOREAL_IDLE_META_HOST_V130__: H }, () => ygg);
assert.equal(phrase({ at: 0, boost: { type: "toughness", strength: 1 }, reward: { ap: 5 } }), "Le Puits rote et recrache un Boost Toughness 1 !");
assert.equal(phrase({ at: 1, boost: { type: "power", strength: 5 }, reward: {} }), "Le Puits rote et recrache un Boost Power 5 !");
assert.equal(phrase({ at: 0, reward: { wandoosLevels: 0, ap: 15 } }), "Le Puits rote… et ça sent affreusement mauvais.");
assert.ok(phrase({ at: 0, reward: { seeds: 10 } }).startsWith("Une énorme graine verte jaillit du Puits"), "graine avant le déblocage : la phrase du wiki, sans nommer le système");
assert.equal(phrase({ at: 0, reward: { seeds: 10 } }).includes("Yggdrasil"), false);
ygg = { unlocked: true };
assert.ok(phrase({ at: 0, reward: { seeds: 10 } }).includes("+10 graines"));
for (const reward of [{ adventureStats: 2 }, { adventureHp: 20 }, { adventureRegen: 0.2 }, { experience: 3 }, { cubePower: 5 }, { wandoosLevels: 1 }]) {
  for (const at of [0, 1]) {
    const p = phrase({ at, reward: { ...reward, ap: 5 } });
    assert.ok(/^Le Puits/.test(p) && !/[A-Za-z]{3,} the |belch/i.test(p), JSON.stringify(reward) + " : " + p);
  }
}
assert.notEqual(phrase({ at: 0, reward: { adventureHp: 20 } }), phrase({ at: 1, reward: { adventureHp: 20 } }), "deux variantes");
assert.equal(phrase({ at: 4, reward: { adventureHp: 20 } }), phrase({ at: 4, reward: { adventureHp: 20 } }), "stable pour un même jet");
assert.ok(page.includes("phraseMoneyPitIdleV1_(derniere.entree,j)") && page.includes("soreal-idle-prize-detail-v1"), "phrase + détail dans « Ton prix »");

// 4. Recharge du Puits : après le k-ième jet, k + 1 heures (wiki Money Pit)
{
  const context = { bosses: 37, bestGold: 0 };
  let state = normalizeIdleNguState({}, context, 1_000_000);
  state.currencies.gold = 1e9;
  state = normalizeIdleNguState(state, context, 1_000_000);
  const a = applyIdleNguAction(state, { action: "moneyPit" }, context, 1_000_000);
  assert.equal(a.result.cooldownHours, 2, "après le premier jet : 2 heures");
  a.state.currencies.gold = 1e7;
  const b = applyIdleNguAction(a.state, { action: "moneyPit" }, context, a.result.nextAt);
  assert.equal(b.result.cooldownHours, 3);
  b.state.currencies.gold = 1e7;
  const c = applyIdleNguAction(b.state, { action: "moneyPit" }, context, b.result.nextAt);
  assert.equal(c.result.cooldownHours, 4);
  assert.throws(() => applyIdleNguAction(a.state, { action: "moneyPit" }, context, a.result.nextAt - 1), /PUITS_EN_RECHARGE/);
}
console.log("idle-money-pit-phrases-layout-v1: OK");
