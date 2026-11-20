/*
 * Chaîne secrète du Greasy Nerd (titan 7) : Norman, 2026-11-20 (« implémente la chaîne secrète du Greasy Nerd, lue dans le code du jeu »). Toutes les règles viennent du code du jeu (build 1260, Assembly-CSharp.dll) ;
 * aucune valeur inventée. Méthodes du jeu citées à côté de chaque règle.
 *
 *  1. La MAMAN DU GREASY NERD (AdventureController::spawnEnemy, zone 23 ; enemyType 14) : tant que `titan7Unlocked` est faux, la zone du 7e titan fait apparaître « GREASY NERD'S MOM » à la place du Nerd
 *     (cadence 3, Power 6e13, Toughness 6e13, Regen 6e12, PV 6e15 : AdventureController::createEnemyTable ; IDLE_TITAN_COMBAT_V1.nerdmom). Sa mort (LootDrop::zone23Drop) ne donne ni or ni EXP ni compteur de titans :
 *     `titan7questStarted` = vrai et un message (le cadenas à 5 lettres). Elle relance le minuteur de la zone (enemyDeath : boss7Spawn.reset), donc celui du Nerd.
 *  2. Le CADENAS (Character::Update) : une fois la quête commencée (`titan7questStarted`) et tant qu'elle n'est pas finie (`titan7questComplete`), cinq lettres tapées au clavier, dans l'ordre, pendant que la page
 *     « Combat de boss » est affichée (Character.menuID == 15 : BossController::updateText n'agit que pour menuID 15) et que le nombre de boss vaincus de la partie en cours (Character.bossID ; la page affiche bossID + 1)
 *     vaut un nombre précis : F (bossID 24), A (41), R (62), T (81), S (120). Chaque lettre exige que la précédente soit faite (titan7QuestSequence 0 -> 1 -> ... -> 5) et affiche « COMBINATION LOCK n DISENGAGED »
 *     (HoverTooltip::showOverrideTooltip, 1 s). La cinquième pose `titan7Unlocked` et `titan7questComplete` (« ... GREASY NERD TITAN UNLOCKED! »).
 *     Ces mêmes touches servent aussi de raccourcis (F : récupérer la ressource 3, R : l'énergie, T : la magie) : quand la lettre est acceptée par le cadenas, le raccourci n'a PAS lieu (branche « sinon » du jeu) ;
 *     sinon il a lieu comme d'habitude.
 * Anti-spoil (règle n°2) : aucun drapeau n'existe dans l'état avant la mort de la Maman ; la lettre attendue et son boss (`titan7Cadenas` du snapshot de l'Aventure) ne sont envoyés au client qu'une fois la quête commencée.
 * Les textes sont ceux du jeu (anglais d'origine, traduits par le serveur sur la réponse : design/traductions/fr/misc.json).
 */

/* Lettre attendue (touche du clavier) et nombre de boss vaincus exigé (Character.bossID), dans l'ordre de la séquence. */
export const IDLE_NERD_CADENAS_V1 = Object.freeze([
  Object.freeze({ lettre: "f", boss: 24, message: "COMBINATION LOCK 1 DISENGAGED!" }),
  Object.freeze({ lettre: "a", boss: 41, message: "COMBINATION LOCK 2 DISENGAGED!" }),
  Object.freeze({ lettre: "r", boss: 62, message: "COMBINATION LOCK 3 DISENGAGED!" }),
  /* (le jeu n'a pas de point d'exclamation pour le quatrième : conservé tel quel) */
  Object.freeze({ lettre: "t", boss: 81, message: "COMBINATION LOCK 4 DISENGAGED" }),
  Object.freeze({ lettre: "s", boss: 120, message: "COMBINATION LOCK 5 DISENGAGED! GREASY NERD TITAN UNLOCKED!" })
]);

export const IDLE_NERD_MESSAGES_V1 = Object.freeze({
  mere: Object.freeze([
    "With the Greasy Nerd's mom dispatched, you head down to the basement to confront the Titan. But dammit - the door's locked with a 5 letter combination lock! You hear the nerd sneer from the other side of the door: 'Only the biggest NGU fans can find my secret passcode scattered in the beautifully crafted LORE!'"
  ])
});

function drapeauxV1(s) {
  if (!s.unlockFlags || typeof s.unlockFlags !== "object") s.unlockFlags = {};
  return s.unlockFlags;
}

/* titan7QuestSequence du jeu (0 à 5), reconstitué des drapeaux `titan7Lock1`..`titan7Lock4` (posés seulement une fois faits) et de `titan7questComplete` (cinquième lettre). */
export function nerdSequenceV1(flags) {
  if (!flags) return 0;
  if (flags.titan7questComplete) return 5;
  let n = 0;
  while (n < 4 && flags["titan7Lock" + (n + 1)]) n++;
  return n;
}

/* Mort de la MAMAN (LootDrop::zone23Drop, enemyType 14) : la quête commence (une quête déjà finie ne revient jamais en arrière), le message du cadenas. */
export function nerdMereMortV1(s) {
  const f = drapeauxV1(s);
  f.titan7questStarted = true;
  return { messages: IDLE_NERD_MESSAGES_V1.mere.slice() };
}

/*
 * Prochaine lettre attendue, annoncée au client SEULEMENT une fois la quête commencée et tant qu'elle n'est pas finie (`titan7Cadenas` du snapshot de l'Aventure) ; null sinon : rien n'est dit avant la découverte.
 */
export function nerdCadenasAttenduV1(s) {
  const f = s && s.unlockFlags;
  if (!f || !f.titan7questStarted || f.titan7questComplete) return null;
  const e = IDLE_NERD_CADENAS_V1[nerdSequenceV1(f)];
  return e ? { lettre: e.lettre, boss: e.boss } : null;
}

/*
 * Une touche tapée (Character::Update) : `lettre` (minuscule), `bossVaincus` = Character.bossID, `menuBoss` = la page « Combat de boss » est affichée (menuID == 15, connu de la page seulement).
 * Renvoie null si la touche n'est pas acceptée (aucun effet : le raccourci habituel a lieu), sinon { etape, debloque, message }.
 */
export function nerdLettreV1(s, lettre, bossVaincus, menuBoss) {
  const f = s && s.unlockFlags;
  if (!f || !f.titan7questStarted || f.titan7questComplete || menuBoss !== true) return null;
  const k = nerdSequenceV1(f);
  const e = IDLE_NERD_CADENAS_V1[k];
  if (!e || String(lettre || "").toLowerCase() !== e.lettre || Math.floor(Number(bossVaincus)) !== e.boss) return null;
  if (k < 4) {
    f["titan7Lock" + (k + 1)] = true;
    return { etape: k + 1, debloque: false, message: e.message };
  }
  f.titan7Unlocked = true;
  f.titan7questComplete = true;
  return { etape: 5, debloque: true, message: e.message };
}
