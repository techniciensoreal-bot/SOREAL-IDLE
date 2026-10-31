/*
 * Apparences (« skins ») du chat de la Garderie (2026-10-31) : l'armoire devient un chat-étagère parmi 11. Images R2 : idle/garderie-skins/<id>.webp
 * (route /api/idle/media/garderie-skin?id=<id>, idle-media-v1.js). Choix cosmétique stocké dans state.records.daycareSkin (identifiant TEXTE,
 * exclu de la coercion des records en compteurs, idle-ngu-etat.js).
 *
 * Conditions (wiki NGU Idle, pages Daycare Kitty / Item Daycare / Wishes / Fibonacci Perk / 4G's Sellout Shop, vérifiées par Norman) :
 *  - defaut : toujours possédé ;
 *  - noeud (« pretty kitty ») : choix du chaton au « Special Prize » (state.records.specialPrizeChoice === 2, y compris le rattrapage d'un
 *    Special Prize réclamé avant l'existence du choix, comme portraitEnvV1) ;
 *  - arcenciel (Nyankitty) : souhait n°44 « I wish there was more cute Daycare Kitty Art » au niveau 1 ;
 *  - fibonacci : niveau 1597 du perk Fibonacci (id 94, cap 1597) ;
 *  - matrix : achat « Daycare Kitty Art! » (4G's Sellout Shop, 250 000 AP). Le wiki parle de « plusieurs nouveaux designs » mais ne nomme que
 *    Matrix : seul Matrix est rattaché ;
 *  - dore, chauvesouris, tchernobyl, pirate, noel, nega : condition NON PUBLIÉE par le wiki (pages Daycare Kitty, Item Daycare, Wishes, Sellout
 *    Shop consultées : aucune ne dit comment les obtenir). Aucune condition inventée : `condition: null` = jamais possédés pour l'instant
 *    (décision de Norman à venir).
 * Anti-spoil (règle n°2) : l'état client ne contient QUE les ids possédés, jamais de total ni de skin non possédé.
 */

export const IDLE_DAYCARE_SKIN_DEFAUT_V1 = "defaut";
export const IDLE_DAYCARE_FIBONACCI_PERK_ID_V1 = 94;
export const IDLE_DAYCARE_FIBONACCI_NIVEAU_V1 = 1597;
export const IDLE_DAYCARE_WISH_ART_ID_V1 = 44;

/* [id, condition] : condition = null → jamais possédé (non publiée). */
const TABLE_V1 = [
  ["defaut", { type: "defaut" }],
  ["noeud", { type: "specialPrize" }],
  ["arcenciel", { type: "wish", wish: IDLE_DAYCARE_WISH_ART_ID_V1 }],
  ["fibonacci", { type: "perk", perk: IDLE_DAYCARE_FIBONACCI_PERK_ID_V1, level: IDLE_DAYCARE_FIBONACCI_NIVEAU_V1 }],
  ["dore", null],
  ["matrix", { type: "achat", achat: "daycareKittyArt" }],
  ["chauvesouris", null],
  ["tchernobyl", null],
  ["pirate", null],
  ["noel", null],
  ["nega", null]
];

export const IDLE_DAYCARE_SKINS_V1 = Object.freeze(TABLE_V1.map(([id, condition]) => Object.freeze({ id, condition: condition ? Object.freeze(condition) : null })));
export const IDLE_DAYCARE_SKIN_IDS_V1 = Object.freeze(IDLE_DAYCARE_SKINS_V1.map((s) => s.id));

function nombreV1(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/*
 * env : { specialPrizeChoice (0/1/2), wishLevel(id), perkLevel(id), achats(id) → quantité achetée à la Sellout Shop }.
 * Un env incomplet = condition non remplie.
 */
export function skinPossedeV1(skin, env = {}) {
  const c = skin.condition;
  if (!c) return false;
  if (c.type === "defaut") return true;
  if (c.type === "specialPrize") return nombreV1(env.specialPrizeChoice) === 2;
  if (c.type === "wish") return typeof env.wishLevel === "function" && nombreV1(env.wishLevel(c.wish)) >= 1;
  if (c.type === "perk") return typeof env.perkLevel === "function" && nombreV1(env.perkLevel(c.perk)) >= c.level;
  if (c.type === "achat") return typeof env.achats === "function" && nombreV1(env.achats(c.achat)) >= 1;
  return false;
}

export function skinsPossedesV1(state, env = {}) {
  void state;
  return IDLE_DAYCARE_SKINS_V1.filter((s) => skinPossedeV1(s, env)).map((s) => s.id);
}

/* Skin choisi si encore possédé, sinon « defaut ». */
export function skinActifV1(state, env = {}) {
  const choix = String(state?.records?.daycareSkin || "");
  return choix && skinsPossedesV1(state, env).includes(choix) ? choix : IDLE_DAYCARE_SKIN_DEFAUT_V1;
}

/* Action « daycareSkin » : refuse un skin inconnu ou non possédé. Renvoie l'id retenu. */
export function choisirSkinV1(state, id, env = {}) {
  const skin = String(id || "");
  if (!IDLE_DAYCARE_SKIN_IDS_V1.includes(skin)) throw new Error("SKIN_GARDERIE_INCONNU");
  if (!skinsPossedesV1(state, env).includes(skin)) throw new Error("SKIN_GARDERIE_VERROUILLE");
  state.records.daycareSkin = skin;
  return skin;
}

/* Pièce d'état client : { actif, possedes } (ids possédés uniquement). */
export function skinsSnapshotV1(state, env = {}) {
  return { actif: skinActifV1(state, env), possedes: skinsPossedesV1(state, env) };
}
