import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  idleScummvmSauvegardesTraiterV1, IDLE_SCUMMVM_SAUV_NOM_V1, IDLE_SCUMMVM_SAUV_MAX_FICHIER_V1, IDLE_SCUMMVM_SAUV_MAX_COMPTE_V1, IDLE_SCUMMVM_SAUV_MAX_FICHIERS_V1
} from "../src/idle-scummvm-sauvegardes-v1.js";

/*
 * Synchronisation des sauvegardes de ScummVM (Norman, 2026-11-22) côté serveur : isolation par compte, liste blanche des noms, bornes, fusion par fichier (la plus récente gagne, égalité = serveur),
 * `maj` du futur refusé, compte non autorisé refusé, lecture vide, conflit par `base`, force. Branchement dans le Worker et le coordinateur.
 */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
const NOW = 1_800_000_000_000;
const oui = async () => true;
const non = async () => false;
const b64 = (t) => Buffer.from(t).toString("base64");
const appel = (compte, corps, autorise = oui) => idleScummvmSauvegardesTraiterV1(sql, compte, corps, { autorise, maintenant: NOW });
const ecrire = (compte, fichiers, extra = {}) => appel(compte, { action: "ecrire", jeu: "dott", fichiers, ...extra });
const lire = (compte, jeu = "dott") => appel(compte, { action: "lire", jeu });

/* lecture vide */
let r = await lire("a@x.fr");
assert.deepEqual(r, { ok: true, fichiers: [], maintenant: r.maintenant });
assert.ok(Number.isFinite(r.maintenant) && r.maintenant > 0, "l'heure du serveur est renvoyée (le client règle son horloge dessus)");

/* accès : compte non autorisé (ou autorisation absente) = refus, rien n'est écrit */
r = await appel("a@x.fr", { action: "ecrire", jeu: "dott", fichiers: [{ nom: "tentacle.s00", maj: NOW, donnees: b64("abcd") }] }, non);
assert.equal(r.ok, false); assert.equal(r.error, "SOREAL_IDLE_ACCES_REFUSE");
assert.equal((await idleScummvmSauvegardesTraiterV1(sql, "a@x.fr", { action: "lire", jeu: "dott" }, {})).ok, false, "sans autorisation injectée : refus (jamais ouvert par défaut)");
assert.equal((await idleScummvmSauvegardesTraiterV1(sql, "", { action: "lire", jeu: "dott" }, { autorise: oui })).ok, false, "sans compte : refus");
assert.deepEqual((await lire("a@x.fr")).fichiers, []);

/* écriture simple + lecture */
r = await ecrire("a@x.fr", [{ nom: "tentacle.s00", maj: NOW - 1000, donnees: b64("sauvegarde-un") }]);
assert.equal(r.ok, true); assert.deepEqual(r.fichiers, [{ nom: "tentacle.s00", maj: NOW - 1000 }]); assert.deepEqual(r.conflits, []);
r = await lire("a@x.fr");
assert.deepEqual(r.fichiers, [{ nom: "tentacle.s00", maj: NOW - 1000, donnees: b64("sauvegarde-un") }]);

/* isolation par compte (et casse de l'adresse) et par jeu */
assert.deepEqual((await lire("b@x.fr")).fichiers, [], "un autre compte ne voit rien");
assert.equal((await lire("A@X.fr")).fichiers.length, 1, "même compte quelle que soit la casse");
assert.deepEqual((await lire("a@x.fr", "autre-jeu")).fichiers, [], "un autre jeu ne voit rien");
await ecrire("b@x.fr", [{ nom: "tentacle.s00", maj: NOW - 500, donnees: b64("sauvegarde-de-b") }]);
assert.equal((await lire("a@x.fr")).fichiers[0].donnees, b64("sauvegarde-un"), "l'écriture de b ne touche pas a");

