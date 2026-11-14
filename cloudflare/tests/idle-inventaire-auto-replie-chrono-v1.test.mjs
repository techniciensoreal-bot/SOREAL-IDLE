import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Norman (2026-11-14) : « quand le menu auto merge et auto boost est replié, on doit quand même voir les compteurs de temps pour la prochaine exécution ». */
const src = readFileSync(new URL("../public/modules/inventory-auto-v1.js", import.meta.url), "utf8");
const m = src.match(/function barreAuto\(j,compact,bascule\)\{[\s\S]*?\n  \}\n  \/\*\n   \* Bloc replié/);
assert.ok(m, "barreAuto trouvée");
const corps = m[0].replace(/\n  \/\*\n   \* Bloc replié$/, "");
let minuteursLances = 0;
const ctx = {
  window: {}, performance: { now: () => 1000 },
  snap: (j) => j.snap, voulu_: (_c, v) => v, entier: (v) => Math.floor(Number(v) || 0),
  dureeMin: (s) => (s >= 60 ? Math.ceil(s / 60) + " min" : s + " s"), duree: (s) => s + " s", minuteurAuto: () => { minuteursLances += 1; }, html: (v) => String(v)
};
vm.runInNewContext(corps + "; this.barreAuto = barreAuto;", ctx);
const etat = (unlocked, cases) => ({ snap: { unlocked, settings: { autoMerge: cases, autoBoost: cases }, intervalSeconds: 60, mergeRemainingSeconds: 125, boostRemainingSeconds: 40 } });

// Replié (compact) : les cases ET les compteurs de la prochaine exécution.
let h = ctx.barreAuto(etat({ autoMerge: true, autoBoost: true }, true), true);
assert.equal((h.match(/ic-chrono/g) || []).length, 2, "replié : un compteur par case cochée");
assert.ok(h.includes("⏱ ") && !h.includes("prochain dans"), "replié : forme courte (⏱ + durée)");
assert.ok(h.includes('data-rest="125"') && h.includes('data-rest="40"') && h.includes('data-idle-auto-v1="1"'), "replié : compteurs vivants (mis à jour par le minuteur)");
assert.ok(minuteursLances >= 1, "replié : le minuteur de mise à jour est lancé");
// Une case décochée n'a pas de compteur ; un système non débloqué n'apparaît pas du tout.
h = ctx.barreAuto(etat({ autoMerge: true, autoBoost: true }, false), true);
assert.equal((h.match(/ic-chrono/g) || []).length, 0, "case décochée : pas de compteur");
h = ctx.barreAuto(etat({ autoMerge: true, autoBoost: false }, true), true);
assert.ok(h.includes("Merge") && !h.includes("Boost") && (h.match(/ic-chrono/g) || []).length === 1, "seul ce qui est débloqué apparaît (anti-spoil)");
// Ouvert : toujours « prochain dans ».
h = ctx.barreAuto(etat({ autoMerge: true, autoBoost: true }, true), false, "");
assert.ok(h.includes("prochain dans") && (h.match(/ic-chrono/g) || []).length === 2, "ouvert : « prochain dans » conservé");
console.log("idle-inventaire-auto-replie-chrono-v1 : OK");
