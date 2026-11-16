/*
 * Chaîne secrète de l'Exilé (« Antlers of the Exile » / Docteur Wahwee) : Norman, 2026-11-16 (« on va entamer ce chantier tant qu'aucun joueur n'est
 * encore à ce stade » ; « tout objet du jeu doit exister dans SOREAL »). Toutes les règles viennent du code du jeu (build 1260, Assembly-CSharp.dll),
 * rapport complet : design/audit-code-jeu/antlers-wahwee.md. Aucune valeur inventée ; les méthodes du jeu sont citées à côté de chaque règle.
 *
 * Les sept objets (ids du jeu 335 à 341, clés SOREAL dans idle-adventure-sets.js SPECIALS) s'enchaînent :
 *   335 Sceau  <- Prêtre d'Exilé sans le sceau en arme ;   336 Visage <- Prêtre avec le sceau (335) en arme ;
 *   337 Tentacule <- ITOPOD étages 950 à 999, exige 336 déjà vu ;
 *   338 Bois (indice) <- quête de la Bête rendue à la main, jauge idle entre 90 % et 100 %, exige 337 déjà vu ;
 *   339 Buster (indice) <- Docteur Wahwee (boss des Mégaterres), pièce de set Mega tirée, set Mega complet porté, exige 338 déjà vu ;
 *   340 Antennes (indice) <- Hack Hack avec R3 = plafond total - 1, exige 339 déjà vu ;
 *   341 Sac <- titans Exilé (exileSpecial, hors périmètre ici : le drop de titan 341 dépend du drapeau exileComplete, voir le rapport §1).
 * « Vu » (ItemList.itemDropped) est posé AVANT l'ajout au sac, donc même sac plein, et reste vrai après usage ou suppression de l'objet.
 */
/* Chargé d'abord : ce module peut être atteint par idle-questing-v1.js ; entrer par le moteur d'Aventure garde l'ordre d'évaluation des imports circulaires. */
import "./idle-adventure-v47.js";
import { special, record } from "./idle-adventure-objets.js";
import { add, inventoryCapacityAdventureV1, syncInventorySlotsAdventureV2 } from "./idle-adventure-inventaire.js";
import { idleNguEffectiveResourceStatV1 } from "./idle-ngu-ressources.js";

export const IDLE_EXILE_OBJETS_V1 = Object.freeze({
  seal: "sealExile",           /* 335 */
  face: "faceExile",           /* 336 */
  tentacle: "exileClueTentacle", /* 337 */
  antlers: "exileClueAntlers", /* 338 */
  buster: "exileClueBuster",   /* 339 */
  antennae: "exileClueAntennae", /* 340 */
  sack: "sackExile"            /* 341 */
});

/* ITOPOD : LootDrop::checkExileDrop (méthode 547) : étages 950 à 999 inclus, probabilité (étage - 949) x 0,0001 par kill, sans facteur de loot. */
export const IDLE_EXILE_ITOPOD_ETAGE_MIN_V1 = 950;
export const IDLE_EXILE_ITOPOD_ETAGE_MAX_V1 = 999;
export function idleExileItopodChanceV1(floor) {
  const f = Math.floor(Number(floor) || 0);
  if (f < IDLE_EXILE_ITOPOD_ETAGE_MIN_V1 || f > IDLE_EXILE_ITOPOD_ETAGE_MAX_V1) return 0;
  return (f - 949) * 0.0001;
}

/* Hack Hack : HacksController::checkExilePiece (méthode 3180), InvokeRepeating toutes les 60 s ; Hack n°13 de la liste du jeu = « Hack Hack » (totalWishSpeedBonus lit le n°14 = Wish Hack). */
export const IDLE_EXILE_HACK_PERIODE_S_V1 = 60;

/* Assemblage : InventoryController::exileAssembled / exileSpecialAssembled (méthodes 3770 et 3771) : cases du sac (rangées de 12) et zone « 1 » du jeu = Égouts. */
export const IDLE_EXILE_ASSEMBLAGE_V1 = Object.freeze({
  minEmplacements: 24,
  zone: "sewers",
  cases: Object.freeze({ 0: "exileClueAntennae", 1: "faceExile", 2: "exileClueAntlers", 12: "exileClueBuster", 14: "exileClueTentacle" }),
  caseSac: 13
});

export function exileVuV1(s, definitionId) {
  return Boolean(s && s.itemList && s.itemList[definitionId] && s.itemList[definitionId].seen);
}

/* markItemAsDropped puis ajout : « vu » même si le sac est plein (l'objet est alors perdu, comme dans le jeu). */
export function exileDonnerV1(s, definitionId, out) {
  record(s, special(definitionId, 0));
  const o = add(s, special(definitionId, 0));
  if (o && Array.isArray(out)) out.push(o);
  return o;
}

function definitionEquipeeV1(s, slot) {
  const id = s && s.equipment && s.equipment[slot];
  if (!id) return "";
  const o = (s.inventory || []).find(x => x && x.id === id);
  return o ? String(o.definitionId || "") : "";
}

