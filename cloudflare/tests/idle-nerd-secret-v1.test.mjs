import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-20) : la chaîne secrète du Greasy Nerd (titan 7), lue dans le code du jeu (build 1260) :
 *  AdventureController::spawnEnemy (zone 23, Maman type 14), LootDrop::zone23Drop (message du cadenas, titan7questStarted), Character::Update (cinq lettres F A R T S, menuID 15, bossID 24 / 41 / 62 / 81 / 120).
 */
await import("../src/idle-sqlite-runtime.js");
const v47 = await import("../src/idle-adventure-v47.js");
const comb = await import("../src/idle-adventure-combat.js");
const zones = await import("../src/idle-adventure-zones.js");
const nerd = await import("../src/idle-nerd-secret-v1.js");
const comba = await import("../src/idle-titans-combat-v1.js");
const migr = await import("../src/idle-migrations-v1.js");
const prog = await import("../src/idle-ngu-progression.js");
const lire = (f) => readFileSync(new URL(f, import.meta.url), "utf8");

const neuf = () => { const s = v47.normalizeIdleAdventureStateV47({}); s.inventory = s.inventory.filter((i) => i.definitionId !== "tutorialCube"); return s; };
const CAD = nerd.IDLE_NERD_CADENAS_V1;

/* 1. données du jeu */
assert.deepEqual(CAD.map((c) => [c.lettre, c.boss]), [["f", 24], ["a", 41], ["r", 62], ["t", 81], ["s", 120]], "Character::Update : F 24, A 41, R 62, T 81, S 120");
assert.deepEqual(CAD.map((c) => c.message), ["COMBINATION LOCK 1 DISENGAGED!", "COMBINATION LOCK 2 DISENGAGED!", "COMBINATION LOCK 3 DISENGAGED!", "COMBINATION LOCK 4 DISENGAGED", "COMBINATION LOCK 5 DISENGAGED! GREASY NERD TITAN UNLOCKED!"], "textes du jeu (le 4e sans point d'exclamation)");
assert.equal(nerd.IDLE_NERD_MESSAGES_V1.mere.length, 1);
assert.ok(nerd.IDLE_NERD_MESSAGES_V1.mere[0].startsWith("With the Greasy Nerd's mom dispatched, you head down to the basement") && nerd.IDLE_NERD_MESSAGES_V1.mere[0].includes("5 letter combination lock"));
const nerdT = zones.IDLE_ADVENTURE_TITANS.find((t) => t.id === "nerd"), mere = zones.IDLE_ADVENTURE_TITANS.find((t) => t.id === "nerdmom");
assert.equal(nerdT.requiresUnlock, "titan7Unlocked", "le Nerd exige titan7Unlocked"); assert.equal(nerdT.secret, true, "le Nerd n'est pas listé tant qu'il n'est pas atteignable");
assert.ok(mere && mere.secret && mere.hiddenWhenFlag === "titan7Unlocked" && mere.remplacePar === "nerd" && mere.boss === 125 && mere.evilOnly && mere.p === 0 && mere.t === 0 && mere.cooldown === 4.5 * 3600000, "la Maman remplace le Nerd tant que titan7Unlocked est faux (même boss 125, Evil, même minuteur)");
assert.deepEqual(comba.IDLE_TITAN_COMBAT_V1.nerdmom.variantes[""], { hp: 6e15, power: 6e13, toughness: 6e13, regen: 6e12, attackRate: 3 }, "createEnemyTable : cadence 3, Power 6e13, Toughness 6e13, Regen 6e12, PV 6e15");

