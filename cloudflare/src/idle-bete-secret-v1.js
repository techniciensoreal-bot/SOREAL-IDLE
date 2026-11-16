/*
 * Chaîne secrète de la Bête (titan 6) : Norman, 2026-11-16 (« implémente la chaîne secrète d'indices qui débloque la Bête exactement comme le jeu »). Toutes les règles viennent du code du jeu
 * (build 1260, Assembly-CSharp.dll) ; aucune valeur inventée. Rapport : design/audit-code-jeu/boss-at-rebirth.md (E11, section 6) et design/audit-code-jeu/bete-secret.md.
 *
 * Enchaînement (drapeaux du jeu clue1Complete..clue4Complete et titan6Unlocked, rangés dans unlockFlags de l'Aventure) :
 *   179 Note froissée  <- SKELETON GUARDIAN (zone du 6e titan tant que titan6Unlocked est faux), à chaque victoire, niveau 100 (LootDrop::zone19Drop, ennemi de type 12) ;
 *   180 Premier indice <- UUG (LootDrop::checkUUGSecret, fin de zone14Drop) : Anneau d'Apathie de niveau EXACTEMENT 69 porté (InventoryController::apathyCheck == 69) ET la Note déjà au niveau 100 (itemMaxxed[179]) ;
 *   181 Deuxième indice <- Grand Corrupted Tree (checkTreeSecret, fin de zone8Drop) : indice 1 fait ET arme équipée = « A Stick » (id 75) ;
 *   182 Troisième indice <- Jake (checkJakeSecret, fin de zone11Drop) : indices 1 et 2 faits, ni tête, ni torse, ni jambes, ni bottes, ni arme, et pour seuls accessoires le Stapler (id 118) ;
 *   183 Dernier indice <- ITOPOD (checkITOPODSecret, fin de itopodDrop) : indices 1 à 3 faits, étage de départ 0, étage 100, premier kill de l'étage (itopodKillCount == 1) et joueur NU pendant toute la visite
 *       (clue4Eligible : posé à l'entrée dans l'ITOPOD si l'indice 3 est fait, retombe à faux dès que la moindre pièce ou le moindre accessoire est porté lors d'un butin) ;
 *   titan6Unlocked <- Rebirth::checkSpecial (appelée au début de TOUT Rebirth) : les 4 indices faits ET durée de la partie strictement entre 2585 et 2615 secondes ET titan pas encore débloqué.
 * « Vu » (itemDropped) et « au maximum » (itemMaxxed, niveau 100) sont posés AVANT l'ajout au sac (makeLevelledLoot) : même sac plein, et ils restent vrais après usage ou suppression de l'objet.
 * Les objets 180 à 183 sont donnés SANS dédoublonnage (le jeu n'en met aucun) : chaque victoire qui remplit la condition en redonne un.
 * Adaptation SOREAL (l'ITOPOD y est un calcul groupé, sans entrée dans la zone) : une « visite » commence quand le joueur règle ses étages (towerSetFloorsV1, qui recommence au premier ennemi de l'étage
 * de départ), exactement l'équivalent de ZoneSelector::changeZone vers l'ITOPOD ; l'éligibilité se mémorise dans les données de la Tour (`beteElig`, absente = faux).
 * Les textes (noms, descriptions, messages du journal) sont ceux du jeu, en anglais d'origine ; la traduction française est dans design/traductions/fr/misc.json.
 */
/* Chargé d'abord : même ordre d'évaluation des imports circulaires que idle-antlers-v1.js. */
import "./idle-adventure-v47.js";
import { special, record } from "./idle-adventure-objets.js";
import { add } from "./idle-adventure-inventaire.js";

export const IDLE_BETE_OBJETS_V1 = Object.freeze({
  note: "crumpledNote",   /* 179 */
  clue1: "beastClue1",    /* 180 */
  clue2: "beastClue2",    /* 181 */
  clue3: "beastClue3",    /* 182 */
  clue4: "beastClue4"     /* 183 */
});

