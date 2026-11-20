import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-20, « implémente tout », après la comparaison des MacGuffins et objets de quête avec le jeu) : la chaîne secrète de la Marraine (titan 8), lue dans le code du jeu (build 1260) :
 *  LootDrop::zone26Drop (Consigliere, type 22), zone2Drop / zone4Drop / zone9Drop / zone15Drop / zone10Drop (les cinq noms), AdventureController::spawnEnemy, InventoryController::itemTooltipText (Death Note, id 288).
 */
await import("../src/idle-sqlite-runtime.js");
const v47 = await import("../src/idle-adventure-v47.js");
const comb = await import("../src/idle-adventure-combat.js");
const butin = await import("../src/idle-adventure-butin.js");
const zones = await import("../src/idle-adventure-zones.js");
const sets = await import("../src/idle-adventure-sets.js");
const desc = await import("../src/idle-adventure-descriptions-v1.js");
const mar = await import("../src/idle-marraine-secrete-v1.js");
const comba = await import("../src/idle-titans-combat-v1.js");
const migr = await import("../src/idle-migrations-v1.js");
const lire = (f) => readFileSync(new URL(f, import.meta.url), "utf8");

const neuf = () => { const s = v47.normalizeIdleAdventureStateV47({}); s.inventory = s.inventory.filter((i) => i.definitionId !== "tutorialCube"); return s; };
const CIBLES = mar.IDLE_MARRAINE_CIBLES_V1;

/* 1. l'objet et le titan : données du jeu */
assert.equal(sets.SPECIALS_EN_V1.deathNote.name, "The Death Note"); assert.equal(sets.SPECIALS.deathNote.name, "La Death Note");
assert.equal(sets.wikiItemIdAdventureV1("deathNote"), 288, "identifiant du jeu : 288");
assert.equal(desc.IDLE_ADVENTURE_DESCRIPTIONS_V1.deathNote, "The Consigliere won't grant you an audience with The Godmother until you whack off everyone on this list:");
const mere = zones.IDLE_ADVENTURE_TITANS.find((t) => t.id === "godmother"), cons = zones.IDLE_ADVENTURE_TITANS.find((t) => t.id === "consigliere");
assert.equal(mere.requiresUnlock, "titan8Unlocked", "la Marraine exige titan8Unlocked");
assert.ok(cons && cons.secret && cons.hiddenWhenFlag === "titan8Unlocked" && cons.remplacePar === "godmother" && cons.boss === 166 && cons.evilOnly && cons.p === 0 && cons.t === 0, "le Consigliere remplace la Marraine tant que titan8Unlocked est faux (même boss 166, Evil)");
assert.deepEqual(comba.IDLE_TITAN_COMBAT_V1.consigliere.variantes[""], { hp: 6e19, power: 6e17, toughness: 6e17, regen: 6e16, attackRate: 2 }, "createEnemyTable : Attaque 2, Power 6e17, Toughness 6e17, Regen 6e16, PV 6e19");
assert.deepEqual(CIBLES.map((c) => c.flag), ["skeletonWhacked", "icarusWhacked", "kingCircleWhacked", "robBossWhacked", "emptyNameWhacked"], "les cinq drapeaux du jeu");
/* chaque cible existe vraiment dans le bestiaire SOREAL, dans la bonne zone */
for (const c of CIBLES) {
  const z = zones.IDLE_ADVENTURE_MOB_BESTIARY_V1[c.zone];
  assert.ok(z && [].concat(z.normal || [], z.boss || []).some((m) => m.name === c.mob), `${c.mob} existe dans ${c.zone}`);
}

