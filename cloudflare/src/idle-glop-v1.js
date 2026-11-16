/*
 * La GLOP, arme contre IT HUNGERS (Norman, 2026-11-16 : « tout objet du jeu doit exister dans SOREAL », « pourquoi il y a encore des choses inventées ? »). Toutes les règles viennent du code du jeu
 * (build 1260, Assembly-CSharp.dll) ; la méthode du jeu est citée à côté de chaque règle. Aucune valeur inventée.
 *
 *  1. Départ de la quête : LootDrop::postDeathDrops (méthode 555) : être mis K.O. par IT HUNGERS (ennemis de type 33 à 36 = IT HUNGERS V1 à V4, createEnemyTable) pose `titan10questStarted` ;
 *     si le sac ne contient aucune « GLOP Recipe » (387) retirable, la recette est donnée (« As you wake up in the Safe Zone, you feel a piece of paper stuck to your head. » ...).
 *  2. Ingrédients : drops plats (Random.value < p, SANS facteur de loot), seulement une fois `titan10questStarted` posé, sur un ennemi de nom exact (LootDrop::zone7Drop, zone15Drop, zone20Drop, zone22Drop,
 *     zone29Drop, makeLevelledLoot(id, 1)) : 368 Pickle Ice Cream 18 % (SUNDAE), 367 steak 36 % (ORANGE TOUPEE WITH FISTS), 369 Surstromming 48 % (Screaming Chocolate Fish), 370 Marmite 30 % (Barry, the Beer Fairy),
 *     371 Pizza à l'ananas 30 % (The Annoying Fan). Noms SOREAL des mêmes ennemis (bestiaire : idle-adventure-zones.js).
 *  3. Fabrication : « utiliser » (ItemController::consumeItem, méthode 3794) un ingrédient 367 à 371 retirable appelle InventoryController::attemptToMakeGlop (méthode 3772) : il faut un exemplaire
 *     RETIRABLE de chacun des cinq (ItemNameDesc::findItemToDelete, méthode 3826 : id égal ET retirable = non verrouillé) ; le premier manquant, dans l'ordre 367, 368, 369, 370, 371, est annoncé
 *     (« You're missing ... to make the Glop! ») et rien n'est consommé ; sinon les cinq sont retirés et une GLOP (372, niveau 0) est créée.
 *  4. Usage : EnemyAI::checkAndUseGlop (méthode 290) : quand le compteur de GLOP de l'ennemi est à 0, il cherche dans le sac la première GLOP retirable, la RETIRE et ajoute 5 attaques (glopCount += 5).
 *     itHungersAI (méthode 289) : sans GLOP (compteur à 0 après la recherche) IT HUNGERS est invincible et sa puissance monte de 400 ; avec GLOP il perd une charge par attaque (simulé dans le combat :
 *     modules/titans-comportements-v1.js). Le combat se joue dans la page : elle reçoit le nombre de GLOP du sac au départ (`fight.glopStock`) et annonce au serveur combien elle en a utilisé
 *     (`glopsUtilises`, à la victoire ou à la défaite), que le serveur retire du sac.
 */
/* Chargé d'abord : même ordre d'évaluation des imports circulaires que idle-antlers-v1.js. */
import "./idle-adventure-v47.js";
import { special, record } from "./idle-adventure-objets.js";
import { add, syncInventorySlotsAdventureV2 } from "./idle-adventure-inventaire.js";

export const IDLE_GLOP_OBJETS_V1 = Object.freeze({
  steak: "wellDoneSteak",          /* 367 */
  glace: "pickleIceCream",         /* 368 */
  surstromming: "canSurstromming", /* 369 */
  marmite: "jarOfMarmite",         /* 370 */
  pizza: "pizzaPineapple",         /* 371 */
  glop: "glop",                    /* 372 */
  recette: "glopRecipe"            /* 387 */
});

