import assert from "node:assert/strict";
import fs from "node:fs";
import { IDLE_NGU_DIGGERS, normalizeIdleNguState, applyIdleNguAction, idleNguTimeMachineGrossGoldPerSecond } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-11-08) : « dans Mineurs, quand on clique sur le bouton Maximum, il doit nous mettre au maximum que notre or peut supporter ». « Au maximum » demande le niveau le plus haut possédé avec ajustement (fit) :
 * le moteur ramène le niveau au plus haut dont la consommation d'or, avec celle des autres mineurs au travail, tient dans l'or par seconde brut.
 */
const context = { bosses: 82, bestGold: 1e15 };
let state = normalizeIdleNguState({}, context, 1_000_000);
state.adventure.unlockFlags.diggers = true;
state = normalizeIdleNguState(state, context, 1_000_000);
state.currencies.gold = 1e18;
state.systems.timeMachine.data.bestGoldThisRun = 1e15;
state.systems.timeMachine.data.highestBossEver = 82;
state.systems.timeMachine.data.speedLevel = 50;
const gross = idleNguTimeMachineGrossGoldPerSecond(state);
state = applyIdleNguAction(state, { action: "upgradeDigger", digger: "drop" }, context, 1_000_000).state;
const def = IDLE_NGU_DIGGERS.find((x) => x.id === "drop");
const drain = (l) => (l <= 0 ? 0 : def.drain * Math.pow(def.growth, l - 1));
const d = state.systems.diggers.data.diggers.drop;
d.maxLevel = 400;   // beaucoup plus de niveaux possédés que l'or n'en supporte
let attendu = 0; while (attendu < 400 && drain(attendu + 1) <= gross) attendu += 1;
assert.ok(attendu >= 2 && attendu < 400, "scénario utile : le maximum supporté est entre 2 et 399 (" + attendu + ")");

// sans ajustement : comportement d'avant (le travail au-delà de l'or est refusé)
state = applyIdleNguAction(state, { action: "setDiggerLevel", digger: "drop", level: 1 }, context, 1_000_000).state;
state = applyIdleNguAction(state, { action: "toggleDigger", digger: "drop", active: true }, context, 1_000_000).state;
assert.throws(() => applyIdleNguAction(state, { action: "setDiggerLevel", digger: "drop", level: 400 }, context, 1_000_000), /GPS_INSUFFISANT/, "sans fit : refusé comme avant");

// avec ajustement : le plus haut niveau supporté, et le mineur reste au travail
const r = applyIdleNguAction(state, { action: "setDiggerLevel", digger: "drop", level: 400, fit: true }, context, 1_000_000).state.systems.diggers.data.diggers.drop;
assert.equal(r.runLevel, attendu, "Au maximum = plus haut niveau que l'or par seconde supporte");
assert.equal(r.active, true, "il reste au travail");
assert.ok(drain(r.runLevel) <= gross && drain(r.runLevel + 1) > gross, "un niveau de plus ne passerait plus");

// au repos : même niveau, sans le mettre au travail
const repos = applyIdleNguAction(state, { action: "toggleDigger", digger: "drop", active: false }, context, 1_000_000).state;
const r2 = applyIdleNguAction(repos, { action: "setDiggerLevel", digger: "drop", level: 400, fit: true }, context, 1_000_000).state.systems.diggers.data.diggers.drop;
assert.equal(r2.runLevel, attendu);
assert.equal(r2.active, false);

// une demande plus basse que le supporté n'est pas relevée
const bas = applyIdleNguAction(state, { action: "setDiggerLevel", digger: "drop", level: 2, fit: true }, context, 1_000_000).state.systems.diggers.data.diggers.drop;
assert.equal(bas.runLevel, 2);

// le bouton de la page demande l'ajustement
const page = fs.readFileSync("cloudflare/public/modules/labos-page-v1.js", "utf8");
assert.ok(page.includes("'+max+',true)\"") && page.includes(">Au maximum</button>"), "bouton « Au maximum » : fit demandé");
/* Boutons grisés lisibles (Norman, 2026-11-08) : jamais l'attribut disabled (la règle globale button:disabled{color:#758198!important} grise le texte sur gris) ; classe mn-manque + aria-disabled, sans onclick ; texte clair contrasté */
assert.ok(!/'disabled /.test(page) && !page.includes("?'disabled '"), "aucun bouton de la page n'utilise l'attribut disabled");
assert.equal((page.match(/aria-disabled="true"/g) || []).length, 3, "trois boutons peuvent être indisponibles (−, +, Améliorer) : « Au maximum » reste TOUJOURS cliquable, même posé sur le niveau maximal (Norman, 2026-11-09)");
{
  const bouton = page.slice(page.indexOf("lp-btn\" onclick=\"window.__setDiggerIdleV47__"), page.indexOf(">Au maximum</button>"));
  assert.ok(bouton.includes("'+max+',true)") && !bouton.includes("lp-manque") && !bouton.includes("aria-disabled"), "« Au maximum » : jamais grisé, toujours avec fit");
}
const css = page.match(/\.lp-btn:disabled,\.lp-btn\.lp-manque\{[^}]*\}/)[0];
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const rapport = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
const texte = /color:(#[0-9a-f]{6})/.exec(css)[1], fonds = [...css.matchAll(/(#[0-9a-f]{6})/g)].map((m) => m[1]).filter((x) => x !== texte);
assert.ok(fonds.length >= 2, "fond dégradé");
for (const fond of fonds) assert.ok(rapport(texte, fond) >= 7, "contraste du texte grisé sur " + fond + " : " + rapport(texte, fond).toFixed(1));
// Norman (2026-11-09) : « sur le bouton grisé Améliorer le labo, les écritures sont toujours difficiles à lire, surtout le Qi en rouge » : fond presque noir, contour noir, et les lettres d'unité reprennent la couleur claire du coût (la couleur propre à l'unité, souvent sombre, se perdait).
{
  assert.ok(page.includes("background:linear-gradient(180deg,#26242c,#16151a)"), "fond grisé presque noir");
  assert.ok(page.includes(".lp-btn.lp-manque small .nb-suf,'+P+'.lp-btn:disabled small .nb-suf{color:#ffd978;filter:none"), "lettres d'unité claires sur un bouton grisé, avec la spécificité de la page (P)");
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lm = (h) => 0.2126 * lin(parseInt(h.slice(1, 3), 16)) + 0.7152 * lin(parseInt(h.slice(3, 5), 16)) + 0.0722 * lin(parseInt(h.slice(5, 7), 16));
  const rp = (a, b) => (Math.max(lm(a), lm(b)) + 0.05) / (Math.min(lm(a), lm(b)) + 0.05);
  for (const fond of ["#26242c", "#16151a"]) assert.ok(rp("#ffd978", fond) >= 7, "coût et unités lisibles (" + rp("#ffd978", fond).toFixed(1) + ")");
}
const ui = fs.readFileSync("cloudflare/public/modules/ui-aventure-1-v1.js", "utf8");
assert.ok(ui.includes("function setDiggerIdleV47_(id,niveau,ajuster)") && ui.includes("p.fit=true"), "le client transmet fit au moteur");
console.log("idle-mineurs-au-maximum-v1: OK (niveau supporté " + attendu + ")");
