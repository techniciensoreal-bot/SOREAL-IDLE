/*
 * SOREAL IDLE — mise à l'échelle des objets équipés par le boss atteint (alignement sur le code du jeu, build 1260, audit design/audit-code-jeu/sets-bonus.md, 2026-11-16 ; Norman : « aligne-toi sur le jeu »).
 *
 * Lu dans le jeu (IL) : InventoryController::equipAttackBonus (3604), equipDefenseBonus (3605) et equipSpecBonus (3606) retournent, pour CHAQUE valeur d'un objet équipé
 * (Power, Toughness, spec1, spec2, spec3), floor( valeur x min(1, Character::effectiveBossID / Equipment.bossRequired) ). HP = somme des Power mis à l'échelle x 3 (3596),
 * Regen = somme des Toughness mis à l'échelle x 0,03. Character::effectiveBossID (2237) = bossID (boss tués dans le Rebirth en cours, remis à 0 à chaque Rebirth) + 301 si la
 * difficulté du Rebirth est >= Evil + 301 de plus si >= Sadistic. Un objet sans bossRequired (0) n'est jamais mis à l'échelle.
 *
 * Table générée depuis le champ bossRequired de ItemNameDesc::constructItemInfo (515 objets, 158 équipables concernés : paliers 20, 33, 58, 67, 82, 100). Clé = identifiant d'objet du jeu
 * (wikiItemId, IDLE_ADVENTURE_WIKI_ITEM_IDS_V1). Les consommables (182, 183, 191) et les objets non portés (342, 335) n'y figurent pas.
 */
export const IDLE_BOSS_REQUIS_PALIERS_V1 = Object.freeze({
  20: Object.freeze([68,69,70,71,72,73,74,435]),
  33: Object.freeze([78,79,80,81,82,83,84,85,86,87,88,89,90]),
  58: Object.freeze([76,95,96,97,98,99,100,101]),
  67: Object.freeze([94]),
  82: Object.freeze([103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,122,123,124,125,126,127,128,130,131,132,133,134,439,440,441]),
  100: Object.freeze([136,137,138,139,140,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,164,165,166,167,168,169,170,173,174,175,176,177,178,184,185,186,187,188,189,190,192,193,194,195,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,295,296,442,444,445,446,447,448,449,450,451,452]),
});
export const IDLE_BOSS_REQUIS_V1 = (() => {
  const t = Object.create(null);
  for (const [palier, ids] of Object.entries(IDLE_BOSS_REQUIS_PALIERS_V1)) for (const id of ids) t[id] = Number(palier);
  return Object.freeze(t);
})();
/* Facteur du jeu : min(1, boss effectif / bossRequired). Sans boss effectif connu (null) ou objet sans palier : 1 (aucune échelle). */
export function idleBossRequisFacteurV1(wikiItemId, bossEffectif) {
  if (bossEffectif === null || bossEffectif === undefined || !Number.isFinite(bossEffectif)) return 1;
  const requis = IDLE_BOSS_REQUIS_V1[wikiItemId] || 0;
  if (!(requis > 0)) return 1;
  return Math.min(1, Math.max(0, bossEffectif) / requis);
}
/* floor(valeur x facteur) du jeu ; valeur intacte quand le facteur vaut 1. */
export function idleBossRequisEchelleV1(valeur, facteur) {
  const v = Number(valeur) || 0;
  if (!(facteur < 1)) return v;
  return Math.floor(v * facteur + 1e-9);
}