/* Prêtre d'Exilé, LootDrop::zone30Drop (méthode 518) : arme équipée = Sceau (335) -> Visage (336), sinon -> Sceau (335). Aucun or ni EXP. */
export function exilePretreButinV1(s, out) {
  const avecSceau = definitionEquipeeV1(s, "weapon") === IDLE_EXILE_OBJETS_V1.seal;
  return exileDonnerV1(s, avecSceau ? IDLE_EXILE_OBJETS_V1.face : IDLE_EXILE_OBJETS_V1.seal, out);
}

/*
 * ITOPOD : n kills sur l'étage `floor`. Pour chaque kill le jeu tire un nombre et réussit si tirage <= p ; ici n tirages équivalents par saut géométrique
 * (aucun dédoublonnage : plusieurs 337 possibles, plafonné à 200 par appel comme les boosts de l'ITOPOD). Exige 336 déjà vu.
 */
export function exileItopodV1(s, floor, n, rng = Math.random) {
  const out = [];
  const p = idleExileItopodChanceV1(floor);
  if (!(p > 0) || !(n > 0) || !exileVuV1(s, IDLE_EXILE_OBJETS_V1.face)) return out;
  let restant = Math.floor(n);
  for (let essais = 0; restant > 0 && essais < 200; essais++) {
    const u = Math.max(1e-300, Number(rng()) || 0);
    const ecart = Math.floor(Math.log(u) / Math.log(1 - p));
    if (!(ecart < restant)) break;
    restant -= ecart + 1;
    exileDonnerV1(s, IDLE_EXILE_OBJETS_V1.tentacle, out);
  }
  return out;
}

/*
 * Quête de la Bête : BeastQuestController::giveRewardsAndClear (méthodes 1241/1242) : rendue à la main (idle COUPÉ), aucun objet venu de l'idle
 * (allActive = NON usedIdle), jauge idle entre 90 % et 100 % inclus, Tentacule (337) déjà vu -> Bois de l'Exilé (338).
 * Le rendu automatique de l'idle (idle actif) n'en donne jamais.
 */
export function exileIndiceBeteV1(adventure, idleActif, quete) {
  if (!adventure || !quete) return null;
  if (idleActif || quete.usedIdle) return null;
  const barre = Number(quete.idleBar) || 0;
  if (!(barre >= 0.9 && barre <= 1)) return null;
  if (!exileVuV1(adventure, IDLE_EXILE_OBJETS_V1.tentacle)) return null;
  return exileDonnerV1(adventure, IDLE_EXILE_OBJETS_V1.antlers);
}

/*
 * Docteur Wahwee : LootDrop::zone13Drop (méthode 501), branche boss : le tirage d'une pièce Mega doit avoir RÉUSSI (`tirageMegaReussi`), puis Bois (338)
 * déjà vu ET tête 130, torse 131, jambes 132, bottes 133, arme 134 équipés (pièces de base, quel que soit le niveau) -> Buster (339), sans autre aléa.
 */
export function exileWahweeV1(s, tirageMegaReussi) {
  if (!tirageMegaReussi || !exileVuV1(s, IDLE_EXILE_OBJETS_V1.antlers)) return null;
  for (const slot of ["head", "chest", "legs", "boots", "weapon"]) {
    if (definitionEquipeeV1(s, slot) !== "mega:" + slot) return null;
  }
  return exileDonnerV1(s, IDLE_EXILE_OBJETS_V1.buster);
}

/*
 * Hack Hack : HacksController::checkExilePiece (méthode 3180) est lancée par InvokeRepeating(60 s, 60 s) dans HacksController::Start (méthode 3178) : une minuterie CONTINUE, qui tourne
 * que la condition soit tenue ou non et qui teste la condition à chaque échéance (60 s, 120 s...). Condition (R3 allumée, Hack n°13 avec R3 = plafond total - 1, Buster 339 déjà vu) -> une paire d'Antennes (340).
 * Reproduction : la phase de la minuterie (data.exilePhaseS, 0 à 60 s) avance de tout le temps joué ; chaque échéance franchie pendant la synchro teste la condition sur l'état de la synchro (constant
 * entre deux actions du joueur : toute action synchronise d'abord). InvokeRepeating ne tourne pas hors connexion (le jeu ne rejoue pas ses minuteries) : une synchro de 5 minutes ou plus (même seuil
 * « hors ligne » que le farm d'Aventure) remet la phase à 0, comme une nouvelle ouverture du jeu (la première échéance tombe 60 s après le démarrage).
 */
