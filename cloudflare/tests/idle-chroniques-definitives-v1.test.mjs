import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { lireDefinitivesV1, definirDefinitiveV1, marquerDefinitivePreteV1, surchargesPourJoueurV1 } from "../src/idle-textes-v1.js";
import { lireSrc } from "./_src-sources.mjs";

/*
 * Norman (2026-11-05) : « sur chaque chronique de boss, je veux pouvoir cocher définitive. Une fois fait, les fichiers audio ne sont remis qu'en un seul, avec exactement les mêmes temps d'arrêt que quand on le lit de
 * manière séparée. On ne doit voir aucune différence. Ensuite les voix séparées sont supprimées et seule l'entière est conservée. » Écoute avant toute suppression (accord de Norman).
 */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
const plan = (entier, etapes) => ({ entier, etapes });
const plans = { avec: plan("052e1b98e29f8a", [{ h: "0ecd44bdc2d8e2" }, { p: 1100 }, { h: "0dde9728ddebe8" }]), sans: plan("0b0faf64db9e17", [{ h: "0dde9728ddebe8" }]) };

// 1. serveur : cocher enregistre le plan exact (blocs ET silences), décocher l'efface
assert.deepEqual(lireDefinitivesV1(sql), {});
const d = definirDefinitiveV1(sql, "boss:4", true, plans);
assert.deepEqual(d.plans.avec.etapes, [{ h: "0ecd44bdc2d8e2" }, { p: 1100 }, { h: "0dde9728ddebe8" }], "les silences sont gardés au milli-seconde près");
assert.equal(d.pret, false, "pas prête tant que l'outil n'a pas posé le fichier entier");
assert.equal(lireDefinitivesV1(sql)["boss:4"].plans.sans.entier, "0b0faf64db9e17");
// plans invalides refusés : empreinte, silence négatif ou énorme, plan sans bloc
for (const mauvais of [{}, { avec: plan("zz", [{ h: "0ecd44bdc2d8e2" }]) }, { avec: plan("052e1b98e29f8a", [{ h: "0ecd44bdc2d8e2" }, { p: -5 }]) }, { avec: plan("052e1b98e29f8a", [{ p: 1000 }]) }, { avec: plan("052e1b98e29f8a", [{ h: "0ecd44bdc2d8e2" }, { p: 999999 }]) }]) {
  assert.throws(() => definirDefinitiveV1(sql, "boss:4", true, mauvais), /TEXTE_DEFINITIVE_PLAN_INVALIDE/);
}
// seules les chroniques de boss ont cette case
for (const cle of ["sandwich", "boss:x", "", "a b"]) assert.throws(() => definirDefinitiveV1(sql, cle, true, plans), /TEXTE_CLE_INVALIDE/);

// 2. le joueur ne reçoit l'empreinte du fichier ENTIER qu'une fois le fichier prêt sur R2 (sinon il lit les blocs), dans sa langue
assert.deepEqual(surchargesPourJoueurV1(sql, "fr").entieres, [], "pas prête : rien envoyé");
assert.throws(() => marquerDefinitivePreteV1(sql, "boss:99", true, false), /TEXTE_DEFINITIVE_ABSENTE/);
marquerDefinitivePreteV1(sql, "boss:4", true, false);
assert.deepEqual(surchargesPourJoueurV1(sql, "fr").entieres.sort(), ["052e1b98e29f8a", "0b0faf64db9e17"]);
assert.deepEqual(surchargesPourJoueurV1(sql, "en").entieres, [], "la version française n'est pas envoyée à un joueur anglais");
definirDefinitiveV1(sql, "boss:4:en", true, plans);
marquerDefinitivePreteV1(sql, "boss:4:en", true, false);
assert.equal(surchargesPourJoueurV1(sql, "en").entieres.length, 2);
const apres = marquerDefinitivePreteV1(sql, "boss:4", true, true);
assert.equal(apres.separeesSupprimees, true);
// recocher (texte modifié) remet « pret » à faux
assert.equal(definirDefinitiveV1(sql, "boss:4", true, plans).pret, false);
assert.deepEqual(surchargesPourJoueurV1(sql, "fr").entieres, []);
definirDefinitiveV1(sql, "boss:4", false);
assert.deepEqual(Object.keys(lireDefinitivesV1(sql)), ["boss:4:en"]);