/* 2. accès : sans titan7Unlocked, la Maman se montre à la place du Nerd ; avec, l'inverse ; un Nerd déjà vaincu reste */
{
  const s = neuf();
  const ouvert = (id) => { const d = zones.IDLE_ADVENTURE_TITANS.find((t) => t.id === id); return comb.titanGate(s, d); };
  assert.equal(ouvert("nerd"), false, "Nerd fermé tant que la chaîne n'est pas faite"); assert.equal(ouvert("nerdmom"), true);
  const etat = (snap, id) => { const t = snap.titans.find((x) => x.id === id); return t ? t.progressionUnlocked : null; };
  const snap = v47.idleAdventureSnapshotV47(s, 170, "difficile", {});
  assert.equal(etat(snap, "nerdmom"), true, "à l'écran : la Maman est atteignable");
  assert.equal(etat(snap, "nerd"), null, "le Nerd n'est même pas dans la liste envoyée (anti-spoil)");
  s.unlockFlags.titan7Unlocked = true;
  assert.equal(ouvert("nerd"), true); assert.equal(ouvert("nerdmom"), false, "Maman disparue une fois le Nerd débloqué");
  const snap2 = v47.idleAdventureSnapshotV47(s, 170, "difficile", {});
  assert.equal(etat(snap2, "nerd"), true); assert.equal(etat(snap2, "nerdmom"), null, "Maman absente de la liste");
  const t = neuf(); t.titans.nerd = { kills: 1, nextAt: 0 };
  assert.equal(comb.titanGate(t, nerdT), true, "Nerd déjà vaincu : toujours ouvert"); assert.equal(comb.titanGate(t, mere), false);
  /* hors Evil : la Maman (comme le Nerd avant elle) est listée mais fermée par la difficulté ; le Nerd, lui, reste caché */
  const n = v47.idleAdventureSnapshotV47(neuf(), 170, "normal", {});
  assert.equal(etat(n, "nerdmom"), false); assert.equal(etat(n, "nerd"), null);
}

/* 3. rien dans l'état avant la mort de la Maman ; le vrai combat : ni or ni EXP, quête commencée, minuteur du Nerd relancé */
{
  const s = neuf(); const ctx = { bosses: 170, difficulty: "difficile", stats: { power: 1e40, toughness: 1e40 } };
  const snap0 = v47.idleAdventureSnapshotV47(s, 170, "difficile", {});
  assert.deepEqual(Object.keys(snap0.unlockFlags).filter((k) => /titan7/.test(k)), [], "aucun drapeau du cadenas avant la découverte");
  assert.equal(snap0.titan7Cadenas, undefined, "ni lettre ni boss annoncés avant la découverte (anti-spoil)");
  assert.throws(() => comb.titan(s, "nerd", ctx, 1000, "easy"), /PROGRESSION_TITAN_REQUISE/, "le Nerd est fermé");
  const r = comb.titan(s, "nerdmom", ctx, 1000, "easy");
  assert.ok(r.secretNerd && r.secretNerd.messages.length === 1 && r.secretNerd.messages[0] === nerd.IDLE_NERD_MESSAGES_V1.mere[0], "résultat : le message du cadenas");
  assert.ok(!r.gold && !r.experience && !r.ap, "ni or ni EXP ni AP : zone23Drop type 14 s'arrête avant");
  assert.equal(s.unlockFlags.titan7questStarted, true); assert.ok(!s.unlockFlags.titan7Unlocked);
  assert.ok(s.titans.nerd && s.titans.nerd.nextAt >= s.titans.nerdmom.nextAt, "sa mort relance le minuteur de la zone, donc du Nerd");
  assert.throws(() => comb.titan(s, "nerdmom", ctx, 1001, "easy"), /TITAN_EN_REAPPARITION/, "la Maman réapparaît après son minuteur");
}

/* 4. le cadenas : lettre, boss, menu, ordre */
{
  const s = neuf();
  assert.equal(nerd.nerdLettreV1(s, "f", 24, true), null, "avant la Maman : rien");
  assert.equal(nerd.nerdCadenasAttenduV1(s), null);
  nerd.nerdMereMortV1(s);
  assert.deepEqual(nerd.nerdCadenasAttenduV1(s), { lettre: "f", boss: 24 });
  assert.equal(nerd.nerdLettreV1(s, "f", 24, false), null, "pas sur la page Combat de boss");
  assert.equal(nerd.nerdLettreV1(s, "f", 25, true), null, "mauvais nombre de boss");
  assert.equal(nerd.nerdLettreV1(s, "a", 41, true), null, "pas dans l'ordre");
  assert.equal(nerd.nerdLettreV1(s, "x", 24, true), null);
  const attendu = ["f", "a", "r", "t", "s"], bossN = [24, 41, 62, 81, 120];
  for (let i = 0; i < 5; i++) {
    assert.equal(nerd.nerdSequenceV1(s.unlockFlags), i);
    assert.deepEqual(nerd.nerdCadenasAttenduV1(s), { lettre: attendu[i], boss: bossN[i] });
    /* la mauvaise lettre au bon boss, la bonne lettre au mauvais boss, la bonne lettre une étape trop tôt : rien */
    assert.equal(nerd.nerdLettreV1(s, attendu[(i + 1) % 5], bossN[i], true), null);
    assert.equal(nerd.nerdLettreV1(s, attendu[i], bossN[i] + 1, true), null);
    const r = nerd.nerdLettreV1(s, attendu[i].toUpperCase(), bossN[i], true);
    assert.equal(r.etape, i + 1); assert.equal(r.message, CAD[i].message); assert.equal(r.debloque, i === 4);
    if (i < 4) assert.ok(!s.unlockFlags.titan7Unlocked);
  }
  assert.equal(s.unlockFlags.titan7Unlocked, true); assert.equal(s.unlockFlags.titan7questComplete, true);
  assert.equal(nerd.nerdCadenasAttenduV1(s), null, "quête finie : plus de lettre attendue");
  assert.equal(nerd.nerdLettreV1(s, "f", 24, true), null, "quête finie : les touches n'ont plus d'effet");
  assert.equal(nerd.nerdSequenceV1(s.unlockFlags), 5);
  /* la quête ne recommence pas une fois finie */
  nerd.nerdMereMortV1(s); assert.equal(nerd.nerdSequenceV1(s.unlockFlags), 5);
}

