/*
 * Cœurs du 4G's Sellout Shop (2026-09-23) -- "My Red/Yellow/Brown/Green/Blue/
 * Purple/Orange/Grey/Pink/Rainbow Heart".
 *
 * Sources (miroir local NGU-Wiki, Règle n°1 d'AGENTS.md) :
 *  - "4G's Sellout Shop", section Items : prix en AP et effet "When this heart
 *    reaches 100, ...". "These effects are Completion Bonuses. Hence each item
 *    can be bought multiple times but their effect can only be obtained once."
 *  - fiches "My <X> Heart" : Id, stats et Specials de l'accessoire (définitions
 *    dans SPECIALS, idle-adventure-v47.js) ; "My Grey Heart is unlocked by
 *    Resource 3 unlocked".
 *  - "<X> Heart (set)" : le bonus de complétion (SETS_OBJETS_V1, même fichier),
 *    obtenu quand le cœur atteint le niveau 100 (fusion ou Item Daycare :
 *    "Hearts which can only be purchased", page Item Daycare).
 *  - page "Arbitrary Points" : "Arbitrary points gained from all sources, except
 *    for ITOPOD kills and Special Prize, can be increased by ... My Yellow Heart
 *    item/set bonus (max 20%)" ; "Maximal bonus is 193.698% (158.25% * 120% *
 *    102%)" -> facteur multiplicatif (1 + bonus).
 *  - page "Yggdrasil" : "EXPBonus(x) = x * NGU_EXP * (1 + RedHeartEXPBonus) *
 *    Perk_Fibo987 * ..." -> facteur multiplicatif de toute l'EXP gagnée.
 *  - page "Cards" : "Mayo Infusers: x2, or x2.2 with Blue Heart Set" ; page
 *    "Yggdrasil" : Poop "1.5 (1.65 with Blue Heart Set)" ; Build History 2018 :
 *    "The set bonus also grants a bonus 10% effect to all consumables boosts
 *    used, such as the energy/magic potions, poop, or even the pills!" -> le
 *    facteur de chaque consommable est multiplié par 1,1.
 *
 * CHOIX SOREAL (convention, pas un nombre de jeu) : pour Red/Yellow, le bonus
 * "max heart bonus even when not equipped" n'est pas cumulé avec celui du cœur
 * équipé -- on retient le plus grand des deux (le wiki parle du MÊME bonus,
 * simplement disponible sans l'équiper ; "max 20%" pour l'AP).
 */

const N = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const I = (v, d = 0) => Math.floor(N(v, d));

/* Id d'objet SOREAL = id d'achat Sellout (heartRed ...). wikiId = champ "Id" de la fiche. */
export const IDLE_HEARTS_V1 = Object.freeze([
  Object.freeze({ id: "heartRed", wikiId: 119, name: "My Red Heart" }),
  Object.freeze({ id: "heartYellow", wikiId: 129, name: "My Yellow Heart" }),
  Object.freeze({ id: "heartBrown", wikiId: 162, name: "My Brown Heart" }),
  Object.freeze({ id: "heartGreen", wikiId: 171, name: "My Green Heart" }),
  Object.freeze({ id: "heartBlue", wikiId: 196, name: "My Blue Heart" }),
  Object.freeze({ id: "heartPurple", wikiId: 212, name: "My Purple Heart" }),
  Object.freeze({ id: "heartOrange", wikiId: 293, name: "My Orange Heart" }),
  /* "My Grey Heart is unlocked by Resource 3 unlocked" ; "You cannot get this heart before unlocking Resource 3". */
  Object.freeze({ id: "heartGrey", wikiId: 297, name: "My Grey Heart", requiresR3: true }),
  Object.freeze({ id: "heartPink", wikiId: 344, name: "My Pink Heart" }),
  Object.freeze({ id: "heartRainbow", wikiId: 390, name: "My Rainbow Heart" })
]);

export function idleHeartV1(id) {
  return IDLE_HEARTS_V1.find((h) => h.id === String(id || "")) || null;
}

function setRewards(state) {
  const r = state?.adventure?.setRewards;
  return r && typeof r === "object" ? r : {};
}

function completed(state, setId) {
  return Boolean(state?.adventure?.completedSets?.[setId]);
}

