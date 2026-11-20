/*
 * Chaîne secrète de la Marraine (titan 8) : Norman, 2026-11-20 (« implémente tout »). Toutes les règles viennent du code du jeu (build 1260, Assembly-CSharp.dll) ; aucune valeur inventée.
 * Méthodes du jeu citées à côté de chaque règle.
 *
 *  1. Le CONSIGLIERE (LootDrop::zone26Drop, ennemi de type 22 ; AdventureController::spawnEnemy, zone 26) : tant que `titan8Unlocked` est faux, la zone du 8e titan fait apparaître THE CONSIGLIERE à la place
 *     de la Marraine (Attaque 2, Power 6e17, Toughness 6e17, Regen 6e16, PV 6e19 : createEnemyTable ; IDLE_TITAN_COMBAT_V1.consigliere). Sa mort ne donne ni or ni EXP ni compteur de titans :
 *       - si les CINQ noms sont rayés (skeletonWhacked, icarusWhacked, kingCircleWhacked, robBossWhacked, emptyNameWhacked) : `titan8Unlocked` = vrai (la Marraine apparaît) ;
 *       - sinon : `titan8questStarted` = vrai et une Death Note (288, niveau 100, makeTitanLevelledLoot) est donnée ; à chaque victoire tant que la liste n'est pas complète.
 *  2. Les cinq noms (LootDrop::zone2Drop, zone4Drop, zone9Drop, zone15Drop, zone10Drop) : une fois la quête commencée (`titan8questStarted`) et tant que la Marraine n'est pas débloquée, tuer l'ennemi nommé raye son
 *     nom (Skeleton de la Forêt, Icarus Proudbottom du Ciel, KING CIRCLE de l'Univers 2D, Rob Boss du Beardverse, l'ennemi au nom vide du Champ de bataille ancien) ; le tuer encore dit qu'il est déjà rayé.
 *  3. L'infobulle de la Death Note (InventoryController::itemTooltipText) liste Skeleton, Icarus Proudbottom, King Circle et Rob Boss (grisés une fois rayés), un « trou » dans la liste (le nom vide), puis un message
 *     de fin : « head back to the Consigliere » quand les CINQ sont rayés, « that blank space still gives you the spoops » quand les quatre noms visibles le sont mais pas le nom vide. Rendu côté page : modules/exile-glop-v1.js.
 * Les textes sont ceux du jeu (anglais d'origine, traduits par le serveur sur la réponse : design/traductions/fr/misc.json).
 */
import "./idle-adventure-v47.js";
import { special, record } from "./idle-adventure-objets.js";
import { add } from "./idle-adventure-inventaire.js";
import { IDLE_DEATH_NOTE_TEXTES_V1 } from "./idle-adventure-descriptions-v1.js";

export const IDLE_MARRAINE_OBJETS_V1 = Object.freeze({ note: "deathNote" });   /* 288 */
export const IDLE_MARRAINE_NIVEAU_NOTE_V1 = 100;

const DEJA_V1 = (nom) => [`Hey genius, <b>${nom}</b> has already been crossed off the Death Note!`, "Now you're just whacking off for fun."];

/*
 * Cibles : `flag` (drapeau du jeu), `zone`/`mob` (zone SOREAL et nom EXACT de l'ennemi dans le bestiaire SOREAL : le jeu compare le nom de l'ennemi, « KING CIRCLE (BOSS) » chez lui = le boss KING CIRCLE de l'Univers 2D ;
 * l'ennemi au nom VIDE du jeu est celui dont le bestiaire SOREAL porte le nom "" entre guillemets), `liste` : nom affiché sur la Death Note (null = le « trou »).
 */