/* Rebirth::checkSpecial : « totalseconds > 2585 » ET « totalseconds < 2615 » (comparaisons strictes dans l'IL : ble.un / bge.un). */
export const IDLE_BETE_SECONDES_MIN_V1 = 2585;
export const IDLE_BETE_SECONDES_MAX_V1 = 2615;
/* InventoryController::apathyCheck == 69 (checkUUGSecret). */
export const IDLE_BETE_NIVEAU_ANNEAU_V1 = 69;
/* ITOPOD : itopodLevel == 100, itopodStart == 0, itopodKillCount == 1 (checkITOPODSecret). */
export const IDLE_BETE_ETAGE_ITOPOD_V1 = 100;

export const IDLE_BETE_MESSAGES_V1 = Object.freeze({
  squelette: Object.freeze([
    "The Skeleton Guardian lets out a small sigh as it collapses to dust. What on earth was that thing??",
    "You see a small curled note left behind in the dust and fish it out."
  ]),
  uug: Object.freeze([
    "As you deliver your final blow, UUG starts giggling uncontrollably at something...",
    "He laughs so hard his fat rolls start jiggling - and a piece of paper slips out beneath! You snatch it up."
  ]),
  arbre: Object.freeze([
    "Being defeated so embarrasingly, the Grand Corrupted Tree explodes!",
    "You're showered with wood splinters - but amongst them, another clue appears!"
  ]),
  jake: Object.freeze([
    "Jake lets out a wail of terror as he disintegrates!",
    "As his final act, his arm reaches out as it crumbles to dust, leaving you his business card - yet another clue!"
  ]),
  itopod: Object.freeze([
    "One of the Pissed Off Dudes disappears in a flash of smoke - leaving behind a final clue!"
  ]),
  bete: "YOU HAVE RELEASED THE POWER OF THE BEAST! TREMBLE IN FEAR AT YOUR OWN STUPIDITY!"
});

const I = (v, d = 0) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? n : d; };

/* makeLevelledLoot(id, 100) : « vu » et « maximum » posés avant l'ajout, même sac plein. */
function donnerV1(s, definitionId, out) {
  const o = special(definitionId, 100);
  record(s, o);
  const a = add(s, o);
  if (a && Array.isArray(out)) out.push(a);
  return a;
}

function objetPorteV1(s, slot) {
  const id = s && s.equipment && s.equipment[slot];
  if (!id) return null;
  return (s.inventory || []).find(x => x && x.id === id) || null;
}

function accessoiresPortesV1(s) {
  const ids = s && s.equipment && Array.isArray(s.equipment.accessories) ? s.equipment.accessories : [];
  return ids.map(id => (s.inventory || []).find(x => x && x.id === id)).filter(Boolean);
}

/* Aucune des cinq pièces ni aucun accessoire (LootDrop::checkNakedness ; le jeu ne regarde que tête, torse, jambes, bottes, arme et les accessoires). */
export function beteNuV1(s) {
  for (const slot of ["head", "chest", "legs", "boots", "weapon"]) if (objetPorteV1(s, slot)) return false;
  return accessoiresPortesV1(s).length === 0;
}

function indicesFaitsV1(s, n) {
  const f = (s && s.unlockFlags) || {};
  for (let i = 1; i <= n; i++) if (!f["clue" + i + "Complete"]) return false;
  return true;
}

/* LootDrop::zone19Drop, ennemi de type 12 (SKELETON GUARDIAN) : la Note (niveau 100), aucun or ni EXP. */
export function beteSqueletteButinV1(s, out) {
  const a = donnerV1(s, IDLE_BETE_OBJETS_V1.note, out);
  return { objet: a, messages: IDLE_BETE_MESSAGES_V1.squelette.slice() };
}

/* LootDrop::checkUUGSecret (méthode 542) : Anneau d'Apathie de niveau 69 porté + Note au niveau 100 -> Premier indice. */
export function beteIndiceUUGV1(s, out) {
  const anneau = accessoiresPortesV1(s).find(o => o.definitionId === "ringOfApathy");
  if (!anneau || I(anneau.level, -1) !== IDLE_BETE_NIVEAU_ANNEAU_V1) return null;
  const note = s.itemList && s.itemList[IDLE_BETE_OBJETS_V1.note];
  if (!note || I(note.maxLevel, -1) < 100) return null;
  const a = donnerV1(s, IDLE_BETE_OBJETS_V1.clue1, out);
  s.unlockFlags.clue1Complete = true;
  return { indice: 1, objet: a, messages: IDLE_BETE_MESSAGES_V1.uug.slice() };
}

