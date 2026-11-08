import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { instantaneJoueurV1, evenementsV1, IDLE_FLUX_DELAI_TM_OR_MS_V1 } from "../src/idle-flux-v1.js";
import { normalizeIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * « En direct » (Norman, 2026-11-08) : quand un joueur fait des actions dans la Machine temporelle (ajoute de l'Énergie ou de la Magie), le fil dit combien d'Or par seconde elle produit chez lui (« 1,37 Qa d'or par seconde »).
 * Anti-spoil : la phrase n'existe que pour un lecteur qui possède le menu de la machine ; en retirer ne s'annonce pas ; une annonce par minute au plus.
 */
const contexte = { bosses: 82, bestGold: 1e15 };
function etat(energie, magie) {
  let s = normalizeIdleNguState({}, contexte, 1_000_000);
  s.adventure.unlockFlags.timeMachine = true;
  s = normalizeIdleNguState(s, contexte, 1_000_000);
  s.systems.timeMachine.unlocked = true;
  s.systems.timeMachine.data.bestGoldThisRun = 7.75e6;
  s.systems.timeMachine.data.highestBossEver = 120;
  s.systems.timeMachine.data.speedLevel = 60;
  s.systems.timeMachine.data.goldLevel = 400;
  s.systems.timeMachine.allocation = { energy: energie, magic: magie, r3: 0 };
  return s;
}
const inst = (e, m) => instantaneJoueurV1({ stats: { metaNgu: etat(e, m) } });

// Instantané : allocation (entiers) et Or brut par seconde (le même calcul que le menu).
const a0 = inst(0, 0), a1 = inst(5e9, 0);
assert.equal(a0.tmAlloc, 0); assert.equal(a1.tmAlloc, 5e9);
assert.ok(a1.tmGps > 1e9 && Number.isInteger(a1.tmGps), "l'Or par seconde de la machine est lu dans l'état : " + a1.tmGps);
assert.deepEqual([instantaneJoueurV1({ stats: { metaNgu: {} } }).tmAlloc, instantaneJoueurV1({ stats: { metaNgu: {} } }).tmGps], [0, 0], "état vide : zéro, jamais d'erreur");
const verrou = etat(5, 0); verrou.systems.timeMachine.unlocked = false;
assert.equal(instantaneJoueurV1({ stats: { metaNgu: verrou } }).tmGps, 0, "machine verrouillée : 0");

// Événements : ajout seulement, jamais depuis un instantané d'avant ce jalon, jamais à 0 Or par seconde.
const tmOr = (av, ap) => evenementsV1(av, ap, {}).filter((e) => e.type === "tmOr");
assert.deepEqual(tmOr(a0, a1), [{ type: "tmOr", donnees: { gps: a1.tmGps } }], "de l'énergie ajoutée : annonce avec l'or par seconde");
assert.equal(tmOr(a1, a1).length, 0, "rien n'a changé");
assert.equal(tmOr(a1, a0).length, 0, "en retirer ne s'annonce pas");
assert.equal(tmOr(a1, inst(5e9, 3e6)).length, 1, "de la magie ajoutée aussi");
assert.equal(tmOr({ bossMax: 5, succes: [], titans: {}, defis: {}, rebirths: 0 }, a1).length, 0, "ancien instantané : pas de comparaison");
assert.equal(tmOr(a0, Object.assign({}, a1, { tmGps: 0 })).length, 0, "jamais à 0 Or par seconde");
assert.ok(IDLE_FLUX_DELAI_TM_OR_MS_V1 >= 60000, "une annonce par minute au plus");

// Phrases côté lecteur.
const ctx = { window: {}, document: { addEventListener() {}, getElementById: () => null } };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync("cloudflare/public/modules/flux-v1.js", "utf8"), ctx);
const phrase = ctx.window.__SOREAL_IDLE_FLUX_V1__.phrase;
const lecteur = (machine = true) => ({ zones: [], bossMax: 0, connus: { boss: {}, titan: {}, succes: {}, menus: { machine } } });
const dit = (gps, l, moi = false, id = 0) => { const p = phrase({ type: "tmOr", nom: "Saka", id, donnees: { gps }, moi }, l); return p && p.texte; };
assert.match(dit(1.37e15, lecteur()), /^La Machine temporelle de Saka produit 1,37 Qa d’or par seconde$/);
assert.match(dit(1.37e15, lecteur(), true), /^Ta Machine temporelle produit 1,37 Qa d’or par seconde$/);
assert.equal(new Set([0, 1, 2].map((i) => dit(2.5e12, lecteur(), false, i))).size, 3, "trois tournures");
assert.match(dit(2.5e12, lecteur(), false, 1), /2,5 T d’or/, "T par seconde");
// Anti-spoil : sans le menu de la machine, rien ; sans or, rien.
assert.equal(dit(1.37e15, lecteur(false)), null, "lecteur sans Machine temporelle : rien du tout");
assert.equal(dit(0, lecteur()), null, "pas d'or : rien");
// Le formateur du jeu est préféré quand il existe (toutes les unités).
ctx.window.__SOREAL_IDLE_META_HOST_V130__ = { formatGrandNombreIdleV70_: (n) => "FORMAT(" + n + ")" };
assert.match(dit(3e18, lecteur()), /FORMAT\(3000000000000000000\) d’or par seconde/, "formateur du jeu");
console.log("idle-flux-tm-or-par-seconde-v1: OK");