/* 2. accès : sans titan8Unlocked, le Consigliere se montre à la place de la Marraine ; avec, l'inverse */
{
  const s = neuf();
  const ouvert = (id) => { const d = zones.IDLE_ADVENTURE_TITANS.find((t) => t.id === id); return comb.titanGate(s, d); };
  assert.equal(ouvert("godmother"), false, "Marraine fermée tant que la chaîne n'est pas faite");
  assert.equal(ouvert("consigliere"), true, "Consigliere ouvert");
  const etat = (snap, id) => { const t = snap.titans.find((x) => x.id === id); return t ? t.progressionUnlocked : null; };
  const snap = v47.idleAdventureSnapshotV47(s, 170, "difficile", {});
  assert.equal(etat(snap, "consigliere"), true, "à l'écran : le Consigliere est atteignable");
  assert.equal(etat(snap, "godmother"), false, "la Marraine n'est PAS atteignable (le serveur ne l'envoie pas au joueur tant qu'elle ne l'est pas : anti-spoil du snapshot Titans)");
  s.unlockFlags.titan8Unlocked = true;
  assert.equal(ouvert("godmother"), true); assert.equal(ouvert("consigliere"), false, "Consigliere disparu une fois la Marraine débloquée");
  const snap2 = v47.idleAdventureSnapshotV47(s, 170, "difficile", {});
  assert.equal(etat(snap2, "godmother"), true); assert.equal(etat(snap2, "consigliere"), null, "Consigliere absent de la liste");
  /* une partie qui a déjà vaincu la Marraine la garde, sans rien faire */
  const t = neuf(); t.titans.godmother = { kills: 1, nextAt: 0 };
  assert.equal(comb.titanGate(t, mere), true, "Marraine déjà vaincue : toujours ouverte"); assert.equal(comb.titanGate(t, cons), false);
}

/* 3. les cinq noms : rien avant la quête, rayé une fois, « déjà rayé » ensuite, rien après le déblocage, rien dans une autre zone */
{
  const s = neuf();
  assert.equal(mar.marraineMortCibleV1(s, "forest", "Skeleton"), null, "avant la quête : rien");
  s.unlockFlags.titan8questStarted = true;
  assert.equal(mar.marraineMortCibleV1(s, "forest", "Goblin"), null, "un autre ennemi : rien");
  assert.equal(mar.marraineMortCibleV1(s, "cave", "Skeleton"), null, "le nom dans une autre zone : rien");
  for (const c of CIBLES) {
    const r1 = mar.marraineMortCibleV1(s, c.zone, c.mob);
    assert.deepEqual(r1.messages, c.faite, c.mob + " : messages du jeu à la 1re fois"); assert.equal(s.unlockFlags[c.flag], true);
    const r2 = mar.marraineMortCibleV1(s, c.zone, c.mob);
    assert.equal(r2.deja, true); assert.deepEqual(r2.messages, c.deja, c.mob + " : déjà rayé, textes du jeu");
  }
  s.unlockFlags.titan8Unlocked = true;
  assert.equal(mar.marraineMortCibleV1(s, "forest", "Skeleton"), null, "une fois la Marraine débloquée : plus rien");
}
assert.deepEqual(CIBLES[0].faite, ["You wonder what this skeleton did to piss the mafia so much that they whacked him off, even when  ", "he was already undead. Oh well! <b>Skeleton</b> has been crossed off the Death Note!"]);
assert.equal(CIBLES[1].deja[0], "Hey genius,<b>Icarus Proudbottom</b> has already been crossed off the Death Note!", "le jeu n'a pas d'espace après la virgule pour Icarus");

/* 4. mort du Consigliere : quête + Death Note niveau 100 ; liste complète = déblocage */
{
  const s = neuf(); const out = [];
  const r = mar.marraineConsigliereV1(s, out);
  assert.equal(s.unlockFlags.titan8questStarted, true); assert.ok(!s.unlockFlags.titan8Unlocked);
  assert.equal(r.objet.definitionId, "deathNote"); assert.equal(r.objet.level, 100, "makeTitanLevelledLoot(288, 100)");
  assert.deepEqual(r.messages, mar.IDLE_MARRAINE_MESSAGES_V1.quete); assert.equal(r.messages.length, 4);
  assert.ok(s.inventory.some((i) => i.definitionId === "deathNote" && i.level === 100), "la Death Note est dans le sac");
  const r2 = mar.marraineConsigliereV1(s, []);
  assert.equal(s.inventory.filter((i) => i.definitionId === "deathNote").length, 2, "à chaque victoire tant que la liste n'est pas complète : une Death Note de plus (comme le jeu)");
  assert.ok(!mar.marraineListeCompleteV1(s.unlockFlags));
  for (const c of CIBLES) s.unlockFlags[c.flag] = true;
  const inv0 = s.inventory.length;
  const r3 = mar.marraineConsigliereV1(s, []);
  assert.equal(r3.debloque, true); assert.equal(s.unlockFlags.titan8Unlocked, true); assert.equal(s.inventory.length, inv0, "le déblocage ne donne pas de Death Note");
  assert.deepEqual(r3.messages, mar.IDLE_MARRAINE_MESSAGES_V1.debloque);
  /* quatre noms sur cinq : pas de déblocage */
  const q = neuf(); for (const c of CIBLES.slice(0, 4)) q.unlockFlags[c.flag] = true;
  mar.marraineConsigliereV1(q, []); assert.ok(!q.unlockFlags.titan8Unlocked, "le nom vide manque : pas de déblocage");
}

