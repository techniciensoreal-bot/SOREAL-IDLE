import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import {
  battementV1,
  listerEnLigneV1,
  lireChatV1,
  envoyerChatV1,
  supprimerMessageChatV1,
  dernierIdChatV1,
  normaliserActiviteV1,
  IDLE_PRESENCE_EN_LIGNE_MS_V1,
  IDLE_PRESENCE_GAIN_MAX_S_V1,
  IDLE_CHAT_MAX_MESSAGES_V1
} from "../src/idle-chat-v1.js";

/*
 * Chat et présence de SOREAL IDLE (Norman, 2026-09-30) : chat réservé aux joueurs du jeu, « en ligne » = battement reçu de CE jeu
 * (jamais de APP/TV), activité (« Farm dans… ») et temps de jeu ACTIF du classement.
 */
function baseVide() {
  const db = new DatabaseSync(":memory:");
  return {
    exec(query, ...bindings) {
      const statement = db.prepare(query);
      if (/^\s*(select|pragma|with)/i.test(query)) return statement.all(...bindings);
      statement.run(...bindings);
      return [];
    }
  };
}
const T0 = 1_700_000_000_000;

// 1. Temps de jeu ACTIF : crédité seulement si actif, avec battement précédent rapproché, plafonné par battement.
{
  const sql = baseVide();
  const a = { email: "a@x.fr", nom: "Alice", admin: false };
  assert.equal(battementV1(sql, { ...a, actif: true, now: T0 }).gain, 0, "premier battement : rien à créditer");
  assert.equal(battementV1(sql, { ...a, actif: true, now: T0 + 20_000 }).gain, 20, "20 s d'interaction réelle = 20 s");
  assert.equal(battementV1(sql, { ...a, actif: false, now: T0 + 40_000 }).gain, 0, "page inactive/cachée : rien");
  assert.equal(battementV1(sql, { ...a, actif: true, now: T0 + 60_000 }).gain, 20, "retour d'activité : l'écart depuis le DERNIER battement");
  /* Absent 3 heures (rattrapage hors-ligne) : jamais compté -- c'était le défaut du classement. */
  assert.equal(battementV1(sql, { ...a, actif: true, now: T0 + 60_000 + 3 * 3600_000 }).gain, 0, "retour après 3 h : pas de temps compté");
  /* Jamais plus que le plafond, même avec un écart de 59 s. */
  const r = battementV1(sql, { ...a, actif: true, now: T0 + 60_000 + 3 * 3600_000 + 59_000 });
  assert.equal(r.gain, IDLE_PRESENCE_GAIN_MAX_S_V1, "plafonné à 45 s par battement");
  /* Un client qui spamme des battements ne gagne que le temps réellement écoulé. */
  const spam = baseVide();
  battementV1(spam, { ...a, actif: true, now: T0 });
  let total = 0;
  for (let i = 1; i <= 10; i++) total += battementV1(spam, { ...a, actif: true, now: T0 + i * 1000 }).gain;
  assert.equal(total, 10, "10 battements en 10 s = 10 s, pas davantage");
  /* Pas de valeur « actif » fournie ou invalide : jamais actif. */
  const b = baseVide();
  battementV1(b, { ...a, actif: "oui", now: T0 });
  assert.equal(battementV1(b, { ...a, actif: "oui", now: T0 + 10_000 }).gain, 0, "seul true est accepté");
}

// 2. Présence : en ligne = battement récent ; activité sûre ; jamais d'e-mail renvoyé ; drapeau « moi ».
{
  const sql = baseVide();
  battementV1(sql, { email: "a@x.fr", nom: "Alice", admin: false, actif: true, activite: { t: "farm", zoneId: 7, zoneNom: "Forêt <b>X</b>" }, now: T0 });
  battementV1(sql, { email: "b@x.fr", nom: "Bob (Robert)", admin: true, actif: false, activite: { t: "boss", boss: 23 }, now: T0 + 10_000 });
  const liste = listerEnLigneV1(sql, "a@x.fr", T0 + 20_000);
  assert.equal(liste.length, 2);
  const alice = liste.find((u) => u.nom === "Alice");
  assert.equal(alice.moi, true);
  assert.deepEqual(alice.activite, { t: "farm", zoneId: 7, zoneNom: "Forêt <b>X</b>" }, "texte brut conservé (l'affichage échappe)");
  const bob = liste.find((u) => u.nom === "Bob (Robert)");
  assert.equal(bob.admin, true);
  assert.equal(bob.actif, false);
  assert.deepEqual(bob.activite, { t: "boss", boss: 23 });
  assert.ok(!JSON.stringify(liste).includes("@"), "aucune adresse e-mail n'est jamais renvoyée");
  // Expiré : plus en ligne.
  assert.equal(listerEnLigneV1(sql, "a@x.fr", T0 + IDLE_PRESENCE_EN_LIGNE_MS_V1 + 1).length, 1, "Alice (battement à T0) expire, Bob (T0+10 s) reste");
  assert.equal(listerEnLigneV1(sql, "a@x.fr", T0 + 10_000 + IDLE_PRESENCE_EN_LIGNE_MS_V1 + 1).length, 0);
  assert.throws(() => battementV1(sql, { email: "", nom: "x", actif: true }), /PRESENCE_EMAIL_REQUIS/);
}

