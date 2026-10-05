import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-05) : « plus jamais de barre qui fait marche arrière ni de temps d'arrêt pour valider un niveau pendant que le calcul de l'Or se fait ». Étape 1 : un journal qui NOTE ces défauts
 * quand ils se produisent chez le joueur (modules/diag-fluidite-v1.js). Ce test rejoue des images successives de l'écran sur un faux document.
 */
const src = readFileSync("cloudflare/public/modules/diag-fluidite-v1.js", "utf8");
let maintenant = 1_000_000;
const stockage = {};
const etat = { systemes: { currencies: { gold: 1000 } } };
const ecran = { niv: 3, f: 0.5, eta: "Niveau suivant dans 5 s" };
const racine = {
  querySelectorAll: () => [{ getAttribute: () => "scissors:main", __f: () => ecran.f }],
  querySelector: (sel) => {
    if (sel.includes("data-idle-aug-niv-v1")) return { textContent: String(ecran.niv) };
    if (sel.includes("data-idle-aug-eta-v1")) return { textContent: ecran.eta };
    return null;
  }
};
const barre = racine.querySelectorAll()[0];
const DateReelle = Date;
const FauxDate = function (...a) { return new DateReelle(...a); };
FauxDate.now = () => maintenant;
const ctx = {
  console,
  Date: FauxDate,
  localStorage: { getItem: (k) => stockage[k] ?? null, setItem: (k, v) => { stockage[k] = v; } },
  document: { hidden: false, querySelector: () => racine, getElementById: () => null },
  navigator: {},
  setInterval: () => 0,
  window: null
};
ctx.window = {
  __SOREAL_IDLE_LIRE_ETAT_V1__: () => etat,
  getComputedStyle: () => ({ transform: "matrix(" + ecran.f + ",0,0,1,0,0)" })
};
ctx.window.window = ctx.window;
Object.assign(ctx.window, { localStorage: ctx.localStorage, document: ctx.document, Date: ctx.Date });
vm.createContext(ctx);
vm.runInContext(src, ctx);
// le script lit window.getComputedStyle comme global : on l'expose aussi au niveau racine
ctx.getComputedStyle = ctx.window.getComputedStyle;
const D = ctx.window.__SOREAL_IDLE_DIAG_V1__;
const pas = (ms) => { maintenant += ms; D.echantillon(); };

// 1. Évolution normale : aucun défaut noté.
pas(200); ecran.f = 0.6; pas(200); ecran.f = 0.9; pas(200); ecran.niv = 4; ecran.f = 0.05; pas(200); ecran.f = 0.2; pas(200);
assert.equal(D.journal().length, 0, "évolution normale : rien noté");

// 1 bis. La barre repart de zéro un instant avant le numéro de niveau (moins d'une image d'écart) : normal, rien noté.
ecran.f = 0.97; pas(200); ecran.f = 0.04; pas(200); ecran.niv = 5; ecran.f = 0.1; pas(200);
assert.equal(D.journal().length, 0, "écart de moins de 0,4 s entre barre et niveau : rien noté");

// 1 ter. Validation tardive : la barre repart, le niveau ne change que 0,6 s plus tard.
maintenant += 6000; ecran.f = 0.98; pas(200); ecran.f = 0.03; pas(200); pas(200); pas(200); ecran.niv = 6; pas(200);
assert.equal(D.journal().filter((e) => e.type === "validation_tardive").length, 1, "validation_tardive notée");

// 2. Barre qui recule sans que le niveau monte (rien dans la seconde et demie qui suit).
maintenant += 6000; ecran.f = 0.7; pas(200); ecran.f = 0.45; pas(200);
for (let i = 0; i < 9; i += 1) pas(200);
assert.equal(D.journal().filter((e) => e.type === "barre_recule").length, 1, "barre_recule noté");

// 3. Niveau affiché qui baisse.
maintenant += 6000; ecran.niv = 4; ecran.f = 0.3; pas(200); ecran.niv = 3; pas(200);
assert.equal(D.journal().filter((e) => e.type === "niveau_recule").length, 1, "niveau_recule noté");

// 4. Or rendu : dépense locale puis remontée proche du montant.
maintenant += 6000; etat.systemes.currencies.gold = 1000; pas(200); etat.systemes.currencies.gold = 400; pas(200); etat.systemes.currencies.gold = 990; pas(200);
const rendu = D.journal().filter((e) => e.type === "or_remonte");
assert.equal(rendu.length, 1, "or_remonte noté");
assert.equal(rendu[0].depense, 600);

// 5. Petite hausse de revenu normale (moins du quart de la dépense) : pas un défaut.
maintenant += 20000; etat.systemes.currencies.gold = 5000; pas(200); etat.systemes.currencies.gold = 4000; pas(200); etat.systemes.currencies.gold = 4050; pas(200);
assert.equal(D.journal().filter((e) => e.type === "or_remonte").length, 1, "revenu normal : pas noté");

// 6. Pause de validation : barre pleine plus de 2,5 s sans « il manque ».
maintenant += 20000; ecran.niv = 8; ecran.f = 1; ecran.eta = "Niveau suivant dans 0 s"; pas(200);
for (let i = 0; i < 16; i += 1) pas(200);
assert.equal(D.journal().filter((e) => e.type === "pause_validation").length, 1, "pause_validation notée");

// 7. Barre pleine faute d'Or : attente normale, rien noté.
maintenant += 20000; ecran.niv = 9; ecran.eta = "⏳ Barre pleine : il manque 1,2K Or pour le niveau suivant."; ecran.f = 1; pas(200);
for (let i = 0; i < 20; i += 1) pas(200);
assert.equal(D.journal().filter((e) => e.type === "pause_validation").length, 1, "attente d'Or : pas une pause à signaler");

// Journal : texte lisible, enregistré sur l'appareil, jamais plus de 80 lignes.
assert.ok(D.texte().startsWith("Journal de fluidité — "));
assert.ok(JSON.parse(stockage["soreal_idle_diag_v1"]).length >= 4);
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(index.includes("/modules/diag-fluidite-v1.js"), "module chargé par la page");
assert.ok(readFileSync("cloudflare/public/modules/bug-report-v1.js", "utf8").includes("Journal de fluidité"), "bouton dans Réglages (administrateur)");
assert.ok(!/fetch\(|XMLHttpRequest|google\.script\.run|sendBeacon/.test(src), "rien n'est envoyé : le journal reste sur l'appareil");
console.log("idle-diag-fluidite-v1: OK");
