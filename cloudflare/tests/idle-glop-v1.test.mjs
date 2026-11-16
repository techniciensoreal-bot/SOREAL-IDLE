import assert from "node:assert/strict";
import { neuf, agir, ajouter, possede } from "./_antlers-aide.mjs";
import { rollKill } from "../src/idle-adventure-butin.js";
import { IDLE_ADVENTURE_WIKI_ITEM_IDS_V1, SPECIALS_EN_V1 } from "../src/idle-adventure-sets.js";
import { IDLE_ADVENTURE_MOB_BESTIARY_V1 } from "../src/idle-adventure-zones.js";
import { IDLE_GLOP_BUTIN_V1, IDLE_GLOP_INGREDIENTS_V1, IDLE_GLOP_CHARGES_V1 } from "../src/idle-glop-v1.js";

/*
 * La GLOP (quête d'IT HUNGERS), lue dans le code du jeu (build 1260) :
 *  - ids : 367 à 371 (ingrédients), 372 (GLOP), 387 (GLOP Recipe) ;
 *  - postDeathDrops (555) : K.O. par IT HUNGERS = titan10questStarted + recette (si aucune retirable dans le sac) ;
 *  - zone7/15/20/22/29Drop : ingrédients, tirages PLATS, seulement une fois la quête démarrée ;
 *  - attemptToMakeGlop (3772) : cinq ingrédients retirables, premier manquant annoncé, sinon les cinq sont retirés et une GLOP naît ;
 *  - checkAndUseGlop (290) : chaque GLOP retirée du sac = 5 attaques ; combat joué dans la page, qui annonce `glopsUtilises`.
 */
const IDS = { wellDoneSteak: 367, pickleIceCream: 368, canSurstromming: 369, jarOfMarmite: 370, pizzaPineapple: 371, glop: 372, glopRecipe: 387 };
for (const [cle, id] of Object.entries(IDS)) {
  assert.equal(IDLE_ADVENTURE_WIKI_ITEM_IDS_V1[cle], id, cle);
  assert.ok(SPECIALS_EN_V1[cle], cle);
  assert.equal(SPECIALS_EN_V1[cle].p, 0);
}
assert.equal(IDLE_GLOP_CHARGES_V1, 5);
assert.deepEqual(IDLE_GLOP_INGREDIENTS_V1.map(x => x.definitionId), ["wellDoneSteak", "pickleIceCream", "canSurstromming", "jarOfMarmite", "pizzaPineapple"]);

/* Les ennemis nommés existent dans le bestiaire SOREAL (zone et nom exacts). */
for (const r of IDLE_GLOP_BUTIN_V1) {
  const z = IDLE_ADVENTURE_MOB_BESTIARY_V1[r.zone];
  assert.ok(z, r.zone);
  assert.ok([...(z.normal || []), ...(z.boss || [])].some(m => m.name === r.mob), r.zone + " : " + r.mob);
}
assert.deepEqual(IDLE_GLOP_BUTIN_V1.map(r => r.p), [0.18, 0.36, 0.48, 0.3, 0.3]);

const CTX = { bosses: 301, difficulty: "extreme", stats: { power: 1e40, toughness: 1e40 } };
const tuerHungers = (s, t = 1_000_000) => {
  const d = agir(s, { action: "titan", titan: "hungers", difficulty: "easy" }, CTX, t);
  return d;
};