/* Ordre de vérification d'attemptToMakeGlop et texte annoncé pour le premier ingrédient manquant (chaînes du jeu, majuscules comprises). */
export const IDLE_GLOP_INGREDIENTS_V1 = Object.freeze([
  { definitionId: "wellDoneSteak", manque: "You're missing a Well Done Steak with Ketchup to make the Glop!" },
  { definitionId: "pickleIceCream", manque: "You're missing a Pickle Ice Cream to make the Glop!" },
  { definitionId: "canSurstromming", manque: "You're missing A Can of Surstromming to make the Glop!" },
  { definitionId: "jarOfMarmite", manque: "You're missing A Jar of Marmite to make the Glop!" },
  { definitionId: "pizzaPineapple", manque: "You're missing a Pizza With Pineapple to make the Glop!" }
]);

export const IDLE_GLOP_MESSAGE_FABRIQUEE_V1 = "You head back to Spiky Haired Guy's place and borrow a hazmat suit to assemble the Glop. It melts through the plate a bit and spontaneously combusts at least three times in the making, but you now have a weapon to take on IT HUNGERS! Unless you filtered this item, in which case you're an idiot.";
export const IDLE_GLOP_MESSAGES_RECETTE_V1 = Object.freeze([
  "As you wake up in the Safe Zone, you feel a piece of paper stuck to your head.",
  "You peel it off - it's a recipe of some sort..."
]);

/* Butin des ingrédients : zone SOREAL, nom SOREAL de l'ennemi, objet, probabilité PLATE du jeu (jamais multipliée par le facteur de loot). */
export const IDLE_GLOP_BUTIN_V1 = Object.freeze([
  { zone: "clock", mob: "Sundae", definitionId: "pickleIceCream", p: 0.18 },                   /* zone7Drop : « SUNDAE (BOSS) », Random.value < 0,18 */
  { zone: "beardverse", mob: "An Orange Toupée With Fists", definitionId: "wellDoneSteak", p: 0.36 }, /* zone15Drop : « ORANGE TOUPEE WITH FISTS (BOSS) », < 0,36 */
  { zone: "chocolate", mob: "Screaming Chocolate Fish", definitionId: "canSurstromming", p: 0.48 },  /* zone20Drop : « Screaming Chocolate Fish », < 0,48 */
  { zone: "pinkprincess", mob: "Barry, the Beer Fairy", definitionId: "jarOfMarmite", p: 0.3 },     /* zone22Drop : « Barry, the Beer Fairy », < 0,3 */
  { zone: "jrpgville", mob: "The Annoying Fan", definitionId: "pizzaPineapple", p: 0.3 }           /* zone29Drop : « The Annoying Fan », < 0,3 */
]);

/* Nombre d'attaques de la charge qu'une GLOP ajoute (EnemyAI::checkAndUseGlop : glopCount += 5). */
export const IDLE_GLOP_CHARGES_V1 = 5;

/* ItemNameDesc::findItemToDelete : premier objet de cet id qui est RETIRABLE (non verrouillé), -1 sinon. */
function indexRetirableV1(s, definitionId) {
  const inv = (s && s.inventory) || [];
  for (let i = 0; i < inv.length; i++) if (inv[i] && inv[i].definitionId === definitionId && !inv[i].locked) return i;
  return -1;
}

function retirerParIndexV1(s, index) {
  const o = s.inventory[index];
  if (!o) return null;
  const id = o.id;
  for (const slot of ["head", "chest", "legs", "boots", "weapon", "weapon2"]) if (s.equipment && s.equipment[slot] === id) s.equipment[slot] = "";
  if (s.equipment) s.equipment.accessories = (Array.isArray(s.equipment.accessories) ? s.equipment.accessories : []).filter(x => x !== id);
  s.inventory = s.inventory.filter(x => x.id !== id);
  return o;
}

