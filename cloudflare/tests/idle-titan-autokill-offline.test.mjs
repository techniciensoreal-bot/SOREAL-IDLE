import assert from "node:assert/strict";
import {
  applyIdleNguAction,
  advanceIdleNguState,
  normalizeIdleNguState
} from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-26/27), en réponse à docs/HORS-LIGNE.md : « traite le point 1 » -- Auto-Kill des Titans, en
 * ligne ET hors ligne, wiki NGU page "Titans" : « Once you have the minimum required strength to auto-kill them,
 * you can turn on "Automatically Kill Titans" in the settings. This will enable to automatically fight them
 * while online and offline as soon as the cooldown period is over ». Seuils AutoKillP/AutoKillT/AutoKillKills :
 * voir les commentaires de chaque titan dans idle-adventure-v47.js (source = section "Recommended stats" de sa
 * page wiki, ligne "AutoKill").
 */

// --- réglage par défaut fermé (aucun état existant ne se met à auto-tuer sans opt-in explicite) ---
{
  const state = normalizeIdleNguState(null, {}, 1000);
  assert.equal(state.adventure.autoKillTitansEnabled, false, "fermé par défaut, comme tout nouveau réglage");
}

// --- activer/désactiver le réglage ---
{
  const on = applyIdleNguAction(null, { action: "adventure", adventure: { action: "setAutoKillTitans", enabled: true } }, {}, 1000).state;
  assert.equal(on.adventure.autoKillTitansEnabled, true);
  const off = applyIdleNguAction(on, { action: "adventure", adventure: { action: "setAutoKillTitans", enabled: false } }, {}, 1000).state;
  assert.equal(off.adventure.autoKillTitansEnabled, false);
}

const TITAN_ITEM_IDS = ["aNumber", "giantSeed", "scrapPaper", "uugHair", "wanderersCane", "heroicSigil", "stillBeatingHeart", "incriminatingEvidence", "severedUnicornHead"];

// --- GRB (t1), hors ligne : kills réguliers au rythme du cooldown, EXP/AP/or crédités, AUCUN objet de titan ---
{
  const ctx = { bosses: 300, adventurePower: 5000, adventureToughness: 5000, difficulty: "extreme" };
  let state = normalizeIdleNguState(null, ctx, 1000);
  state.difficulty = "extreme";
  state = applyIdleNguAction(state, { action: "adventure", adventure: { action: "setAutoKillTitans", enabled: true } }, ctx, 1000).state;
  const dix_jours = 10 * 24 * 3600;
  state = advanceIdleNguState(state, dix_jours, ctx, 1000 + dix_jours * 1000);
  const t1 = state.adventure.titans.t1;
  assert.ok(t1 && t1.kills > 0, "GRB doit avoir été auto-tué au moins une fois sur 10 jours (cooldown 1h)");
  // ~240 cycles possibles en 10 jours (cooldown plancher 1h) : large marge de tolérance, aucune valeur inventée exigée au kill près.
  assert.ok(t1.kills >= 200 && t1.kills <= 241, "environ un kill par heure (cooldown plancher), pas un rattrapage instantané ni bloqué : " + t1.kills);
  assert.ok(state.adventure.permanent.experience > 0 && state.adventure.permanent.ap > 0 && state.adventure.permanent.gold > 0, "EXP/AP/or crédités comme un vrai kill");
  assert.ok(!state.adventure.inventory.some((it) => TITAN_ITEM_IDS.includes(it.definitionId)), "aucun objet de titan (wiki : « no items drop while you are offline »)");
  assert.equal(Object.keys(state.adventure.unlockItems || {}).length, 0, "aucun déblocage d'objet garanti (1er kill) accordé par Auto-Kill");
}

// --- réglage désactivé : aucun auto-kill, même avec des stats suffisantes et un long rattrapage ---
{
  const ctx = { bosses: 300, adventurePower: 5000, adventureToughness: 5000 };
  let state = normalizeIdleNguState(null, ctx, 1000);
  state.difficulty = "extreme";
  const dix_jours = 10 * 24 * 3600;
  state = advanceIdleNguState(state, dix_jours, ctx, 1000 + dix_jours * 1000);
  assert.ok(!state.adventure.titans.t1 || state.adventure.titans.t1.kills === 0, "réglage fermé : aucun Auto-Kill");
}