/* --- 1. K.O. par IT HUNGERS : drapeau + recette ; pas de seconde recette ; une recette VERROUILLÉE ne compte pas (findItemToDelete exige un objet retirable). --- */
function sacrifier(s) {
  s.unlockFlags.itHungersUnlockedForTest = true;
  s.fight = { active: true, zone: s.selectedZone, boss: true, playerHp: 1, playerHpMax: 10, monsterHp: 5, monsterHpMax: 5, titanId: "hungers", titanTier: "easy", titanStartedAt: 5, glopStock: 0 };
  return agir(s, { action: "loseZoneFight", titanId: "hungers", titanStartedAt: 5 }, CTX);
}
function etatFaim() {
  const s = neuf();
  s.selectedZone = "safe";
  return s;
}
{
  let r = sacrifier(etatFaim());
  assert.equal(r.state.unlockFlags.titan10questStarted, true);
  assert.equal(r.result.glop.demarree, true);
  assert.equal(r.result.glop.recette, true);
  assert.deepEqual(r.result.glop.messages, ["As you wake up in the Safe Zone, you feel a piece of paper stuck to your head.", "You peel it off - it's a recipe of some sort..."]);
  assert.equal(possede(r.state, "glopRecipe"), 1);
  assert.equal(r.state.itemList.glopRecipe.seen, true);
  /* Mort suivante : la recette est dans le sac, aucune nouvelle. */
  const s2 = r.state; s2.selectedZone = "safe";
  r = sacrifier(s2);
  assert.equal(possede(r.state, "glopRecipe"), 1);
  assert.equal(r.result.glop.recette, false);
  assert.equal(r.result.glop.demarree, false);
  /* Recette verrouillée : le jeu en redonne une (aucun objet RETIRABLE de cet id). */
  const s3 = r.state; s3.selectedZone = "safe";
  s3.inventory.find(x => x.definitionId === "glopRecipe").locked = true;
  r = sacrifier(s3);
  assert.equal(possede(r.state, "glopRecipe"), 2);
}
/* Un K.O. contre un autre titan ne démarre rien. */
{
  const s = etatFaim();
  s.fight = { active: true, zone: "safe", boss: true, playerHp: 1, playerHpMax: 10, monsterHp: 5, monsterHpMax: 5, titanId: "t1", titanTier: "", titanStartedAt: 5 };
  const r = agir(s, { action: "loseZoneFight", titanId: "t1", titanStartedAt: 5 }, CTX);
  assert.ok(!r.state.unlockFlags.titan10questStarted);
  assert.equal(possede(r.state, "glopRecipe"), 0);
}

/* --- 2. Ingrédients : seulement une fois la quête démarrée, tirage plat (jamais multiplié par le loot), ennemi nommé. --- */
function tuer(s, zone, mob, boss, tirage) {
  s.selectedZone = zone;
  return rollKill(s, { bosses: 301, difficulty: (zone === "pinkprincess" || zone === "jrpgville") ? "difficile" : "normal", dropMultiplier: 50, forceBoss: boss, forceMobName: mob, alea: () => tirage });
}
for (const r of IDLE_GLOP_BUTIN_V1) {
  const boss = r.mob === "Sundae" || r.mob === "An Orange Toupée With Fists";
  /* quête non démarrée : rien */
  let s = neuf();
  tuer(s, r.zone, r.mob, boss, 0);
  assert.equal(possede(s, r.definitionId), 0, r.mob + " : quête non démarrée");
  /* quête démarrée, tirage juste sous la probabilité : l'ingrédient, niveau 1 ; juste au-dessus : rien (facteur de loot x50 sans effet) */
  s = neuf(); s.unlockFlags.titan10questStarted = true;
  tuer(s, r.zone, r.mob, boss, r.p - 1e-9);
  assert.equal(possede(s, r.definitionId), 1, r.mob);
  assert.equal(s.inventory.find(x => x.definitionId === r.definitionId).level, 1);
  assert.equal(s.itemList[r.definitionId].seen, true);
  s = neuf(); s.unlockFlags.titan10questStarted = true;
  tuer(s, r.zone, r.mob, boss, r.p);
  assert.equal(possede(s, r.definitionId), 0, r.mob + " : tirage = p, rien (Random.value < p)");
  /* autre ennemi de la même zone : rien */
  s = neuf(); s.unlockFlags.titan10questStarted = true;
  tuer(s, r.zone, "Un autre ennemi", boss, 0);
  assert.equal(possede(s, r.definitionId), 0);
}

