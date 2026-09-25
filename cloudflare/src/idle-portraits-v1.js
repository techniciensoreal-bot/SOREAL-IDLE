/*
 * Player Portraits (2026-09-24) -- wiki NGU : pages "Player Portraits", "Portrait pack pictures",
 * "MacGuffin Fragments" et "Wishes".
 *
 * "Player Portraits are the images that represent your hero in Boss Fights. ... Most Player
 * Portraits are unlocked by completing the corresponding equipment set. Others are unlocked
 * through wishes, seasonal updates, or the "Sexy Player Fashion Pack" available in 4G's Sellout
 * Shop." Le portrait par défaut est « Default Profile Picture » (PlayerAPportrait16).
 *
 * Implémenté (conditions publiées sans ambiguïté) :
 *  - défaut ;
 *  - un portrait par set complété (42 sets de la galerie) ; le set Forest donne en plus les deux
 *    « Bonus profile from the Forest set » (PlayerAPportrait20 et 21) ;
 *  - souhaits 26 (« Oscar Meyer Weiner »), 75 (« Mayo ») et 202 (« Sneak Preview ») ;
 *  - SEXY et SMART : page MacGuffin Fragments, « unlocking a player portrait if SEXY (SMART)
 *    MacGuffin bonuses reach 250% ».
 * Non implémenté (voir docs/WORKLOG.md) : « Complete all the Normal / Evil / SADISTIC challenges »
 * (ni « complété » = une fois ou au maximum, ni la difficulté ne sont précisés), Sexy Player Fashion
 * Pack (110 kreds), bonus Steam, connexion d'Halloween, Krissmuss 2020 (événements passés).
 *
 * Le choix du joueur est cosmétique : il n'a aucun effet sur les stats. Le média est servi par
 * /api/idle/media/player (idle-media-v1.js) depuis le dossier R2 idle/player/.
 */

/* [id, fichier de l'image du wiki (sans extension), libellé, condition] */
const SET = "set";
const WISH = "wish";
const MACGUFFIN = "macguffin";
const SPECIAL = "special";