/* fusion par fichier : la plus récente gagne, égalité = serveur */
r = await ecrire("a@x.fr", [{ nom: "tentacle.s00", maj: NOW - 2000, donnees: b64("plus-ancienne") }]);
assert.equal(r.ok, true);
assert.equal((await lire("a@x.fr")).fichiers[0].donnees, b64("sauvegarde-un"), "une version plus ancienne n'écrase pas");
await ecrire("a@x.fr", [{ nom: "tentacle.s00", maj: NOW - 1000, donnees: b64("egalite") }]);
assert.equal((await lire("a@x.fr")).fichiers[0].donnees, b64("sauvegarde-un"), "égalité : le serveur garde la sienne");
await ecrire("a@x.fr", [{ nom: "tentacle.s00", maj: NOW - 900, donnees: b64("plus-recente") }, { nom: "tentacle.s01", maj: NOW - 5000, donnees: b64("autre-fichier") }]);
let l = (await lire("a@x.fr")).fichiers;
assert.deepEqual(l.map((f) => [f.nom, f.maj]), [["tentacle.s00", NOW - 900], ["tentacle.s01", NOW - 5000]], "fusion fichier par fichier");
assert.equal(l[0].donnees, b64("plus-recente"));
/* fichier par fichier dans un même lot : l'un ancien (gardé côté serveur), l'autre récent (écrit) */
await ecrire("a@x.fr", [{ nom: "tentacle.s00", maj: NOW - 3000, donnees: b64("vieux") }, { nom: "tentacle.s01", maj: NOW - 100, donnees: b64("nouveau") }]);
l = (await lire("a@x.fr")).fichiers;
assert.equal(l[0].donnees, b64("plus-recente")); assert.equal(l[1].donnees, b64("nouveau"));

/* maj : jamais au-delà de maintenant + 5 min ; entier strictement positif */
assert.equal((await ecrire("a@x.fr", [{ nom: "tentacle.s02", maj: NOW + 5 * 60 * 1000 + 1, donnees: b64("futur") }])).code, "SCUMMVM_SAUV_MAJ_FUTUR");
assert.equal((await ecrire("a@x.fr", [{ nom: "tentacle.s02", maj: NOW + 5 * 60 * 1000, donnees: b64("limite") }])).ok, true, "5 min exactement : accepté");
for (const maj of [0, -5, 1.5, "1", null, NaN]) assert.equal((await ecrire("a@x.fr", [{ nom: "tentacle.s03", maj, donnees: b64("x") }])).code, "SCUMMVM_SAUV_MAJ", "maj invalide : " + maj);
assert.equal((await lire("a@x.fr")).fichiers.some((f) => f.nom === "tentacle.s03"), false);

/* liste blanche des noms */
assert.ok(IDLE_SCUMMVM_SAUV_NOM_V1.test("tentacle.s00") && IDLE_SCUMMVM_SAUV_NOM_V1.test("tentacle.s99") && IDLE_SCUMMVM_SAUV_NOM_V1.test("timestamps"));
for (const nom of ["scummvm.ini", "../tentacle.s00", "tentacle.s0", "tentacle.s000", "tentacle.sav", "a/b.s00", "tentacle.s00 ", "", ".s00", "TIMESTAMPS", "timestamps2", "tent acle.s00", "x".repeat(41) + ".s00"]) {
  assert.equal((await ecrire("a@x.fr", [{ nom, maj: NOW, donnees: b64("x") }])).code, "SCUMMVM_SAUV_NOM", "nom refusé : " + JSON.stringify(nom));
}
assert.equal((await ecrire("a@x.fr", [{ nom: "timestamps", maj: NOW - 10, donnees: b64("t") }])).ok, true);
/* identifiant de jeu */
for (const jeu of ["", "A", "a b", "a/b", "../x", "x".repeat(41), null, 5]) assert.equal((await appel("a@x.fr", { action: "lire", jeu })).code, "SCUMMVM_SAUV_JEU", "jeu refusé : " + JSON.stringify(jeu));
assert.equal((await appel("a@x.fr", { action: "supprimer", jeu: "dott" })).code, "SCUMMVM_SAUV_ACTION");