/* --- 3. Fabrication --- */
function avecIngredients(manquants = [], verrouilles = []) {
  let s = neuf();
  for (const def of IDLE_GLOP_INGREDIENTS_V1.map(x => x.definitionId)) {
    if (manquants.includes(def)) continue;
    const a = ajouter(s, def, 1); s = a.s;
    if (verrouilles.includes(def)) s.inventory.find(x => x.id === a.o.id).locked = true;
  }
  return s;
}
const utiliser = (s, def) => {
  const o = s.inventory.find(x => x.definitionId === def && !x.locked) || s.inventory.find(x => x.definitionId === def);
  return agir(s, { action: "makeGlop", itemId: o.id });
};
{
  /* Tous présents : cinq retirés, une GLOP (niveau 0), message du jeu. */
  const r = utiliser(avecIngredients(), "pickleIceCream");
  assert.equal(r.result.fabrique, true);
  assert.ok(r.result.message.startsWith("You head back to Spiky Haired Guy's place"));
  assert.equal(possede(r.state, "glop"), 1);
  for (const d of IDLE_GLOP_INGREDIENTS_V1) assert.equal(possede(r.state, d.definitionId), 0, d.definitionId);
  assert.equal(r.state.itemList.glop.seen, true);
  assert.equal(r.state.inventory.find(x => x.definitionId === "glop").level, 0);
}
/* Premier ingrédient manquant, dans l'ordre du jeu : message exact, rien consommé. */
for (const ing of IDLE_GLOP_INGREDIENTS_V1) {
  const s = avecIngredients([ing.definitionId]);
  const autre = IDLE_GLOP_INGREDIENTS_V1.find(x => x.definitionId !== ing.definitionId).definitionId;
  const r = utiliser(s, autre);
  assert.equal(r.result.fabrique, false);
  assert.equal(r.result.message, ing.manque);
  assert.equal(possede(r.state, "glop"), 0);
  assert.equal(r.state.inventory.length, s.inventory.length, "rien n'est consommé");
}
{
  /* deux manquants : le PREMIER dans l'ordre (steak avant ananas) */
  const r = utiliser(avecIngredients(["pizzaPineapple", "wellDoneSteak"]), "pickleIceCream");
  assert.equal(r.result.message, "You're missing a Well Done Steak with Ketchup to make the Glop!");
  /* un ingrédient verrouillé n'est pas retirable : comme absent */
  const v = utiliser(avecIngredients([], ["canSurstromming"]), "pickleIceCream");
  assert.equal(v.result.message, "You're missing A Can of Surstromming to make the Glop!");
  /* utiliser l'ingrédient verrouillé lui-même : rien ne se passe */
  const sv = avecIngredients([], ["canSurstromming"]);
  const l = agir(sv, { action: "makeGlop", itemId: sv.inventory.find(x => x.definitionId === "canSurstromming").id });
  assert.equal(l.result.fabrique, false);
  assert.equal(possede(l.state, "glop"), 0);
  /* un objet qui n'est pas un ingrédient : refus */
  const s = avecIngredients(); const x = ajouter(s, "glop").o;
  assert.throws(() => agir(s, { action: "makeGlop", itemId: x.id }), /OBJET_NON_UTILISABLE|OBJET_INTROUVABLE/);
}

/* --- 4. Combat : stock au départ, consommation annoncée à la victoire et à la défaite, jamais plus que le stock --- */
function departFaim(nbGlop, verrouilles = 0) {
  let s = neuf();
  s.unlockFlags.titan10questStarted = true;
  for (let i = 0; i < nbGlop; i++) { const a = ajouter(s, "glop"); s = a.s; if (i < verrouilles) s.inventory.find(x => x.id === a.o.id).locked = true; }
  return s;
}
function lancer(s) {
  const r = agir(s, { action: "startTitanFight", titan: "hungers", difficulty: "easy" }, CTX);
  return r;
}
{
  const r = lancer(departFaim(3, 1));
  assert.equal(r.state.fight.titanId, "hungers");
  assert.equal(r.state.fight.glopStock, 2, "GLOP retirables du sac (une verrouillée ne compte pas)");
  /* victoire : le client annonce 2 utilisées (plus que le stock serait ramené au stock) */
  const f = r.state.fight;
  const v = agir(r.state, { action: "resolveZoneFight", titanId: "hungers", titanStartedAt: f.titanStartedAt, glopsUtilises: 99 }, CTX, f.titanStartedAt + 10_000);
  assert.equal(possede(v.state, "glop"), 1, "2 GLOP retirées, la verrouillée reste");
  assert.ok(v.state.inventory.find(x => x.definitionId === "glop").locked);
}
{
  const r = lancer(departFaim(2));
  const f = r.state.fight;
  const d = agir(r.state, { action: "loseZoneFight", titanId: "hungers", titanStartedAt: f.titanStartedAt, glopsUtilises: 1 }, CTX);
  assert.equal(possede(d.state, "glop"), 1, "défaite : la GLOP utilisée est retirée");
  assert.equal(d.state.unlockFlags.titan10questStarted, true);
  assert.equal(possede(d.state, "glopRecipe"), 1);
}
{
  /* Sans GLOP au départ : stock 0 ; un autre titan n'a pas de stock. */
  const r = lancer(departFaim(0));
  assert.equal(r.state.fight.glopStock, 0);
  assert.equal(possede(agir(r.state, { action: "resolveZoneFight", titanId: "hungers", titanStartedAt: r.state.fight.titanStartedAt, glopsUtilises: 5 }, CTX, r.state.fight.titanStartedAt + 10_000).state, "glop"), 0);
}
console.log("ok");
