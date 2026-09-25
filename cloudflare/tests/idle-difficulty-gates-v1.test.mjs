import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot, idleNguBonuses } from "../src/idle-ngu-progression.js";
import {
  IDLE_PERK_DIFFICULTE_V1,
  IDLE_QUIRK_DIFFICULTE_V1,
  idleDifficulteSuffisanteV1,
  idleNiveauxActifsV1
} from "../src/idle-difficulty-gates-v1.js";

/*
 * Norman (2026-09-25) : « Difficulté des perks : aujourd'hui tout est achetable dès le Normal, alors que ces éléments sont réservés à Evil ou
 * Sadistic dans le wiki. Tu fais comme sur le wiki. » Wiki (Perk Points, Quirk Points) : « Evil only » / « Sadistic only » ; source tierce identique.
 */
const compte = (t, rang) => Object.values(t).filter((v) => v === rang).length;
assert.deepEqual([compte(IDLE_PERK_DIFFICULTE_V1, 1), compte(IDLE_PERK_DIFFICULTE_V1, 2)], [85, 82], "perks : 85 Evil, 82 Sadistic");
assert.deepEqual([compte(IDLE_QUIRK_DIFFICULTE_V1, 1), compte(IDLE_QUIRK_DIFFICULTE_V1, 2)], [55, 104], "quirks : 55 Evil, 104 Sadistic");
assert.equal(IDLE_PERK_DIFFICULTE_V1[125], 1, "Welcome to Evil Difficulty = Evil");
assert.equal(IDLE_PERK_DIFFICULTE_V1[144], 2, "Welcome to Sadistic Difficulty = Sadistic");
assert.equal(IDLE_PERK_DIFFICULTE_V1[0], undefined, "The Newbie Energy Perk = Normal");

// Règle : difficulté courante >= difficulté exigée
assert.equal(idleDifficulteSuffisanteV1(IDLE_PERK_DIFFICULTE_V1, 125, "normal"), false);
assert.equal(idleDifficulteSuffisanteV1(IDLE_PERK_DIFFICULTE_V1, 125, "difficile"), true);
assert.equal(idleDifficulteSuffisanteV1(IDLE_PERK_DIFFICULTE_V1, 125, "extreme"), true, "Evil reste disponible en Sadistic");
assert.equal(idleDifficulteSuffisanteV1(IDLE_PERK_DIFFICULTE_V1, 144, "difficile"), false);
assert.deepEqual({ ...idleNiveauxActifsV1({ 0: 1, 125: 1, 144: 1 }, IDLE_PERK_DIFFICULTE_V1, "difficile") }, { 0: 1, 125: 1 });

// Achats : refusés tant que la difficulté est trop basse
const ctx = { bosses: 300 };
const etat = (difficulty) => {
  const s = normalizeIdleNguState({ difficulty }, ctx, 0);
  s.systems.perks.unlocked = true; s.systems.quirks.unlocked = true;
  s.currencies.pp = 1e9; s.currencies.qp = 1e9;
  return s;
};
assert.throws(() => applyIdleNguAction(etat("normal"), { action: "buyPerk", perkId: 125 }, ctx, 1000), /DIFFICULTE_REQUISE/);
assert.doesNotThrow(() => applyIdleNguAction(etat("difficile"), { action: "buyPerk", perkId: 125 }, ctx, 1000));
assert.throws(() => applyIdleNguAction(etat("difficile"), { action: "buyPerk", perkId: 144 }, ctx, 1000), /DIFFICULTE_REQUISE/);
assert.doesNotThrow(() => applyIdleNguAction(etat("extreme"), { action: "buyPerk", perkId: 144 }, ctx, 1000));
const quirkSadistique = Number(Object.keys(IDLE_QUIRK_DIFFICULTE_V1).find((id) => IDLE_QUIRK_DIFFICULTE_V1[id] === 2));
assert.throws(() => applyIdleNguAction(etat("difficile"), { action: "buyQuirk", quirkId: quirkSadistique }, ctx, 1000), /DIFFICULTE_REQUISE/);
assert.doesNotThrow(() => applyIdleNguAction(etat("extreme"), { action: "buyQuirk", quirkId: quirkSadistique }, ctx, 1000));

// Effets : un niveau déjà possédé reste, mais inactif tant que la difficulté est trop basse
{
  const normal = etat("normal");
  normal.systems.perks.data.levels = { 125: 1 };
  const evil = etat("difficile");
  evil.systems.perks.data.levels = { 125: 1 };
  const sans = idleNguBonuses(etat("normal")).attackMultiplier;
  assert.equal(idleNguBonuses(normal).attackMultiplier, sans, "Welcome to Evil sans effet en Normal");
  assert.ok(idleNguBonuses(evil).attackMultiplier > sans * 2.9, "+200 % d'Attack/Defense en Evil");
  assert.equal(normal.systems.perks.data.levels[125], 1, "le niveau n'est jamais perdu");
}

