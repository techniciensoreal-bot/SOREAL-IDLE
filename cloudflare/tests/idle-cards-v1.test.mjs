import assert from "node:assert/strict";
import {
  IDLE_CARDS_TYPES_V1,
  IDLE_CARDS_MAYO_TYPES_V1,
  IDLE_CARDS_BASE_V1,
  IDLE_CARDS_PERKS_V1,
  IDLE_CARDS_QUIRKS_V1,
  IDLE_CARDS_WISH_EFFECTS_V1,
  idleCardBonusPctV1,
  idleCardRarityLabelV1,
  idleCardsTypeChancesV1,
  idleCardsModifiersV1,
  idleCardsCreateCardV1,
  advanceIdleCardsV1,
  idleCardsActionV1,
  idleCardsGrantChallengeMayoV1,
  normalizeIdleCardsDataV1
} from "../src/idle-cards-v1.js";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  advanceIdleNguState,
  idleNguSnapshot,
  idleNguBonuses,
  rebirthIdleNguState,
  REBIRTH_UNLOCK_BOSS_V1
} from "../src/idle-ngu-progression.js";
import { IDLE_WISHES_CATALOG_V1 } from "../src/idle-wishes-v1.js";
import { idlePerkByIdV1 } from "../src/idle-perks-v1.js";
import { idleQuirkByIdV1 } from "../src/idle-quirks-v1.js";
import { idleSelloutShopBuyV1 } from "../src/idle-sellout-shop-v1.js";

