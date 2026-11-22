import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { IDLE_COOKING_INGREDIENTS_V1, idleCookingIndicesRepasV1, idleCookingAjouterNomsV1 } from "../src/idle-cooking-noms-v1.js";

/*
 * Cuisine (CookingController, IL et scène du build 1260, 2026-11-22) : gain d'EXP total affiché +(100 + repas mangés) % plafonné à 300 %, nom / quantité / unité de chaque ingrédient
 * (20 noms de scène, 8 tirés par plat, quantité = multiplicateur d'unité x niveau), plus de garde « gain non documenté ».
 * Quêtes (BeastQuestController::updateText) : « x % de récompenses (travailleur acharné) », « QP Reward Modifier », « Quest Item Drop Modifier ».
 */

// ---------- noms des ingrédients ----------
{
  assert.equal(IDLE_COOKING_INGREDIENTS_V1.length, 20, "20 ingrédients dans la scène");
  assert.equal(new Set(IDLE_COOKING_INGREDIENTS_V1.map((i) => i.nom)).size, 20, "noms distincts");
  const unite = (nom) => IDLE_COOKING_INGREDIENTS_V1.find((i) => i.nom === nom);
  assert.deepEqual([unite("Hot Sauce").unite, unite("Hot Sauce").facteur], ["ml", 50], "50 ml par niveau");
  assert.deepEqual([unite("Lobster").unite, unite("Lobster").facteur], ["Kg", 1]);
  assert.deepEqual([unite("Rice").unite, unite("Rice").facteur], ["Cups", 2], "2 Cups par niveau");
  for (let repas = 0; repas < 200; repas++) {
    const idx = idleCookingIndicesRepasV1(repas);
    assert.equal(idx.length, 8);
    assert.equal(new Set(idx).size, 8, "tirage sans remise (repas " + repas + ")");
    assert.deepEqual(idleCookingIndicesRepasV1(repas), idx, "déterministe : même repas, mêmes noms");
  }
  assert.notDeepEqual(idleCookingIndicesRepasV1(1), idleCookingIndicesRepasV1(2), "un autre repas change les ingrédients");
  const snap = {
    data: {
      hasMeal: true, mealNumber: 7,
      ingredients: Array.from({ length: 8 }, (_, i) => ({ index: i, unlocked: i < 6, level: 0 }))
    }
  };
  idleCookingAjouterNomsV1(snap);
  assert.ok(snap.data.ingredients.slice(0, 6).every((i) => i.nom && i.unite && i.facteur > 0), "noms pour les emplacements débloqués");
  assert.ok(snap.data.ingredients.slice(6).every((i) => i.nom === undefined && i.unite === undefined), "un emplacement verrouillé n'a ni nom ni unité (règle n°2)");
  assert.equal(new Set(snap.data.ingredients.slice(0, 6).map((i) => i.nom)).size, 6);
}

