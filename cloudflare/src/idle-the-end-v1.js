/*
 * SOREAL IDLE — THE END (2026-09-25).
 *
 * Wiki, page THE END : « 16 consumables you can gather from late SADISTIC difficulty features [...] Assembling all 16 items (on the top left of the
 * first page of your inventory) and ctrl+clicking the piece with the red button will display the ending of the game. The items don't disappear;
 * you can watch the ending any number of times you want. » Numéros d'objet 480 à 495, chacun avec son « hint » et sa source :
 *
 *   480 Ascended x9 Pendant maxé, transformé                         (idle-adventure-v47.js, transformAdventureItemV1)
 *   481 MOVE 69 utilisé 69 fois                                       (idle-adventure-v47.js, useMove69AdventureV1)
 *   482 Perk 231 « ERROR »                                            (idle-ngu-progression.js, idleTheEndSyncV1)
 *   483 / 489 / 493 / 484  drops d'AMALGAMATE (V1+ / V2+ / V3+ / V4)  (idle-adventure-v47.js, rollTitanLootV1)
 *   485 GLITCHY LOOTY maxé, transformé                                (idle-adventure-v47.js, transformAdventureItemV1)
 *   486 Quirk 176 « A PROBLEM HAS BEEN DETECTED »                     (idleTheEndSyncV1)
 *   487 boss 300 vaincu en Sadistic                                   (idleTheEndSyncV1)
 *   488 dernier Hack, qui apparaît quand les 15 autres sont au maximum (idle-ngu-progression.js, advanceTheEndFinalHackV1)
 *   490 Wish 203 « ARE YOU SURE YOU WISH TO SHUT DOWN? »              (idleTheEndSyncV1)
 *   491 ITOPOD étage 1450+ : 0,005 % x (étage - 1449) par kill       (idle-ngu-progression.js, advanceTowerV1)
 *   492 la carte THE END (1 % à côté d'une carte, Sadistic, 99 de chaque mayo) (idle-cards-v1.js)
 *   494 dernier sort de Blood Magic (5e22 de sang)                    (idle-ngu-progression.js, castBloodSpell)
 *   495 drop fixe du Traitor                                          (idle-adventure-v47.js, titan)
 *
 * Écart avec le jeu d'origine, choisi : les pièces ne vivent pas dans les cases du sac (elles ne peuvent donc être ni jetées ni perdues, la re-génération par
 * la carte THE END n'a plus d'objet) ; elles sont rangées dans state.adventure.theEnd et affichées dans le sac dès la première trouvée. Le jeu d'origine
 * les fait apparaître dans les cases en haut à gauche du sac ; ici, une fois les 16 réunies, le bouton rouge sert à lancer la fin.
 * Aucun spoil : rien n'est visible tant qu'aucune pièce n'est trouvée, jamais de compteur « x / 16 ».
 */

export const IDLE_THE_END_PIECES_V1 = Object.freeze([
  Object.freeze({ id: 480, hint: "DO NOT ASCEND." }),
  Object.freeze({ id: 481, hint: "AFTER ALL THIS TIME, YOU'RE STILL THIS IMMATURE?" }),
  Object.freeze({ id: 482, hint: "NGU.EXE WILL NOW CLOSE." }),
  Object.freeze({ id: 483, hint: "THE 12TH, FIRST OF HIS FORM" }),
  Object.freeze({ id: 484, hint: "THE 12TH, LAST OF HIS FORM" }),
  Object.freeze({ id: 485, hint: "DO NOT LOOT." }),
  Object.freeze({ id: 486, hint: "A FATAL EXCEPTION HAS OCCURED." }),
  Object.freeze({ id: 487, hint: "THE 903RD TO FALL" }),
  Object.freeze({ id: 488, hint: "ONE FINAL ACK." }),
  Object.freeze({ id: 489, hint: "THE 12TH, SECOND OF HIS FORM" }),
  Object.freeze({ id: 490, hint: "SHUT IT DOWN" }),
  Object.freeze({ id: 491, hint: "NEAR THE END OF THE INFINITE TOWER." }),
  Object.freeze({ id: 492, hint: "A DAUNTING CAST." }),
  Object.freeze({ id: 493, hint: "THE 12TH, THIRD OF HIS FORM" }),
  Object.freeze({ id: 494, hint: "LEECHES WILL HELP" }),
  Object.freeze({ id: 495, hint: "I WILL *DIE* BEFORE I LET YOU TAKE AWAY MY VISION FOR THIS WORLD!!!" })
]);