/* markItemAsDropped puis ajout : « vu » même sac plein (comme exileDonnerV1). */
function donnerV1(s, definitionId, niveau, out) {
  record(s, special(definitionId, niveau));
  const o = add(s, special(definitionId, niveau));
  if (o && Array.isArray(out)) out.push(o);
  return o;
}

/* Départ de la quête (postDeathDrops) : appelé quand le joueur est mis K.O. par IT HUNGERS. */
export function glopMortParFaimV1(s) {
  const out = { demarree: false, recette: false, messages: [] };
  if (!s.unlockFlags) s.unlockFlags = {};
  if (!s.unlockFlags.titan10questStarted) { s.unlockFlags.titan10questStarted = true; out.demarree = true; }
  if (indexRetirableV1(s, IDLE_GLOP_OBJETS_V1.recette) === -1) {
    const o = donnerV1(s, IDLE_GLOP_OBJETS_V1.recette, 0);
    syncInventorySlotsAdventureV2(s);
    if (o) { out.recette = true; out.messages.push(...IDLE_GLOP_MESSAGES_RECETTE_V1); }
  }
  return out;
}

/* Butin d'un ingrédient pour l'ennemi vaincu (zone SOREAL + nom SOREAL) ; `alea` renvoie [0, 1[ (idle-alea-v1.js). */
export function glopIngredientButinV1(s, zoneId, mobName, alea, out) {
  if (!s || !s.unlockFlags || !s.unlockFlags.titan10questStarted) return null;
  const r = IDLE_GLOP_BUTIN_V1.find(x => x.zone === zoneId && x.mob === String(mobName || ""));
  if (!r) return null;
  if (!(alea() < r.p)) return null;
  return donnerV1(s, r.definitionId, 1, out);
}

/* « Utiliser » un ingrédient (consumeItem -> attemptToMakeGlop). */
export function glopFabriquerV1(s, itemId) {
  const o = (s.inventory || []).find(x => x && String(x.id) === String(itemId || ""));
  if (!o) throw Error("OBJET_INTROUVABLE");
  if (!IDLE_GLOP_INGREDIENTS_V1.some(x => x.definitionId === o.definitionId)) throw Error("OBJET_NON_UTILISABLE");
  if (o.locked) return { fabrique: false, message: "" };   /* consumeItem exige un objet retirable : rien ne se passe */
  const indices = [];
  for (const ing of IDLE_GLOP_INGREDIENTS_V1) {
    const i = indexRetirableV1(s, ing.definitionId);
    if (i === -1) return { fabrique: false, manque: ing.definitionId, message: ing.manque };
    indices.push(i);
  }
  const aRetirer = indices.map(i => s.inventory[i]);
  for (const x of aRetirer) retirerParIndexV1(s, s.inventory.indexOf(x));
  syncInventorySlotsAdventureV2(s);
  const glop = donnerV1(s, IDLE_GLOP_OBJETS_V1.glop, 0);
  syncInventorySlotsAdventureV2(s);
  return { fabrique: Boolean(glop), message: IDLE_GLOP_MESSAGE_FABRIQUEE_V1, objet: glop ? glop.id : "" };
}

/* GLOP retirables du sac (donnée de départ du combat : le jeu relit le sac à chaque attaque ; le serveur le lit une fois au départ). */
export function glopCompterV1(s) {
  return ((s && s.inventory) || []).filter(x => x && x.definitionId === IDLE_GLOP_OBJETS_V1.glop && !x.locked).length;
}

/* checkAndUseGlop : retire `n` GLOP (les premières retirables) ; renvoie le nombre réellement retiré. */
export function glopConsommerV1(s, n) {
  let reste = Math.max(0, Math.floor(Number(n) || 0)), retire = 0;
  while (reste > 0) {
    const i = indexRetirableV1(s, IDLE_GLOP_OBJETS_V1.glop);
    if (i === -1) break;
    retirerParIndexV1(s, i);
    reste--; retire++;
  }
  if (retire) syncInventorySlotsAdventureV2(s);
  return retire;
}