/* LootDrop::checkTreeSecret (méthode 543) : indice 1 fait + arme équipée « A Stick » (id 75, training:weapon) -> Deuxième indice. */
export function beteIndiceArbreV1(s, out) {
  if (!indicesFaitsV1(s, 1)) return null;
  const arme = objetPorteV1(s, "weapon");
  if (!arme || arme.definitionId !== "training:weapon") return null;
  const a = donnerV1(s, IDLE_BETE_OBJETS_V1.clue2, out);
  s.unlockFlags.clue2Complete = true;
  return { indice: 2, objet: a, messages: IDLE_BETE_MESSAGES_V1.arbre.slice() };
}

/* LootDrop::checkJakeSecret (méthode 544) : indices 1 et 2 faits, aucune pièce, seul accessoire = Stapler (id 118) -> Troisième indice. */
export function beteIndiceJakeV1(s, out) {
  if (!indicesFaitsV1(s, 2)) return null;
  for (const slot of ["head", "chest", "legs", "boots", "weapon"]) if (objetPorteV1(s, slot)) return null;
  const accs = accessoiresPortesV1(s);
  if (!accs.some(o => o.definitionId === "stapler")) return null;
  if (accs.some(o => o.definitionId !== "stapler")) return null;
  const a = donnerV1(s, IDLE_BETE_OBJETS_V1.clue3, out);
  s.unlockFlags.clue3Complete = true;
  return { indice: 3, objet: a, messages: IDLE_BETE_MESSAGES_V1.jake.slice() };
}

/*
 * LootDrop::checkITOPODSecret (méthode 546), appelée à chaque kill de l'ITOPOD. `d` = données de la Tour (étage de départ `startFloor`, éligibilité `beteElig`), `floor` = étage des kills,
 * `n` = nombre de kills, `killsAvant` = kills déjà faits sur cet étage (0 : le premier de ces kills est le premier de l'étage, itopodKillCount == 1). La nudité est testée à chaque butin
 * (checkNakedness) : elle ne fait que RETIRER l'éligibilité, jamais la rendre.
 */
export function beteItopodV1(s, d, floor, n, killsAvant) {
  if (!s || !d || !(n > 0) || !indicesFaitsV1(s, 3)) return null;
  if (!beteNuV1(s)) d.beteElig = false;
  if (floor !== IDLE_BETE_ETAGE_ITOPOD_V1 || d.startFloor !== 0 || d.beteElig !== true || I(killsAvant, -1) !== 0) return null;
  const a = donnerV1(s, IDLE_BETE_OBJETS_V1.clue4, null);
  s.unlockFlags.clue4Complete = true;
  return { indice: 4, objet: a, messages: IDLE_BETE_MESSAGES_V1.itopod.slice() };
}

/* Début d'une visite de l'ITOPOD (étages réglés) : éligible seulement si l'indice 3 est fait (ZoneSelector::changeZone). */
export function beteDebutVisiteV1(s, d) {
  if (!d) return;
  if (s && s.unlockFlags && s.unlockFlags.clue3Complete) d.beteElig = true;
}

/* Rebirth::checkSpecial (méthode 2675) : les 4 indices faits, durée de partie strictement entre 2585 et 2615 s, titan pas encore débloqué -> titan6Unlocked. Renvoie vrai si débloqué à l'instant. */
export function beteSpecialRebirthV1(state, runSeconds) {
  const adv = state && state.adventure;
  const f = adv && adv.unlockFlags;
  if (!f || !indicesFaitsV1(adv, 4) || f.titan6Unlocked) return false;
  if (!(runSeconds > IDLE_BETE_SECONDES_MIN_V1 && runSeconds < IDLE_BETE_SECONDES_MAX_V1)) return false;
  f.titan6Unlocked = true;
  return true;
}

/* Fin du butin d'un titan (rollTitanLootV1) : UUG (t4), Grand Corrupted Tree (t2), Jake (t3) ; la Bête elle-même ne donne rien ici. */
export function beteSecretsTitanV1(s, id, out) {
  if (id === "skeleton") return beteSqueletteButinV1(s, out);
  if (id === "t4") return beteIndiceUUGV1(s, out);
  if (id === "t2") return beteIndiceArbreV1(s, out);
  if (id === "t3") return beteIndiceJakeV1(s, out);
  return null;
}