/* La pièce au bouton rouge : la dernière du jeu d'origine (« THE END BEGINS HERE. »), tombée du Traitor. */
export const IDLE_THE_END_RED_BUTTON_PIECE_V1 = 495;

/* Sixième pièce : le dernier Hack. Temps total : « It levels by itself, requiring no Resource 3, and takes 200,000 seconds (55.55 hours) to complete ». */
export const IDLE_THE_END_FINAL_HACK_SECONDS_V1 = 200000;
/* Dernier sort de Blood Magic : « blood requirement: 50 sextillion / 5e22 ». */
export const IDLE_THE_END_LAST_SPELL_BLOOD_V1 = 5e22;
/* ITOPOD : « Drop chance equal to 0.005% * (ITOPOD Level - 1449) ». */
export const IDLE_THE_END_TOWER_FIRST_FLOOR_V1 = 1450;
/* Carte THE END : « a random chance (~1%) of spawning an End card alongside any normal card. The mayo cost of any End card is 99 of each of the six types of mayo. » */
export const IDLE_THE_END_CARD_CHANCE_V1 = 0.01;
export const IDLE_THE_END_CARD_MAYO_V1 = 99;

const IDS = new Set(IDLE_THE_END_PIECES_V1.map((p) => p.id));
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/* Données persistées (state.adventure.theEnd) : { pieces: { "480": tempsDeLaTrouvaille }, endings: n, lastEndingAt }. */
export function idleTheEndNormalizeV1(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const pieces = {};
  for (const id of Object.keys(src.pieces && typeof src.pieces === "object" ? src.pieces : {})) {
    if (IDS.has(Number(id))) pieces[String(Number(id))] = Math.max(0, num(src.pieces[id], 0));
  }
  return {
    pieces,
    endings: Math.max(0, Math.floor(num(src.endings, 0))),
    lastEndingAt: Math.max(0, num(src.lastEndingAt, 0)),
    /* Dernier Hack : secondes accumulées (0 à 200 000). */
    finalHackSeconds: Math.min(IDLE_THE_END_FINAL_HACK_SECONDS_V1, Math.max(0, num(src.finalHackSeconds, 0)))
  };
}

/* Garantit state.adventure.theEnd (état Aventure) et le renvoie. */
export function idleTheEndDataV1(adventure) {
  if (!adventure || typeof adventure !== "object") return idleTheEndNormalizeV1(null);
  adventure.theEnd = idleTheEndNormalizeV1(adventure.theEnd);
  return adventure.theEnd;
}

export function idleTheEndHasV1(adventure, id) {
  return Boolean(adventure?.theEnd?.pieces && Object.prototype.hasOwnProperty.call(adventure.theEnd.pieces, String(id)));
}

/* Ajoute une pièce (état Aventure). Renvoie true seulement à la première obtention. */
export function idleTheEndGrantV1(adventure, id, now = 0) {
  const n = Number(id);
  if (!IDS.has(n) || !adventure || typeof adventure !== "object") return false;
  const d = idleTheEndDataV1(adventure);
  if (Object.prototype.hasOwnProperty.call(d.pieces, String(n))) return false;
  d.pieces[String(n)] = Math.max(1, num(now, 0));
  return true;
}

export function idleTheEndCountV1(adventure) {
  return Object.keys(adventure?.theEnd?.pieces || {}).length;
}

export function idleTheEndCompleteV1(adventure) {
  return idleTheEndCountV1(adventure) >= IDLE_THE_END_PIECES_V1.length;
}

/*
 * Instantané client. undefined tant qu'aucune pièce n'est trouvée (rien à montrer, aucun spoil). Les pièces trouvées seulement, avec leur texte ;
 * pas de compteur. `complete` : les 16 sont réunies, le bouton rouge peut lancer la fin.
 */