// 3. Activité : valeurs bornées, inconnues -> « libre ».
{
  assert.deepEqual(normaliserActiviteV1(null), { t: "libre" });
  assert.deepEqual(normaliserActiviteV1({ t: "hack", zoneId: 1 }), { t: "libre" });
  assert.deepEqual(normaliserActiviteV1({ t: "farm", zoneId: -5, zoneNom: "x".repeat(200) }), { t: "farm", zoneId: 0, zoneNom: "x".repeat(60) });
  assert.deepEqual(normaliserActiviteV1({ t: "boss", boss: 10 ** 9 }), { t: "boss", boss: 99999 });
}

// 4. Chat : envoi, lecture (derniers messages, puis « depuis l'id »), drapeau moi, e-mail jamais renvoyé, nettoyage, limite de cadence.
{
  const sql = baseVide();
  assert.equal(dernierIdChatV1(sql), 0);
  const r1 = envoyerChatV1(sql, { email: "a@x.fr", nom: "Alice", admin: false, texte: "  Bonjour​ tout le monde  ", now: T0 });
  assert.equal(r1.ok, true);
  assert.equal(envoyerChatV1(sql, { email: "a@x.fr", nom: "Alice", admin: false, texte: "trop vite", now: T0 + 500 }).code, "CHAT_TROP_RAPIDE");
  assert.equal(envoyerChatV1(sql, { email: "a@x.fr", nom: "Alice", admin: false, texte: "   ", now: T0 + 5000 }).code, "CHAT_VIDE");
  const r2 = envoyerChatV1(sql, { email: "b@x.fr", nom: "Bob", admin: true, texte: "Salut Alice", now: T0 + 600 });
  assert.equal(r2.ok, true, "le délai minimum est par joueur");
  const vu = lireChatV1(sql, { email: "a@x.fr" });
  assert.deepEqual(vu.map((m) => [m.nom, m.message, m.moi, m.admin]), [["Alice", "Bonjour tout le monde", true, false], ["Bob", "Salut Alice", false, true]]);
  assert.ok(!JSON.stringify(vu).includes("@"), "aucune adresse e-mail dans les messages");
  assert.equal(dernierIdChatV1(sql), r2.id);
  assert.deepEqual(lireChatV1(sql, { email: "a@x.fr", apresId: r1.id }).map((m) => m.message), ["Salut Alice"]);
  assert.equal(lireChatV1(sql, { email: "a@x.fr", apresId: r2.id }).length, 0);
  assert.equal(envoyerChatV1(sql, { email: "a@x.fr", nom: "Alice", texte: "x".repeat(1000), now: T0 + 9000 }).ok, true);
  assert.equal(lireChatV1(sql, { email: "a@x.fr" }).pop().message.length, 280, "messages limités à 280 caractères");
  supprimerMessageChatV1(sql, r1.id);
  assert.equal(lireChatV1(sql, { email: "a@x.fr" }).some((m) => m.id === r1.id), false, "modération : message supprimé");
}

// 5. Historique borné.
{
  const sql = baseVide();
  for (let i = 0; i < IDLE_CHAT_MAX_MESSAGES_V1 + 30; i++) envoyerChatV1(sql, { email: "a@x.fr", nom: "A", texte: "m" + i, now: T0 + i * 10_000 });
  const n = sql.exec("SELECT COUNT(*) AS n FROM idle_chat")[0].n;
  assert.equal(n, IDLE_CHAT_MAX_MESSAGES_V1, "500 derniers messages conservés");
}

// 6. Opérations exposées, réservées aux joueurs ayant accès ; suppression réservée à l'administrateur ; contrat à jour ; classement = temps ACTIF.
{
  const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
  const contrat = JSON.parse(readFileSync("cloudflare/contracts/idle-protocol.json", "utf8")).operations;
  for (const op of ["battementSorealIdle", "lireChatSorealIdle", "envoyerChatSorealIdle", "supprimerMessageChatSorealIdle"]) {
    assert.match(runtime, new RegExp("^  " + op + ",$", "m"), op + " dans IDLE_OPERATIONS");
    assert.ok(contrat.includes(op), op + " dans le contrat");
    const f = runtime.slice(runtime.indexOf("function " + op + "("));
    assert.ok(f.slice(0, f.indexOf("\n}\n")).includes("exigerAccesSorealIdle_(sessionToken)"), op + " exige un accès au jeu");
  }
  const suppr = runtime.slice(runtime.indexOf("function supprimerMessageChatSorealIdle("));
  assert.match(suppr.slice(0, suppr.indexOf("\n}\n")), /ADMIN_SOREAL_IDLE_EMAIL\) throw new Error\('SOREAL_IDLE_ADMIN_REQUIS'\)/);
  assert.match(runtime, /playSeconds: Math\.floor\(positif\(stats && stats\.tempsActifSec\)\)/, "le classement « Temps de jeu » lit le temps ACTIF");
  assert.ok(!/playSeconds: Math\.floor\(positif\(records\.playSeconds\)\)/.test(runtime), "plus le temps écoulé du moteur (rattrapage hors-ligne compris)");
  assert.match(runtime, /tempsActifSec:Math\.max\(0,nombreSorealIdle_\(s\.tempsActifSec,0\)\)/, "champ conservé par le normaliseur de stats");
}

console.log("idle-chat-server-v1: OK");