const TABLE_V1 = [
  ["default", "PlayerAPportrait16", "Portrait par défaut", { type: "default" }],
  ["training", "PlayerAPportrait17", "Training", { type: SET, set: "training" }],
  ["sewers", "PlayerAPportrait18", "Sewers", { type: SET, set: "sewers" }],
  ["forest", "PlayerAPportrait19", "Forest", { type: SET, set: "forest" }],
  ["forest-bonus-1", "PlayerAPportrait20", "Forest (bonus 1)", { type: SET, set: "forest" }],
  ["forest-bonus-2", "PlayerAPportrait21", "Forest (bonus 2)", { type: SET, set: "forest" }],
  ["cave", "PlayerAPportrait22", "Cave", { type: SET, set: "cave" }],
  ["hsb", "PlayerAPportrait23", "HSB", { type: SET, set: "hsb" }],
  ["grb", "PlayerAPportrait24", "GRB", { type: SET, set: "grb" }],
  ["clock", "PlayerAPportrait25", "Clock", { type: SET, set: "clock" }],
  ["2d", "PlayerAPportrait26", "2D", { type: SET, set: "2d" }],
  ["spoopy", "PlayerAPportrait27", "Spoopy", { type: SET, set: "spoopy" }],
  ["jake", "PlayerAPportrait28", "Jake", { type: SET, set: "jake" }],
  ["gaudy", "PlayerAPportrait29", "Gaudy", { type: SET, set: "gaudy" }],
  ["mega", "PlayerAPportrait30", "Mega", { type: SET, set: "mega" }],
  ["beardverse", "PlayerAPportrait31", "Beardverse", { type: SET, set: "beardverse" }],
  ["wanderer", "PlayerPortrait-Wanderer", "Wanderer's", { type: SET, set: "wanderer" }],
  ["rerednaw", "PlayerPortrait-Rerednaw", "S'rerednaW", { type: SET, set: "rerednaw" }],
  ["badly", "PlayerPortrait-BadlyDrawn", "Badly Drawn", { type: SET, set: "badly" }],
  ["stealth", "PlayerPortrait-Stealth", "Stealth", { type: SET, set: "stealth" }],
  ["slimy", "PlayerPortrait-Slimy", "Slimy", { type: SET, set: "slimy" }],
  ["choco", "PlayerPortrait-Choco", "Choco", { type: SET, set: "choco" }],
  ["edgy", "PlayerPortrait-Edgy", "Edgy", { type: SET, set: "edgy" }],
  ["pinkprincess", "PlayerPortrait-PrettyPinkPrincess", "Pretty Pink Princess", { type: SET, set: "pinkprincess" }],
  ["greasynerd", "PlayerPortrait-GreasyNerd", "Greasy Nerd", { type: SET, set: "greasynerd" }],
  ["meta", "PlayerPortrait-Meta", "Meta", { type: SET, set: "meta" }],
  ["party", "PlayerPortrait-Interdimensional", "Party", { type: SET, set: "party" }],
  ["mobster", "PlayerPortrait-Mobster", "Mobster", { type: SET, set: "mobster" }],
  ["typo", "PlayerPortrait-Typo", "Typo", { type: SET, set: "typo" }],
  ["fad", "PlayerPortrait-Fadzone", "Fad", { type: SET, set: "fad" }],
  ["jrpg", "PlayerPortrait-JRPG", "JRPG", { type: SET, set: "jrpg" }],
  ["exile", "PlayerPortrait-Exile", "Exile", { type: SET, set: "exile" }],
  ["rad", "PlayerPortrait-Rad", "Rad", { type: SET, set: "rad" }],
  ["backtoschool", "PlayerPortrait-Back To School", "Back To School", { type: SET, set: "backtoschool" }],
  ["western", "Tier29 PlayerAvatar", "Western", { type: SET, set: "western" }],
  ["space", "Tier30 PlayerAvatar", "Space", { type: SET, set: "space" }],
  ["bread", "PlayerPortrait Bread", "Bread", { type: SET, set: "bread" }],
  ["disco", "PlayerPortrait 70s", "Disco", { type: SET, set: "disco" }],
  ["halloweenie", "PlayerPortrait Halloween", "Halloweenie", { type: SET, set: "halloweenie" }],
  ["rock", "RockLobster", "Rock", { type: SET, set: "rock" }],
  ["construction", "PlayerConstruction", "Construction", { type: SET, set: "construction" }],
  ["duck", "PlayerDuckQuack", "Duck", { type: SET, set: "duck" }],
  ["dutch", "PlayerNether", "Dutch", { type: SET, set: "dutch" }],
  ["amalgamate", "Titangamation Player", "Amalgamate", { type: SET, set: "amalgamate" }],
  ["pirate", "PlayerPirate", "Pirate", { type: SET, set: "pirate" }],
  ["wish-sneak-preview", "Player portrait - sneak preview", "Souhait « Sneak Preview »", { type: WISH, wish: 202 }],
  ["sexy", "Sexy", "SEXY !", { type: MACGUFFIN, macguffin: "sexy", pct: 250 }],
  ["smart", "Smart", "SMART", { type: MACGUFFIN, macguffin: "smart", pct: 250 }],
  ["wish-weiner", "PlayerPortrait-Weiner", "Souhait « Oscar Meyer Weiner »", { type: WISH, wish: 26 }],
  ["wish-mayo", "PlayerPortrait-Mayo", "Souhait « Mayo »", { type: WISH, wish: 75 }],
  /* Special Prize, choix « joli chaton » (Norman, 2026-09-25) : image R2 idle/Kitty/BadKittyDaycareBow.webp (voir IDLE_PORTRAIT_KITTY_R2_KEY_V1). */
  ["kitty", "BadKittyDaycareBow", "Joli chaton", { type: SPECIAL, choice: 2 }]
];
/* Le chaton n'est pas dans le dossier idle/player/ : son fichier R2 est désigné explicitement. */
export const IDLE_PORTRAIT_KITTY_R2_KEY_V1 = "idle/Kitty/BadKittyDaycareBow.webp";

export const IDLE_PORTRAITS_V1 = Object.freeze(TABLE_V1.map(([id, file, name, unlock]) => Object.freeze({
  id,
  file,
  name,
  unlock: Object.freeze(unlock)
})));