/* 5. le vrai combat de titan : ni or ni EXP, minuteur de la Marraine relancé, résultat annoncé */
{
  const s = neuf(); const ctx = { bosses: 170, difficulty: "difficile", stats: { power: 1e40, toughness: 1e40 } };
  const r = comb.titan(s, "consigliere", ctx, 1000, "easy");
  assert.ok(r.secretMarraine && r.secretMarraine.messages.length === 4 && r.secretMarraine.objet, "résultat : la quête commence, Death Note donnée");
  assert.ok(!r.gold && !r.experience && !r.ap, "ni or ni EXP ni AP : zone26Drop type 22 s'arrête avant");
  assert.ok(s.titans.godmother && s.titans.godmother.nextAt >= s.titans.consigliere.nextAt, "sa mort relance le minuteur de la zone, donc de la Marraine");
  assert.equal(s.unlockFlags.titan8questStarted, true);
  /* la Marraine reste fermée tant que la liste n'est pas faite */
  assert.throws(() => comb.titan(s, "godmother", ctx, 99999999999, "easy"), /PROGRESSION_TITAN_REQUISE/);
  for (const c of CIBLES) s.unlockFlags[c.flag] = true;
  s.titans.consigliere.nextAt = 0;
  const r2 = comb.titan(s, "consigliere", ctx, 2e12, "easy");
  assert.equal(r2.secretMarraine.debloque, true); assert.equal(s.unlockFlags.titan8Unlocked, true);
  const g = comb.titan(s, "godmother", ctx, 4e12, "easy");
  assert.ok(g.gold > 0 || g.drops.length > 0, "la Marraine se combat maintenant normalement");
}

/* 6. kill de zone : le nom est rayé par rollKill (forceMobName) et le résultat porte les messages */
{
  const s = neuf(); s.unlockFlags.titan8questStarted = true; s.selectedZone = "forest";
  const kill = butin.rollKill(s, { bosses: 100, difficulty: "normal", difficultyPeaks: {}, forceBoss: false, forceMobName: "Skeleton" });
  assert.ok(kill.secretMarraine && kill.secretMarraine.messages.length === 2, "rollKill : Skeleton rayé"); assert.equal(s.unlockFlags.skeletonWhacked, true);
  const encore = butin.rollKill(s, { bosses: 100, difficulty: "normal", difficultyPeaks: {}, forceBoss: false, forceMobName: "Skeleton" });
  assert.equal(encore.secretMarraine.deja, true);
  const autre = butin.rollKill(s, { bosses: 100, difficulty: "normal", difficultyPeaks: {}, forceBoss: false, forceMobName: "Goblin" });
  assert.equal(autre.secretMarraine, undefined, "un autre ennemi : aucun champ");
  const avant = neuf(); avant.selectedZone = "forest";
  const sans = butin.rollKill(avant, { bosses: 100, difficulty: "normal", difficultyPeaks: {}, forceBoss: false, forceMobName: "Skeleton" });
  assert.equal(sans.secretMarraine, undefined, "avant la quête : rien (anti-spoil)");
}

