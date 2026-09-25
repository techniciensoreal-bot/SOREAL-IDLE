/*
 * SOREAL IDLE — verrous de DIFFICULTÉ des Perks et des Quirks (Norman, 2026-09-25 : « tu fais comme sur le wiki »).
 *
 * Le wiki (pages Perk Points et Quirk Points) marque chaque entrée « Evil only » / « Sadistic only » (colonne Difficulty / Note) ; le calculateur
 * tiers thecaligarmo/ngu-idle-calculators (champ `mode`) donne exactement les mêmes verrous (0 écart sur 232 perks et 186 quirks, contrôle du
 * 2026-09-25). Une entrée n'est achetable — et son effet ne s'applique — que si la difficulté COURANTE est au moins celle qu'elle exige :
 * Normal < Evil < Sadistic. Les niveaux déjà achetés sont conservés (jamais perdus) mais restent inactifs tant que la difficulté est trop basse.
 * Wishes (ajout du 2026-09-25) : les pages Energy / Magic / Resource 3 du wiki listent les souhaits avec une colonne Difficulty (111 lignes
 * recoupées, 0 écart avec la source tierce) ; les 231 souhaits sont Evil (95) ou Sadistic (136) : aucun n'existe en Normal.
 *
 * Identifiants de difficulté du jeu : "normal", "difficile" (= Evil), "extreme" (= Sadistic).
 */
export const IDLE_DIFFICULTE_RANG_V1 = Object.freeze({ normal: 0, difficile: 1, extreme: 2 });

function tableV1(evil, sadistic) {
  const t = {};
  for (const id of evil.split(",").filter(Boolean)) t[Number(id)] = 1;
  for (const id of sadistic.split(",").filter(Boolean)) t[Number(id)] = 2;
  return Object.freeze(t);
}

/* id -> rang de difficulté exigé (1 = Evil, 2 = Sadistic) ; absent = Normal */
export const IDLE_PERK_DIFFICULTE_V1 = tableV1(
  "56,57,58,59,60,61,62,63,64,67,70,71,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,95,96,97,98,99,100,101,102,103,106,107,108,109,110,112,113,114,115,116,117,118,119,120,121,122,123,124,125,145,146,149,150,155,156,161,162,163,164,165,166,167,168,169,170,171,172,173,200,201,208,211,212",
  "126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,147,148,151,152,153,154,157,158,159,160,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,202,203,204,205,206,207,209,210,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231"
);
export const IDLE_QUIRK_DIFFICULTE_V1 = tableV1(
  "14,15,16,17,18,22,23,24,27,28,29,32,33,34,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,71,72,90,99,100,101,102,103,104,105,106,107,108,109,110,111,138,139,146,151,152",
  "61,62,63,64,65,66,67,68,69,70,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,140,141,142,143,144,145,147,148,149,150,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185"
);

export function idleRangDifficulteV1(difficulty) {
  return IDLE_DIFFICULTE_RANG_V1[difficulty] ?? 0;
}

/* Cette entrée est-elle utilisable à la difficulté courante ? */
export function idleDifficulteSuffisanteV1(table, id, difficulty) {
  return (table[Number(id)] || 0) <= idleRangDifficulteV1(difficulty);
}

/* Niveaux réellement ACTIFS : ceux dont la difficulté exigée est atteinte. */
export function idleNiveauxActifsV1(levelsById, table, difficulty) {
  const rang = idleRangDifficulteV1(difficulty);
  const out = {};
  if (!levelsById || typeof levelsById !== "object") return out;
  for (const [id, level] of Object.entries(levelsById)) {
    if ((table[Number(id)] || 0) <= rang) out[id] = level;
  }
  return out;
}

/* Niveaux actifs des perks / quirks d'un état de jeu (state.difficulty = difficulté courante). */
export function idlePerkNiveauxV1(state) {
  return idleNiveauxActifsV1(state?.systems?.perks?.data?.levels, IDLE_PERK_DIFFICULTE_V1, state?.difficulty);
}
export function idleQuirkNiveauxV1(state) {
  return idleNiveauxActifsV1(state?.systems?.quirks?.data?.levels, IDLE_QUIRK_DIFFICULTE_V1, state?.difficulty);
}

/* Souhaits : id -> rang de difficulté exigé (1 = Evil, 2 = Sadistic). */
export const IDLE_WISH_DIFFICULTE_V1 = tableV1(
  "0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,80,103,105,110,115,116,117,118,119,120,154,155,164,169,170,190",
  "79,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,104,106,107,108,109,111,112,113,114,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,156,157,158,159,160,161,162,163,165,166,167,168,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230"
);

/* Souhaits actifs (id -> { level, ... }) : ceux dont la difficulté exigée est atteinte. Les niveaux déjà obtenus ne sont jamais perdus. */
export function idleWishTracksActifsV1(state) {
  const tracks = state?.systems?.wishes?.data?.tracks;
  const out = {};
  if (!tracks || typeof tracks !== "object") return out;
  for (const [id, t] of Object.entries(tracks)) {
    if (idleWishAccessibleV1(state, id)) out[id] = t;
  }
  return out;
}

/*
 * Page Wishes, « Wish upgrades > Challenges » : « Evil Troll Challenge 4 : Unlock the Dual Wielding Wish » (souhait 28) et « Evil Troll Challenge 6 :
 * Unlock Improved Dual Wielding » (souhait 45). id -> nombre de complétions du Troll Challenge Evil requis.
 */
export const IDLE_WISH_TROLL_EVIL_V1 = Object.freeze({ 28: 4, 45: 6 });

/* Souhait accessible : difficulté suffisante ET, pour les souhaits de double arme, le Troll Challenge Evil requis. */
export function idleWishAccessibleV1(state, id) {
  if (!idleDifficulteSuffisanteV1(IDLE_WISH_DIFFICULTE_V1, id, state?.difficulty)) return false;
  const troll = IDLE_WISH_TROLL_EVIL_V1[Number(id)];
  return !troll || Math.floor(Number(state?.challenge?.completionsTier?.difficile?.troll) || 0) >= troll;
}