// Catalogues exposés : ni Evil ni Sadistic visibles en Normal (pas de spoil), sauf ce qui est déjà possédé
{
  const ids = (s) => new Set(idleNguSnapshot(s, ctx, 0).perkDefinitions.map((p) => p.id));
  assert.equal(ids(etat("normal")).has(125), false);
  assert.equal(ids(etat("difficile")).has(125), true);
  assert.equal(ids(etat("difficile")).has(144), false);
  assert.equal(ids(etat("extreme")).has(144), true);
  const possede = etat("normal");
  possede.systems.perks.data.levels = { 125: 1 };
  assert.equal(ids(possede).has(125), true, "un perk déjà possédé reste affiché");
}


// --- Souhaits (pages Energy / Magic / Resource 3 du wiki : colonne Difficulty ; 231 souhaits Evil ou Sadistic) ---
{
  const { IDLE_WISH_DIFFICULTE_V1, idleWishTracksActifsV1 } = await import("../src/idle-difficulty-gates-v1.js");
  const c = (rang) => Object.values(IDLE_WISH_DIFFICULTE_V1).filter((v) => v === rang).length;
  assert.deepEqual([c(1), c(2)], [95, 136], "souhaits : 95 Evil, 136 Sadistic, aucun Normal");
  assert.equal(IDLE_WISH_DIFFICULTE_V1[0], 1, "« I wish that wishes kicked ass » = Evil (wiki Resource 3)");
  assert.equal(IDLE_WISH_DIFFICULTE_V1[88], 2, "Resource 3 Power V = Sadistic (wiki Resource 3)");
  const s = (difficulty) => {
    const e = etat(difficulty);
    e.systems.wishes.unlocked = true;
    return e;
  };
  assert.throws(() => applyIdleNguAction(s("normal"), { action: "setWishSlot", slot: 0, wish: "1" }, ctx, 1000), /DIFFICULTE_REQUISE/);
  assert.doesNotThrow(() => applyIdleNguAction(s("difficile"), { action: "setWishSlot", slot: 0, wish: "1" }, ctx, 1000));
  assert.throws(() => applyIdleNguAction(s("difficile"), { action: "setWishSlot", slot: 0, wish: "88" }, ctx, 1000), /DIFFICULTE_REQUISE/);
  assert.doesNotThrow(() => applyIdleNguAction(s("extreme"), { action: "setWishSlot", slot: 0, wish: "88" }, ctx, 1000));
  // niveaux déjà obtenus : conservés, inactifs à une difficulté trop basse
  const t = s("normal");
  t.systems.wishes.data.tracks["1"].level = 3;
  assert.equal(idleWishTracksActifsV1(t)["1"], undefined);
  assert.equal(t.systems.wishes.data.tracks["1"].level, 3);
  t.difficulty = "difficile";
  assert.equal(idleWishTracksActifsV1(t)["1"].level, 3);
  // catalogue exposé : rien en Normal (pas de spoil), les souhaits Evil en Evil, tout en Sadistic
  const nb = (d) => idleNguSnapshot(s(d), ctx, 0).systems.find((x) => x.id === "wishes").tracks.length;
  assert.equal(nb("normal"), 0);
  assert.equal(nb("difficile"), 93, "95 souhaits Evil moins Dual Wielding I et II (Troll Challenges Evil 4 et 6)");
  assert.equal(nb("extreme"), 229);
}

// --- Corrections de valeurs issues du contrôle croisé du 2026-09-25 (wiki + source tierce) ---
{
  const { IDLE_WISHES_CATALOG_V1 } = await import("../src/idle-wishes-v1.js");
  const { IDLE_NGU_AUGMENTATIONS } = await import("../src/idle-ngu-progression.js");
  const { IDLE_ADVENTURE_ZONES } = await import("../src/idle-adventure-v47.js");
  const w = (id) => IDLE_WISHES_CATALOG_V1.find((x) => x.id === id);
  assert.equal(w(88).levels, 10, "Resource 3 Power V : 10 niveaux (page Resource 3 ; la page Wishes dit 1)");
  assert.equal(w(89).levels, 10, "Resource 3 Bars V : 10 niveaux");
  assert.equal(w(91).speedDivider, 1e23, "Energy Power VI : diviseur 1e23 (data-sort-value ; le texte 1e21 est une coquille)");
  assert.equal(w(189).bonus.statPct, 1, "Bosses V : +100 % d'Attack/Defense par niveau, comme les autres souhaits « bosses »");
  assert.equal(IDLE_NGU_AUGMENTATIONS.find((a) => a.id === "laserSword").upgrade.baseGold, 1.5625e23, "Quadruple Sided Laser Sword : 156.25 Sext = 1.5625e23");
  const bts = IDLE_ADVENTURE_ZONES.find((z) => z.id === "backtoschool");
  assert.ok(Math.abs(bts.oneHitP / 3.25e28 - 0.8381) < 0.001, "Back To School : One Hit au même rapport (0,838) que les zones voisines");
}
console.log("idle-difficulty-gates-v1 OK");