/* 7. migration : les parties qui avaient l'accès à la Marraine le gardent */
{
  const M = migr.MIGRATIONS.find((m) => m.nom === "marraine-secrete-v58");
  assert.ok(M && M.de === 57 && M.vers === 58 && migr.ETAT_VERSION_COURANTE >= 58);
  const prog = await import("../src/idle-ngu-progression.js");
  /* un état « natif » (version et schéma de sauvegarde du jeu) à la version 57 : la seule condition pour que la migration soit jouée */
  const etat = (extra) => Object.assign({ version: prog.IDLE_NGU_META_VERSION, saveSchema: prog.IDLE_NGU_SAVE_SCHEMA, adventure: { unlockFlags: {}, titans: {} }, records: {}, etatVersion: 57 }, extra);
  const joue = (e, jeu) => migr.appliquerMigrationV1(M, e, { jeu: jeu || {} });
  assert.equal(joue(etat({ records: { highestBoss: 166 } })).adventure.unlockFlags.titan8Unlocked, true, "boss 166 atteint : accès gardé");
  assert.equal(joue(etat(), { bosses: 170 }).adventure.unlockFlags.titan8Unlocked, true, "contexte de jeu : boss 170");
  assert.equal(joue(etat({ difficultyPeaks: { difficile: 170 } })).adventure.unlockFlags.titan8Unlocked, true, "pic de difficulté");
  const vue = etat(); vue.adventure.titans.godmother = { kills: 2, nextAt: 0 };
  assert.equal(joue(vue).adventure.unlockFlags.titan8Unlocked, true, "Marraine déjà vaincue");
  assert.equal(joue(etat({ records: { highestBoss: 100 } })).adventure.unlockFlags.titan8Unlocked, undefined, "avant le boss 166 : devra faire la chaîne");
  const dejaFait = etat({ records: { highestBoss: 10 } }); dejaFait.adventure.unlockFlags.titan8Unlocked = true;
  assert.equal(joue(dejaFait).adventure.unlockFlags.titan8Unlocked, true, "idempotent");
}

/* 8. catalogue : les phrases de la Death Note ne sont envoyées qu'une fois l'objet obtenu */
{
  const s = neuf();
  assert.ok(!v47.idleAdventureSnapshotV47(s, 170, "difficile", {}).itemCatalog.deathNote, "pas de Death Note obtenue : aucune entrée (anti-spoil)");
  mar.marraineConsigliereV1(s, []);
  const e = v47.idleAdventureSnapshotV47(s, 170, "difficile", {}).itemCatalog.deathNote;
  assert.deepEqual(e.textes, desc.IDLE_DEATH_NOTE_TEXTES_V1); assert.equal(e.desc, desc.IDLE_ADVENTURE_DESCRIPTIONS_V1.deathNote);
}

/* 9. page : fiche de la Death Note et popup ; traductions françaises de tous les textes du jeu */
{
  const fiche = lire("../public/modules/exile-glop-v1.js");
  assert.ok(fiche.includes("function blocDeathNote(a,entree)") && fiche.includes("item.definitionId==='deathNote'?blocDeathNote(a,cat.deathNote)") && fiche.includes("['skeletonWhacked','Skeleton'],['icarusWhacked','Icarus Proudbottom'],['kingCircleWhacked','King Circle'],['robBossWhacked','Rob Boss']"), "liste des quatre noms, grisés une fois rayés");
  assert.ok(fiche.includes("if(f.emptyNameWhacked)") && fiche.includes("t.retour") && fiche.includes("t.incomplete"), "message de fin selon les noms rayés");
  const popup = lire("../public/modules/popup-effet-objet-v1.js");
  assert.ok(popup.includes("r.secretMarraine") && popup.includes("marraine-liste") && popup.includes("replace(/<\\/?b>/g,'')"), "popup des événements de la chaîne (balises <b> retirées)");
  const fr = JSON.parse(lire("../../design/traductions/fr/misc.json"));
  const textes = [desc.IDLE_ADVENTURE_DESCRIPTIONS_V1.deathNote, ...Object.values(desc.IDLE_DEATH_NOTE_TEXTES_V1), ...mar.IDLE_MARRAINE_MESSAGES_V1.debloque, ...mar.IDLE_MARRAINE_MESSAGES_V1.quete];
  for (const c of CIBLES) textes.push(...c.faite, ...c.deja);
  for (const t of textes) assert.ok(typeof fr[t] === "string" && fr[t].length > 0, "traduction française manquante : " + t.slice(0, 60));
  assert.equal(new Set(textes).size > 20, true);
}
console.log("idle-marraine-secrete-v1: OK");