// 3. opérations administrateur, dans le contrat ; la liste Admin renvoie les chroniques définitives ; la purge ne supprime jamais une voix entière
const runtime = lireSrc("idle-sqlite-runtime.js");
const contrat = JSON.parse(readFileSync("cloudflare/contracts/idle-protocol.json", "utf8")).operations;
for (const op of ["definirChroniqueDefinitiveAdminSorealIdle", "marquerChroniqueEntiereAdminSorealIdle"]) {
  assert.match(runtime, new RegExp("^  " + op + ",$", "m"));
  assert.ok(contrat.includes(op), op + " au contrat");
}
const admin = lireSrc("idle-runtime-admin.js");
assert.ok(/definitives: lireDefinitivesV1\(__idleCtx\.__idleSql\)/.test(admin), "liste Admin : definitives");
assert.ok(/export function definirChroniqueDefinitiveAdminSorealIdle[\s\S]*?exigerAdminHistoiresSorealIdle_/.test(admin), "administrateur seulement");
assert.ok(/export function marquerChroniqueEntiereAdminSorealIdle[\s\S]*?exigerAdminHistoiresSorealIdle_/.test(admin), "administrateur seulement");
const entree = readFileSync("cloudflare/src/idle-worker-entry-v1.js", "utf8");
assert.ok(entree.includes("entieresDefinitives") && /declareesSeules\.add\(h\)/.test(entree) && entree.includes("for (const h of entieresDefinitives) utiles.add(h)"), "purge (normale et stricte) : voix entières gardées");

// 4. client : le jeu lit le fichier entier (un seul bloc audio, silences dans le fichier) ; l'éditeur calcule le plan avec le vrai module
const tts = readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
assert.ok(/else if\(entieres\[entierDe_\(text\)\]\)\{[\s\S]*?chargerVoixR2_\(entierDe_\(text\)\)[\s\S]*?playBlobWebAudioPromise_\(blob,targetId,myGeneration,text\)/.test(tts), "lecture du fichier entier");
assert.ok(/enregistrerEntieres:enregistrerEntieres_/.test(tts) && /planEntier:planEntier_/.test(tts));
assert.ok(/function planEntier_[\s\S]*?etapes\.push\(\{p:Math\.round/.test(tts), "le plan garde les silences");
const adm = readFileSync("cloudflare/public/modules/textes-admin-v1.js", "utf8");
assert.ok(adm.includes("data-stx-def") && adm.includes("definirChroniqueDefinitiveAdminSorealIdle") && adm.includes("texteLuSans"), "case Définitive dans l'éditeur des chroniques de boss");
assert.ok(adm.includes("tE.enregistrerEntieres(res.entieres)"), "le jeu déclare les voix entières reçues");
assert.ok(/function estCleBoss_\(cle\)\{return \/\^boss:\\d\+\(:en\)\?\$\/\.test/.test(adm), "case réservée aux chroniques de boss");

// 5. outil de fusion : silences exacts, contrôle de durée, suppression demandée avec sauvegarde et accord
const outil = readFileSync("cloudflare/tools/fusionner-chroniques-definitives.mjs", "utf8");
assert.ok(outil.includes("Buffer.alloc(n * 2)") && outil.includes("m.silenceMs / 1000) * taux"), "silences en échantillons exacts");
assert.ok(outil.includes("ecart > 0.06") && outil.includes("--oui") && outil.includes("--sauvegarde"), "contrôle de durée, accord et sauvegarde avant suppression");
assert.ok(outil.includes("n'est pas sur R2"), "jamais de suppression sans fichier entier sur R2");

console.log("chroniques définitives : OK");