/* 5. l'action du moteur (titan7Lettre) : valide le serveur, tout le parcours jusqu'au déblocage, puis le Nerd se combat */
{
  const ctxA = (bosses) => ({ bosses, difficulty: "difficile" });
  let e = prog.normalizeIdleNguState({}, ctxA(0), 0);
  const agir = (lettre, bosses, menuBoss = true) => { const a = prog.applyIdleNguAction(e, { action: "titan7Lettre", lettre, menuBoss }, ctxA(bosses), 1000); e = a.state; return a.result; };
  assert.deepEqual(agir("f", 24), { titan7: false }, "avant la Maman : rien");
  assert.equal(e.adventure.unlockFlags.titan7Lock1, undefined);
  nerd.nerdMereMortV1(e.adventure);
  assert.deepEqual(agir("f", 24, false), { titan7: false }, "hors page Combat de boss");
  const r1 = agir("f", 24); assert.equal(r1.titan7, true); assert.equal(r1.etape, 1); assert.equal(r1.message, "COMBINATION LOCK 1 DISENGAGED!");
  assert.equal(agir("a", 40).titan7, false);
  assert.equal(agir("a", 41).etape, 2); assert.equal(agir("r", 62).etape, 3); assert.equal(agir("t", 81).etape, 4);
  const r5 = agir("s", 120); assert.equal(r5.debloque, true); assert.equal(e.adventure.unlockFlags.titan7Unlocked, true);
  assert.deepEqual(agir("f", 24), { titan7: false });
  const snap = v47.idleAdventureSnapshotV47(e.adventure, 170, "difficile", {});
  assert.equal(snap.titan7Cadenas, undefined, "quête finie : plus rien annoncé");
  assert.equal(snap.titans.find((t) => t.id === "nerd").progressionUnlocked, true, "le Nerd est atteignable");
}

/* 6. snapshot : la lettre attendue n'est annoncée qu'une fois la quête commencée */
{
  const s = neuf(); nerd.nerdMereMortV1(s);
  assert.deepEqual(v47.idleAdventureSnapshotV47(s, 170, "difficile", {}).titan7Cadenas, { lettre: "f", boss: 24 });
  nerd.nerdLettreV1(s, "f", 24, true);
  assert.deepEqual(v47.idleAdventureSnapshotV47(s, 170, "difficile", {}).titan7Cadenas, { lettre: "a", boss: 41 });
}