export function idleTheEndSnapshotV1(adventure) {
  const d = adventure?.theEnd;
  const found = d ? IDLE_THE_END_PIECES_V1.filter((p) => Object.prototype.hasOwnProperty.call(d.pieces || {}, String(p.id))) : [];
  if (!found.length) return undefined;
  return {
    pieces: found.map((p) => ({ id: p.id, hint: p.hint, red: p.id === IDLE_THE_END_RED_BUTTON_PIECE_V1 })),
    complete: found.length === IDLE_THE_END_PIECES_V1.length,
    endings: Math.max(0, Math.floor(num(d.endings, 0)))
  };
}

/* Lance la fin : exige les 16 pièces ; les pièces restent (on peut la revoir autant de fois qu'on veut). */
export function idleTheEndPlayV1(adventure, now = 0) {
  if (!idleTheEndCompleteV1(adventure)) throw new Error("FIN_INDISPONIBLE");
  const d = idleTheEndDataV1(adventure);
  d.endings += 1;
  d.lastEndingAt = Math.max(1, num(now, 0));
  return { endings: d.endings, text: IDLE_THE_END_TEXT_V1 };
}

/*
 * Texte de la fin (rédaction originale SOREAL, à relire / réécrire par Norman : c'est SA fin). Servi UNIQUEMENT par le serveur au moment de la lancer :
 * il n'existe nulle part dans le code livré au navigateur avant. Chaque entrée est un paragraphe ; « --- » sépare deux tableaux ; une entrée commençant
 * par « # » est un titre.
 */
export const IDLE_THE_END_TEXT_V1 = Object.freeze([
  "# THE END",
  "Le dernier coup part, et le Traître ne se relève pas.",
  "Tu restes un long moment debout dans le silence, les poings encore serrés. Autour de toi, les chiffres qui tenaient le monde debout se mettent à trembler : ils ont trop grandi, trop vite, et le monde n'est plus assez grand pour les contenir.",
  "Les MacGuffins tombent un à un et roulent à tes pieds, tièdes, presque vivants. Tu les ramasses sans réfléchir — personne ne t'avait dit qu'ils ne brûlaient pas. Ils s'emboîtent d'eux-mêmes dans le creux de ta main et forment un médaillon. Au centre, un bouton rouge, minuscule, qui t'attend.",
  "Le Traître, à terre, te regarde. Pour la première fois, tu vois son visage en entier, et c'est le tien.",
  "— Tu n'as jamais compris, murmure-t-il. Il n'y avait qu'un seul de nous deux. Il y a longtemps, quelque chose s'est fissuré, et il a fallu que l'un des deux tienne le rôle du méchant.",
  "Il se défait en poussière, doucement, comme un vieux château de sable. Il ne reste rien de lui sauf un éclat brillant. Tu le glisses à sa place dans le médaillon. Il fait un petit clic.",
  "---",
  "Tu appuies.",
  "Blanc. Un blanc sans bord, sans haut, sans bas. Tes pas ne font plus de bruit. Les rats, les rois, les boss, les ascenseurs qui montent trop haut, la tour sans fin : tout ce que tu as traversé se replie sur lui-même comme une page qu'on ferme.",
  "Une voix, alors, très calme, très ancienne :",
  "— Tu as fini ? Tu as vraiment fini ?",
  "Tu ne sais pas si c'est une question ou une félicitation. Tu réponds en hochant la tête, parce que ta bouche ne fonctionne plus.",
  "— Alors on peut recommencer, dit la voix. Depuis le début. Plus doucement, cette fois.",
  "---",
  "Le monde se rallume comme une bougie dans une pièce vide. Le premier matin. L'herbe, un vent léger, un peu de poussière dorée. Quelque part, très loin, quelqu'un rit.",
  "Tu ouvres les yeux dans la Zone de départ, le sac presque vide, le cœur léger. Tout est à refaire. Et pour la première fois, ça te fait plaisir.",
  "---",
  "À toi qui es arrivé jusqu'ici.",
  "Merci d'avoir joué à SOREAL IDLE, d'avoir cherché les recoins, d'avoir supporté les nombres qui prennent trop de place et les nuits passées à attendre qu'une barre se remplisse. Ce jeu a été fait pour s'amuser ensemble.",
  "Reviens quand tu veux. Le monde est toujours là.",
  "— SOREAL",
  "# THE... END ?"
]);