/* Red Heart : EXP équipé (Special "expPct", en %) ou 10 % du set complété -- facteur (1 + bonus). */
export function idleHeartsExpMultiplierV1(state, gearSpecials) {
  const equipe = Math.max(0, N(gearSpecials?.expPct, 0)) / 100;
  const set = Math.max(0, N(setRewards(state).heartExpPct, 0));
  return 1 + Math.max(equipe, set);
}

/* Yellow Heart : AP équipé (Special "apPct", en %) ou 20 % du set complété -- facteur (1 + bonus). */
export function idleHeartsApMultiplierV1(state, gearSpecials) {
  const equipe = Math.max(0, N(gearSpecials?.apPct, 0)) / 100;
  const set = Math.max(0, N(setRewards(state).heartApPct, 0));
  return 1 + Math.max(equipe, set);
}

/* Blue Heart (set) : facteur appliqué à l'effet de chaque consommable (x2 -> x2,2). */
export function idleHeartsConsumableFactorV1(state) {
  return 1 + Math.max(0, N(setRewards(state).consumablesEffectPct, 0));
}

/* Orange Heart (set) : "Quests give 20% more QP!". */
export function idleHeartsQpMultiplierV1(state) {
  return 1 + Math.max(0, N(setRewards(state).questQpPct, 0));
}

/* Grey Heart (set) : "25% Faster Hacks!". */
export function idleHeartsHackSpeedMultiplierV1(state) {
  return 1 + Math.max(0, N(setRewards(state).hackSpeedPct, 0));
}

/* Rainbow Heart (set) : "+10% Mayo and Card Generation Speed!" (page Cards : "Rainbow Heart (set): x1.10"). */
export function idleHeartsCardMayoSpeedMultiplierV1(state) {
  return 1 + Math.max(0, N(setRewards(state).cardMayoSpeedPct, 0));
}

/* Purple Heart (set) : "MacGuffins drop 20% more often" (réduction des kills, idle-macguffins-v1.js). */
export function idleHeartsPurpleCompleteV1(state) {
  return completed(state, "heartPurple");
}

/* Pink Heart (set) : "Gain an additional Wish slot!" (slots de souhaits, idle-ngu-progression.js). */
export function idleHeartsPinkCompleteV1(state) {
  return completed(state, "heartPink");
}

/*
 * Achat d'un cœur : l'AP n'est débité QUE si l'objet a bien été livré dans
 * l'inventaire d'Aventure (niveau 0 : aucune fiche ne publie de niveau d'achat).
 * Dépendances injectées pour éviter tout import croisé :
 *  - buy(state, itemId, options) : idleSelloutShopBuyV1 ;
 *  - createItem(defId, level) / addItem(adventure, item) : fabriques du moteur Aventure ;
 *  - nextCost(itemId) : coût du prochain achat (null = maximum atteint) ;
 *  - r3Unlocked : Resource 3 débloquée (My Grey Heart).
 */
export function idleHeartsBuyV1(state, itemId, deps) {
  const heart = idleHeartV1(itemId);
  if (!heart) throw new Error("COEUR_INTROUVABLE");
  if (heart.requiresR3 && !deps.r3Unlocked) throw new Error("R3_VERROUILLEE");
  const cost = deps.nextCost(heart.id);
  if (cost == null) throw new Error("OBJET_AU_MAXIMUM");
  if (N(state.currencies?.ap, 0) < cost) throw new Error("AP_INSUFFISANT");
  if (!state.adventure || typeof state.adventure !== "object") throw new Error("AVENTURE_INDISPONIBLE");
  const objet = deps.createItem(heart.id, 0);
  objet.id = `i${Math.max(1, I(state.adventure.serial, 1))}`;
  state.adventure.serial = Math.max(1, I(state.adventure.serial, 1)) + 1;
  const ajoute = deps.addItem(state.adventure, objet);
  if (!ajoute) throw new Error("INVENTAIRE_PLEIN");
  /* Le client n'accepte un inventaire serveur que si sa révision avance (même règle que le Daycare). */
  state.adventure.revision = Math.max(0, I(state.adventure.revision, 0)) + 1;
  const achat = deps.buy(state, heart.id, { adventureItemDelivered: true });
  return Object.assign({}, achat, { item: ajoute });
}