/* 7. migration : les parties qui avaient l'accès au Nerd le gardent */
{
  const M = migr.MIGRATIONS.find((m) => m.nom === "nerd-secret-v59");
  assert.ok(M && M.de === 58 && M.vers === 59 && migr.ETAT_VERSION_COURANTE === 59);
  const etat = (extra) => Object.assign({ version: prog.IDLE_NGU_META_VERSION, saveSchema: prog.IDLE_NGU_SAVE_SCHEMA, adventure: { unlockFlags: {}, titans: {} }, records: {}, etatVersion: 58 }, extra);
  const joue = (e, jeu) => migr.appliquerMigrationV1(M, e, { jeu: jeu || {} });
  const f = (e) => e.adventure.unlockFlags;
  const evil = joue(etat({ difficultyPeaks: { difficile: 130 } })); assert.equal(f(evil).titan7Unlocked, true, "pic Evil au boss 125 ou plus : accès gardé"); assert.equal(f(evil).titan7questComplete, true, "la quête est finie : les lettres n'ont plus d'effet");
  assert.equal(f(joue(etat({ difficultyPeaks: { extreme: 125 } }))).titan7Unlocked, true, "pic Sadistic");
  assert.equal(f(joue(etat({ difficulty: "difficile" }), { bosses: 140 })).titan7Unlocked, true, "partie Evil en cours au boss 140");
  const vu = etat(); vu.adventure.titans.nerd = { kills: 2, nextAt: 0 };
  assert.equal(f(joue(vu)).titan7Unlocked, true, "Nerd déjà vaincu");
  assert.equal(f(joue(etat({ difficultyPeaks: { difficile: 124 } }))).titan7Unlocked, undefined, "avant le boss 125 : devra faire la chaîne");
  assert.equal(f(joue(etat({ difficultyPeaks: { normal: 300 } }))).titan7Unlocked, undefined, "Normal seulement : le Nerd n'était pas ouvert, rien ne lui est donné");
  assert.equal(f(joue(etat())).titan7questStarted, undefined, "aucun drapeau de quête posé par la migration (anti-spoil)");
  const dejaFait = etat(); dejaFait.adventure.unlockFlags.titan7Unlocked = true;
  assert.equal(f(joue(dejaFait)).titan7Unlocked, true, "idempotent");
}

/* 8. client et serveur : lettres lues du serveur, jamais en dur dans la page ; le raccourci n'a pas lieu quand la lettre est acceptée */
{
  const ui = lire("../public/modules/cadenas-nerd-v1.js");
  assert.ok(ui.includes("adv.titan7Cadenas") && ui.includes("REG.idleMenuActifV28!=='combat'") && ui.includes("action:'titan7Lettre',lettre:touche,menuBoss:true"), "détection côté page : seulement avec la lettre annoncée par le serveur, sur la page Combat de boss");
  assert.ok(ui.includes("addEventListener('keydown'") && ui.includes("ev.preventDefault();ev.stopPropagation();") && ui.includes("},true);"), "phase de capture : la lettre acceptée n'arrive pas jusqu'au raccourci R / T");
  assert.ok(ui.includes("ev.repeat") && ui.includes("'INPUT'") && ui.includes("isContentEditable"), "mêmes gardes que les raccourcis du jeu (pas en tapant dans un champ)");
  assert.ok(!/\b(24|41|62|81|120)\b/.test(ui.replace(/\/\*[\s\S]*?\*\//g, "")), "aucun numéro de boss du secret dans le code de la page");
  assert.ok(lire("../public/index.html").includes('/modules/cadenas-nerd-v1.js?v='), "module chargé par la page");
  const meta = lire("../public/modules/meta-progression-v130.js");
  assert.ok(meta.includes("payload.action==='titan7Lettre'&&res.resultat&&res.resultat.titan7&&res.resultat.message"), "message du jeu affiché seulement si la lettre est acceptée");
  const popup = lire("../public/modules/popup-effet-objet-v1.js");
  assert.ok(popup.includes("r.secretNerd") && popup.includes("nerd-cadenas"), "popup du message de la Maman");
  const fr = JSON.parse(lire("../../design/traductions/fr/misc.json"));
  for (const t of [...nerd.IDLE_NERD_MESSAGES_V1.mere, ...CAD.map((c) => c.message)]) assert.ok(typeof fr[t] === "string" && fr[t].length > 0, "traduction française manquante : " + t.slice(0, 60));
}

/* 9. anti-spoil : le rapport de l'état d'un joueur neuf ne contient ni drapeau ni lettre du secret */
{
  const s = neuf();
  const brut = JSON.stringify(v47.idleAdventureSnapshotV47(s, 170, "difficile", {}));
  /* (seul le nom du drapeau de remplacement figure dans la définition de la Maman, comme pour les autres préludes : Squelette, Consigliere, Prêtre) */
  assert.ok(!/titan7Lock|titan7quest|titan7Cadenas|COMBINATION|LORE/.test(brut), "rien du secret avant la découverte, même au boss 170 en Evil");
}
console.log("idle-nerd-secret-v1: OK");