export const IDLE_PORTRAIT_DEFAULT_ID_V1 = "default";
/* Page Arbitrary Points, « Special Prize » : 50 000 AP, une seule fois (sans aucun bonus d'AP). */
export const IDLE_SPECIAL_PRIZE_AP_V1 = 50000;

function conditionTexteV1(unlock) {
  if (unlock.type === SET) return "Compléter le set " + unlock.set;
  if (unlock.type === WISH) return "Terminer le souhait n°" + unlock.wish;
  if (unlock.type === SPECIAL) return "Special Prize : le joli chaton";
  if (unlock.type === MACGUFFIN) return "Bonus permanent du fragment " + unlock.macguffin.toUpperCase() + " à " + unlock.pct + " %";
  return "Disponible dès le départ";
}

/* env : { completedSets, wishLevel(id), macguffinPct(id), specialPrizeChoice (0 aucun, 1 AP, 2 chaton) } */
export function idlePortraitUnlockedV1(portrait, env = {}) {
  const u = portrait.unlock;
  if (u.type === "default") return true;
  if (u.type === SET) return Boolean(env.completedSets && env.completedSets[u.set]);
  if (u.type === WISH) return typeof env.wishLevel === "function" && Number(env.wishLevel(u.wish)) >= 1;
  if (u.type === SPECIAL) return Number(env.specialPrizeChoice) === u.choice;
  if (u.type === MACGUFFIN) return typeof env.macguffinPct === "function" && Number(env.macguffinPct(u.macguffin)) >= u.pct;
  return false;
}

export function idlePortraitByIdV1(id) {
  return IDLE_PORTRAITS_V1.find(p => p.id === String(id || "")) || null;
}

/* Portrait choisi si encore valide, sinon le portrait par défaut. */
export function idlePortraitSelectedIdV1(selectedId, env = {}) {
  const p = idlePortraitByIdV1(selectedId);
  return p && idlePortraitUnlockedV1(p, env) ? p.id : IDLE_PORTRAIT_DEFAULT_ID_V1;
}

export function idlePortraitsSnapshotV1(selectedId, env = {}, specialPrizeClaimed = false, specialPrizeChoice = 0) {
  const selected = idlePortraitSelectedIdV1(selectedId, env);
  const list = IDLE_PORTRAITS_V1.map(p => ({
    id: p.id,
    file: p.file,
    name: p.name,
    condition: conditionTexteV1(p.unlock),
    unlocked: idlePortraitUnlockedV1(p, env)
  }));
  return {
    selected,
    selectedFile: idlePortraitByIdV1(selected).file,
    unlockedCount: list.filter(p => p.unlocked).length,
    total: list.length,
    list,
    specialPrize: { ap: IDLE_SPECIAL_PRIZE_AP_V1, claimed: Boolean(specialPrizeClaimed), choice: Number(specialPrizeChoice) === 2 ? "kitty" : (specialPrizeClaimed ? "ap" : "") }
  };
}

/* Action « select » : refuse un portrait verrouillé ou inconnu. */
export function idlePortraitSelectV1(id, env = {}) {
  const p = idlePortraitByIdV1(id);
  if (!p) throw new Error("PORTRAIT_INCONNU");
  if (!idlePortraitUnlockedV1(p, env)) throw new Error("PORTRAIT_VERROUILLE");
  return p.id;
}

function normaliserV1(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/*
 * Choix du fichier R2 (dossier idle/player/) pour un portrait : le nom du fichier du wiki, avec ou
 * sans préfixe (ex. « Portrait_PlayerAPportrait16.png »), comparé sans casse ni séparateurs.
 * Renvoie "" si aucun fichier ne correspond (l'appelant retombe alors sur son comportement par défaut).
 */
export function idlePortraitPickR2KeyV1(keys, portraitFile) {
  const cible = normaliserV1(portraitFile);
  if (!cible || !Array.isArray(keys)) return "";
  const base = k => normaliserV1(String(k).split("/").pop().replace(/\.[^.]+$/, ""));
  const exact = keys.find(k => base(k) === cible);
  if (exact) return exact;
  return keys.find(k => base(k).endsWith(cible)) || "";
}