// ---------- page Cooking ----------
const hote = {
  idleHtml_: (v) => String(v == null ? "" : v),
  entetePageIdleV28_: (t, s) => "<h1>" + t + "</h1><p>" + s + "</p>"
};
const fenCuisine = { __SOREAL_IDLE_META_HOST_V130__: hote, __SOREAL_IDLE_META_V130__: { systemeMetaParIdIdleV130_: (j, id) => j.systemes.systems.find((s) => s.id === id) || null, actionMetaIdleV130_() {} } };
fenCuisine.window = fenCuisine;
vm.runInNewContext(readFileSync("cloudflare/public/modules/cooking-v1.js", "utf8"), fenCuisine);
const cuisine = (data) => fenCuisine.__SOREAL_IDLE_COOKING_V1__.page({
  systemes: { systems: [{ id: "cooking", state: { unlocked: true, data: Object.assign({
    levelMin: 0, levelMax: 20, mealNumber: 3, efficiencyPct: 50, totalCookingBonusesPct: 100, mealExpGainPct: 12, totalExpGainPct: 0, mealsEaten: 0, hasMeal: true,
    bonuses: { gearPieces: [], gearMultiplier: 1 }, timer: { ready: true, readyInMs: 0, mealMs: 86400000, capMs: 172800000, bankedMs: 0 },
    ingredients: [{ index: 0, unlocked: true, level: 3, nom: "Hot Sauce", unite: "ml", facteur: 50 }, { index: 1, unlocked: true, level: 2, nom: "Rice", unite: "Cups", facteur: 2 }, { index: 2, unlocked: true, level: 1 }, { index: 3, unlocked: false, level: 0 }]
  }, data) } }] }
});
{
  let h = cuisine({});
  assert.ok(h.includes("Hot Sauce") && h.includes("<b>150</b> ml"), "50 ml x niveau 3 = 150 ml");
  assert.ok(h.includes("Rice") && h.includes("<b>4</b> Cups"), "2 Cups x niveau 2 = 4 Cups");
  assert.ok(h.includes("Ingrédient n°3"), "repli sans nom du serveur");
  assert.ok(!h.includes("Ingrédient n°4"), "emplacement verrouillé : rien (règle n°2)");
  assert.ok(/Gain d’EXP total<b>\+100,00 %/.test(h), "aucun repas mangé : +100 % (expBonus = 1 au départ)");
  h = cuisine({ totalExpGainPct: 60 });
  assert.ok(/Gain d’EXP total<b>\+160,00 %/.test(h), "+(100 + 60) %");
  h = cuisine({ totalExpGainPct: 250 });
  assert.ok(/Gain d’EXP total<b>\+300,00 %/.test(h), "plafonné à 300 %");
  assert.ok(!/non documenté/.test(h) && !h.includes("pas encore disponible"), "plus de garde « gain non documenté »");
  assert.ok(h.includes("onclick=\"window.__cuisineMangerIdleV1__()\""), "Manger actif quand le repas existe et que la minuterie est prête");
  h = cuisine({ hasMeal: false, mealExpGainPct: null });
  assert.ok(/<button[^>]* disabled>🍽️ Manger !<\/button>/.test(h), "sans repas : Manger désactivé, sans mention « non documenté »");
}

// ---------- page Questing ----------
const fenQuetes = {
  __SOREAL_IDLE_META_HOST_V130__: Object.assign({ idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)), formatGrandNombreIdleV70_: (v) => String(Math.floor(Number(v) || 0)), idleNombre_: (v) => Number(v) || 0 }, hote),
  __SOREAL_IDLE_META_V130__: { systemeMetaParIdIdleV130_: (j, id) => j.systemes.systems.find((s) => s.id === id) || null, actionMetaIdleV130_() {} }
};
fenQuetes.window = fenQuetes;
vm.runInNewContext(readFileSync("cloudflare/public/modules/questing-v1.js", "utf8"), fenQuetes);
const quetes = (data) => fenQuetes.__SOREAL_IDLE_QUESTING_V1__.page({
  systemes: { currencies: { qp: 5 }, systems: [{ id: "questing", state: { unlocked: true } }], questing: Object.assign({
    unlocked: true, majorsBanked: 1, bankCap: 3, butters: 0, idle: false, idleDivider: 1, idleSecondsPerItem: 10, goToQuestZone: false, eligibleZones: [],
    quest: { major: true, itemName: "Machin", zoneName: "Zone", zone: "z", progress: 1, required: 5, usedIdle: false, readyToComplete: false, idleBar: 0, idleEtaSeconds: 0 }
  }, data) }
});
{
  let h = quetes({ activeRewardMultiplier: 2, qpMultiplier: 1.21, dropMultiplier: 1.5 });
  assert.ok(h.includes("200 % de récompenses (travailleur acharné, sans mode idle)"), "x% de récompenses venu du serveur");
  assert.ok(!h.includes("(x2)"), "plus de « x2 » écrit en dur");
  assert.ok(h.includes("Modificateur de récompense en QP : <b>121,0 %</b>"), "QP Reward Modifier");
  assert.ok(h.includes("Modificateur de butin de quête : <b>150,0 %</b>"), "Quest Item Drop Modifier");
  h = quetes({ activeRewardMultiplier: 4 * 1.5 });
  assert.ok(h.includes("600 % de récompenses"), "x2 x souhait 19 x souhait 62 : la valeur du serveur, pas un 2 écrit en dur");
  h = quetes({});
  assert.ok(!h.includes("Modificateur de") && !h.includes("% de récompenses (travailleur"), "champs absents (autre agent pas encore déployé) : rien d'inventé");
  assert.ok(h.includes("récompense active"), "repli sans valeur : « récompense active »");
}
console.log("idle-cuisine-quetes-affichage-v1: OK");