/* contenu : base 64 non vide, bornes par fichier */
for (const donnees of ["", "***", "abc", 5, null, "ab=d"]) assert.ok(!(await ecrire("a@x.fr", [{ nom: "tentacle.s04", maj: NOW, donnees }])).ok, "contenu refusé : " + JSON.stringify(donnees));
assert.equal((await ecrire("a@x.fr", [{ nom: "tentacle.s04", maj: NOW, donnees: "A".repeat(IDLE_SCUMMVM_SAUV_MAX_FICHIER_V1 + 4) }])).code, "SCUMMVM_SAUV_TAILLE");
assert.equal((await ecrire("c@x.fr", [{ nom: "tentacle.s04", maj: NOW, donnees: "A".repeat(IDLE_SCUMMVM_SAUV_MAX_FICHIER_V1) }])).ok, true, "300 000 caractères : accepté");
/* corps de forme invalide */
assert.equal((await appel("a@x.fr", { action: "ecrire", jeu: "dott", fichiers: [] })).code, "SCUMMVM_SAUV_LISTE");
assert.equal((await appel("a@x.fr", { action: "ecrire", jeu: "dott", fichiers: "x" })).code, "SCUMMVM_SAUV_LISTE");
assert.equal((await ecrire("a@x.fr", [null])).ok, false);
assert.equal((await ecrire("a@x.fr", [{ nom: "tentacle.s05", maj: NOW, donnees: b64("x") }, { nom: "tentacle.s05", maj: NOW, donnees: b64("y") }])).code, "SCUMMVM_SAUV_DOUBLON");
assert.equal((await idleScummvmSauvegardesTraiterV1(sql, "a@x.fr", null, { autorise: oui })).ok, false);

/* au plus 12 fichiers par jeu et par compte ; tout ou rien */
const d = "d@x.fr";
const lot = (de, a) => { const f = []; for (let i = de; i < a; i += 1) f.push({ nom: "tentacle.s" + String(i).padStart(2, "0"), maj: NOW - 1000, donnees: b64("f" + i) }); return f; };
assert.equal((await ecrire(d, lot(0, IDLE_SCUMMVM_SAUV_MAX_FICHIERS_V1))).ok, true);
assert.equal(IDLE_SCUMMVM_SAUV_MAX_FICHIERS_V1, 12);
r = await ecrire(d, lot(12, 13));
assert.equal(r.code, "SCUMMVM_SAUV_TROP_DE_FICHIERS");
assert.equal((await lire(d)).fichiers.length, 12, "refus : rien n'est écrit");
r = await ecrire(d, [{ nom: "tentacle.s00", maj: NOW, donnees: b64("remplace") }]);
assert.equal(r.ok, true, "remplacer un fichier existant ne dépasse pas la limite");
assert.equal((await ecrire(d, lot(0, 13))).ok, false, "un lot de 13 fichiers est refusé (liste trop longue)");

/* 1 500 000 caractères au total pour le compte (tous jeux confondus) */
const e = "e@x.fr";
for (let i = 0; i < 5; i += 1) assert.equal((await appel(e, { action: "ecrire", jeu: "jeu" + i, fichiers: [{ nom: "t.s00", maj: NOW - 1, donnees: "A".repeat(IDLE_SCUMMVM_SAUV_MAX_FICHIER_V1) }] })).ok, true);
assert.equal(IDLE_SCUMMVM_SAUV_MAX_COMPTE_V1, 1500000);
r = await appel(e, { action: "ecrire", jeu: "jeu5", fichiers: [{ nom: "t.s00", maj: NOW - 1, donnees: "A".repeat(4) }] });
assert.equal(r.code, "SCUMMVM_SAUV_QUOTA", "le total du compte est borné");
assert.equal((await appel(e, { action: "lire", jeu: "jeu5" })).fichiers.length, 0);