export function exileHackV1(state, seconds, enLigne = true) {
  const hacks = state && state.systems && state.systems.hacks;
  const adv = state && state.adventure;
  if (!hacks || !hacks.data || !adv) return [];
  const d = hacks.data;
  if (!enLigne) {
    if (d.exilePhaseS !== undefined) delete d.exilePhaseS;
    return [];
  }
  const total = Math.max(0, Number(d.exilePhaseS) || 0) + Math.max(0, Number(seconds) || 0);
  const echeances = Math.floor(total / IDLE_EXILE_HACK_PERIODE_S_V1);
  const phase = total - echeances * IDLE_EXILE_HACK_PERIODE_S_V1;
  if (phase > 0 || d.exilePhaseS !== undefined) d.exilePhaseS = phase;   /* temps nul : l'état ne change pas (SOREAL_IDLE_VERIF_TEMPS_NUL) */
  if (!(echeances > 0) || !hacks.unlocked) return [];
  const cap = Math.floor(idleNguEffectiveResourceStatV1(state, "r3", "cap"));
  const tient = d.activeTrack === "hackHack"
    && exileVuV1(adv, IDLE_EXILE_OBJETS_V1.buster)
    && cap - 1 >= 0
    && Number(hacks.allocation && hacks.allocation.r3) === cap - 1;
  if (!tient) return [];
  const out = [];
  for (let i = 0; i < echeances && out.length < 50; i++) exileDonnerV1(adv, IDLE_EXILE_OBJETS_V1.antennae, out);
  return out;
}

function definitionDansCaseV1(s, index) {
  const slots = s.inventorySlots || [];
  const id = slots[index];
  if (!id) return "";
  const o = (s.inventory || []).find(x => x && x.id === id);
  return o ? String(o.definitionId || "") : "";
}

export function exileAssembleV1(s) {
  syncInventorySlotsAdventureV2(s);
  if (inventoryCapacityAdventureV1(s) < IDLE_EXILE_ASSEMBLAGE_V1.minEmplacements) return { assemble: false, special: false };
  if (s.selectedZone !== IDLE_EXILE_ASSEMBLAGE_V1.zone) return { assemble: false, special: false };
  for (const [i, def] of Object.entries(IDLE_EXILE_ASSEMBLAGE_V1.cases)) {
    if (definitionDansCaseV1(s, Number(i)) !== def) return { assemble: false, special: false };
  }
  return { assemble: true, special: definitionDansCaseV1(s, IDLE_EXILE_ASSEMBLAGE_V1.caseSac) === IDLE_EXILE_OBJETS_V1.sack };
}

const PIECES_ASSEMBLABLES_V1 = Object.freeze(["faceExile", "exileClueTentacle", "exileClueAntlers", "exileClueBuster", "exileClueAntennae", "sackExile"]);

/* Textes du jeu annoncés à l'assemblage (ItemController::consumeItem, méthode 3794, infobulles) ; traduits par le serveur (design/traductions/fr/misc.json). */
export const IDLE_EXILE_MESSAGES_V1 = Object.freeze({
  debloque: "The pieces vibrate with the mystical voodoo energy that only unlocking something can generate. You can now face THE EXILE in Adventure mode!",
  recompenseSpeciale: "The ground beneath you rumbles and shakes violently for a moment, like an earthquake. You're sure something has changed about the Exile, but you can't see it yet.",
  lecher: "You're overcome with a desire to individually lick every piece of the Exile, which of course you succumb to. It takes 30 minutes to give each piece a proper tongue polishing until they sparkle in the noon sun... you gross bastard."
});

/*
 * « Utiliser » une pièce (ItemController::consumeItem, méthode 3794, objets 336 à 341 retirables) : rien n'est consommé. Avec le Sac (341) à la case 13 (exileSpecialAssembled) :
 * si l'Exilé n'est pas encore débloqué -> rien ; sinon titan9SpecialReward + message du tremblement. Sans le Sac, assemblage complet (exileAssembled) : première fois -> titan9Unlocked
 * + message ; ensuite un message (« lécher les pièces »). Assemblage incomplet : rien, sans message (comme le jeu). Une pièce verrouillée n'est pas retirable : rien.
 */
export function exileUtiliserPieceV1(s, itemId) {
  const o = (s.inventory || []).find(x => x && String(x.id) === String(itemId || ""));
  if (!o) throw Error("OBJET_INTROUVABLE");
  if (!PIECES_ASSEMBLABLES_V1.includes(o.definitionId)) throw Error("OBJET_NON_ASSEMBLABLE");
  const rien = { assemble: false, special: false, debloque: false, recompenseSpeciale: false };
  if (o.locked) return rien;
  const etat = exileAssembleV1(s);
  const flags = s.unlockFlags;
  if (etat.special) {
    if (!flags.titan9Unlocked) return { assemble: true, special: true, debloque: false, recompenseSpeciale: false };
    flags.titan9SpecialReward = true;
    return { assemble: true, special: true, debloque: false, recompenseSpeciale: true, message: IDLE_EXILE_MESSAGES_V1.recompenseSpeciale };
  }
  if (!etat.assemble) return rien;
  if (!flags.titan9Unlocked) {
    flags.titan9Unlocked = true;
    return { assemble: true, special: false, debloque: true, recompenseSpeciale: false, message: IDLE_EXILE_MESSAGES_V1.debloque };
  }
  return { assemble: true, special: false, debloque: false, recompenseSpeciale: false, message: IDLE_EXILE_MESSAGES_V1.lecher };
}