export const IDLE_MARRAINE_CIBLES_V1 = Object.freeze([
  Object.freeze({
    flag: "skeletonWhacked", zone: "forest", mob: "Skeleton", liste: "Skeleton",
    faite: Object.freeze(["You wonder what this skeleton did to piss the mafia so much that they whacked him off, even when  ", "he was already undead. Oh well! <b>Skeleton</b> has been crossed off the Death Note!"]),
    deja: Object.freeze(DEJA_V1("Skeleton"))
  }),
  Object.freeze({
    flag: "icarusWhacked", zone: "sky", mob: "Icarus Proudbottom", liste: "Icarus Proudbottom",
    faite: Object.freeze(["Shouldn't have dropped your boombooms on the Godmother's limo, Icarus. Shitty move.", "<b>Icarus Proudbottom</b> has been crossed off the Death Note!"]),
    /* (le jeu n'a pas d'espace après la virgule dans ce message : conservé tel quel) */
    deja: Object.freeze(["Hey genius,<b>Icarus Proudbottom</b> has already been crossed off the Death Note!", "Now you're just whacking off for fun."])
  }),
  Object.freeze({
    flag: "kingCircleWhacked", zone: "2d", mob: "KING CIRCLE", liste: "King Circle",
    faite: Object.freeze(["Usually the mafia stays out of political circles...", "Guess the Square Kingdom paid up enough to make them forget.", "<b>King Circle</b> has been crossed off the Death Note!"]),
    deja: Object.freeze(DEJA_V1("King Circle"))
  }),
  Object.freeze({
    flag: "robBossWhacked", zone: "beardverse", mob: "Rob Boss", liste: "Rob Boss",
    faite: Object.freeze(["After you whack Rob Boss, you tamper with the crime scene to make it look like...", "A happy little accident.", "<b>Rob Boss</b> has been crossed off the Death Note!"]),
    deja: Object.freeze(DEJA_V1("Rob Boss"))
  }),
  Object.freeze({
    flag: "emptyNameWhacked", zone: "ancient", mob: "\"\"", liste: null,
    faite: Object.freeze(["You're not sure how to cross out a name like this, but you find a way.", "<b>' '</b> has been crossed off the Death Note!"]),
    deja: Object.freeze(DEJA_V1("' '"))
  })
]);

export const IDLE_MARRAINE_MESSAGES_V1 = Object.freeze({
  debloque: Object.freeze([
    "You defeated the Consigliere, and this time for good. You pull out the Death Note he gave you.",
    "You add his name to the bottom of the list and toss it on his body, and enter the doors to see THE GODMOTHER."
  ]),
  quete: Object.freeze([
    "The Consigliere wipes a trickle of blood from his mouth before delivering a massive haymaker!",
    "You feel the air burst out of your lungs as you slam against the wall on the other side of the room.",
    "He walks over and hands you a small piece of paper. 'Alright tough guy, you want an audience with the",
    "Godmother? Go whack off all the guys on this list, then we'll talk."
  ]),
  /* Infobulle de la Death Note (InventoryController::itemTooltipText) */
  trou: IDLE_DEATH_NOTE_TEXTES_V1.trou,
  retour: IDLE_DEATH_NOTE_TEXTES_V1.retour,
  incomplete: IDLE_DEATH_NOTE_TEXTES_V1.incomplete
});

function drapeauxV1(s) {
  if (!s.unlockFlags || typeof s.unlockFlags !== "object") s.unlockFlags = {};
  return s.unlockFlags;
}

/* La liste est complète : les CINQ noms sont rayés (le nom vide compris). */
export function marraineListeCompleteV1(flags) {
  return Boolean(flags) && IDLE_MARRAINE_CIBLES_V1.every((c) => Boolean(flags[c.flag]));
}

/* makeTitanLevelledLoot(288, 100) : « vu » et « maximum » posés avant l'ajout, même sac plein. */
function donnerV1(s, definitionId, out) {
  const o = special(definitionId, IDLE_MARRAINE_NIVEAU_NOTE_V1);
  record(s, o);
  const a = add(s, o);
  if (a && Array.isArray(out)) out.push(a);
  return a;
}

/* Mort du CONSIGLIERE (LootDrop::zone26Drop, ennemi de type 22). */
export function marraineConsigliereV1(s, out) {
  const f = drapeauxV1(s);
  if (marraineListeCompleteV1(f)) {
    f.titan8Unlocked = true;
    return { debloque: true, messages: IDLE_MARRAINE_MESSAGES_V1.debloque.slice() };
  }
  f.titan8questStarted = true;
  const a = donnerV1(s, IDLE_MARRAINE_OBJETS_V1.note, out);
  return { objet: a, messages: IDLE_MARRAINE_MESSAGES_V1.quete.slice() };
}

/* Mort d'un ennemi nommé d'une zone ordinaire (zone2Drop, zone4Drop, zone9Drop, zone15Drop, zone10Drop) : raye le nom, ou dit qu'il l'est déjà. Rien tant que la quête n'a pas commencé ni une fois la Marraine débloquée. */
export function marraineMortCibleV1(s, zoneId, mobName) {
  const f = s && s.unlockFlags;
  if (!f || !f.titan8questStarted || f.titan8Unlocked) return null;
  const c = IDLE_MARRAINE_CIBLES_V1.find((x) => x.zone === zoneId && x.mob === String(mobName == null ? "" : mobName));
  if (!c) return null;
  if (f[c.flag]) return { deja: true, messages: c.deja.slice() };
  f[c.flag] = true;
  return { messages: c.faite.slice() };
}