// --- Walderp (t5) : la forme finale n'est Auto-Kill qu'après une victoire manuelle (wiki : forms 1-4 "cannot autokill") ---
{
  const ctx = { bosses: 300, adventurePower: 5e9, adventureToughness: 5e9 };
  let state = normalizeIdleNguState(null, ctx, 1000);
  state.difficulty = "extreme";
  state = applyIdleNguAction(state, { action: "adventure", adventure: { action: "setAutoKillTitans", enabled: true } }, ctx, 1000).state;
  // jamais vaincu manuellement -> aucun Auto-Kill malgré des stats énormes
  const dix_jours = 10 * 24 * 3600;
  const sansFlag = advanceIdleNguState(structuredClone(state), dix_jours, ctx, 1000 + dix_jours * 1000);
  assert.ok(!sansFlag.adventure.titans.t5 || sansFlag.adventure.titans.t5.kills === 0, "Walderp jamais vaincu manuellement : pas d'Auto-Kill");
  // une fois la forme finale déjà vaincue une fois (flag posé) : Auto-Kill actif
  state.adventure.unlockFlags.walderpFinalDefeated = true;
  state.adventure.titans.t5 = { kills: 5, nextAt: 2000, rebirthKills: 5 };
  state = advanceIdleNguState(state, dix_jours, ctx, 1000 + dix_jours * 1000);
  assert.ok(state.adventure.titans.t5.kills > 5, "Walderp Auto-Kill actif une fois la forme finale déjà vaincue");
}

// --- IT HUNGERS : alternative "5 kills à cette difficulté" (wiki), même avec des stats bien en dessous du seuil AutoKill ---
{
  const ctx = { bosses: 300, adventurePower: 1, adventureToughness: 1, difficulty: "extreme" };
  let state = normalizeIdleNguState(null, ctx, 1000);
  state.difficulty = "extreme";
  state = applyIdleNguAction(state, { action: "adventure", adventure: { action: "setAutoKillTitans", enabled: true } }, ctx, 1000).state;
  state.adventure.titans.hungers = { kills: 5, nextAt: 2000, rebirthKills: 5, difficultyKills: { brutal: 5 } };
  const avecKills = advanceIdleNguState(structuredClone(state), 10 * 24 * 3600, ctx, 1000 + 10 * 24 * 3600 * 1000);
  assert.ok(avecKills.adventure.titans.hungers.kills > 5, "IT HUNGERS : 5 kills manuels préalables suffisent, malgré des stats dérisoires");

  // sans les 5 kills préalables (seulement 2) et les mêmes stats dérisoires : aucun Auto-Kill.
  state.adventure.titans.hungers = { kills: 2, nextAt: 2000, rebirthKills: 2, difficultyKills: { brutal: 2 } };
  const sansKills = advanceIdleNguState(state, 10 * 24 * 3600, ctx, 1000 + 10 * 24 * 3600 * 1000);
  assert.equal(sansKills.adventure.titans.hungers.kills, 2, "ni les stats ni les kills ne suffisent : aucun Auto-Kill");
}

// --- Combat manuel : incrémente bien le compteur de kills PAR DIFFICULTÉ (nécessaire à l'alternative "N kills") ---
{
  const ctx = { bosses: 300, adventurePower: 1e35, adventureToughness: 1e35 };
  let state = normalizeIdleNguState(null, ctx, 1000);
  state.difficulty = "extreme";
  const r = applyIdleNguAction(state, { action: "adventure", adventure: { action: "titan", titanId: "hungers", difficulty: "brutal", stats: { power: 1e35, toughness: 1e35 } } }, ctx, 2000);
  assert.equal(r.state.adventure.titans.hungers.difficultyKills.brutal, 1, "1 kill manuel Brutal = difficultyKills.brutal=1");
}

// --- Le palier choisi par Auto-Kill n'est PAS lié à ctx.difficulty (Normal/Evil/Sadistic) : il choisit le palier
//     le plus élevé auquel le joueur est déjà éligible (stats ou kills), pour maximiser l'EXP (wiki, page Titans). ---
{
  const ctx = { bosses: 300, adventurePower: 7.5e26, adventureToughness: 3.7e26, difficulty: "difficile" }; // seuil Brutal exact de l'Exile ; "difficile" (Evil) jamais "brutal" : bien deux notions différentes
  let state = normalizeIdleNguState(null, ctx, 1000);
  state.difficulty = "difficile";
  state = applyIdleNguAction(state, { action: "adventure", adventure: { action: "setAutoKillTitans", enabled: true } }, ctx, 1000).state;
  state = advanceIdleNguState(state, 6 * 3600, ctx, 1000 + 6 * 3600 * 1000);
  assert.ok(state.adventure.titans.t7 && state.adventure.titans.t7.kills > 0, "Exile Auto-Kill au palier Brutal malgré un mode de jeu 'difficile' (Evil), pas 'extreme'");
  assert.equal(state.adventure.titans.t7.difficultyKills.brutal, state.adventure.titans.t7.kills, "le palier réellement combattu est bien Brutal");
}

console.log("idle-titan-autokill-offline: OK");