/* conflit : base = le maj du serveur vu par l'appareil ; si un autre appareil a écrit depuis, pas d'écrasement silencieux */
const g = "g@x.fr";
await ecrire(g, [{ nom: "tentacle.s00", maj: NOW - 5000, donnees: b64("v1") }]);
r = await ecrire(g, [{ nom: "tentacle.s00", maj: NOW - 4000, donnees: b64("v2-telephone") }]);   /* le téléphone, sans base : la plus récente gagne */
assert.equal(r.ok, true);
r = await ecrire(g, [{ nom: "tentacle.s00", maj: NOW - 1000, donnees: b64("v3-pc"), base: NOW - 5000 }]);   /* le PC avait vu v1 : le serveur a v2 */
assert.deepEqual(r.conflits, ["tentacle.s00"]);
assert.equal((await lire(g)).fichiers[0].donnees, b64("v2-telephone"), "la version d'un autre appareil n'est jamais écrasée en silence");
r = await ecrire(g, [{ nom: "tentacle.s00", maj: NOW - 1000, donnees: b64("v3-pc"), base: NOW - 4000 }]);   /* base à jour : accepté */
assert.deepEqual(r.conflits, []);
assert.equal((await lire(g)).fichiers[0].donnees, b64("v3-pc"));
r = await ecrire(g, [{ nom: "tentacle.s01", maj: NOW - 1000, donnees: b64("neuf"), base: 0 }]);
assert.equal(r.ok, true, "base 0 et fichier absent du serveur : accepté");
r = await ecrire(g, [{ nom: "tentacle.s01", maj: NOW - 900, donnees: b64("encore"), base: 0 }]);
assert.deepEqual(r.conflits, ["tentacle.s01"], "base 0 mais le serveur a une version : conflit");
/* « Reprendre ici » : force remplace sans comparer (le maj du futur reste refusé) */
r = await ecrire(g, [{ nom: "tentacle.s01", maj: NOW - 9000, donnees: b64("force") }], { force: true });
assert.equal(r.ok, true);
assert.equal((await lire(g)).fichiers.find((f) => f.nom === "tentacle.s01").donnees, b64("force"));
assert.equal((await ecrire(g, [{ nom: "tentacle.s01", maj: NOW + 10 * 60 * 1000, donnees: b64("force") }], { force: true })).code, "SCUMMVM_SAUV_MAJ_FUTUR");
assert.equal((await ecrire(g, [{ nom: "scummvm.ini", maj: NOW, donnees: b64("x") }], { force: true })).code, "SCUMMVM_SAUV_NOM", "force n'ouvre pas la liste blanche");

/* aucun contenu de sauvegarde dans le code serveur (pas de journal) */
const src = readFileSync("cloudflare/src/idle-scummvm-sauvegardes-v1.js", "utf8");
assert.ok(!/console\./.test(src), "aucun console.* dans le module serveur");

/* branchement : Worker (route à jeton, corps borné, limites) et coordinateur (session, droit de jouer, droit Énigmes) ; aucune opération ajoutée */
const worker = readFileSync("cloudflare/src/idle-worker-entry-v1.js", "utf8");
assert.ok(worker.includes('url.pathname === "/api/v1/scummvm-sauvegardes" && request.method === "POST"'));
assert.ok(/scvsauv:" \+ jeton/.test(worker) && worker.includes("/__soreal-idle-v1/scummvm-sauvegardes"));
const coord = readFileSync("cloudflare/src/index-idle-coordinator-v1.js", "utf8");
const bloc = coord.slice(coord.indexOf('path === "/__soreal-idle-v1/scummvm-sauvegardes"'), coord.indexOf('path === "/__soreal-idle-v1/scummvm-acces"'));
assert.ok(bloc.includes("standaloneSessionV1") && bloc.includes("accesJeuV1") && bloc.includes("idleScummvmCompteAutoriseV1(this.env"), "session, droit de jouer et droit Énigmes");
assert.ok(!/p\?\.(email|compte)/.test(bloc), "le compte n'est jamais fourni par le client");
assert.ok(/import \{ idleScummvmCompteAutoriseV1 \} from "\.\/idle-scummvm-acces-v1\.js"/.test(coord), "importe la fonction d'accès partagée");
const proto = JSON.parse(readFileSync("cloudflare/contracts/idle-protocol.json", "utf8"));
assert.ok(!JSON.stringify(proto).includes("scummvm-sauvegardes"), "le contrat du protocole ne change pas");

console.log("idle-scummvm-sauvegardes-serveur-v1: OK");
