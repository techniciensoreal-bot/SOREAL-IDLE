import assert from "node:assert/strict";
import { neuf, agir, ajouter, equiper, possede } from "./_antlers-aide.mjs";
import { IDLE_ADVENTURE_TITANS, idleAdventureSnapshotV47 } from "../src/idle-adventure-v47.js";
import { IDLE_TITAN_COMBAT_V1 } from "../src/idle-titans-combat-v1.js";
import { beteDebutVisiteV1, beteItopodV1, beteSpecialRebirthV1, IDLE_BETE_MESSAGES_V1 } from "../src/idle-bete-secret-v1.js";
import { SPECIALS } from "../src/idle-adventure-sets.js";
import { IDLE_ADVENTURE_DESCRIPTIONS_V1 } from "../src/idle-adventure-descriptions-v1.js";

/*
 * Chaîne secrète de la Bête (build 1260 : Rebirth::checkSpecial, LootDrop::zone19Drop / checkUUGSecret / checkTreeSecret / checkJakeSecret / checkITOPODSecret).
 * La Bête n'existe que si titan6Unlocked, posé UNIQUEMENT par le Rebirth ; avant, la zone du 6e titan fait apparaître SKELETON GUARDIAN.
 */
const CTX = { bosses: 301, difficulty: "normal", stats: { power: 1e30, toughness: 1e30, regen: 1e30 } };
const ids = (s, bosses = 301) => idleAdventureSnapshotV47(s, bosses, "normal").titans.map(t => t.id);
const t6 = IDLE_ADVENTURE_TITANS.find(x => x.id === "t6");
const sq = IDLE_ADVENTURE_TITANS.find(x => x.id === "skeleton");

/* Définitions : valeurs lues dans createEnemyTable (SKELETON GUARDIAN : attaque 3, 3e7 / 3e7 / 3e6, PV 3e9). */
assert.equal(t6.requiresUnlock, "titan6Unlocked");
assert.equal(sq.boss, 132);
assert.equal(sq.hiddenWhenFlag, "titan6Unlocked");
assert.equal(sq.p, 0);
assert.equal(sq.cooldown, t6.cooldown, "même minuteur de zone que la Bête");
assert.deepEqual(IDLE_TITAN_COMBAT_V1.skeleton.variantes[""], { hp: 3e9, power: 3e7, toughness: 3e7, regen: 3e6, attackRate: 3 });
/* Objets 179 à 183 : noms et textes du jeu, tels quels. */
assert.equal(SPECIALS.crumpledNote.name.length > 0, true);
assert.equal(IDLE_ADVENTURE_DESCRIPTIONS_V1.beastClue1, "What on earth does it mean?");
assert.equal(IDLE_ADVENTURE_DESCRIPTIONS_V1.beastClue2, "You still don't get it. :|");
assert.ok(IDLE_ADVENTURE_DESCRIPTIONS_V1.crumpledNote.includes("To release the power of THE BEAST"));

/* Sans le secret : SKELETON GUARDIAN à la place de la Bête, jamais la Bête (règle n°2 : aucun nom de Bête, aucun indice). */
{
  const s = neuf();
  assert.ok(ids(s).includes("skeleton"));
  assert.ok(!ids(s).includes("t6"));
  assert.ok(!ids(s, 131).includes("skeleton"), "pas avant le boss 132");
  assert.throws(() => agir(s, { action: "titan", titan: "t6", difficulty: "easy" }, CTX), /PROGRESSION_TITAN_REQUISE/);
  const snap = JSON.stringify(idleAdventureSnapshotV47(s, 301, "normal"));
  assert.ok(!/clue[1-4]Complete/.test(snap), "aucun drapeau d'indice dans la réponse");
}
/* SKELETON GUARDIAN : la Note (niveau 100) à CHAQUE victoire, ni or ni EXP, messages du jeu ; sa mort relance le minuteur de la Bête. */
{
  let s = neuf();
  let r = agir(s, { action: "titan", titan: "skeleton" }, CTX);
  assert.deepEqual(r.result.drops.map(d => d.definitionId), ["crumpledNote"]);
  assert.equal(r.result.drops[0].level, 100);
  assert.equal(r.result.gold, 0);
  assert.equal(r.result.experience, 0);
  assert.deepEqual(r.result.secretBete.messages, [...IDLE_BETE_MESSAGES_V1.squelette]);
  assert.equal(r.state.itemList.crumpledNote.maxLevel, 100);
  assert.ok(r.state.titans.t6.nextAt > 1_000_000, "minuteur de la zone partagé avec la Bête");
  assert.throws(() => agir(r.state, { action: "titan", titan: "skeleton" }, CTX, 1_000_000 + 1000), /TITAN_EN_REAPPARITION/);
  const r2 = agir(r.state, { action: "titan", titan: "skeleton" }, CTX, 1_000_000 + 4 * 3600 * 1000);
  assert.equal(possede(r2.state, "crumpledNote"), 2, "une Note de plus à chaque victoire");
}
/* Une fois titan6Unlocked : la Bête se montre, SKELETON GUARDIAN disparaît. */
{
  const s = neuf();
  s.unlockFlags.titan6Unlocked = true;
  assert.ok(ids(s).includes("t6"));
  assert.ok(!ids(s).includes("skeleton"));
  assert.throws(() => agir(s, { action: "titan", titan: "skeleton" }, CTX), /PROGRESSION_TITAN_REQUISE/);
  const r = agir(s, { action: "titan", titan: "t6", difficulty: "easy" }, { ...CTX, stats: { power: 7e8, toughness: 5e8 } });
  assert.equal(r.result.id, "t6");
}
/* Partie qui avait déjà battu la Bête : elle reste accessible, SKELETON GUARDIAN n'apparaît pas. */
{
  const s = neuf();
  s.titans.t6 = { kills: 2, nextAt: 0 };
  assert.ok(ids(s).includes("t6"));
  assert.ok(!ids(s).includes("skeleton"));
}

