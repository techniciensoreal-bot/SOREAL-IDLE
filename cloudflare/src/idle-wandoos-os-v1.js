/*
 * Niveaux d'OS Wandoos par consommation des copies "A busted copy of Wandoos
 * 98 / XL" et déblocage de Wandoos XL (2026-09-23).
 *
 * Sources (miroir local NGU-Wiki, Règle n°1 d'AGENTS.md) :
 *  - page "Wandoos", "Leveling up the OS" : "Wandoos 98 Levels, earned by
 *    consuming A busted copy of Wandoos 98 higher than your current level" /
 *    "Wandoos XL Levels, earned by consuming A busted copy of Wandoos XL higher
 *    than your current level" ; "requires to consume (CTRL+click) ... of a
 *    higher level than your current OS level" ; "If the item is several levels
 *    higher than your current OS level, the surplus levels will be left" ;
 *    "Max level is 100, requiring a total of 5,050 levels".
 *  - fiche "A busted copy of Wandoos 98" : "Upgrading costs a number of levels
 *    equal to the new Wandoos OS Level" (1 + 2 + ... + 100 = 5 050, cohérent).
 *    Chaque consommation donne donc +1 niveau d'OS et retire (niveau actuel + 1)
 *    niveaux à la copie, qui reste dans l'inventaire avec le surplus.
 *  - fiche "A busted copy of Wandoos XL" : "You take out the Wandoos XL
 *    installation disc and break it into little pieces ... you just unlocked
 *    Wandoos XL!" -- la première copie consommée débloque l'OS XL (et est
 *    détruite) ; les suivantes montent le niveau d'OS XL comme pour Wandoos 98.
 *  - page "Wandoos", "Boot-up" : "The boot-up process can be sped up by 10% by
 *    maxing the Wandoos XL set ... 60 minutes x 90% for the Wandoos XL set x 50%
 *    for five 100-level Evil challenges" -> facteur 0,9 sur la durée du boot.
 *
 * Le déblocage de Wandoos 98 lui-même reste le drapeau unlockItems existant
 * (consumeUnlock, idle-adventure-v47.js) : ici on ne fait que les niveaux d'OS.
 * CHOIX SOREAL : une copie consommée au-delà du niveau d'OS 100 est refusée
 * (le jeu la fait "exploser" sans effet) plutôt que détruite.
 */

const N = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const I = (v, d = 0) => Math.floor(N(v, d));

const MAX_NIVEAU_OS_PAR_SOURCE_V1 = 100;
const COPIES_V1 = Object.freeze({
  wandoos98: "consumed98",
  wandoosXl: "consumedXl"
});

export function idleWandoosXlUnlockedV1(state) {
  return Boolean(state?.adventure?.unlockFlags?.wandoosXl);
}

/* Wandoos XL (set) : durée du boot x (1 - 10 %). */
export function idleWandoosBootMultiplierV1(state) {
  const reduction = Math.max(0, Math.min(1, N(state?.adventure?.setRewards?.wandoosBootReductionPct, 0)));
  return 1 - reduction;
}

function retirerObjet(adventure, id) {
  for (const slot of ["head", "chest", "legs", "boots", "weapon"]) {
    if (adventure.equipment && adventure.equipment[slot] === id) adventure.equipment[slot] = "";
  }
  if (adventure.equipment && Array.isArray(adventure.equipment.accessories)) {
    adventure.equipment.accessories = adventure.equipment.accessories.filter((x) => x !== id);
  }
  adventure.inventory = adventure.inventory.filter((x) => x.id !== id);
}

export function idleWandoosConsumeCopyV1(state, itemId) {
  const wandoos = state?.systems?.wandoos;
  if (!wandoos?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const adventure = state.adventure;
  const inventaire = Array.isArray(adventure?.inventory) ? adventure.inventory : [];
  const objet = inventaire.find((x) => x && x.id === String(itemId || ""));
  const cle = objet ? COPIES_V1[objet.definitionId] : "";
  if (!objet || !cle) throw new Error("COPIE_WANDOOS_INVALIDE");

  if (objet.definitionId === "wandoosXl" && !idleWandoosXlUnlockedV1(state)) {
    adventure.unlockFlags = adventure.unlockFlags && typeof adventure.unlockFlags === "object" ? adventure.unlockFlags : {};
    adventure.unlockFlags.wandoosXl = true;
    retirerObjet(adventure, objet.id);
    /* Le client n'accepte un inventaire serveur que si sa révision avance (même règle que le Daycare). */
    adventure.revision = Math.max(0, I(adventure.revision, 0)) + 1;
    return { unlocked: "xl", definitionId: objet.definitionId };
  }

  if (!wandoos.data || typeof wandoos.data !== "object") wandoos.data = {};
  const niveaux = wandoos.data.osLevels && typeof wandoos.data.osLevels === "object"
    ? wandoos.data.osLevels
    : (wandoos.data.osLevels = { moneyPit: 0, consumed98: 0, consumedXl: 0 });
  const actuel = Math.max(0, I(niveaux[cle], 0));
  if (actuel >= MAX_NIVEAU_OS_PAR_SOURCE_V1) throw new Error("OS_NIVEAU_MAX");
  const nouveau = actuel + 1;
  const niveauObjet = Math.max(0, I(objet.level, 0));
  if (niveauObjet < nouveau) throw new Error("NIVEAU_COPIE_INSUFFISANT");
  objet.level = niveauObjet - nouveau;
  niveaux[cle] = nouveau;
  adventure.revision = Math.max(0, I(adventure.revision, 0)) + 1;
  return { definitionId: objet.definitionId, osLevel: nouveau, source: cle, remainingItemLevel: objet.level };
}
