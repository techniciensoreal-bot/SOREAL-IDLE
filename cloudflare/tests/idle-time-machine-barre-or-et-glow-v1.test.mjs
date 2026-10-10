import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-03) : (1) « la Time Machine a une barre supplémentaire dans NGU IDLE (en bas), qui tique 1 fois par seconde de base » ; (2) « quand le Money Pit, la roue ou le bonus AP est
 * disponible, le bouton doit glow de façon visible » ; « 1 minute est suffisant » pour la mise à jour du bouton du menu.
 */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");

// --- Barre d'Or de la machine : présente dans la page, cadence = remplissages par seconde (wiki), phase sur l'heure du serveur ---
const ctx = { bosses: 58 };
const T = 5_000_000;
const etat = normalizeIdleNguState({}, ctx, T);
etat.systems.timeMachine.unlocked = true;
etat.systems.timeMachine.data.bestGoldThisRun = 36400;
const window = {
  __SOREAL_IDLE_HEURE_V1__: () => 1_000_000_123, // 1 000 000,123 s : phase = 0,123 s pour une période de 1 s
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat() { return null; },
    idleHtml_: String,
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
    formatGrandNombreIdleV70_: (v) => "#" + v,
    entetePageIdleV28_: () => "",
    rafraichirMenuRacineIdleV28_() {}
  },
  __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: String },
  __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: String }
};
const els = {};
const elBarre = { attrs: {}, className: "", getAttribute(k) { return this.attrs[k] ?? null; }, setAttribute(k, v) { this.attrs[k] = v; if (k === "style") this.style = v; } };
const elLegende = { textContent: "" };
const document = { getElementById() { return null; }, querySelector: (q) => (q === "[data-tm-or-remplissage]" ? elBarre : q === "[data-tm-or-legende]" ? elLegende : q === ".soreal-idle-tm-v1" ? {} : els[q] || null), querySelectorAll: () => [] };
vm.runInNewContext(meta, { window, document });
const api = window.__SOREAL_IDLE_META_V130__;
const page = api.pageSystemeMetaIdleV130_({ systemes: idleNguSnapshot(etat, ctx, T) }, "timeMachine", "Time Machine");
assert.ok(page.includes('data-tm-or-remplissage="1" data-fills="1"'), "barre d'Or présente, 1 remplissage par seconde au niveau 0");
assert.match(page, /animation-duration:1\.0000s;animation-delay:-0\.1230s/, "une seconde par cycle, phase prise sur l'heure du serveur");
assert.ok(page.includes("+#1128400 Or à chaque remplissage · 1 remplissage par seconde"), "légende : Or par remplissage et cadence");
// 50 remplissages par seconde (niveau 49) : l'œil ne suit plus, la barre reste pleine et scintille.
etat.systems.timeMachine.data.speedLevel = 49;
const page50 = api.pageSystemeMetaIdleV130_({ systemes: idleNguSnapshot(etat, ctx, T) }, "timeMachine", "Time Machine");
assert.ok(page50.includes("soreal-idle-tm-or-remplissage-v1 rapide") && page50.includes('data-fills="50"'));
// Mise à jour en place quand la cadence change.
window.__patcherChiffresTimeMachineIdleV1__({ systemes: idleNguSnapshot(etat, ctx, T) });
assert.equal(elBarre.getAttribute("data-fills"), "50");
assert.ok(elBarre.className.includes("rapide"));
assert.match(elLegende.textContent, /50 remplissages par seconde/);
for (const k of ["sorealTmOrV1", "sorealTmOrRapideV1"]) assert.ok(css.includes("@keyframes " + k));

// --- Glow : vérification du menu une fois par minute, glow intérieur (jamais rogné par le défilement du menu) ---
assert.ok(ui.includes("if(maintenantVerif-idleDispoMoneyPitVerifieV1<60000)return;"), "une vérification par minute");
assert.ok(ui.includes("function idleDisponibiliteMoneyPitV1_(j)") && ui.includes("if(cal&&cal.reclamable)return 'calendrier';"), "Money Pit, roue et bonus AP");
assert.ok(css.includes("@keyframes sorealNavDispoV1") && css.includes("inset 0 0 24px 8px var(--dispo-lueur)"), "lueur intérieure forte");
assert.ok(css.includes(".soreal-idle-nav-money-orange-v1"), "couleur du bonus AP");
assert.ok((meta.match(/glow-dispo-v1/g) || []).length >= 3, "les trois boutons prêts de la page brillent");
assert.ok(css.includes("@keyframes sorealBoutonDispoV1"));
console.log("idle-time-machine-barre-or-et-glow-v1 OK");