/* Prérequis des titans 2 à 4 (sans rapport avec le secret). */
function pret(s) {
  s.unlockFlags.ngu = true; s.unlockFlags.yggdrasil = true; s.unlockFlags.diggers = true; s.unlockFlags.ringOfApathyMaxed = true;
  s.titans.t1 = { kills: 99, nextAt: 0 }; s.titans.t2 = { kills: 99, nextAt: 0 }; s.titans.t3 = { kills: 99, nextAt: 0 };
  return s;
}
const tuer = (s, id, t = 1_000_000) => agir(s, { action: "titan", titan: id }, CTX, t);
const defs = r => r.result.drops.map(d => d.definitionId);

/* UUG : Anneau d'Apathie de niveau EXACTEMENT 69 porté + Note déjà au niveau 100 -> Premier indice (180). */
{
  const note = s => { s.itemList.crumpledNote = { maxLevel: 100, seen: true }; return s; };
  const avecAnneau = (niveau) => { let s = pret(neuf()); s = note(s); const a = ajouter(s, "ringOfApathy", niveau); return agir(a.s, { action: "equip", id: a.o.id, slot: "accessory" }).state; };
  let r = tuer(avecAnneau(69), "t4");
  assert.ok(defs(r).includes("beastClue1"), "anneau 69 : premier indice");
  assert.equal(r.state.unlockFlags.clue1Complete, true);
  assert.deepEqual(r.result.secretBete.messages, [...IDLE_BETE_MESSAGES_V1.uug]);
  assert.equal(r.state.itemList.beastClue1.maxLevel, 100);
  for (const n of [68, 70, 100]) assert.ok(!defs(tuer(avecAnneau(n), "t4")).includes("beastClue1"), "anneau " + n + " : rien");
  /* Anneau 69 dans le sac mais pas porté : rien. */
  let s = note(pret(neuf())); s = ajouter(s, "ringOfApathy", 69).s;
  assert.ok(!defs(tuer(s, "t4")).includes("beastClue1"));
  /* Sans la Note au niveau 100 : rien. */
  let t = pret(neuf()); const a = ajouter(t, "ringOfApathy", 69); t = agir(a.s, { action: "equip", id: a.o.id, slot: "accessory" }).state;
  assert.ok(!defs(tuer(t, "t4")).includes("beastClue1"), "Note pas maxée : rien");
}
/* Grand Corrupted Tree : indice 1 fait + arme équipée « A Stick » (id 75) -> Deuxième indice (181). */
{
  const base = () => { const s = pret(neuf()); s.unlockFlags.clue1Complete = true; return s; };
  let r = tuer(equiper(base(), "training:weapon", "weapon"), "t2");
  assert.ok(defs(r).includes("beastClue2"));
  assert.equal(r.state.unlockFlags.clue2Complete, true);
  assert.deepEqual(r.result.secretBete.messages, [...IDLE_BETE_MESSAGES_V1.arbre]);
  assert.ok(!defs(tuer(base(), "t2")).includes("beastClue2"), "sans le bâton : rien");
  const sans = equiper(neuf(), "training:weapon", "weapon");
  Object.assign(sans, pret(sans));
  assert.ok(!defs(tuer(sans, "t2")).includes("beastClue2"), "indice 1 pas fait : rien");
}
/* Jake : indices 1 et 2, aucune pièce, Stapler pour seul accessoire -> Troisième indice (182). */
{
  const base = () => { const s = pret(neuf()); s.unlockFlags.clue1Complete = true; s.unlockFlags.clue2Complete = true; return s; };
  const avecStapler = s => equiper(s, "stapler", "accessory");
  let r = tuer(avecStapler(base()), "t3");
  assert.ok(defs(r).includes("beastClue3"));
  assert.equal(r.state.unlockFlags.clue3Complete, true);
  assert.ok(!defs(tuer(base(), "t3")).includes("beastClue3"), "sans Stapler : rien");
  assert.ok(!defs(tuer(equiper(avecStapler(base()), "ringOfApathy", "accessory"), "t3")).includes("beastClue3"), "un autre accessoire : rien");
  assert.ok(!defs(tuer(equiper(avecStapler(base()), "training:weapon", "weapon"), "t3")).includes("beastClue3"), "une arme : rien");
}