/*
 * Système Cards et Mayo (idle-cards-v1.js). Chaque valeur verrouillée ici est
 * copiée de la page « Cards » du miroir wiki (ou de la page citée).
 */
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg} : ${a} vs ${b}`);
function seeded(seed = 1) {
  let x = seed >>> 0;
  return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
}
const ctx = { bosses: 300 };
function base() {
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 1_000_000);
  s.systems.cards.unlocked = true;
  s.systems.perks.data.levels = s.systems.perks.data.levels || {};
  s.systems.quirks.data.levels = s.systems.quirks.data.levels || {};
  return s;
}

// --- 14 types, 6 mayos, constantes de base ---
assert.equal(IDLE_CARDS_TYPES_V1.length, 14, "« The chance of any card type dropping is normally 1 in 14 »");
assert.deepEqual(IDLE_CARDS_MAYO_TYPES_V1.map((m) => m.nom), ["Angry", "Sad", "Moldy", "Ayy Lmayo", "Cinco de Mayo", "Pretty"]);
assert.equal(IDLE_CARDS_BASE_V1.deckSize, 10);
assert.equal(IDLE_CARDS_BASE_V1.cardSeconds, 3600);
assert.equal(IDLE_CARDS_BASE_V1.chonkerSeconds, 72 * 3600);

// --- Tableau « Bonus per mayo at tier 1 » (rareté 0.8 / 1.2), 3 chiffres significatifs du wiki ---
const perMayoTier1 = {
  energyNgu: [0.112, 0.154], magicNgu: [0.106, 0.15], wandoos: [0.108, 0.152], augments: [0.108, 0.152],
  timeMachine: [0.112, 0.158], hacks: [0.104, 0.146], wishes: [0.104, 0.146], stats: [6.6, 7.4],
  adventure: [0.136, 0.178], drop: [0.112, 0.158], gold: [0.56, 0.79], daycare: [0.022, 0.03],
  pp: [0.028, 0.037], qp: [0.027, 0.036]
};
for (const [type, [lo, hi]] of Object.entries(perMayoTier1)) {
  near(idleCardBonusPctV1(type, 1, 0.8, 1), lo, 0.0006, `${type} R=0.8`);
  near(idleCardBonusPctV1(type, 1, 1.2, 1), hi, 0.0006, `${type} R=1.2`);
}
// Le bonus est linéaire en mayo.
near(idleCardBonusPctV1("stats", 1, 0.8, 9), 6.6 * 9, 1e-9, "linéaire en mayo");
// Tableau des gains par tier (calculé à rareté 1.2) : E-NGU 1->2 = 2.10, A/D 1->2 = 2.51, A/D total 1->17 = 1 489 817.36.
near(idleCardBonusPctV1("energyNgu", 2, 1.2, 1) / idleCardBonusPctV1("energyNgu", 1, 1.2, 1), 2.10, 0.005, "E-NGU 1->2");
near(idleCardBonusPctV1("stats", 2, 1.2, 1) / idleCardBonusPctV1("stats", 1, 1.2, 1), 2.51, 0.005, "A/D 1->2");
near(idleCardBonusPctV1("stats", 17, 1.2, 1) / idleCardBonusPctV1("stats", 1, 1.2, 1), 1489817.36, 1, "A/D total");
near(idleCardBonusPctV1("energyNgu", 17, 1.2, 1) / idleCardBonusPctV1("energyNgu", 1, 1.2, 1), 38.88, 0.01, "E-NGU total");

// --- Raretés ---
assert.equal(idleCardRarityLabelV1(0.8), "Crappy");
assert.equal(idleCardRarityLabelV1(0.95), "Bad");
assert.equal(idleCardRarityLabelV1(1.0), "Meh");
assert.equal(idleCardRarityLabelV1(1.1), "Okay");
assert.equal(idleCardRarityLabelV1(1.15), "Good");
assert.equal(idleCardRarityLabelV1(1.18), "Great");
assert.equal(idleCardRarityLabelV1(1.2), "Hot Damn");

// --- Tags : exemples chiffrés de la page ---
{
  const total = (tags, e) => tags.reduce((sum, t) => sum + idleCardsTypeChancesV1(tags, e)[t], 0);
  near(idleCardsTypeChancesV1([], 0.1).drop, 1 / 14, 1e-12, "sans tag : 1/14");
  near(total(["drop"], 0.10), 0.1643, 0.0001, "1 tag à 10 % : « just under 17% »");
  near(total(["drop", "gold", "pp", "qp"], 0.10), 0.5714, 0.0001, "4 tags à 10 % : 57.14 %");
  near(total(["drop"], 0.165), 0.2246, 0.0001, "1 tag à 16.5 % : 22.46 %");
  near(total(["drop", "gold", "pp", "qp"], 0.165), 0.7571, 0.0001, "4 tags à 16.5 % : 75.71 %");
  const all = idleCardsTypeChancesV1(["drop", "gold"], 0.12);
  near(Object.values(all).reduce((a, b) => a + b, 0), 1, 1e-12, "probabilités normalisées");
}

// --- Catalogues : perks 161-216, quirks 99-169, souhaits (ids et niveaux identiques au catalogue des Wishes) ---
assert.equal(IDLE_CARDS_PERKS_V1.length, 56);
assert.equal(IDLE_CARDS_QUIRKS_V1.length, 71);
assert.deepEqual(idlePerkByIdV1(216), IDLE_CARDS_PERKS_V1.find((p) => p.id === 216), "perks Cards présents dans le catalogue réel");
assert.equal(idlePerkByIdV1(216).cost, 3000000);
assert.equal(idlePerkByIdV1(211).cost, 750000);
assert.equal(idleQuirkByIdV1(149).cost, 38888, "BIG CHONKER CARDS : 38,888 QP");
assert.equal(idleQuirkByIdV1(156).cost, 40000, "Card Recycling: Mayo : 40,000 QP");
assert.equal(idleQuirkByIdV1(169).cap, 2, "Tier Up IV des quirks : 2 niveaux");
for (const [id, w] of Object.entries(IDLE_CARDS_WISH_EFFECTS_V1)) {
  const wish = IDLE_WISHES_CATALOG_V1.find((x) => x.id === Number(id));
  assert.ok(wish, "souhait " + id + " présent dans le catalogue");
  assert.equal(wish.name, w.name, "nom du souhait " + id);
  assert.equal(wish.levels, w.levels, "niveaux du souhait " + id);
}

// --- Maxima documentés (« Tier ups », deck, générateurs, tags, effet de tag, coûts en mayo) ---
{
  const s = base();
  for (const p of IDLE_CARDS_PERKS_V1) s.systems.perks.data.levels[p.id] = p.cap;
  for (const q of IDLE_CARDS_QUIRKS_V1) s.systems.quirks.data.levels[q.id] = q.cap;
  for (const [id, w] of Object.entries(IDLE_CARDS_WISH_EFFECTS_V1)) s.systems.wishes.data.tracks[id] = { level: w.levels, tempLevel: 0, permanentLevel: 0, progress: 0 };
  s.selloutShop.purchases = { extraDeckSize: 50, mayoGenerator: 2, extraTagSlot: 1 };
  s.adventure.completedSets = { rock: true, rad: true, amalgamate: true, disco: true, duck: true, stillBeatingHeart: true, heartRainbow: true };
  /* Récompenses de set créditées par checkSets (SETS_OBJETS_V1) : Still-Beating Heart +1 % tag, Rainbow Heart +10 %. */
  s.adventure.setRewards = Object.assign({}, s.adventure.setRewards, { cardTagEffect: 0.01, cardMayoSpeedPct: 0.10 });
  s.challenge.completionsTier.extreme.troll = 7;
  const m = idleCardsModifiersV1(s);
  assert.equal(m.tiers.wishes, 10, "Total : 10 pour Wishes");
  assert.equal(m.tiers.qp, 13, "13 pour QP");
  assert.equal(m.tiers.pp, 15, "15 pour PP");
  for (const t of ["energyNgu", "magicNgu", "wandoos", "augments", "timeMachine", "hacks", "stats", "adventure", "drop", "gold", "daycare"]) assert.equal(m.tiers[t], 17, "17 pour " + t);
  assert.equal(m.deckSize, 120, "Bigger deck size : Total 120");
  assert.equal(m.generators, 6, "Extra mayo generators : Total 6");
  assert.equal(m.tagSlots, 4, "Extra tag slot : Total 4");
  near(m.tagEffect, 0.165, 1e-12, "« Total: 16.5% » (dont le set Still-Beating Heart +1 %)");
  assert.deepEqual([m.mayoMin, m.mayoMax], [5, 13], "« final mayo cost range of 5-13 »");
  assert.deepEqual([m.chonkerMayoMin, m.chonkerMayoMax], [26, 34], "Chonkers : 26 à 34 après les souhaits 229/230");
  assert.equal(m.rarityMin, 0.85, "Disco : rareté min. 0.85");
  // Page Cards : total x2.1157 dont Rainbow Heart x1.10 ; mayo x2.3273 dont Rainbow x1.10.
  near(m.cardSpeed, 2.1157, 0.0005, "vitesse des cartes");
  near(m.mayoSpeed, 2.3273, 0.0005, "vitesse de la mayo");
  assert.equal(m.chonkers && m.recycleSpawn && m.recycleMayo, true);
}

// --- Génération : 1 carte par heure, deck plein => arrêt ---
{
  let s = base();
  advanceIdleCardsV1(s, 3599, seeded(1));
  assert.equal(s.systems.cards.data.deck.length, 0);
  advanceIdleCardsV1(s, 1, seeded(2));
  assert.equal(s.systems.cards.data.deck.length, 1, "1 carte après 3600 s");
  const c = s.systems.cards.data.deck[0];
  const total = Object.values(c.mayo).reduce((a, b) => a + b, 0);
  assert.ok(total >= 1 && total <= 9 && Object.keys(c.mayo).length <= 6, "coût 1-9 sur 1-6 types");
  assert.ok(c.rarity >= 0.8 && c.rarity <= 1.2 && c.tier === 1 && !c.protected);
  near(c.bonusPct, idleCardBonusPctV1(c.type, c.tier, c.rarity, total), 1e-12, "bonus = formule");
  advanceIdleCardsV1(s, 100 * 3600, seeded(3));
  assert.equal(s.systems.cards.data.deck.length, 10, "deck de 10 plein : plus de carte");
  assert.ok(s.systems.cards.data.spawnProgress < 1, "aucune carte stockée en attente");
  // Via le moteur complet (advanceIdleNguState) aussi.
  let t = base();
  /* Hasard figé : le moteur complet tire avec Math.random ; sans cela ce test échouait environ 3 fois sur 100 (3 cartes au lieu de 2), ce qui bloquait un déploiement en CI (2026-09-26). */
  const hasardOrigine = Math.random;
  Math.random = seeded(4);
  try {
    t = advanceIdleNguState(t, 2 * 3600, ctx, 1_000_000 + 2 * 3600 * 1000);
  } finally {
    Math.random = hasardOrigine;
  }
  assert.equal(t.systems.cards.data.deck.length, 2);
}

// --- Mayo : 1 générateur = 1 mayo/h ; 2 générateurs = partage ; Mayo Infuser x2 ---
{
  let s = base();
  assert.throws(() => idleCardsActionV1(base(), { mode: "toggleGenerator", mayo: "nope" }), /MAYO_INVALIDE/);
  idleCardsActionV1(s, { mode: "toggleGenerator", mayo: "angry" });
  assert.throws(() => idleCardsActionV1(s, { mode: "toggleGenerator", mayo: "sad" }), /GENERATEURS_PLEINS/, "1 seul générateur de base");
  advanceIdleCardsV1(s, 3600);
  assert.equal(s.systems.cards.data.mayo.angry, 1);
  assert.equal(s.currencies.mayo, 1, "currencies.mayo = total stocké");
  s.systems.quirks.data.levels[150] = 1; // +1 générateur, +2 % de vitesse
  idleCardsActionV1(s, { mode: "toggleGenerator", mayo: "sad" });
  advanceIdleCardsV1(s, 3600);
  near(s.systems.cards.data.mayoProgress.sad, 0.51, 1e-9, "2 générateurs : 1.02 / 2 par heure");
  s.selloutEffects.remaining.mayoInfuser = 1800;
  const before = s.systems.cards.data.mayoProgress.moldy;
  idleCardsActionV1(s, { mode: "toggleGenerator", mayo: "sad" });
  idleCardsActionV1(s, { mode: "toggleGenerator", mayo: "moldy" });
  advanceIdleCardsV1(s, 3600);
  near(s.systems.cards.data.mayoProgress.moldy - before, 1.02 * 5400 / 3600 / 2, 1e-9, "Infuser : x2 pendant sa durée restante seulement");
}

// --- Lancer une carte : coût en mayo, bonus permanent, multiplicateurs du jeu ---
{
  let s = base();
  const card = { id: "carte-x", type: "stats", tier: 1, rarity: 1.2, mayo: { angry: 2, sad: 1 }, protected: false, chonker: false };
  s.systems.cards.data = normalizeIdleCardsDataV1({ deck: [card], nextId: 2 });
  assert.throws(() => idleCardsActionV1(s, { mode: "cast", cardId: "carte-x" }), /MAYO_INSUFFISANTE/);
  s.systems.cards.data.mayo.angry = 2; s.systems.cards.data.mayo.sad = 5;
  const avant = idleNguBonuses(s);
  const r = idleCardsActionV1(s, { mode: "cast", cardId: "carte-x" });
  near(r.bonusPct, 7.4 * 3, 1e-9, "A/D R=1.2 T1 : 7.4 %/mayo x 3");
  assert.equal(s.systems.cards.data.deck.length, 0);
  assert.equal(s.systems.cards.data.mayo.angry, 0);
  assert.equal(s.systems.cards.data.mayo.sad, 4);
  const apres = idleNguBonuses(s);
  near(apres.attackMultiplier / avant.attackMultiplier, 1 + 22.2 / 100, 1e-9, "A/D -> attaque");
  near(apres.defenseMultiplier / avant.defenseMultiplier, 1 + 22.2 / 100, 1e-9, "A/D -> défense");
  // Via l'action moteur : Drop Chance.
  s.systems.cards.data.deck.push({ id: "carte-d", type: "drop", tier: 1, rarity: 1, mayo: { sad: 4 }, bonusPct: 0, protected: false, chonker: false });
  let st = applyIdleNguAction(s, { action: "cards", mode: "cast", cardId: "carte-d" }, ctx, 1_000_000).state;
  const dropPct = idleCardBonusPctV1("drop", 1, 1, 4);
  near(idleNguBonuses(st).dropMultiplier / avant.dropMultiplier, 1 + dropPct / 100, 1e-9, "DROPS -> dropMultiplier");
  near(st.bonuses.cards.drop, dropPct, 1e-12);
  assert.ok(idleNguBonuses(st).cardsQpGainMultiplier === 1, "QP exposé pour Questing");
}

// --- Protéger, jeter, déplacer ; recyclage (perk 216, quirk 156) ---
{
  let s = base();
  const mk = (id, extra = {}) => ({ id, type: "gold", tier: 1, rarity: 1, mayo: { pretty: 3 }, protected: false, chonker: false, ...extra });
  s.systems.cards.data = normalizeIdleCardsDataV1({ deck: [mk("a"), mk("b"), mk("c", { chonker: true, protected: true })], nextId: 4 });
  idleCardsActionV1(s, { mode: "protect", cardId: "a" });
  assert.throws(() => idleCardsActionV1(s, { mode: "cast", cardId: "a" }), /CARTE_PROTEGEE/);
  assert.throws(() => idleCardsActionV1(s, { mode: "yeet", cardId: "a" }), /CARTE_PROTEGEE/);
  idleCardsActionV1(s, { mode: "move", cardId: "b", index: 0 });
  assert.deepEqual(s.systems.cards.data.deck.map((c) => c.id), ["b", "a", "c"]);
  s.systems.perks.data.levels[216] = 1;
  s.systems.quirks.data.levels[156] = 1;
  const r = idleCardsActionV1(s, { mode: "yeet", cardId: "b" });
  near(s.systems.cards.data.spawnProgress, 0.10, 1e-12, "perk 216 : +10 % du minuteur");
  near(s.systems.cards.data.mayoProgress.pretty, 0.20, 1e-12, "quirk 156 : +20 % de progression de mayo");
  assert.equal(r.mayoProgress, "pretty");
  idleCardsActionV1(s, { mode: "protect", cardId: "c", protected: false });
  idleCardsActionV1(s, { mode: "yeet", cardId: "c" });
  near(s.systems.cards.data.chonkerProgress, 0.25, 1e-12, "Chonker jeté : +25 % du minuteur Chonker");
}

// --- Big Chonkers : 72 h, 21-29 mayo, rareté 1.2, protégés ---
{
  let s = base();
  s.systems.quirks.data.levels[149] = 1;
  const c = idleCardsCreateCardV1(s, { rng: seeded(9), chonker: true });
  const total = Object.values(c.mayo).reduce((a, b) => a + b, 0);
  assert.ok(total >= 21 && total <= 29, "coût Chonker 21-29 : " + total);
  assert.equal(c.rarity, 1.2);
  assert.equal(c.protected, true);
  s.selloutShop.purchases = { extraDeckSize: 50 }; // deck de 60 : les 72 cartes normales le remplissent
  advanceIdleCardsV1(s, 72 * 3600, seeded(4));
  assert.equal(s.systems.cards.data.deck.filter((x) => x.chonker).length, 0, "deck plein avant les 72 h : pas de Chonker");
  s.selloutShop.purchases = { extraDeckSize: 50 };
  s.systems.quirks.data.levels[146] = 5; s.systems.quirks.data.levels[147] = 5; s.systems.quirks.data.levels[148] = 5; // deck 75
  s.systems.cards.data.deck = [];
  s.systems.cards.data.chonkerProgress = 0;
  advanceIdleCardsV1(s, 72 * 3600, seeded(4));
  assert.equal(s.systems.cards.data.deck.filter((x) => x.chonker).length, 1, "1 Chonker en 72 h");
}

// --- Tiers : perks/quirks/souhaits, set Rock, Regular Black Pens (+2, 25 cartes) ---
{
  let s = base();
  s.systems.perks.data.levels[169] = 1; // Energy NGU Card Tier Up I
  s.systems.wishes.data.tracks["115"] = { level: 1, tempLevel: 0, permanentLevel: 0, progress: 0 };
  s.adventure.completedSets = { rock: true };
  assert.equal(idleCardsModifiersV1(s).tiers.energyNgu, 4);
  assert.equal(idleCardsModifiersV1(s).tiers.hacks, 2, "Rock : +1 à toutes");
  s.currencies.ap = 40000;
  idleSelloutShopBuyV1(s, "regularBlackPens");
  assert.equal(s.selloutEffects.blackPens, 25, "40 000 AP pour 25 pens");
  const c = idleCardsCreateCardV1(s, { rng: seeded(5) });
  assert.equal(c.tier, idleCardsModifiersV1(s).tiers[c.type] + 2, "+2 tiers");
  assert.equal(s.selloutEffects.blackPens, 24);
}

// --- Sets Rad/Amalgamate (deck), Duck et Troll Sadistic (vitesses) ---
{
  const s = base();
  s.adventure.completedSets = { rad: true, amalgamate: true, duck: true };
  s.challenge.completionsTier.extreme.troll = 5;
  const m = idleCardsModifiersV1(s);
  assert.equal(m.deckSize, 25);
  near(m.cardSpeed, 1.06 * 1.10, 1e-12, "Duck x1.06, Troll 5 x1.10");
  near(m.mayoSpeed, 1.06, 1e-12, "Troll 6 pas encore atteint");
}

// --- Sellout : achats Cards désormais achetables ---
{
  const s = base();
  s.currencies.ap = 1e7;
  idleSelloutShopBuyV1(s, "extraDeckSize");
  idleSelloutShopBuyV1(s, "mayoGenerator");
  idleSelloutShopBuyV1(s, "extraTagSlot");
  idleSelloutShopBuyV1(s, "mayoInfuser");
  assert.equal(s.selloutEffects.remaining.mayoInfuser, 86400, "24 h");
  const m = idleCardsModifiersV1(s);
  assert.deepEqual([m.deckSize, m.generators, m.tagSlots], [11, 2, 2]);
  near(m.mayoSpeed, 1.02, 1e-12, "+2 % par slot de générateur");
  assert.throws(() => idleSelloutShopBuyV1(s, "extraTagSlot"), /OBJET_AU_MAXIMUM/);
}

// --- Tags : slots limités ---
{
  const s = base();
  idleCardsActionV1(s, { mode: "toggleTag", type: "adventure" });
  assert.throws(() => idleCardsActionV1(s, { mode: "toggleTag", type: "hacks" }), /TAGS_PLEINS/);
  idleCardsActionV1(s, { mode: "toggleTag", type: "adventure" });
  assert.deepEqual(s.systems.cards.data.tags, []);
}

// --- Basic Challenge Sadistic : 1 mayo de chaque par complétion, 5 à la dernière ---
{
  const s = base();
  assert.equal(idleCardsGrantChallengeMayoV1(s, 1), 1);
  assert.equal(idleCardsGrantChallengeMayoV1(s, 5), 5);
  assert.equal(s.systems.cards.data.mayo.cincoDeMayo, 6);
  assert.equal(s.currencies.mayo, 36);
  // Chemin réel : défi basique en Sadistic.
  let t = base();
  t.difficulty = "extreme";
  t.systems.challenges.unlocked = true;
  t = applyIdleNguAction(t, { action: "challenge", mode: "start", challenge: "basic" }, { bosses: 0 }, 1_000_000).state;
  t = applyIdleNguAction(t, { action: "challenge", mode: "complete", challenge: "basic" }, { bosses: 58 }, 1_000_000).state;
  assert.equal(t.systems.cards.data.mayo.angry, 1, "1re complétion Sadistic : +1 Angry");
}

// --- Rebirth : deck, bonus accumulés et mayo stockée conservés (page Rebirths) ---
{
  let s = base();
  s.systems.cards.data.deck.push({ id: "garde", type: "hacks", tier: 3, rarity: 1.1, mayo: { sad: 2 }, protected: false, chonker: false });
  s.systems.cards.data.mayo.sad = 7;
  s.bonuses.cards.hacks = 12.5;
  const t = 1_000_000 + 3600 * 1000;
  const after = rebirthIdleNguState(s, { bosses: Math.max(REBIRTH_UNLOCK_BOSS_V1, 10) }, t);
  const st = after.state || after;
  assert.equal(st.systems.cards.data.deck.some((c) => c.id === "garde"), true, "deck conservé");
  assert.equal(st.systems.cards.data.mayo.sad >= 7, true, "mayo conservée");
  assert.equal(st.bonuses.cards.hacks, 12.5, "bonus accumulés conservés");
}

// --- Anciennes cartes factices écartées ; snapshot client ---
{
  const legacy = normalizeIdleNguState({ systems: { cards: { unlocked: true, data: { nextCardAt: 5, deck: [{ id: "card-1", type: "attack", quality: 1 }] } } }, bonuses: { cards: { attack: 0.1 } } }, ctx, 1_000_000);
  assert.equal(legacy.systems.cards.data.deck.length, 0, "type « attack » inventé : écarté");
  assert.equal(legacy.bonuses.cards.attack, undefined);
  assert.equal(legacy.bonuses.cards.stats, 0);
  const s = base();
  const snap = idleNguSnapshot(s, ctx, 1_000_000);
  assert.equal(snap.cards.unlocked, true);
  assert.equal(snap.cards.types.length, 14);
  assert.equal(snap.cards.mayoTypes.length, 6);
  assert.equal(snap.cards.deckSize, 10);
  near(snap.cards.secondsToNextCard, 3600, 1e-9, "prochaine carte dans 1 h");
}

console.log("idle-cards-v1: OK");