/* ITOPOD : étage 100, départ 0, premier kill de l'étage, nu pendant toute la visite, indices 1 à 3. */
{
  const adv = () => { const s = neuf(); Object.assign(s.unlockFlags, { clue1Complete: true, clue2Complete: true, clue3Complete: true }); return s; };
  const visite = (s, d) => { d.startFloor = 0; delete d.beteElig; beteDebutVisiteV1(s, d); };
  let s = adv(); let d = {};
  visite(s, d);
  assert.equal(d.beteElig, true);
  assert.equal(beteItopodV1(s, d, 99, 10, 0), null);
  assert.equal(beteItopodV1(s, d, 100, 5, 3), null, "pas le premier kill de l'étage");
  const r = beteItopodV1(s, d, 100, 10, 0);
  assert.equal(r.indice, 4);
  assert.equal(s.unlockFlags.clue4Complete, true);
  assert.equal(possede(s, "beastClue4"), 1);
  /* Étage de départ différent de 0 : non. */
  s = adv(); d = { startFloor: 1 }; beteDebutVisiteV1(s, d);
  assert.equal(beteItopodV1(s, d, 100, 1, 0), null);
  /* Indice 3 pas fait au début de la visite : jamais éligible. */
  s = adv(); delete s.unlockFlags.clue3Complete; d = { startFloor: 0 }; beteDebutVisiteV1(s, d);
  s.unlockFlags.clue3Complete = true;
  assert.equal(beteItopodV1(s, d, 100, 1, 0), null);
  /* Une pièce portée à un butin : l'éligibilité tombe pour toute la visite, même si on la retire ensuite. */
  s = adv(); d = { startFloor: 0 }; beteDebutVisiteV1(s, d);
  const e = equiper(s, "training:weapon", "weapon");
  assert.equal(beteItopodV1(e, d, 50, 10, 0), null);
  assert.equal(d.beteElig, false);
  const nu = adv();
  assert.equal(beteItopodV1(nu, d, 100, 1, 0), null, "retirée ensuite : toujours inéligible");
  /* Un accessoire compte aussi. */
  s = adv(); d = { startFloor: 0 }; beteDebutVisiteV1(s, d);
  assert.equal(beteItopodV1(equiper(s, "stapler", "accessory"), d, 100, 1, 0), null);
  assert.equal(d.beteElig, false);
}

/* Rebirth : 4 indices faits + durée strictement entre 2585 et 2615 s + titan pas encore débloqué. */
{
  const f = () => ({ adventure: { unlockFlags: { clue1Complete: true, clue2Complete: true, clue3Complete: true, clue4Complete: true } } });
  for (const [sec, attendu] of [[2584, false], [2585, false], [2585.001, true], [2600, true], [2614.999, true], [2615, false], [3000, false]]) {
    const st = f();
    assert.equal(beteSpecialRebirthV1(st, sec), attendu, sec + " s");
    assert.equal(Boolean(st.adventure.unlockFlags.titan6Unlocked), attendu);
  }
  for (const manque of [1, 2, 3, 4]) {
    const st = f(); delete st.adventure.unlockFlags["clue" + manque + "Complete"];
    assert.equal(beteSpecialRebirthV1(st, 2600), false, "indice " + manque + " manquant");
  }
  const deja = f(); deja.adventure.unlockFlags.titan6Unlocked = true;
  assert.equal(beteSpecialRebirthV1(deja, 2600), false, "déjà débloquée");
}
console.log("idle-bete-secret-v1: OK");
